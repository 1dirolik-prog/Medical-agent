import { FamilyMember, LabResult, SymptomLog } from "../types";
import { STORAGE_KEY } from "./storage";

const getCustomAiConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('family_health_state');
    if (raw) {
      const state = JSON.parse(raw);
      if (state.aiSettings) {
        return state.aiSettings;
      }
    }
  } catch (e) {}
  return { provider: 'gemini' };
};

export const getGeminiContent = async (prompt: string): Promise<string> => {
  const aiConfig = getCustomAiConfig();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ prompt, aiConfig })
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = errText;
      try {
        const errJson = JSON.parse(errText);
        msg = errJson.error || errText;
      } catch (e) {}
      throw new Error(msg);
    }

    const json = await response.json();
    return json.text;
  } catch (error: any) {
    console.error("Client getGeminiContent error:", error);
    throw error;
  }
};

export const extractLabsFromImages = async (
  images: { data: string; mimeType: string }[],
  targetLanguage: string = "en",
  previousHistory: string = "",
  documentTypeHint?: string
) => {
  try {
    const aiSettings = getCustomAiConfig();

    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
      },
      body: JSON.stringify({
        images,
        targetLanguage,
        previousHistory,
        aiSettings,
        documentTypeHint,
      }),
    });

    if (!response.ok) {
      // Decode potential JSON error message or general text
      const errText = await response.text();
      let msg = errText;
      try {
        const errJson = JSON.parse(errText);
        msg = errJson.error || errText;
      } catch (e) {}
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Client extractLabsFromImages error:", error);
    throw error;
  }
};

export const getAIHealthInsights = async (
  member: FamilyMember,
  labs: LabResult[],
  symptoms: SymptomLog[],
  languageContext: string = "English",
  images?: { data: string, mimeType: string }[]
) => {
  try {
    const aiSettings = getCustomAiConfig();

    const response = await fetch("/api/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
      },
      body: JSON.stringify({
        member,
        labs,
        symptoms,
        languageContext,
        images,
        aiSettings,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to load health insights from the server.");
    }

    const data = await response.json();
    return data.text || "No insights returned from the server.";
  } catch (error: any) {
    console.error("Client getAIHealthInsights error:", error);
    return "AI insights are currently unavailable. Please verify connection to the server.";
  }
};

export const checkMedicationInteractions = async (
  newMedication: string,
  existingMedications: { name: string }[]
): Promise<{ hasInteraction: boolean; warningMessage: string }> => {
  if (existingMedications.length === 0) {
    return { hasInteraction: false, warningMessage: "" };
  }

  try {
    const aiSettings = getCustomAiConfig();

    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
      },
      body: JSON.stringify({
        newMedication,
        existingMedications,
        aiSettings,
      }),
    });

    if (!response.ok) {
      return { hasInteraction: false, warningMessage: "" };
    }

    return await response.json();
  } catch (error: any) {
    console.error("Client checkMedicationInteractions error:", error);
    return { hasInteraction: false, warningMessage: "" };
  }
};

export const requestConsilium = async (
  member: FamilyMember,
  labs: LabResult[],
  symptoms: SymptomLog[],
  medications: any[],
  languageContext: string,
  doctors: {id: string, name: string, spec: string}[],
  aiReports: any[] = []
) => {
  try {
    const aiSettings = getCustomAiConfig();

    const response = await fetch("/api/consilium", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "Accept": "application/json",
      },
      body: JSON.stringify({
        member,
        labs,
        symptoms,
        medications,
        languageContext,
        doctors,
        aiReports,
        aiSettings,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = "Consilium generation failed.";
      try {
        const errJson = JSON.parse(errText);
        msg = errJson.error || msg;
      } catch (e) {}
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Client requestConsilium error:", error);
    throw error;
  }
};
