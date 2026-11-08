import { Language } from '../translations';

const paramMap: Record<string, Partial<Record<Language, string>>> = {
  // Complete Blood Count (CBC)
  'WBC': { ru: 'Лейкоциты (WBC)', de: 'Leukozyten (WBC)', pl: 'Leukocyty (WBC)', es: 'Leucocitos (WBC)' },
  'RBC': { ru: 'Эритроциты (RBC)', de: 'Erythrozyten (RBC)', pl: 'Erytrocyty (RBC)', es: 'Eritrocitos (RBC)' },
  'HGB': { ru: 'Гемоглобин (HGB)', de: 'Hämoglobin (HGB)', pl: 'Hemoglobina (HGB)', es: 'Hemoglobina (HGB)' },
  'HCT': { ru: 'Гематокрит (HCT)', de: 'Hämatokrit (HCT)', pl: 'Hematokryt (HCT)', es: 'Hematocrito (HCT)' },
  'PLT': { ru: 'Тромбоциты (PLT)', de: 'Thrombozyten (PLT)', pl: 'Płytki krwi (PLT)', es: 'Plaquetas (PLT)' },
  'MCV': { ru: 'Ср. объем эритроцита (MCV)', de: 'Mittleres zelluläres Volumen (MCV)', pl: 'Średnia objętość krwinki (MCV)', es: 'Volumen corpuscular medio (MCV)' },
  'MCH': { ru: 'Ср. содерж. гемоглобина (MCH)', de: 'Mittleres korpuskuläres Hämoglobin (MCH)', pl: 'Średnia masa hemoglobiny (MCH)', es: 'Hemoglobina corpuscular media (MCH)' },
  'MCHC': { ru: 'Ср. конц. гемоглобина (MCHC)', de: 'Mittlere korpuskuläre Hämoglobinkonzentration (MCHC)', pl: 'Średnie stężenie hemoglobiny (MCHC)', es: 'Concentración de hemoglobina corpuscular media (MCHC)' },
  'RDW': { ru: 'Ширина распред. эритроцитов (RDW)', de: 'Erythrozytenverteilungsbreite (RDW)', pl: 'Rozkład objętości erytrocytów (RDW)', es: 'Amplitud de distribución eritrocitaria (RDW)' },
  'MPV': { ru: 'Ср. объем тромбоцита (MPV)', de: 'Mittleres Thrombozytenvolumen (MPV)', pl: 'Średnia objętość płytki krwi (MPV)', es: 'Volumen plaquetario medio (MPV)' },
  'PDW': { ru: 'Ширина распред. тромбоцитов (PDW)', de: 'Thrombozytenverteilungsbreite (PDW)', pl: 'Rozkład objętości płytek krwi (PDW)', es: 'Amplitud de distribución plaquetaria (PDW)' },
  'PCT': { ru: 'Тромбокрит (PCT)', de: 'Thrombozytenkrit (PCT)', pl: 'Płytkokryt (PCT)', es: 'Plaquetocrito (PCT)' },
  'EOS': { ru: 'Эозинофилы (EOS)', de: 'Eosinophile (EOS)', pl: 'Eozynofile (EOS)', es: 'Eosinófilos (EOS)' },
  'MONO': { ru: 'Моноциты (MONO)', de: 'Monozyten (MONO)', pl: 'Monocyty (MONO)', es: 'Monocitos (MONO)' },
  'BASO': { ru: 'Базофилы (BASO)', de: 'Basophile (BASO)', pl: 'Bazofile (BASO)', es: 'Basófilos (BASO)' },
  'NEUT': { ru: 'Нейтрофилы (NEUT)', de: 'Neutrophile (NEUT)', pl: 'Neutrofile (NEUT)', es: 'Neutrófilos (NEUT)' },
  'LYMPH': { ru: 'Лимфоциты (LYMPH)', de: 'Lymphozyten (LYMPH)', pl: 'Limfocyty (LYMPH)', es: 'Linfocitos (LYMPH)' },
  'ESR': { ru: 'СОЭ (ESR)', de: 'Blutkörperchensenkungsgeschwindigkeit (BSG)', pl: 'OB (Odczyn Biernackiego)', es: 'VSG (Velocidad de sedimentación globular)' },
  
  // Basic Metabolic Panel
  'GLU': { ru: 'Глюкоза (GLU)', de: 'Glukose (GLU)', pl: 'Glukoza (GLU)', es: 'Glucosa (GLU)' },
  'CA': { ru: 'Кальций (Ca)', de: 'Kalzium (Ca)', pl: 'Wapń (Ca)', es: 'Calcio (Ca)' },
  'NA': { ru: 'Натрий (Na)', de: 'Natrium (Na)', pl: 'Sód (Na)', es: 'Sodio (Na)' },
  'K': { ru: 'Калий (K)', de: 'Kalium (K)', pl: 'Potas (K)', es: 'Potasio (K)' },
  'CL': { ru: 'Хлориды (Cl)', de: 'Chlorid (Cl)', pl: 'Chlorki (Cl)', es: 'Cloruro (Cl)' },
  'CREA': { ru: 'Креатинин (CREA)', de: 'Kreatinin (CREA)', pl: 'Kreatynina (CREA)', es: 'Creatinina (CREA)' },
  'BUN': { ru: 'Азот мочевины крови (BUN)', de: 'Blutharnstoffstickstoff (BUN)', pl: 'Azot mocznika we krwi (BUN)', es: 'Nitrógeno ureico en sangre (BUN)' },
  'UREA': { ru: 'Мочевина (Urea)', de: 'Harnstoff (Urea)', pl: 'Mocznik (Urea)', es: 'Urea' },
  'URIC_ACID': { ru: 'Мочевая кислота', de: 'Harnsäure', pl: 'Kwas moczowy', es: 'Ácido úrico' },
  
  // Liver & Kidneys
  'AST': { ru: 'АСТ (Аспартатаминотрансфераза)', de: 'AST (GOT)', pl: 'AST', es: 'AST (GOT)' },
  'ALT': { ru: 'АЛТ (Аланинаминотрансфераза)', de: 'ALT (GPT)', pl: 'ALT', es: 'ALT (GPT)' },
  'ALP': { ru: 'Щелочная фосфатаза (ALP)', de: 'Alkalische Phosphatase (ALP)', pl: 'Fosfataza alkaliczna (ALP)', es: 'Fosfatasa alcalina (ALP)' },
  'BIL_TOTAL': { ru: 'Билирубин общий', de: 'Bilirubin gesamt', pl: 'Bilirubina całkowita', es: 'Bilirrubina total' },
  'BIL_DIRECT': { ru: 'Билирубин прямой', de: 'Bilirubin direkt', pl: 'Bilirubina bezpośrednia (sprzężona)', es: 'Bilirrubina directa' },
  'GGT': { ru: 'ГГТ (Гамма-ГТ)', de: 'Gamma-GT (GGT)', pl: 'GGTP', es: 'GGT (Gamma glutamil transferasa)' },
  'TOTAL_PROTEIN': { ru: 'Общий белок', de: 'Gesamteiweiß', pl: 'Białko całkowite', es: 'Proteínas totales' },

  // Lipids
  'CHOL': { ru: 'Холестерин общий', de: 'Cholesterin gesamt', pl: 'Cholesterol całkowity', es: 'Colesterol total' },
  'HDL': { ru: 'ЛПВП (HDL)', de: 'HDL-Cholesterin', pl: 'HDL', es: 'Colesterol HDL' },
  'LDL': { ru: 'ЛПНП (LDL)', de: 'LDL-Cholesterin', pl: 'LDL', es: 'Colesterol LDL' },
  'TRIG': { ru: 'Триглицериды (TRIG)', de: 'Triglyceride (TRIG)', pl: 'Trójglicerydy (TRIG)', es: 'Triglicéridos (TRIG)' },
  'VLDL': { ru: 'ЛПОНП (VLDL)', de: 'VLDL-Cholesterin', pl: 'VLDL', es: 'Colesterol VLDL' },

  // Thyroid
  'TSH': { ru: 'ТТГ (TSH)', de: 'TSH', pl: 'TSH', es: 'TSH' },
  'FT4': { ru: 'Свободный Т4 (FT4)', de: 'Freies T4 (FT4)', pl: 'Wolne T4 (FT4)', es: 'T4 libre (FT4)' },
  'FT3': { ru: 'Свободный Т3 (FT3)', de: 'Freies T3 (FT3)', pl: 'Wolne T3 (FT3)', es: 'T3 libre (FT3)' },
  'T4': { ru: 'Общий Т4', de: 'Gesamtes T4', pl: 'Całkowite T4', es: 'T4 total' },
  'T3': { ru: 'Общий Т3', de: 'Gesamtes T3', pl: 'Całkowite T3', es: 'T3 total' },
  'ANTI_TPO': { ru: 'Анти-ТПО', de: 'Anti-TPO', pl: 'anty-TPO', es: 'Anti-TPO' },
  'ANTI_TG': { ru: 'Анти-ТГ', de: 'Anti-TG', pl: 'anty-TG', es: 'Anti-TG' },

  // Iron / Anemia
  'FERRITIN': { ru: 'Ферритин', de: 'Ferritin', pl: 'Ferrytyna', es: 'Ferritina' },
  'IRON': { ru: 'Железо сывороточное', de: 'Serumeisen', pl: 'Żelazo w surowicy', es: 'Hierro sérico' },
  'TIBC': { ru: 'ОЖСС (TIBC)', de: 'Totale Eisenbindungskapazität (TIBC)', pl: 'Całkowita zdolność wiązania żelaza (TIBC)', es: 'Capacidad total de fijación de hierro (TIBC)' },
  'TRANSFERRIN': { ru: 'Трансферрин', de: 'Transferrin', pl: 'Transferyna', es: 'Transferrina' },
  
  // Vitamins & Hormones & Others
  'VITAMIN_D': { ru: 'Витамин D (25-OH)', de: 'Vitamin D (25-OH)', pl: 'Witamina D (25-OH)', es: 'Vitamina D (25-OH)' },
  'B12': { ru: 'Витамин B12', de: 'Vitamin B12', pl: 'Witamina B12', es: 'Vitamina B12' },
  'FOLATE': { ru: 'Фолиевая кислота', de: 'Folsäure', pl: 'Kwas foliowy', es: 'Ácido fólico' },
  'CRP': { ru: 'СРБ (C-реактивный белок)', de: 'CRP (C-reaktives Protein)', pl: 'CRP (Białko C-reaktywne)', es: 'PCR (Proteína C reactiva)' },
  'TESTOSTERONE': { ru: 'Тестостерон', de: 'Testosteron', pl: 'Testosteron', es: 'Testosterona' },
  'ESTRADIOL': { ru: 'Эстрадиол (E2)', de: 'Östradiol (E2)', pl: 'Estradiol (E2)', es: 'Estradiol (E2)' },
  'PROGESTERONE': { ru: 'Прогестерон', de: 'Progesteron', pl: 'Progesteron', es: 'Progesterona' },
  'PROLACTIN': { ru: 'Пролактин', de: 'Prolaktin', pl: 'Prolaktyna', es: 'Prolactina' },
  'CORTISOL': { ru: 'Кортизол', de: 'Cortisol', pl: 'Kortyzol', es: 'Cortisol' },
  'INSULIN': { ru: 'Инсулин', de: 'Insulin', pl: 'Insulina', es: 'Insulina' },
  'HBA1C': { ru: 'Гликированный гемоглобин (HbA1c)', de: 'HbA1c', pl: 'HbA1c (Hemoglobina glikowana)', es: 'Hemoglobina glicosilada (HbA1c)' },
  'MAGNESIUM': { ru: 'Магний (Mg)', de: 'Magnesium (Mg)', pl: 'Magnez (Mg)', es: 'Magnesio (Mg)' },
  'PHOSPHORUS': { ru: 'Фосфор (P)', de: 'Phosphor (P)', pl: 'Fosfor (P)', es: 'Fósforo (P)' },
  'CK': { ru: 'КФК (Креатинкиназа)', de: 'Kreatinkinase (CK)', pl: 'Kinaza kreatynowa (CK)', es: 'Creatina quinasa (CK)' },
  'LDH': { ru: 'ЛДГ (Лактатдегидрогеназа)', de: 'Laktatdehydrogenase (LDH)', pl: 'Dehydrogenaza mleczanowa (LDH)', es: 'Lactato deshidrogenasa (LDH)' },
  'AMYLASE': { ru: 'Амилаза', de: 'Amylase', pl: 'Amylaza', es: 'Amilasa' }
};

