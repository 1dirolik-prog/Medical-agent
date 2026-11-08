import React from 'react';
import { Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export type ScanStage = 'preparing' | 'ocr' | 'analyzing' | 'done' | 'error';

interface ScanProgressCardProps {
  stage: ScanStage;
  progress: number;
  stageMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  language: string;
}

export const ScanProgressCard: React.FC<ScanProgressCardProps> = ({
  stage,
  progress,
  stageMessage,
  error,
  onRetry,
  language,
}) => {
  const isRu = language === 'ru';

  const defaultStageMessages: Record<ScanStage, string> = {
    preparing: isRu
      ? 'Оптимизация и калибровка снимков...'
      : 'Optimizing and calibrating document images...',
    ocr: isRu
      ? 'Медицинское оптическое распознавание текста (OCR)...'
      : 'Medical Optical Character Recognition (OCR)...',
    analyzing: isRu
      ? 'Клинический анализ показателей и сопоставление норм...'
      : 'Clinical indicator analysis and reference range mapping...',
    done: isRu ? 'Распознавание завершено!' : 'Scan completed successfully!',
    error: isRu ? 'Ошибка распознавания' : 'Scanning error',
  };

  const currentMessage = stageMessage || defaultStageMessages[stage];

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-android !p-5 bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-start gap-3"
      >
        <AlertCircle size={22} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1">
            {isRu ? 'Не удалось извлечь данные' : 'Failed to extract data'}
          </h4>
          <p className="text-xs text-rose-600/90 dark:text-rose-400/90 leading-relaxed font-medium">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
            >
              {isRu ? 'Попробовать снова' : 'Retry'}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-android !p-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border-medical-blue/20 dark:border-blue-900/40 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-medical-blue/10 dark:bg-medical-blue/20 flex items-center justify-center text-medical-blue">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-white block">
              {isRu ? 'Идёт обработка Medical AI' : 'Medical AI is processing'}
            </span>
            <span className="text-xs text-medical-blue dark:text-blue-400 font-medium">
              {currentMessage}
            </span>
          </div>
        </div>
        <span className="text-sm font-bold text-medical-blue bg-medical-blue/10 dark:bg-medical-blue/20 px-2.5 py-1 rounded-full">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-medical-blue to-indigo-600 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      {/* Visual step indicators */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        <div
          className={`flex items-center justify-center gap-1 py-1 rounded-md transition-colors ${
            progress >= 20
              ? 'text-medical-blue dark:text-blue-400 font-bold bg-medical-blue/5'
              : ''
          }`}
        >
          <CheckCircle size={12} className={progress >= 20 ? 'text-medical-blue' : 'text-slate-300'} />
          <span>{isRu ? 'Подготовка' : 'Prep'}</span>
        </div>
        <div
          className={`flex items-center justify-center gap-1 py-1 rounded-md transition-colors ${
            progress >= 60
              ? 'text-medical-blue dark:text-blue-400 font-bold bg-medical-blue/5'
              : ''
          }`}
        >
          <CheckCircle size={12} className={progress >= 60 ? 'text-medical-blue' : 'text-slate-300'} />
          <span>{isRu ? 'Текст (OCR)' : 'OCR'}</span>
        </div>
        <div
          className={`flex items-center justify-center gap-1 py-1 rounded-md transition-colors ${
            progress >= 90
              ? 'text-medical-blue dark:text-blue-400 font-bold bg-medical-blue/5'
              : ''
          }`}
        >
          <CheckCircle size={12} className={progress >= 90 ? 'text-medical-blue' : 'text-slate-300'} />
          <span>{isRu ? 'Анализ норм' : 'Analysis'}</span>
        </div>
      </div>
    </motion.div>
  );
};
