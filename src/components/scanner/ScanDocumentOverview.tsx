import React from 'react';
import {
  Calendar,
  Building2,
  User,
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';

export interface ScanDocumentMetadata {
  documentType: string;
  documentDate: string;
  labName?: string;
  doctor?: string;
  doctorSpecialization?: string;
  confidence?: number;
  needsReview?: boolean;
  diagnosis?: string;
  recommendations?: string;
  warnings?: string[];
  thumbnail?: string;
}

interface ScanDocumentOverviewProps {
  metadata: ScanDocumentMetadata;
  onUpdateMetadata: (updated: Partial<ScanDocumentMetadata>) => void;
  language: string;
}

export const ScanDocumentOverview: React.FC<ScanDocumentOverviewProps> = ({
  metadata,
  onUpdateMetadata,
  language,
}) => {
  const isRu = language === 'ru';

  const getDocTypeLabel = (type: string) => {
    const map: Record<string, { ru: string; en: string }> = {
      lab_result: { ru: 'Лабораторный анализ', en: 'Laboratory Test' },
      blood: { ru: 'Анализ крови', en: 'Blood Test' },
      biochemistry: { ru: 'Биохимический анализ', en: 'Biochemistry Test' },
      imaging: { ru: 'Лучевая диагностика', en: 'Imaging' },
      ultrasound: { ru: 'УЗИ диагностика', en: 'Ultrasound Scan' },
      mri: { ru: 'МРТ исследование', en: 'MRI Scan' },
      ct: { ru: 'КТ исследование', en: 'CT Scan' },
      consultation: { ru: 'Консультация специалиста', en: 'Consultation Note' },
      medical_report: { ru: 'Медицинская выписка', en: 'Medical Report' },
      prescription: { ru: 'Рецепт / Назначения', en: 'Prescription' },
      other: { ru: 'Медицинский документ', en: 'Medical Document' },
    };
    const key = type?.toLowerCase() || 'other';
    const found = map[key] || { ru: type, en: type };
    return isRu ? found.ru : found.en;
  };

  return (
    <div className="space-y-4">
      {/* Primary Document Meta Card */}
      <div className="card-android !p-5 flex flex-col sm:flex-row gap-4 items-start bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {metadata.thumbnail ? (
          <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xs">
            <img
              src={metadata.thumbnail}
              alt="Scanned Document"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <FileText size={28} />
          </div>
        )}

        <div className="flex-1 w-full space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-medical-blue/10 text-medical-blue dark:text-blue-400">
                <Sparkles size={13} />
                {getDocTypeLabel(metadata.documentType)}
              </span>
              {metadata.needsReview && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
                  <AlertTriangle size={12} />
                  {isRu ? 'Проверьте данные' : 'Review needed'}
                </span>
              )}
            </div>

            {metadata.confidence && (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {isRu ? 'Точность AI:' : 'AI Confidence:'}{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {Math.round(metadata.confidence * 100)}%
                </strong>
              </span>
            )}
          </div>

          {/* Editable Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Date field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={12} />
                <span>{isRu ? 'Дата документа' : 'Document Date'}</span>
              </label>
              <input
                type="date"
                value={metadata.documentDate || ''}
                onChange={(e) => onUpdateMetadata({ documentDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-medical-blue focus:ring-1 focus:ring-medical-blue outline-none transition-all"
              />
            </div>

            {/* Lab or Clinic Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 size={12} />
                <span>{isRu ? 'Лаборатория / Клиника' : 'Lab / Clinic'}</span>
              </label>
              <input
                type="text"
                value={metadata.labName || ''}
                placeholder={isRu ? 'Название лаборатории...' : 'Clinic name...'}
                onChange={(e) => onUpdateMetadata({ labName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-medical-blue focus:ring-1 focus:ring-medical-blue outline-none transition-all"
              />
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User size={12} />
                <span>{isRu ? 'Врач' : 'Doctor'}</span>
              </label>
              <input
                type="text"
                value={metadata.doctor || ''}
                placeholder={isRu ? 'ФИО специалиста...' : 'Doctor name...'}
                onChange={(e) => onUpdateMetadata({ doctor: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-medical-blue focus:ring-1 focus:ring-medical-blue outline-none transition-all"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Stethoscope size={12} />
                <span>{isRu ? 'Специализация' : 'Specialization'}</span>
              </label>
              <input
                type="text"
                value={metadata.doctorSpecialization || ''}
                placeholder={isRu ? 'Терапевт, Эндокринолог...' : 'Cardiologist, ENT...'}
                onChange={(e) => onUpdateMetadata({ doctorSpecialization: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-medical-blue focus:ring-1 focus:ring-medical-blue outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Warnings Banner if any */}
      {metadata.warnings && metadata.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{isRu ? 'Внимание: выявлены отклонения' : 'Warning: critical findings'}</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 pl-1 font-medium leading-relaxed">
            {metadata.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Clinical Insights & Diagnosis Card */}
      {(metadata.diagnosis || metadata.recommendations) && (
        <div className="card-android !p-5 bg-gradient-to-br from-indigo-50/60 via-blue-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            <Sparkles size={14} />
            <span>{isRu ? 'Клиническое резюме Medical AI' : 'Medical AI Clinical Summary'}</span>
          </div>

          {metadata.diagnosis && (
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
                {isRu ? 'Заключение / Диагноз:' : 'Impression / Diagnosis:'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                {metadata.diagnosis}
              </p>
            </div>
          )}

          {metadata.recommendations && (
            <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
                {isRu ? 'Рекомендации и динамика:' : 'Recommendations & Dynamics:'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                {metadata.recommendations}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
