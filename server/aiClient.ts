import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined on the server side.");
  }
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
};

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const generateWithRetry = async (
  client: GoogleGenAI,
  options: any,
  maxRetries = 5
): Promise<any> => {
  // Normalize model name to valid supported Gemini alias
  if (!options.model || options.model === "gemini-3.5-flash") {
    options.model = DEFAULT_GEMINI_MODEL;
  }
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.models.generateContent(options);
    } catch (e: any) {
      lastError = e;
      const msg = e?.message || "";
      if (
        e?.status === 503 ||
        e?.status === 429 ||
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("high demand") ||
        msg.includes("overloaded")
      ) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`[GenAI] Retrying generation (attempt ${i + 1}/${maxRetries}): ${msg}`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw e;
      }
    }
  }
  throw lastError;
};

export const callCustomApi = async (
  messages: any[],
  aiConfig: any,
  responseFormat: string = "text"
): Promise<string> => {
  const { customUrl, customKey, customModel } = aiConfig;
  if (!customUrl || !customKey || !customModel) {
    throw new Error("Custom AI is configured but missing URL, Key, or Model");
  }

  let url = customUrl;
  if (!url.endsWith("/chat/completions")) {
    url = url.replace(/\/$/, "") + "/chat/completions";
  }

  const payload: any = {
    model: customModel,
    messages: messages,
  };

  if (responseFormat === "json") {
    payload.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customKey}`,
      "HTTP-Referer": "https://healthapp.example.com",
      "X-Title": "Medical AI Agent",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Custom AI API Error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
