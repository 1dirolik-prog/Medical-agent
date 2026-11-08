import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { motion } from 'motion/react';
import { Smile, Frown, Meh, Save, X, Edit2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const SymptomsDiary = () => {
  const { addSymptom, updateSymptom, deleteSymptom, symptoms, t, activeMemberId, members, setActiveTab, language } = useHealth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [severity, setSeverity] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [symptomToDelete, setSymptomToDelete] = useState<string | null>(null);

  if (!activeMemberId || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 pt-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Profile Selected</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Please select or create a profile before logging symptoms.</p>
        <button 
          onClick={() => setActiveTab('family')}
          className="px-6 py-3 bg-medical-blue text-white rounded-xl font-bold mt-2 cursor-pointer"
        >
          Go to Profiles
        </button>
      </div>
    );
  }

  const symptomKeys = [
    'Fatigue', 'Headache', 'Indigestion', 'Joint Pain', 
    'Anxiety', 'Sleep Issues', 'Dizziness', 'Shortness of Breath'
  ];

  const handleToggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  const handleEdit = (log: any) => {
    setEditingId(log.id);
    setSeverity(log.severity);
    setSelectedSymptoms(log.symptoms);
    setNotes(log.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSeverity(3);
    setSelectedSymptoms([]);
    setNotes('');
  };

  const handleSave = () => {
    if (editingId) {
      updateSymptom({
        id: editingId,
        date: symptoms.find(s => s.id === editingId)?.date || new Date().toISOString(),
        symptoms: selectedSymptoms,
        severity: severity as any,
        notes
      });
      setEditingId(null);
    } else {
      addSymptom({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        symptoms: selectedSymptoms,
        severity: severity as any,
        notes
      });
    }

    setSeverity(3);
    setSelectedSymptoms([]);
    setNotes('');
    setActiveTab('home');
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.wellbeing_diary}</h2>

      <div className="card-android p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{editingId ? t.edit_entry : t.new_entry}</h3>
          {editingId && (
            <button onClick={handleCancelEdit} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 cursor-pointer">{t.cancel_edit}</button>
          )}
        </div>
        <section>
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">{t.how_you_feel_today}</h4>
          <div className="flex justify-between items-center px-4">
             {[1, 2, 3, 4, 5].map(v => (
               <button 
                 key={v}
                 onClick={() => setSeverity(v)}
                 className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${severity === v ? 'bg-medical-blue text-white scale-110 shadow-lg shadow-medical-blue/20' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550'}`}
               >
                 {getEmoji(v)}
               </button>
             ))}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">{t.common_symptoms}</h4>
          <div className="flex flex-wrap gap-2">
            {symptomKeys.map((s, idx) => (
              <button
                key={s}
                onClick={() => handleToggleSymptom(s)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all border cursor-pointer ${selectedSymptoms.includes(s) ? 'bg-medical-blue/10 dark:bg-medical-blue/20 border-medical-blue text-medical-blue' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
              >
                {t.symptom_list?.[idx] || s}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">{t.notes}</h4>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-medical-blue text-slate-800 dark:text-slate-100 min-h-[100px]"
            placeholder={t.describe_symptoms}
          />
        </section>

        <button 
          type="button"
          onClick={handleSave}
          className="w-full bg-medical-blue text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-medical-blue/20 transition-transform active:scale-95 cursor-pointer"
        >
          <Save size={20} /> {editingId ? t.update_entry : t.save_entry}
        </button>
      </div>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white">{t.recent_logs}</h3>
        {symptoms.slice(-3).reverse().map(log => (
          <div key={log.id} className="card-android p-4 flex gap-4 relative pr-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center text-xl shrink-0">
              {getEmoji(log.severity)}
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 dark:text-slate-550 font-bold mb-1">{new Date(log.date).toLocaleDateString()}</p>
              <div className="flex flex-wrap gap-1">
                {log.symptoms.map(s => {
                  const sIdx = symptomKeys.indexOf(s);
                  const displaySymptom = sIdx !== -1 && t.symptom_list ? t.symptom_list[sIdx] : s;
                  return (
                    <span key={s} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase">{displaySymptom}</span>
                  );
                })}
              </div>
              {log.notes && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 italic">"{log.notes}"</p>}
            </div>
            <div className="absolute right-4 top-4 flex flex-col gap-2">
               <button 
                 onClick={() => handleEdit(log)}
                 aria-label={language === 'ru' ? 'Редактировать' : 'Edit'}
                 className="p-1.5 -m-1.5 text-slate-300 dark:text-slate-600 hover:text-medical-blue dark:hover:text-medical-blue transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
               >
                 <Edit2 size={16} />
               </button>
               <button 
                 onClick={() => setSymptomToDelete(log.id)}
                 aria-label={language === 'ru' ? 'Удалить' : 'Delete'}
                 className="p-1.5 -m-1.5 text-slate-300 dark:text-slate-600 hover:text-medical-red dark:hover:text-medical-red transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
               >
                 <X size={16} />
               </button>
            </div>
          </div>
        ))}
      </section>

      <ConfirmDialog
        isOpen={symptomToDelete !== null}
        onClose={() => setSymptomToDelete(null)}
        onConfirm={() => {
          if (symptomToDelete) {
            deleteSymptom(symptomToDelete);
          }
        }}
        title={language === 'ru' ? 'Удалить запись о симптоме?' : 'Delete Symptom Log?'}
        description={
          language === 'ru'
            ? 'Вы уверены, что хотите удалить эту запись из дневника самочувствия?'
            : 'Are you sure you want to delete this entry from your wellbeing diary?'
        }
        confirmText={language === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={language === 'ru' ? 'Отмена' : 'Cancel'}
      />
    </div>
  );
};

const getEmoji = (severity: number) => {
  switch (severity) {
    case 1: return <Smile size={24} />;
    case 2: return <Smile size={24} className="opacity-60" />;
    case 3: return <Meh size={24} />;
    case 4: return <Frown size={24} className="opacity-60" />;
    case 5: return <Frown size={24} />;
    default: return <Meh size={24} />;
  }
};

export default SymptomsDiary;