export const aliases: Record<string, string> = {
  'GLUCOSE': 'GLU',
  'GLUCOSIS': 'GLU',
  'SUGAR': 'GLU',
  'HEMOGLOBIN': 'HGB',
  'HEMATOCRIT': 'HCT',
  'LEUKOCYTES': 'WBC',
  'ERYTHROCYTES': 'RBC',
  'WHITE BLOOD CELLS': 'WBC',
  'RED BLOOD CELLS': 'RBC',
  'PLATELETS': 'PLT',
  'THROMBOCYTES': 'PLT',
  'CHOLESTEROL': 'CHOL',
  'TOTAL CHOLESTEROL': 'CHOL',
  'TRIGLYCERIDES': 'TRIG',
  'TRIGLYCERIDE': 'TRIG',
  'UREA NITROGEN': 'BUN',
  'CREATININE': 'CREA',
  'BILIRUBIN': 'BIL_TOTAL',
  'BILIRUBIN TOTAL': 'BIL_TOTAL',
  'TOTAL BILIRUBIN': 'BIL_TOTAL',
  'BILIRUBIN DIRECT': 'BIL_DIRECT',
  'DIRECT BILIRUBIN': 'BIL_DIRECT',
  'URIC ACID': 'URIC_ACID',
  'TOTAL PROTEIN': 'TOTAL_PROTEIN',
  'PROTEIN TOTAL': 'TOTAL_PROTEIN',
  'IRON': 'IRON',
  'SERUM IRON': 'IRON',
  'FE': 'IRON',
  'VITAMIN D': 'VITAMIN_D',
  'VITAMIN D3': 'VITAMIN_D',
  '25-OH VITAMIN D': 'VITAMIN_D',
  'VIT D': 'VITAMIN_D',
  'VITAMIN B12': 'B12',
  'CALCIUM': 'CA',
  'SODIUM': 'NA',
  'POTASSIUM': 'K',
  'CHLORIDE': 'CL',
  'MAGNESIUM': 'MAGNESIUM',
  'PHOSPHORUS': 'PHOSPHORUS',
  'C-REACTIVE PROTEIN': 'CRP',
  'ESR': 'ESR',
  'SED RATE': 'ESR',
  'THYROID STIMULATING HORMONE': 'TSH'
};

