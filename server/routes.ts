import express from "express";
import { Type } from "@google/genai";
import { getGeminiClient, generateWithRetry, callCustomApi, DEFAULT_GEMINI_MODEL } from "./aiClient";
import {
  buildExtractPrompt,
  buildInsightsPrompt,
  buildInteractionsPrompt,
  buildConsiliumPrompt,
} from "./prompts";

export const apiRouter = express.Router();

// Robust JSON extraction helper handling markdown fences and partial text
export function parseJsonSafely<T = any>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;
  let clean = raw.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch (_) {
    // Look for outermost object
    const startObj = clean.indexOf("{");
    const endObj = clean.lastIndexOf("}");
    if (startObj !== -1 && endObj > startObj) {
      try {
        return JSON.parse(clean.substring(startObj, endObj + 1));
      } catch (_) {}
    }
    // Look for outermost array
    const startArr = clean.indexOf("[");
    const endArr = clean.lastIndexOf("]");
    if (startArr !== -1 && endArr > startArr) {
      try {
        return JSON.parse(clean.substring(startArr, endArr + 1));
      } catch (_) {}
    }
    console.warn("[parseJsonSafely] Failed to parse JSON, returning fallback. Snippet:", clean.slice(0, 120));
    return fallback;
  }
}

// Health check
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Extract lab results/reports from images
const extractResponseSchema = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      description: "lab_result | imaging | ultrasound | mri | ct | medical_report | prescription | consultation | other",
    },
    scan_confidence: { type: Type.NUMBER },
    document_date: { type: Type.STRING },
    lab_name: { type: Type.STRING },
    doctor: { type: Type.STRING },
    doctor_specialization: { type: Type.STRING },
    indicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          name_short: { type: Type.STRING },
          category: { type: Type.STRING },
          value: { type: Type.NUMBER },
          text_value: { type: Type.STRING },
          unit: { type: Type.STRING },
          reference_min: { type: Type.NUMBER },
          reference_max: { type: Type.NUMBER },
          reference_text: { type: Type.STRING },
          status: { type: Type.STRING },
          comment: { type: Type.STRING },
        },
        required: ["name"],
      },
    },
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          frequency: { type: Type.STRING },
          duration: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ["name"],
      },
    },
    diagnosis: { type: Type.STRING },
    recommendations: { type: Type.STRING },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    raw_text_snippet: { type: Type.STRING },
    needs_review: { type: Type.BOOLEAN },
    error: { type: Type.STRING },
    message: { type: Type.STRING },
  },
  required: ["document_type", "indicators"],
};

apiRouter.post("/extract", async (req, res) => {
  try {
    const { images, targetLanguage, aiSettings, documentTypeHint, previousHistory } = req.body;
    const targetLang = targetLanguage || "en";
    const prompt = buildExtractPrompt(targetLang, documentTypeHint, previousHistory);

    let text = "{}";
    if (aiSettings && aiSettings.provider === "custom") {
      const openAiMessages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(images || []).map((img: any) => {
              const mimeType =
                img.mimeType && img.mimeType.startsWith("image/")
                  ? img.mimeType
                  : "image/jpeg";
              const cleanBase64 = img.data.includes(",")
                ? img.data.substring(img.data.indexOf(",") + 1)
                : img.data;
              return {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${cleanBase64}` },
              };
            }),
          ],
        },
      ];
      text = await callCustomApi(openAiMessages, aiSettings, "json");
    } else {
      const client = getGeminiClient();
      const contents: any[] = [prompt];
      for (const img of images || []) {
        const cleanBase64 = img.data.includes(",")
          ? img.data.substring(img.data.indexOf(",") + 1)
          : img.data;
        let mimeType = img.mimeType || "image/jpeg";
        if (mimeType === "application/octet-stream" || !mimeType.startsWith("image/")) {
          mimeType = "image/jpeg";
        }
        contents.push({
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        });
      }

      const result = await generateWithRetry(client, {
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: extractResponseSchema,
        },
        contents: contents,
      });
      text = result.text || "{}";
    }

    const resJson = parseJsonSafely(text, {
      document_type: "other",
      indicators: [],
      message: "Parsing completed with fallback",
    });

    res.json(resJson);
  } catch (error: any) {
    console.error("Express /api/extract error:", error);
    const errorMsg =
      typeof error === "object" ? error.message || JSON.stringify(error) : String(error);
    res.status(500).json({ error: errorMsg });
  }
});

// 2. Get AI Health Insights
apiRouter.post("/insights", async (req, res) => {
  try {
    const { member, labs, symptoms, languageContext, images, aiSettings } = req.body;
    const hasImages = Boolean(images && images.length > 0);
    const prompt = buildInsightsPrompt(member, labs, symptoms, languageContext, hasImages);

    let text = "";
    if (aiSettings && aiSettings.provider === "custom") {
      const openAiMessages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(images || []).map((img: any) => {
              const mimeType =
                img.mimeType && img.mimeType.startsWith("image/")
                  ? img.mimeType
                  : "image/jpeg";
              const cleanBase64 = img.data.replace(/^data:image\/\w+;base64,/, "");
              return {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${cleanBase64}` },
              };
            }),
          ],
        },
      ];
      text = await callCustomApi(openAiMessages, aiSettings, "text");
    } else {
      const client = getGeminiClient();
      const contents: any[] = [prompt];
      if (images) {
        for (const img of images) {
          const cleanBase64 = img.data.replace(/^data:image\/\w+;base64,/, "");
          contents.push({
            inlineData: {
              data: cleanBase64,
              mimeType: img.mimeType,
            },
          });
        }
      }

      const result = await generateWithRetry(client, {
        model: DEFAULT_GEMINI_MODEL,
        contents: contents,
      });
      text = result.text || "";
    }

    res.json({ text });
  } catch (error: any) {
    console.error("Express /api/insights error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI health insights." });
  }
});

