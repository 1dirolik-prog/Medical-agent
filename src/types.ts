/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Sex = 'Male' | 'Female';
export type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';
export type Language = 'en' | 'ru' | 'pl' | 'es' | 'de';

export interface AiSettings {
  provider: 'gemini' | 'custom';
  customUrl?: string;
  customKey?: string;
  customModel?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  sex: Sex;
  height: number; // cm
  weight: number; // kg
  bloodGroup: BloodGroup;
  occupation: string;
  lifestyle: string;
  chronicConditions: string[];
  medications: Medication[];
  isChild: boolean;
  belongsToFamily?: boolean;
  cycleTrackingEnabled?: boolean;
  mission?: string;
  role?: string;
}

export type MedicationForm = 'tablet' | 'capsule' | 'drops' | 'ointment' | 'injection' | 'syrup' | 'other';
export type MealRelation = 'before' | 'after' | 'with' | 'any';
export type MedicationImportance = 'normal' | 'important' | 'critical';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form?: MedicationForm;
  frequency: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  notes?: string;
  reminders?: string[];
  inventory?: number; // pills remaining
  mealRelation?: MealRelation;
  photoUrl?: string;
  warnings?: string[];
  importance?: MedicationImportance;
}

export type IntakeStatus = 'taken' | 'skipped' | 'snoozed' | 'partial';

export interface MedicationLog {
  id: string;
  medicationId: string;
  memberId: string;
  date: string; // ISO date 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  status: IntakeStatus;
  notes?: string;
  snoozedToTime?: string; // Next reminder time if snoozed
}

export interface LabResult {
  id: string;
  date: string;
  parameter: string; // e.g. "Ferritin"
  value: number;
  textValue?: string;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  category: 'Blood' | 'Biochemistry' | 'Urinalysis' | 'Imaging' | 'Ultrasound' | 'MRI' | 'CT' | 'Consultation' | 'Other';
  notes?: string;
  doctorSpecialization?: string;
}

export interface SymptomLog {
  id: string;
  date: string;
  symptoms: string[]; // e.g. ["Fatigue", "Headache"]
  severity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface HealthEvent {
  id: string;
  date: string;
  type: 'LAB' | 'SYMPTOM' | 'MEDICATION' | 'WEARABLE';
  data: any;
}

export interface AIReport {
  id: string;
  date: string;
  title: string;
  content: string;
  doctorSpecialization?: string;
  reportType?: 'labs' | 'studies' | 'consultations' | 'general' | 'insight' | 'consilium';
}

export interface RiskAnalysis {
  parameterId: string;
  level: RiskLevel;
  message: string;
  trend: 'Up' | 'Down' | 'Stable';
}

export interface AIRecommendation {
  id: string;
  type: 'LIFESTYLE' | 'MEDICAL' | 'NUTRITION';
  title: string;
  content: string;
  priority: RiskLevel;
}
