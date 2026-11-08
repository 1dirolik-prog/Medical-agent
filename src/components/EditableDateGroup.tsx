import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface EditableDateGroupProps {
  dateStr: string;
  displayDate: string;
  sectionTitle: string;
  onSave: (newDate: string) => void;
}

export const EditableDateGroup: React.FC<EditableDateGroupProps> = ({
  dateStr,
  displayDate,
  sectionTitle,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  });

  if (isEditing) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-100 dark:border-slate-700 font-bold text-sm flex items-center gap-2">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 outline-none focus:border-medical-blue"
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            onSave(newDate);
            setIsEditing(false);
          }}
          className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-100 dark:border-slate-700 font-bold text-sm flex items-center gap-2 group">
      <div className="w-2 h-2 rounded-full bg-medical-blue" />
      {displayDate} <span className="text-xs text-slate-400 font-normal ml-2">{sectionTitle}</span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="p-1 text-slate-400 hover:text-medical-blue transition-colors cursor-pointer"
        aria-label="Edit"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
};
