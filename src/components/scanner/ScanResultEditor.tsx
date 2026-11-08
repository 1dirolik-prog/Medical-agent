import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  Pill,
  Activity,
  AlertCircle,
} from 'lucide-react';

export interface EditableIndicator {
  id: string;
  selected: boolean;
  name: string;
  name_short?: string;
  category?: string;
  value: number;
  text_value?: string;
  unit: string;
  reference_min?: number;
  reference_max?: number;
  reference_text?: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'unknown';
  comment?: string;
}

export interface EditableMedication {
  id: string;
  selected: boolean;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface ScanResultEditorProps {
  indicators: EditableIndicator[];
  onUpdateIndicators: (indicators: EditableIndicator[]) => void;
  medications: EditableMedication[];
  onUpdateMedications: (medications: EditableMedication[]) => void;
  language: string;
}

export const ScanResultEditor: React.FC<ScanResultEditorProps> = ({
  indicators,
  onUpdateIndicators,
  medications,
  onUpdateMedications,
  language,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const isRu = language === 'ru';

  // Toggle selection for a single indicator
  const toggleIndicatorSelect = (id: string) => {
    onUpdateIndicators(
      indicators.map((ind) => (ind.id === id ? { ...ind, selected: !ind.selected } : ind))
    );
  };

  // Toggle all indicators
  const toggleAllIndicators = () => {
    const allSelected = indicators.every((ind) => ind.selected);
    onUpdateIndicators(indicators.map((ind) => ({ ...ind, selected: !allSelected })));
  };

  // Delete indicator
  const deleteIndicator = (id: string) => {
    onUpdateIndicators(indicators.filter((ind) => ind.id !== id));
  };

  // Modify indicator field
  const updateIndicatorField = (id: string, field: keyof EditableIndicator, value: any) => {
    onUpdateIndicators(
      indicators.map((ind) => {
        if (ind.id === id) {
          const updated = { ...ind, [field]: value };
          // Auto recalculate status if numeric value or bounds change
          if (field === 'value' || field === 'reference_min' || field === 'reference_max') {
            const min = field === 'reference_min' ? value : ind.reference_min;
            const max = field === 'reference_max' ? value : ind.reference_max;
            const num = field === 'value' ? Number(value) : ind.value;

            if (min != null && max != null && min !== 0 && max !== 0) {
              if (num < min) updated.status = 'low';
              else if (num > max) updated.status = 'high';
              else updated.status = 'normal';
            }
          }
          return updated;
        }
        return ind;
      })
    );
  };

  // Add a manual indicator
  const addManualIndicator = () => {
    const newId = `manual_${Date.now()}`;
    const newIndicator: EditableIndicator = {
      id: newId,
      selected: true,
      name: isRu ? 'Новый показатель' : 'New Indicator',
      value: 0,
      unit: '',
      status: 'normal',
    };
    onUpdateIndicators([newIndicator, ...indicators]);
    setEditingId(newId);
  };

  // Toggle medication
  const toggleMedicationSelect = (id: string) => {
    onUpdateMedications(
      medications.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const selectedIndicatorsCount = indicators.filter((i) => i.selected).length;
  const selectedMedsCount = medications.filter((m) => m.selected).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
            {isRu ? 'В норме' : 'Normal'}
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
            {isRu ? 'Ниже нормы' : 'Low'}
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
            {isRu ? 'Выше нормы' : 'High'}
          </span>
        );
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800">
            {isRu ? 'Критично' : 'Critical'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            {isRu ? 'Норма не указана' : 'No range'}
          </span>
        );
    }
  };

  return (
    <div className="card-android !p-5 space-y-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Indicators Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Activity size={18} className="text-medical-blue" />
            <span>{isRu ? 'Извлеченные показатели' : 'Extracted Indicators'}</span>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold">
              {selectedIndicatorsCount} / {indicators.length}
            </span>
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {isRu
              ? 'Вы можете отредактировать любое значение перед сохранением в медкарту'
              : 'You can edit any value before saving it to health record'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAllIndicators}
            className="text-xs text-medical-blue dark:text-blue-400 hover:underline font-bold px-2 py-1 cursor-pointer"
          >
            {indicators.every((i) => i.selected)
              ? isRu
                ? 'Снять все'
                : 'Deselect all'
              : isRu
              ? 'Выбрать все'
              : 'Select all'}
          </button>
          <button
            type="button"
            onClick={addManualIndicator}
            className="flex items-center gap-1 text-xs bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue dark:text-blue-400 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>{isRu ? 'Добавить строку' : 'Add row'}</span>
          </button>
        </div>
      </div>

      {/* Indicators List / Interactive Table */}
      {indicators.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          {isRu ? 'Показатели не найдены' : 'No indicators extracted'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
          {indicators.map((ind) => {
            const isEditing = editingId === ind.id;

            return (
              <div
                key={ind.id}
                className={`p-3 transition-colors ${
                  ind.selected
                    ? 'bg-white dark:bg-slate-900/90'
                    : 'bg-slate-50/60 dark:bg-slate-950/40 opacity-60'
                }`}
              >
                {isEditing ? (
                  /* Inline Edit Form */
                  <div className="space-y-2.5 bg-blue-50/40 dark:bg-blue-950/20 p-3 rounded-lg border border-medical-blue/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-medical-blue">
                        {isRu ? 'Редактирование показателя' : 'Edit Indicator'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-medical-blue font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Check size={14} /> {isRu ? 'Готово' : 'Done'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRu ? 'Название' : 'Name'}
                        </label>
                        <input
                          type="text"
                          value={ind.name}
                          onChange={(e) => updateIndicatorField(ind.id, 'name', e.target.value)}
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRu ? 'Значение (число)' : 'Numeric Value'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={ind.value || ''}
                          onChange={(e) => updateIndicatorField(ind.id, 'value', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRu ? 'Единица измерения' : 'Unit'}
                        </label>
                        <input
                          type="text"
                          value={ind.unit || ''}
                          placeholder="г/л, ммоль/л..."
                          onChange={(e) => updateIndicatorField(ind.id, 'unit', e.target.value)}
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRu ? 'Текстовый результат (если есть)' : 'Text Result (if any)'}
                        </label>
                        <input
                          type="text"
                          value={ind.text_value || ''}
                          placeholder="отрицательно, обнаружено..."
                          onChange={(e) => updateIndicatorField(ind.id, 'text_value', e.target.value)}
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRu ? 'Референс мин.' : 'Ref Min'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={ind.reference_min ?? ''}
                          onChange={(e) =>
                            updateIndicatorField(
                              ind.id,
                              'reference_min',
                              e.target.value === '' ? undefined : parseFloat(e.target.value)
                            )
                          }
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          {isRu ? 'Референс макс.' : 'Ref Max'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={ind.reference_max ?? ''}
                          onChange={(e) =>
                            updateIndicatorField(
                              ind.id,
                              'reference_max',
                              e.target.value === '' ? undefined : parseFloat(e.target.value)
                            )
                          }
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Display Row */
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleIndicatorSelect(ind.id)}
                      className="text-slate-400 hover:text-medical-blue transition-colors cursor-pointer shrink-0"
                    >
                      {ind.selected ? (
                        <CheckSquare size={18} className="text-medical-blue" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>

                    {/* Parameter name and category */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {ind.name}
                        </span>
                        {ind.name_short && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold">
                            {ind.name_short}
                          </span>
                        )}
                        {getStatusBadge(ind.status)}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>
                          {isRu ? 'Норма:' : 'Ref:'}{' '}
                          {ind.reference_text ||
                            (ind.reference_min != null && ind.reference_max != null
                              ? `${ind.reference_min} - ${ind.reference_max} ${ind.unit}`
                              : isRu
                              ? 'не указана'
                              : 'not specified')}
                        </span>
                        {ind.comment && (
                          <span className="text-amber-600 dark:text-amber-400 truncate max-w-[200px]">
                            • {ind.comment}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Value Badge */}
                    <div className="text-right shrink-0">
                      {ind.text_value ? (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {ind.text_value}
                        </span>
                      ) : (
                        <span
                          className={`text-sm font-bold px-2 py-1 rounded-lg inline-block ${
                            ind.status === 'normal'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                              : ind.status === 'critical'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {ind.value} <span className="text-[10px] font-medium">{ind.unit}</span>
                        </span>
                      )}
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(ind.id)}
                        className="p-1 text-slate-400 hover:text-medical-blue transition-colors cursor-pointer"
                        title={isRu ? 'Редактировать' : 'Edit'}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteIndicator(ind.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title={isRu ? 'Удалить' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Extracted Prescriptions / Medications (if present in document) */}
      {medications.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Pill size={16} className="text-purple-500" />
              <span>{isRu ? 'Назначенные препараты' : 'Prescribed Medications'}</span>
              <span className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                {selectedMedsCount} / {medications.length}
              </span>
            </h5>
          </div>

          <div className="space-y-2">
            {medications.map((med) => (
              <div
                key={med.id}
                onClick={() => toggleMedicationSelect(med.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  med.selected
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-purple-600">
                    {med.selected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      {med.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {med.dosage} {med.frequency ? `• ${med.frequency}` : ''}{' '}
                      {med.duration ? `• ${med.duration}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
