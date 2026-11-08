import React, { useRef } from 'react';
import { Trash2, Plus, Sparkles, X, FileText, AlertCircle } from 'lucide-react';
import { ProcessedDocumentImage } from '../../services/imagePreprocessor';

interface ScanPreviewGalleryProps {
  images: ProcessedDocumentImage[];
  onRemoveImage: (id: string) => void;
  onAddMoreFiles: (files: File[]) => void;
  onStartAnalysis: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
  language: string;
}

export const ScanPreviewGallery: React.FC<ScanPreviewGalleryProps> = ({
  images,
  onRemoveImage,
  onAddMoreFiles,
  onStartAnalysis,
  onClearAll,
  isProcessing,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRu = language === 'ru';

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMoreFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="card-android !p-5 space-y-4 border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <FileText size={18} className="text-medical-blue" />
            <span>
              {isRu ? `Подготовлено страниц: ${images.length}` : `Ready pages: ${images.length}`}
            </span>
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {isRu
              ? 'Проверьте чёткость снимков перед отправкой'
              : 'Verify image clarity before sending'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={isProcessing}
          className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <X size={14} />
          {isRu ? 'Очистить' : 'Clear all'}
        </button>
      </div>

      {/* Pages Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-[3/4] flex flex-col shadow-xs"
          >
            <img
              src={img.thumbnail || img.data}
              alt={`Page ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Page badge */}
            <div className="absolute top-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {isRu ? `Стр. ${index + 1}` : `Page ${index + 1}`}
            </div>
            {/* Delete button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onRemoveImage(img.id)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-90 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
              title={isRu ? 'Удалить страницу' : 'Remove page'}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {/* Add More button card */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-medical-blue dark:hover:border-medical-blue rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-medical-blue dark:hover:text-blue-400 transition-colors aspect-[3/4] cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 gap-1.5 p-3 text-center"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Plus size={18} />
          </div>
          <span className="text-xs font-bold leading-tight">
            {isRu ? 'Добавить страницу' : 'Add page'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      </div>

      {/* Trigger Analysis Button */}
      <div className="pt-2">
        <button
          type="button"
          id="btn-start-analysis"
          disabled={isProcessing}
          onClick={onStartAnalysis}
          className="w-full bg-gradient-to-r from-medical-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-medical-blue/25 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
        >
          <Sparkles size={18} />
          <span>
            {isRu
              ? `Распознать через Medical AI (${images.length} ${
                  images.length === 1 ? 'страница' : images.length < 5 ? 'страницы' : 'страниц'
                })`
              : `Analyze with Medical AI (${images.length} ${
                  images.length === 1 ? 'page' : 'pages'
                })`}
          </span>
        </button>
      </div>
    </div>
  );
};
