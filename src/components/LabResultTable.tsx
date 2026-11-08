import React from "react";
import { translateParameter } from "../services/paramTranslator";
import { getStandardReferenceRange } from "../services/referenceRanges";
import { LabResult, Language } from "../types";
import { TrendingUp, Edit2, Trash2 } from "lucide-react";

interface LabResultTableProps {
  labs: LabResult[];
  language?: Language;
  onSelectParameter?: (paramName: string) => void;
  onEditLab?: (lab: LabResult) => void;
  onDeleteLab?: (labId: string) => void;
  compact?: boolean;
}

export const LabResultTable: React.FC<LabResultTableProps> = ({
  labs,
  language = "en",
  onSelectParameter,
  onEditLab,
  onDeleteLab,
  compact = false,
}) => {
  if (!labs || labs.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700/60">
            <th className="py-2.5 px-3">
              {language === "ru" ? "Параметр" : language === "es" ? "Parámetro" : language === "de" ? "Parameter" : language === "pl" ? "Parametr" : "Parameter"}
            </th>
            <th className="py-2.5 px-2">
              {language === "ru" ? "Значение" : language === "es" ? "Valor" : language === "de" ? "Wert" : language === "pl" ? "Wartość" : "Value"}
            </th>
            <th className="py-2.5 px-2">
              {language === "ru" ? "Норма" : language === "es" ? "Referencia" : language === "de" ? "Referenz" : language === "pl" ? "Norma" : "Ref. Range"}
            </th>
            {(onSelectParameter || onEditLab || onDeleteLab) && (
              <th className="py-2.5 px-2 text-right pr-3">
                {language === "ru" ? "Действия" : "Actions"}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {labs.map((lab) => {
            const standardRange = getStandardReferenceRange(lab.parameter);
            let refText = "-";
            let isOutOfRange = false;

            if (standardRange) {
              if (standardRange.text) {
                refText = standardRange.text;
              } else if (standardRange.min !== undefined && standardRange.max !== undefined) {
                refText = `${standardRange.min} - ${standardRange.max}`;
              }
              if (typeof lab.value === "number") {
                if (standardRange.min !== undefined && lab.value < standardRange.min) isOutOfRange = true;
                if (standardRange.max !== undefined && lab.value > standardRange.max) isOutOfRange = true;
              }
            } else if (lab.referenceRange) {
              if (!(lab.referenceRange.min === 0 && lab.referenceRange.max === 0)) {
                refText = `${lab.referenceRange.min} - ${lab.referenceRange.max}`;
                if (typeof lab.value === "number") {
                  isOutOfRange = lab.value < lab.referenceRange.min || lab.value > lab.referenceRange.max;
                }
              }
            }

            const paramName = translateParameter(lab.parameter, language);

            return (
              <tr
                key={lab.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors group"
              >
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className={onSelectParameter ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" : ""}
                      onClick={() => onSelectParameter && onSelectParameter(lab.parameter)}
                    >
                      {paramName}
                    </span>
                    {onSelectParameter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectParameter(lab.parameter);
                        }}
                        className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all p-1 rounded-md cursor-pointer inline-flex items-center gap-0.5 opacity-70 group-hover:opacity-100"
                        title={language === "ru" ? "Посмотреть динамику" : "View trend"}
                      >
                        <TrendingUp size={12} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-2 font-bold select-all">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs ${
                      isOutOfRange
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                    }`}
                  >
                    {lab.value}{" "}
                    {lab.unit && (
                      <span className="text-[10px] uppercase font-normal ml-1 opacity-80">
                        {lab.unit}
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                  {refText}
                </td>
                {(onSelectParameter || onEditLab || onDeleteLab) && (
                  <td className="py-2.5 px-2 text-right pr-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onEditLab && (
                        <button
                          type="button"
                          onClick={() => onEditLab(lab)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title={language === "ru" ? "Редактировать" : "Edit"}
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {onDeleteLab && (
                        <button
                          type="button"
                          onClick={() => onDeleteLab(lab.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title={language === "ru" ? "Удалить" : "Delete"}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
