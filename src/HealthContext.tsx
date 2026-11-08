import React, { createContext, useContext, useState, useEffect } from 'react';
import { FamilyMember, LabResult, SymptomLog, Medication, AIReport, MedicationLog, AiSettings } from './types';
import { loadState, saveState, getFromIndexedDB } from './services/storage';
import { Language, translations, TranslationDictionary, getTranslations } from './translations';

export type AppTheme = 'light' | 'dark' | 'system';

interface HealthContextType {
  members: FamilyMember[];
  activeMember: FamilyMember | null;
  activeMemberId: string | null;
  labResults: LabResult[];
  symptoms: SymptomLog[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  aiReports: AIReport[];
  language: Language;
  appTheme: AppTheme;
  aiSettings: AiSettings;
  t: TranslationDictionary;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  previousTab: string | null;
  setActiveMemberId: (id: string) => void;
  setLanguage: (lang: Language) => void;
  setAppTheme: (theme: AppTheme) => void;
  setAiSettings: (settings: AiSettings) => void;
  addLabResult: (result: LabResult) => void;
  updateLabResult: (result: LabResult) => void;
  updateLabResultsDate: (oldDate: string, newDate: string, ids?: string[]) => void;
  addSymptom: (symptom: SymptomLog) => void;
  updateSymptom: (symptom: SymptomLog) => void;
  deleteSymptom: (id: string) => void;
  addMember: (member: FamilyMember) => void;
  updateMember: (member: FamilyMember) => void;
  deleteMember: (id: string) => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (medication: Medication) => void;
  deleteMedication: (id: string) => void;
  addMedicationLog: (log: MedicationLog) => void;
  updateMedicationLog: (log: MedicationLog) => void;
  deleteMedicationLog: (id: string) => void;
  addAIReport: (report: AIReport) => void;
  updateAIReport: (id: string, report: Partial<AIReport>) => void;
  deleteAIReport: (id: string) => void;
  deleteLabResult: (id: string) => void;
  deleteLabResultsByDate: (date: string) => void;
  showAddLabModal: boolean;
  setShowAddLabModal: (show: boolean) => void;
  exportBackupData: () => any;
  importBackupData: (backupData: any) => boolean;
}


const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('health_activeTab') || 'home';
  });

  const [previousTab, setPreviousTab] = useState<string | null>(null);

  const setActiveTab = (tab: string) => {
    if (tab !== 'settings') {
      setPreviousTab(activeTab);
    }
    sessionStorage.setItem('health_activeTab', tab);
    setActiveTabState(tab);
  };

  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState(() => {
    const loaded = loadState();
    return {
      ...loaded,
      language: (loaded as any).language || 'en',
      appTheme: (loaded as any).appTheme || 'system',
      aiSettings: (loaded as any).aiSettings || { provider: 'gemini' }
    };
  });

  // Only persist to storage once async IndexedDB sync is complete
  useEffect(() => {
    if (isInitialized) {
      saveState(state as any);
    }
  }, [state, isInitialized]);

  useEffect(() => {
    const theme = (state as any).appTheme || 'system';
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      root.classList.add(theme);
    }
  }, [(state as any).appTheme]);

  // Asynchronous storage hydration from IndexedDB with safe initial seeding
  useEffect(() => {
    let mounted = true;

    const hydrateStorage = async () => {
      try {
        const idbState = await getFromIndexedDB();
        if (!mounted) return;

        setState(prev => {
          let merged = prev;
          if (idbState && Array.isArray(idbState.members) && idbState.members.length > 0) {
            merged = {
              ...prev,
              ...idbState,
              language: (idbState as any).language || (prev as any).language || 'en',
              appTheme: (idbState as any).appTheme || (prev as any).appTheme || 'system',
              aiSettings: (idbState as any).aiSettings || (prev as any).aiSettings || { provider: 'gemini' }
            };
          }

          // Only seed initial demonstration data if labResults are completely empty
          if (Object.keys(merged.labResults || {}).length === 0) {
            const mockMemberId = merged.activeMemberId || merged.members[0]?.id || '1';
            merged = {
              ...merged,
              labResults: {
                [mockMemberId]: [
                  { id: '1', date: '2026-03-10', parameter: 'Ferritin', value: 8, unit: 'ng/mL', referenceRange: { min: 20, max: 200 }, category: 'Blood' },
                  { id: '2', date: '2026-03-10', parameter: 'Iron', value: 45, unit: 'µg/dL', referenceRange: { min: 60, max: 170 }, category: 'Blood' },
                  { id: '3', date: '2026-03-10', parameter: 'Hemoglobin', value: 10.5, unit: 'g/dL', referenceRange: { min: 13.5, max: 17.5 }, category: 'Blood' },
                  { id: '4', date: '2026-04-15', parameter: 'Cholesterol', value: 240, unit: 'mg/dL', referenceRange: { min: 120, max: 200 }, category: 'Blood' }
                ]
              },
              symptoms: {
                [mockMemberId]: [
                  { id: 's1', date: '2026-04-28', symptoms: ['Fatigue', 'Dizziness'], severity: 4, notes: 'Feeling very drained after work.' },
                  { id: 's2', date: '2026-04-29', symptoms: ['Headache'], severity: 2 }
                ]
              },
              medications: {
                [mockMemberId]: [
                  { id: 'm1', name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Daily' }
                ]
              }
            };
          }

          return merged;
        });
      } catch (err) {
        console.warn('Failed to hydrate from IndexedDB, using local state:', err);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    hydrateStorage();

    return () => {
      mounted = false;
    };
  }, []);

  const activeMemberId = state.activeMemberId;
  const activeMember = state.members.find(m => m.id === activeMemberId) || null;
  const labResults = activeMemberId ? (state.labResults[activeMemberId] || []) : [];
  const symptoms = activeMemberId ? (state.symptoms[activeMemberId] || []) : [];
  const medications = activeMemberId ? ((state.medications || {})[activeMemberId] || []) : [];
  const medicationLogs = activeMemberId ? (((state as any).medicationLogs || {})[activeMemberId] || []) : [];
  const aiReports = activeMemberId ? ((state as any).aiReports?.[activeMemberId] || []) : [];
  const language: Language = (state as any).language || 'en';
  const appTheme: AppTheme = (state as any).appTheme || 'system';
  const aiSettings: AiSettings = (state as any).aiSettings || { provider: 'gemini' };
  const t = getTranslations(language);

  const setLanguage = (lang: Language) => {
    setState(prev => ({ ...prev, language: lang }));
  };

  const setAppTheme = (theme: AppTheme) => {
    setState(prev => ({ ...prev, appTheme: theme }));
  };

  const setAiSettings = (settings: AiSettings) => {
    setState(prev => ({ ...prev, aiSettings: settings }));
  };

  const setActiveMemberId = (id: string) => {
    setState(prev => ({ ...prev, activeMemberId: id }));
  };

  const addLabResult = (result: LabResult) => {
    if (!activeMemberId) return;
    setState(prev => ({
      ...prev,
      labResults: {
        ...prev.labResults,
        [activeMemberId]: [...(prev.labResults[activeMemberId] || []), result]
      }
    }));
  };

  const updateLabResult = (result: LabResult) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentLabs = prev.labResults[activeMemberId] || [];
      return {
        ...prev,
        labResults: {
          ...prev.labResults,
          [activeMemberId]: currentLabs.map(lab => lab.id === result.id ? result : lab)
        }
      };
    });
  };

  const updateLabResultsDate = (oldDate: string, newDate: string, ids?: string[]) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentLabs = prev.labResults[activeMemberId] || [];
      const oldDatePrefix = oldDate.split('T')[0];
      return {
        ...prev,
        labResults: {
          ...prev.labResults,
          [activeMemberId]: currentLabs.map(lab => {
             const labDay = lab.date.split('T')[0];
             // If IDs are provided, only update if the lab's ID is in the list
             const shouldUpdate = ids ? ids.includes(lab.id) : (labDay === oldDatePrefix);
             if (shouldUpdate) {
                // Keep time if possible, or just replace the whole string if newDate includes time.
                // Assuming newDate is YYYY-MM-DD
                const timePart = lab.date.includes('T') ? lab.date.substring(lab.date.indexOf('T')) : 'T00:00:00.000Z';
                return { ...lab, date: newDate + timePart };
             }
             return lab;
          })
        }
      };
    });
  };

  const addSymptom = (symptom: SymptomLog) => {
    if (!activeMemberId) return;
    setState(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [activeMemberId]: [...(prev.symptoms[activeMemberId] || []), symptom]
      }
    }));
  };

  const updateSymptom = (symptom: SymptomLog) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentSymptoms = prev.symptoms[activeMemberId] || [];
      return {
        ...prev,
        symptoms: {
          ...prev.symptoms,
          [activeMemberId]: currentSymptoms.map(sym => sym.id === symptom.id ? symptom : sym)
        }
      };
    });
  };

  const addMember = (member: FamilyMember) => {
    setState(prev => ({
      ...prev,
      members: [...prev.members, member]
    }));
  };

  const updateMember = (member: FamilyMember) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === member.id ? member : m)
    }));
  };

  const deleteMember = (id: string) => {
    setState(prev => {
      const remainingMembers = prev.members.filter(m => m.id !== id);
      
      const newLabResults = { ...prev.labResults };
      delete newLabResults[id];

      const newSymptoms = { ...prev.symptoms };
      delete newSymptoms[id];

      const newMedications = { ...prev.medications };
      delete newMedications[id];

      const newAIReports = { ...((prev as any).aiReports || {}) };
      delete newAIReports[id];

      return {
        ...prev,
        members: remainingMembers,
        labResults: newLabResults,
        symptoms: newSymptoms,
        medications: newMedications,
        aiReports: newAIReports as any,
        // Switch active user if the active one was deleted
        activeMemberId: prev.activeMemberId === id ? remainingMembers[0]?.id || null : prev.activeMemberId
      };
    });
  };

  const addMedication = (medication: Medication) => {
    if (!activeMemberId) return;
    setState(prev => ({
      ...prev,
      medications: {
        ...(prev.medications || {}),
        [activeMemberId]: [...((prev.medications || {})[activeMemberId] || []), medication]
      }
    }));
  };

  const updateMedication = (medication: Medication) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentMedications = (prev.medications || {})[activeMemberId] || [];
      return {
        ...prev,
        medications: {
          ...(prev.medications || {}),
          [activeMemberId]: currentMedications.map(med => med.id === medication.id ? medication : med)
        }
      };
    });
  };

  const deleteMedication = (id: string) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentMedications = (prev.medications || {})[activeMemberId] || [];
      return {
        ...prev,
        medications: {
          ...(prev.medications || {}),
          [activeMemberId]: currentMedications.filter(med => med.id !== id)
        }
      };
    });
  };

  const addMedicationLog = (log: MedicationLog) => {
    if (!activeMemberId) return;
    setState(prev => ({
      ...prev,
      medicationLogs: {
        ...((prev as any).medicationLogs || {}),
        [activeMemberId]: [...(((prev as any).medicationLogs || {})[activeMemberId] || []), log]
      }
    }));
  };

  const updateMedicationLog = (log: MedicationLog) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentLogs = ((prev as any).medicationLogs || {})[activeMemberId] || [];
      return {
        ...prev,
        medicationLogs: {
          ...((prev as any).medicationLogs || {}),
          [activeMemberId]: currentLogs.map((l: MedicationLog) => l.id === log.id ? log : l)
        }
      };
    });
  };

  const deleteMedicationLog = (id: string) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentLogs = ((prev as any).medicationLogs || {})[activeMemberId] || [];
      return {
        ...prev,
        medicationLogs: {
          ...((prev as any).medicationLogs || {}),
          [activeMemberId]: currentLogs.filter((l: MedicationLog) => l.id !== id)
        }
      };
    });
  };

  const deleteLabResult = (id: string) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentLabs = prev.labResults[activeMemberId] || [];
      return {
        ...prev,
        labResults: {
          ...prev.labResults,
          [activeMemberId]: currentLabs.filter(lab => lab.id !== id)
        }
      };
    });
  };

  const deleteSymptom = (id: string) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentSymptoms = prev.symptoms[activeMemberId] || [];
      return {
        ...prev,
        symptoms: {
          ...prev.symptoms,
          [activeMemberId]: currentSymptoms.filter(sym => sym.id !== id)
        }
      };
    });
  };

  const deleteLabResultsByDate = (date: string) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentLabs = prev.labResults[activeMemberId] || [];
      const updatedLabs = currentLabs.filter(lab => {
        const labDay = lab.date.split('T')[0];
        const targetDay = date.split('T')[0];
        return labDay !== targetDay;
      });
      return {
        ...prev,
        labResults: {
          ...prev.labResults,
          [activeMemberId]: updatedLabs
        }
      };
    });
  };

  const addAIReport = (report: AIReport) => {
    if (!activeMemberId) return;
    setState(prev => ({
      ...prev,
      aiReports: {
        ...(prev as any).aiReports,
        [activeMemberId]: [...((prev as any).aiReports?.[activeMemberId] || []), report]
      }
    }));
  };

  const updateAIReport = (id: string, overrides: Partial<AIReport>) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentReports = (prev as any).aiReports?.[activeMemberId] || [];
      return {
        ...prev,
        aiReports: {
          ...(prev as any).aiReports,
          [activeMemberId]: currentReports.map((r: AIReport) => r.id === id ? { ...r, ...overrides } : r)
        }
      };
    });
  };

  const deleteAIReport = (id: string) => {
    if (!activeMemberId) return;
    setState(prev => {
      const currentReports = (prev as any).aiReports?.[activeMemberId] || [];
      return {
        ...prev,
        aiReports: {
          ...(prev as any).aiReports,
          [activeMemberId]: currentReports.filter((r: AIReport) => r.id !== id)
        }
      };
    });
  };

  const exportBackupData = React.useCallback(() => {
    return {
      version: '1.0.4',
      exportedAt: new Date().toISOString(),
      members: state.members,
      activeMemberId: state.activeMemberId,
      labResults: state.labResults || {},
      symptoms: state.symptoms || {},
      medications: state.medications || {},
      medicationLogs: (state as any).medicationLogs || {},
      aiReports: (state as any).aiReports || {},
      language: (state as any).language || 'en',
      appTheme: (state as any).appTheme || 'system',
      aiSettings: (state as any).aiSettings || { provider: 'gemini' }
    };
  }, [state]);

  const importBackupData = React.useCallback((backupData: any): boolean => {
    try {
      if (!backupData || typeof backupData !== 'object') return false;

      const members = Array.isArray(backupData.members) && backupData.members.length > 0
        ? backupData.members
        : state.members;

      const newActiveId = backupData.activeMemberId || members[0]?.id || state.activeMemberId;

      const newState: any = {
        ...state,
        members,
        activeMemberId: newActiveId,
        labResults: backupData.labResults && typeof backupData.labResults === 'object' ? backupData.labResults : state.labResults,
        symptoms: backupData.symptoms && typeof backupData.symptoms === 'object' ? backupData.symptoms : state.symptoms,
        medications: backupData.medications && typeof backupData.medications === 'object' ? backupData.medications : state.medications,
        medicationLogs: backupData.medicationLogs && typeof backupData.medicationLogs === 'object' ? backupData.medicationLogs : (state as any).medicationLogs,
        aiReports: backupData.aiReports && typeof backupData.aiReports === 'object' ? backupData.aiReports : (state as any).aiReports,
      };

      if (backupData.language) newState.language = backupData.language;
      if (backupData.appTheme) newState.appTheme = backupData.appTheme;
      if (backupData.aiSettings) newState.aiSettings = backupData.aiSettings;

      setState(newState);
      saveState(newState);
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  }, [state]);

  const contextValue = React.useMemo(() => ({
    members: state.members,
    activeMember,
    activeMemberId,
    labResults,
    symptoms,
    medications,
    medicationLogs,
    aiReports,
    language,
    appTheme,
    aiSettings,
    t,
    activeTab,
    previousTab,
    setActiveTab,
    setActiveMemberId,
    setLanguage,
    setAppTheme,
    setAiSettings,
    addLabResult,
    updateLabResult,
    updateLabResultsDate,
    deleteLabResult,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    addMember,
    updateMember,
    deleteMember,
    addMedication,
    updateMedication,
    deleteMedication,
    addMedicationLog,
    updateMedicationLog,
    deleteMedicationLog,
    addAIReport,
    updateAIReport,
    deleteAIReport,
    deleteLabResultsByDate,
    showAddLabModal,
    setShowAddLabModal,
    exportBackupData,
    importBackupData
  }), [
    state.members,
    activeMember,
    activeMemberId,
    labResults,
    symptoms,
    medications,
    medicationLogs,
    aiReports,
    language,
    appTheme,
    aiSettings,
    t,
    activeTab,
    previousTab,
    showAddLabModal,
    exportBackupData,
    importBackupData
  ]);

  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) throw new Error('useHealth must be used within a HealthProvider');
  return context;
};