export const translateParameter = (param: string, lang: Language): string => {
  if (!param || typeof param !== 'string') return String(param || '');
  if (lang === 'en') return param; // default
  
  // Normalize the input: trim, uppercase, remove extra whitespace
  let normalizedParam = param.trim().toUpperCase().replace(/\s+/g, ' ');
  
  // 1. Exact match in aliases
  if (aliases[normalizedParam]) {
    normalizedParam = aliases[normalizedParam];
  }
  
  // 2. Exact match in paramMap
  if (paramMap[normalizedParam] && paramMap[normalizedParam][lang]) {
    return paramMap[normalizedParam][lang] as string;
  }
  
  // 3. Fallback: fuzzy/partial match if no exact match found
  // For example, if param is "GLUCOSE (FASTING)", we try to find keys or aliases that match.
  for (const [alias, canonicalKey] of Object.entries(aliases)) {
    if (normalizedParam.includes(alias)) {
      if (paramMap[canonicalKey] && paramMap[canonicalKey][lang]) {
        return paramMap[canonicalKey][lang] as string; // returning translated canonical
      }
    }
  }

  for (const [key, value] of Object.entries(paramMap)) {
    if (normalizedParam.includes(key)) {
      if (value[lang]) {
        return value[lang] as string;
      }
    }
  }
  
  // Return original parameter if no translation found
  return param;
};
