import { Sex } from '../types';
import { aliases } from './paramTranslator';

export interface ReferenceRange {
  min?: number;
  max?: number;
  text?: string;
}

// Helper to normalize parameter name
const normalizeParam = (param: string): string => {
  const norm = param.trim().toUpperCase().replace(/\s+/g, '_');
  
  return aliases[norm] || norm;
};

export const getStandardReferenceRange = (
  parameter: string,
  age: number = 30,
  sex: Sex | string = 'Male'
): ReferenceRange | null => {
  let param = normalizeParam(parameter);
  const isMale = sex === 'Male' || sex === 'Мужской';

  // Manual mappings for fuzzy names
  if (param.includes('VITAMIN D') || param.includes('VITAMIN_D')) param = 'VITAMIN_D';

  switch (param) {
    case 'CHOL':
      if (age < 1) return { min: 1.8, max: 3.7 };
      if (age < 12) return { min: 3.7, max: 4.5 };
      if (age >= 20 && age < 30) {
        return isMale ? { min: 3.16, max: 6.32 } : { min: 3.22, max: 6.05 };
      }
      if (age >= 30 && age < 40) {
        return isMale ? { min: 3.57, max: 7.15 } : { min: 3.34, max: 6.35 };
      }
      if (age >= 40 && age < 50) {
        return isMale ? { min: 3.91, max: 7.15 } : { min: 3.85, max: 6.82 };
      }
      if (age >= 50 && age < 60) {
        return isMale ? { min: 4.09, max: 7.15 } : { min: 4.25, max: 7.75 };
      }
      if (age >= 60 && age < 70) {
        return isMale ? { min: 4.12, max: 7.10 } : { min: 4.45, max: 7.35 };
      }
      if (age >= 70) {
        return isMale ? { min: 3.73, max: 6.86 } : { min: 4.48, max: 7.85 };
      }
      return { max: 5.0, text: '< 5.0' };

    case 'LDL': return { max: 3.0, text: '< 3.0' };
    case 'HDL': return isMale ? { min: 1.0, text: '> 1.0' } : { min: 1.2, text: '> 1.2' };
    case 'TRIG': return { max: 1.7, text: '< 1.7' };
    case 'VLDL': return { min: 0.26, max: 1.04 };

    case 'GLU': return { min: 3.9, max: 5.5 };
    case 'HBA1C': return { max: 6.0, text: '< 6.0 %' };
    case 'INSULIN': return { min: 2.6, max: 24.9 };

    case 'HGB':
      if (age < 1) return { min: 100, max: 140 };
      if (age < 12) return { min: 115, max: 145 };
      return isMale ? { min: 130, max: 170 } : { min: 120, max: 150 };
    case 'HCT': return isMale ? { min: 40, max: 52 } : { min: 36, max: 48 };
    case 'RBC': return isMale ? { min: 4.3, max: 5.7 } : { min: 3.8, max: 5.1 };
    case 'MCV': return { min: 80, max: 100 };
    case 'MCH': return { min: 27, max: 33 };
    case 'MCHC': return { min: 320, max: 360 }; // or 32-36 g/dL depending on unit
    case 'RDW': return { min: 11.5, max: 14.5 };
    
    case 'WBC': return { min: 4.0, max: 9.0 };
    case 'NEUT': return { min: 40, max: 70 };
    case 'LYMPH': return { min: 20, max: 40 };
    case 'MONO': return { min: 2, max: 10 };
    case 'EOS': return { min: 0, max: 5 };
    case 'BASO': return { min: 0, max: 1 };

    case 'PLT': return { min: 150, max: 400 };
    case 'MPV': return { min: 7.0, max: 11.0 };
    case 'PDW': return { min: 10.0, max: 18.0 };
    case 'PCT': return { min: 0.15, max: 0.40 };

    case 'ESR': 
      if (age > 50) return isMale ? { max: 20, text: '< 20' } : { max: 30, text: '< 30' };
      return isMale ? { max: 15, text: '< 15' } : { max: 20, text: '< 20' };

    case 'CA': return { min: 2.1, max: 2.6 };
    case 'NA': return { min: 135, max: 145 };
    case 'K': return { min: 3.5, max: 5.1 };
    case 'CL': return { min: 98, max: 107 };
    case 'MAGNESIUM': return { min: 0.66, max: 1.07 };
    case 'PHOSPHORUS': return { min: 0.87, max: 1.45 };

    case 'CREA': return isMale ? { min: 62, max: 106 } : { min: 44, max: 80 };
    case 'BUN': return { min: 2.5, max: 7.1 };
    case 'UREA': return { min: 2.5, max: 8.3 };
    case 'URIC_ACID': return isMale ? { min: 210, max: 420 } : { min: 150, max: 350 };

    case 'AST': return { max: 40, text: '< 40' };
    case 'ALT': return { max: 40, text: '< 40' };
    case 'ALP': return { min: 30, max: 120 };
    case 'BIL_TOTAL': return { max: 21, text: '< 21' };
    case 'BIL_DIRECT': return { max: 5, text: '< 5' };
    case 'GGT': return isMale ? { max: 60, text: '< 60' } : { max: 40, text: '< 40' };
    case 'TOTAL_PROTEIN': return { min: 64, max: 83 };

    case 'FERRITIN': return isMale ? { min: 20, max: 250 } : { min: 10, max: 120 };
    case 'IRON': return isMale ? { min: 11.6, max: 31.3 } : { min: 9.0, max: 30.4 };
    case 'TIBC': return { min: 45, max: 72 };
    case 'TRANSFERRIN': return { min: 2.0, max: 3.6 };

    case 'TSH': return { min: 0.4, max: 4.0 };
    case 'FT4': return { min: 9.0, max: 22.0 };
    case 'FT3': return { min: 2.6, max: 5.7 };
    case 'T4': return { min: 66, max: 181 };
    case 'T3': return { min: 1.2, max: 3.1 };
    case 'ANTI_TPO': return { max: 34, text: '< 34' };
    case 'ANTI_TG': return { max: 115, text: '< 115' };

    case 'VITAMIN_D': return { min: 30, max: 100, text: '30 - 100' };
    case 'B12': return { min: 190, max: 900 };
    case 'FOLATE': return { min: 3, text: '> 3' };

    case 'CRP': return { max: 5, text: '< 5' };
    case 'CK': return isMale ? { max: 190, text: '< 190' } : { max: 170, text: '< 170' };
    case 'LDH': return { min: 140, max: 280 };
    case 'AMYLASE': return { max: 100, text: '< 100' };
    
    case 'TESTOSTERONE': return isMale ? { min: 12, max: 35 } : { max: 2.4, text: '< 2.4' };
    case 'PROLACTIN': return isMale ? { min: 86, max: 324 } : { min: 102, max: 496 };
    case 'CORTISOL': return { min: 171, max: 536 };
    case 'ESTRADIOL': return { text: 'Phase dependent' };
    case 'PROGESTERONE': return { text: 'Phase dependent' };

    default:
      return null;
  }
};