// 3. Check medication interactions
apiRouter.post("/interactions", async (req, res) => {
  try {
    const { newMedication, existingMedications, aiSettings } = req.body;
    const prompt = buildInteractionsPrompt(newMedication, existingMedications);

    let text = "{}";
    if (aiSettings && aiSettings.provider === "custom") {
      const openAiMessages = [{ role: "user", content: prompt }];
      text = await callCustomApi(openAiMessages, aiSettings, "json");
    } else {
      const client = getGeminiClient();
      const result = await generateWithRetry(client, {
        model: DEFAULT_GEMINI_MODEL,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hasInteraction: { type: Type.BOOLEAN },
              warningMessage: { type: Type.STRING },
            },
          },
        },
        contents: prompt,
      });
      text = result.text || "";
    }

    const resJson = parseJsonSafely(text, {
      hasInteraction: false,
      warningMessage: "",
    });
    res.json(resJson);
  } catch (error: any) {
    console.error("Express /api/interactions error:", error);
    res.json({
      hasInteraction: false,
      warningMessage: "Failed to verify drug interactions securely.",
    });
  }
});

// 4. Request medical board consilium
apiRouter.post("/consilium", async (req, res) => {
  try {
    const {
      member,
      labs,
      symptoms,
      medications,
      languageContext,
      doctors,
      aiReports,
      aiSettings,
    } = req.body;

    const prompt = buildConsiliumPrompt(
      member,
      labs,
      symptoms,
      medications,
      languageContext,
      doctors,
      aiReports
    );

    let text = "{}";
    if (aiSettings && aiSettings.provider === "custom") {
      const openAiMessages = [{ role: "user", content: prompt }];
      text = await callCustomApi(openAiMessages, aiSettings, "json");
    } else {
      const client = getGeminiClient();
      const result = await generateWithRetry(client, {
        model: DEFAULT_GEMINI_MODEL,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              discussion: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    doctorId: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["doctorId", "text"],
                },
              },
              conclusion: { type: Type.STRING },
            },
            required: ["discussion", "conclusion"],
          },
        },
        contents: prompt,
      });
      text = result.text || "{}";
    }

    const resJson = parseJsonSafely(text, {
      discussion: [],
      conclusion: "Консилиум завершил анализ данных.",
    });
    res.json(resJson);
  } catch (error: any) {
    console.error("Express /api/consilium error:", error);
    res.status(500).json({ error: error.message || "Failed to process the AI Consilium." });
  }
});

// 5. General AI assistant chat
apiRouter.post("/chat", async (req, res) => {
  try {
    const { prompt, aiConfig } = req.body;

    if (aiConfig?.provider === "custom") {
      const result = await callCustomApi([{ role: "user", content: prompt }], aiConfig);
      res.json({ text: result });
      return;
    }

    const client = getGeminiClient();
    const response = await generateWithRetry(client, {
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("No text found in AI response");
    }
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to get AI response" });
  }
});
