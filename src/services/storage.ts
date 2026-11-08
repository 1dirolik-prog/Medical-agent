import { FamilyMember, LabResult, SymptomLog, Medication, AIReport, MedicationLog, AiSettings } from '../types';

export const STORAGE_KEY = 'family_medical_ai_data';
const DB_NAME = 'FamilyMedicalAIDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';
const STATE_DOC_KEY = 'app_state';

export interface AppState {
  members: FamilyMember[];
  activeMemberId: string | null;
  labResults: Record<string, LabResult[]>;
  symptoms: Record<string, SymptomLog[]>;
  medications: Record<string, Medication[]>;
  medicationLogs?: Record<string, MedicationLog[]>;
  aiReports?: Record<string, AIReport[]>;
  language?: string;
  appTheme?: string;
  aiSettings?: AiSettings;
}

const INITIAL_MEMBER: FamilyMember = {
  id: 'master-user',
  name: 'John Doe',
  age: 35,
  sex: 'Male',
  height: 180,
  weight: 82,
  bloodGroup: 'O+',
  occupation: 'Software Engineer',
  lifestyle: 'Active',
  chronicConditions: [],
  medications: [],
  isChild: false,
  mission: 'To get fit and improve cholesterol',
};

export const getDefaultState = (): AppState => ({
  members: [INITIAL_MEMBER],
  activeMemberId: INITIAL_MEMBER.id,
  labResults: {},
  symptoms: {},
  medications: {},
  medicationLogs: {},
  aiReports: {},
  language: 'en',
  appTheme: 'system',
  aiSettings: { provider: 'gemini' },
});

// IndexedDB helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromIndexedDB(): Promise<AppState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_DOC_KEY);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('Failed to read from IndexedDB:', e);
    return null;
  }
}

export async function putToIndexedDB(state: AppState): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_DOC_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to save to IndexedDB:', e);
  }
}

let idbSaveTimeout: any = null;

// Synchronous load for instant boot
export const loadState = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('family_health_state');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...getDefaultState(),
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to parse state from localStorage:', e);
  }
  return getDefaultState();
};

export const saveState = (state: AppState) => {
  // 1. Try to save to localStorage as fast cache (safely caught if quota exceeded)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('localStorage quota reached or unavailable, relying on IndexedDB:', e);
  }

  // 2. Debounced persistent write to IndexedDB
  if (idbSaveTimeout) clearTimeout(idbSaveTimeout);
  idbSaveTimeout = setTimeout(() => {
    putToIndexedDB(state);
  }, 250);
};

export const clearAllData = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('family_health_state');
    sessionStorage.clear();
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Error clearing database:', e);
  }
};

