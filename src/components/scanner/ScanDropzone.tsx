import React, { useState, useRef } from 'react';
import { Camera, ImageIcon, FileUp, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ScanDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedDocHint: string | null;
  onDocHintSelect: (hint: string | null) => void;
  language: string;
  isProcessing?: boolean;
}

export const ScanDropzone: React.FC<ScanDropzoneProps> = ({
  onFilesSelected,
  selectedDocHint,
  onDocHintSelect,
  language,
  isProcessing = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const isRu = language === 'ru';

  const docHints = isRu
    ? [
        { id: 'blood', label: 'Анализ крови' },
        { id: 'biochemistry', label: 'Биохимия / Моча' },
        { id: 'mri', label: 'МРТ / КТ' },
        { id: 'ultrasound', label: 'УЗИ / Рентген' },
        { id: 'consultation', label: 'Консультация врача' },
        { id: 'prescription', label: 'Рецепт / Назначение' },
      ]
    : [
        { id: 'blood', label: 'Blood Test' },
        { id: 'biochemistry', label: 'Biochemistry / Urine' },
        { id: 'mri', label: 'MRI / CT' },
        { id: 'ultrasound', label: 'Ultrasound / X-Ray' },
        { id: 'consultation', label: 'Doctor Consultation' },
        { id: 'prescription', label: 'Prescription' },
      ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Capture Area with Drag & Drop */}
      <div
        id="scan-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`card-android relative overflow-hidden transition-all duration-300 !p-8 flex flex-col items-center text-center border-2 ${
          isDragOver
            ? 'border-medical-blue bg-blue-50/50 dark:bg-blue-950/20 shadow-lg scale-[1.01]'
            : 'border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        {/* Animated Scanner Radar Icon */}
        <div className="relative mb-5">
          <div className="w-20 h-20 bg-medical-blue/10 dark:bg-medical-blue/20 rounded-full flex items-center justify-center absolute -inset-2 animate-ping opacity-25" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/30 overflow-hidden">
            <motion.div
              animate={{ top: ['-10%', '110%', '-10%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
              className="absolute left-0 right-0 h-[3px] bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] z-20"
            />
            <FileUp size={34} strokeWidth={2} className="relative z-10" />
          </div>
        </div>

        <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1.5">
          {isRu ? 'Загрузите медицинский документ' : 'Upload Medical Document'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-6 leading-relaxed">
          {isRu
            ? 'Сфотографируйте бланк или перетащите снимок. AI извлечёт показатели, референсы и динамику.'
            : 'Take a photo or drag & drop files. AI will extract parameters, reference ranges, and trends.'}
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            id="btn-scan-camera"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 bg-gradient-to-r from-medical-blue to-blue-600 hover:from-blue-600 hover:to-medical-blue text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold shadow-md shadow-medical-blue/25 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <Camera size={20} />
            <span>{isRu ? 'Камера' : 'Camera'}</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            id="btn-scan-gallery"
            disabled={isProcessing}
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            <ImageIcon size={20} className="text-medical-blue" />
            <span>{isRu ? 'Галерея / Файлы' : 'Gallery / Files'}</span>
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {/* Hints / Category Selector */}
        <div className="mt-6 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
            <Sparkles size={13} className="text-medical-blue" />
            <span>{isRu ? 'Подсказка типа документа (опционально)' : 'Document Type Hint (Optional)'}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center max-w-sm mx-auto">
            {docHints.map((hint) => {
              const isSelected = selectedDocHint === hint.id;
              return (
                <button
                  key={hint.id}
                  type="button"
                  id={`hint-btn-${hint.id}`}
                  onClick={() => onDocHintSelect(isSelected ? null : hint.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-medical-blue text-white border-medical-blue shadow-xs scale-102'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {hint.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality tips */}
        <div className="mt-5 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {isRu ? 'Чёткий текст' : 'Sharp text'}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {isRu ? 'Хорошее освещение' : 'Good lighting'}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-blue-500" />
            {isRu ? 'Конфиденциально' : 'Private'}
          </span>
        </div>
      </div>
    </div>
  );
};
