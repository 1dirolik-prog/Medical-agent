import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Plus, Calendar, Save, Trash2, ChevronDown, ChevronUp, AlertTriangle, Loader2, Bell, Clock, X, Archive, CheckCircle2 } from 'lucide-react';
import { Medication, MedicationForm, MealRelation, MedicationLog, MedicationImportance } from '../types';
import { checkMedicationInteractions } from '../services/gemini';

const Medications = () => {
  const { 
    addMedication, 
    updateMedication, 
    deleteMedication, 
    medications, 
    medicationLogs, 
    addMedicationLog,
    deleteMedicationLog,
    activeMember, 
    activeMemberId, 
    members, 
    setActiveTab, 
    t, 
    language 
  } = useHealth();
  const [showAdd, setShowAdd] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filter, setFilter] = useState<'active' | 'past'>('active');

  if (!activeMemberId || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 pt-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.no_profile_selected}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.no_profile_desc}</p>
        <button 
          onClick={() => setActiveTab('family')}
          className="px-6 py-3 bg-medical-blue text-white rounded-xl font-bold mt-2 cursor-pointer"
        >
          {t.go_to_profiles}
        </button>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    dosageUnit: 'mg',
    form: 'tablet' as MedicationForm,
    frequency: 'Daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    duration: '',
    courseDays: '',
    inventory: '',
    mealRelation: 'any' as MealRelation,
    notes: '',
    reminders: ['09:00'],
    importance: 'normal' as MedicationImportance
  });

  const handleFrequencyChange = (freq: string) => {
    let newReminders = [...formData.reminders];
    if (freq === 'Twice Daily') {
      if (newReminders.length < 2) newReminders.push('21:00');
    } else if (freq === 'Daily' || freq === 'Weekly') {
      newReminders = [newReminders[0] || '09:00'];
    } else {
      newReminders = [];
    }
    setFormData({...formData, frequency: freq, reminders: newReminders});
  };

  const isOngoing = (endDate?: string) => {
    if (!endDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return endDate >= today;
  };

  const openAdd = () => {
    setEditingMedicationId(null);
    setFormData({
      name: '',
      dosage: '',
      dosageUnit: 'mg',
      form: 'tablet',
      frequency: 'Daily',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      duration: '',
      courseDays: '',
      inventory: '',
      mealRelation: 'any',
      notes: '',
      reminders: ['09:00'],
      importance: 'normal'
    });
    setInteractionWarning(null);
    setShowAdd(true);
  };

  const openEdit = (med: Medication) => {
    setEditingMedicationId(med.id);
    let dosageVal = med.dosage || '';
    let unit = 'mg';
    if (dosageVal.includes(' ml')) {
      dosageVal = dosageVal.replace(' ml', '');
      unit = 'ml';
    } else if (dosageVal.includes(' mg')) {
      dosageVal = dosageVal.replace(' mg', '');
      unit = 'mg';
    }

    setFormData({
      name: med.name,
      dosage: dosageVal,
      dosageUnit: unit,
      form: med.form || 'tablet',
      frequency: med.frequency,
      startDate: med.startDate || new Date().toISOString().split('T')[0],
      endDate: med.endDate || '',
      duration: med.duration || '',
      courseDays: '',
      inventory: med.inventory?.toString() || '',
      mealRelation: med.mealRelation || 'any',
      notes: med.notes || '',
      reminders: med.reminders || [],
      importance: med.importance || 'normal'
    });
    setInteractionWarning(null);
    setShowDeleteConfirm(false);
    setShowAdd(true);
  };

  const handleDelete = () => {
    if (editingMedicationId) {
      deleteMedication(editingMedicationId);
      setShowAdd(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name) return;

    if (editingMedicationId) {
       saveMedication();
       return;
    }

    setIsChecking(true);
    setInteractionWarning(null);
    
    // Check interactions with other active medications, excluding the one being edited
    const activeMedications = medications.filter(m => m.id !== editingMedicationId && isOngoing(m.endDate));
    const result = await checkMedicationInteractions(formData.name, activeMedications);
    
    setIsChecking(false);

    if (result.hasInteraction) {
      setInteractionWarning(result.warningMessage);
      return;
    }

    saveMedication();
  };

  const saveMedication = () => {
    const medData = {
      id: editingMedicationId || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      dosage: formData.dosage ? `${formData.dosage} ${formData.dosageUnit}`.trim() : '',
      form: formData.form,
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      duration: formData.duration,
      inventory: formData.inventory ? parseInt(formData.inventory) : undefined,
      mealRelation: formData.mealRelation,
      notes: formData.notes,
      reminders: formData.reminders,
      importance: formData.importance
    };

    if (editingMedicationId) {
      updateMedication(medData);
    } else {
      addMedication(medData);
    }

    setShowAdd(false);
    setInteractionWarning(null);
  };

  const activeMedications = medications.filter(m => isOngoing(m.endDate));
  const pastMedications = medications.filter(m => !isOngoing(m.endDate));
  const displayedMedications = filter === 'active' ? activeMedications : pastMedications;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.medications}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.track_medications}</p>
        </div>
        <button 
          onClick={openAdd}
          aria-label={language === 'ru' ? 'Добавить' : 'Add'}
          className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform cursor-pointer"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
        <button 
          onClick={() => setFilter('active')}
          className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer ${filter === 'active' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          {t.active_meds}
        </button>
        <button 
          onClick={() => setFilter('past')}
          className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer ${filter === 'past' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          {t.past_meds}
        </button>
      </div>

      <div className="space-y-4">
        {displayedMedications.length > 0 ? (
          displayedMedications.map(med => {
            const warnings = [];
            if (med.inventory !== undefined && med.inventory <= 5) {
              warnings.push(t.low_inventory.replace('{count}', med.inventory.toString()));
            }
            if (med.name.toLowerCase().includes('sertralin') || med.name.toLowerCase().includes('asentra') || med.name.toLowerCase().includes('antidepressant')) {
              warnings.push(t.abrupt_stop_warning);
            }
            
            // Check logs for missed doses
            const missedLogs = medicationLogs.filter(l => l.medicationId === med.id && l.status === 'skipped');
            if (missedLogs.length >= 3) {
              warnings.push(t.missed_doses_warning.replace('{count}', missedLogs.length.toString()));
            }

            const takenLogs = medicationLogs.filter(l => l.medicationId === med.id && (l.status === 'taken' || l.status === 'partial'));
            const lastTakenLog = takenLogs.length > 0 ? takenLogs.sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())[0] : null;
            const todayStr = new Date().toISOString().split('T')[0];
            const todayTakenLog = takenLogs.find(l => l.date === todayStr);
            let timeSinceLast = '';
            if (lastTakenLog) {
              const diffHours = (new Date().getTime() - new Date(`${lastTakenLog.date}T${lastTakenLog.time}`).getTime()) / (1000 * 60 * 60);
              if (diffHours < 1) {
                timeSinceLast = t.less_than_hour_ago;
              } else if (diffHours < 24) {
                timeSinceLast = t.hours_ago.replace('{count}', Math.floor(diffHours).toString());
              } else {
                timeSinceLast = t.days_ago.replace('{count}', Math.floor(diffHours/24).toString());
              }
            }

            return (
            <motion.div 
              key={med.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card-android cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-all hover:border-purple-200 dark:hover:border-purple-800/40"
              onClick={() => openEdit(med)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 shrink-0">
                    <Pill size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{med.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {med.frequency === 'Daily' ? t.freq_daily : med.frequency === 'Twice Daily' ? t.freq_twice : med.frequency === 'Weekly' ? t.freq_weekly : med.frequency === 'As Needed' ? t.freq_as_needed : med.frequency} {med.dosage ? `• ${med.dosage}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {med.form === 'drops' ? t.med_form_drops : med.form === 'ointment' ? t.med_form_ointment : med.form === 'capsule' ? t.med_form_capsule : med.form === 'tablet' ? t.med_form_tablet : med.form === 'injection' ? t.med_form_injection : med.form === 'syrup' ? t.med_form_syrup : t.med_form_other} 
                      {med.mealRelation !== 'any' && (
                         ` • ${(med.mealRelation === 'before' ? t.meal_relation_before : med.mealRelation === 'after' ? t.meal_relation_after : t.meal_relation_with)}`
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isOngoing(med.endDate) ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                    {isOngoing(med.endDate) ? t.ongoing : t.completed}
                  </span>
                  <div className="flex gap-1 justify-end">
                    {isOngoing(med.endDate) && (
                      <button
                        title={t.move_to_past || "Move to past"}
                        aria-label={t.move_to_past || "Move to past"}
                        onClick={(e) => {
                          e.stopPropagation();
                          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                          updateMedication({ ...med, endDate: yesterday });
                        }}
                        className="p-1.5 text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMedication(med.id);
                      }}
                      aria-label={language === 'ru' ? 'Удалить' : 'Delete'}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {lastTakenLog && (
                <div className="mt-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Clock size={13} />
                    <span>{t.last_taken} {timeSinceLast}</span>
                  </div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{lastTakenLog.time}</div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="mt-2.5 space-y-1">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">
                      <AlertTriangle size={13} />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {isOngoing(med.endDate) && (
                <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {med.inventory !== undefined && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${med.inventory <= 5 ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        {language === 'ru' ? 'Остаток:' : 'Stock:'} {med.inventory}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!activeMemberId) return;
                      if (!todayTakenLog) {
                        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                          try { navigator.vibrate(50); } catch (_) {}
                        }
                        const now = new Date();
                        const log: MedicationLog = {
                          id: Date.now().toString(),
                          medicationId: med.id,
                          memberId: activeMemberId,
                          date: todayStr,
                          time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
                          status: 'taken',
                        };
                        addMedicationLog(log);
                        if (med.inventory && med.inventory > 0) {
                          updateMedication({ ...med, inventory: med.inventory - 1 });
                        }
                      } else {
                        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                          try { navigator.vibrate(30); } catch (_) {}
                        }
                        deleteMedicationLog(todayTakenLog.id);
                        if (med.inventory !== undefined) {
                          updateMedication({ ...med, inventory: med.inventory + 1 });
                        }
                      }
                    }}
                    title={language === 'ru' ? (todayTakenLog ? 'Принято (нажмите для отмены)' : 'Принять препарат') : (todayTakenLog ? 'Taken (click to undo)' : 'Take medication')}
                    className={`h-[34px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-xs cursor-pointer ${
                      todayTakenLog 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-200/60'
                        : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    <CheckCircle2 size={15} className={todayTakenLog ? "text-emerald-700 dark:text-emerald-300" : "text-white"} />
                    <span>
                      {todayTakenLog 
                        ? (language === 'ru' ? `Принято (${todayTakenLog.time})` : `Taken (${todayTakenLog.time})`) 
                        : (language === 'ru' ? 'Принять' : 'Take')}
                    </span>
                  </button>
                </div>
              )}

              <div className="mt-3 pt-2.5 border-t border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar size={13} /> 
                  <span>{new Date(med.startDate || Date.now()).toLocaleDateString(language)}</span>
                </div>
                {med.endDate && (
                  <div className="flex items-center gap-1">
                    <span>{t.until} {new Date(med.endDate).toLocaleDateString(language)}</span>
                  </div>
                )}
                {med.reminders && med.reminders.length > 0 && isOngoing(med.endDate) && (
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    <Bell size={11} />
                    <span>{med.reminders.join(', ')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )})
        ) : (
          <div className="text-center p-12 text-slate-400">
             <Pill size={48} className="mx-auto mb-4 opacity-20" />
             <p>{filter === 'active' ? t.no_active_meds : t.no_past_meds}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAdd(false);
                setInteractionWarning(null);
                setShowDeleteConfirm(false);
              }
            }}
          >
            <motion.div 
              initial={{ y: '100%', opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 flex justify-center mt-2 sm:hidden z-10">
                <div className="w-8 h-1 bg-[#E0E0E0] dark:bg-slate-700 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-5 pt-6 sm:pt-5 border-b border-slate-50 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Pill className="text-[#3D5AFE]" /> {editingMedicationId ? t.edit_entry : t.add_medication}
                </h3>
                <button 
                  onClick={() => {
                    setShowAdd(false);
                    setInteractionWarning(null);
                    setShowDeleteConfirm(false);
                  }}
                  aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                    {t.medication_name_label}
                  </label>
                  <input 
                    className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-slate-800 dark:text-slate-100 shrink-0" 
                    placeholder={t.med_name_placeholder} 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-[100px]">
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                      {t.dosage_label}
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 pr-12 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-slate-800 dark:text-slate-100 shrink-0" 
                        placeholder={t.dosage_placeholder} 
                        value={formData.dosage}
                        onChange={e => setFormData({...formData, dosage: e.target.value})}
                      />
                      <span className="absolute right-3 text-[#9E9E9E] dark:text-slate-400 pointer-events-none text-sm font-medium">mg</span>
                    </div>
                  </div>
                  <div className="flex-[1.5]">
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                      {t.frequency_label}
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 pr-10 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] appearance-none text-slate-800 dark:text-slate-100"
                        value={formData.frequency}
                        onChange={e => handleFrequencyChange(e.target.value)}
                      >
                        <option value="Daily">{t.freq_daily || "Daily"}</option>
                        <option value="Twice Daily">{t.freq_twice || "Twice Daily"}</option>
                        <option value="Weekly">{t.freq_weekly || "Weekly"}</option>
                        <option value="As Needed">{t.freq_as_needed || "As Needed"}</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                      {t.form_label}
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 pr-10 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] appearance-none text-sm text-slate-800 dark:text-slate-100"
                        value={formData.form}
                        onChange={e => setFormData({...formData, form: e.target.value as MedicationForm})}
                      >
                        <option value="tablet">{t.med_form_tablet}</option>
                        <option value="capsule">{t.med_form_capsule}</option>
                        <option value="drops">{t.med_form_drops}</option>
                        <option value="ointment">{t.med_form_ointment}</option>
                        <option value="injection">{t.med_form_injection}</option>
                        <option value="syrup">{t.med_form_syrup}</option>
                        <option value="other">{t.med_form_other}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                      {t.importance_label}
                    </label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 pr-10 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] appearance-none text-sm text-slate-800 dark:text-slate-100"
                        value={formData.importance}
                        onChange={e => setFormData({...formData, importance: e.target.value as MedicationImportance})}
                      >
                        <option value="normal">{t.importance_normal}</option>
                        <option value="important">{t.importance_important}</option>
                        <option value="critical">{t.importance_critical}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                    {t.meal_relation_label}
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 pr-10 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] appearance-none text-sm text-slate-800 dark:text-slate-100"
                      value={formData.mealRelation}
                      onChange={e => setFormData({...formData, mealRelation: e.target.value as MealRelation})}
                    >
                      <option value="any">{t.meal_relation_any}</option>
                      <option value="before">{t.meal_relation_before}</option>
                      <option value="after">{t.meal_relation_after}</option>
                      <option value="with">{t.meal_relation_with}</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                      {t.course_days_label}
                    </label>
                    <input 
                      type="number"
                      className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-sm text-slate-800 dark:text-slate-100 shrink-0" 
                      placeholder={t.optional_placeholder}
                      value={formData.courseDays}
                      onChange={e => {
                        const days = e.target.value;
                        let endDate = formData.endDate;
                        if (days && !isNaN(parseInt(days))) {
                          const dt = new Date(formData.startDate);
                          dt.setDate(dt.getDate() + parseInt(days));
                          endDate = dt.toISOString().split('T')[0];
                        }
                        setFormData({...formData, courseDays: days, endDate});
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">
                      {t.inventory_label}
                    </label>
                    <input 
                      type="number"
                      className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-sm text-slate-800 dark:text-slate-100 shrink-0" 
                      placeholder={t.inventory_eg_placeholder}
                      value={formData.inventory}
                      onChange={e => setFormData({...formData, inventory: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">{t.start_date}</label>
                    <input 
                      type="date"
                      className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-sm text-slate-800 dark:text-slate-100 shrink-0" 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1.5 block">{t.end_date_optional}</label>
                    <input 
                      type="date"
                      className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-sm text-slate-800 dark:text-slate-100 shrink-0" 
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1 block">
                    {t.intake_scheme_label}
                  </label>
                  <input 
                    className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-sm text-slate-800 dark:text-slate-100 shrink-0" 
                    placeholder={t.intake_scheme_eg_placeholder} 
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] flex items-center gap-1">
                      <Clock size={12}/> {t.reminder_times}
                    </label>
                    <button 
                       type="button" 
                       onClick={() => setFormData({...formData, reminders: [...formData.reminders, '12:00']})} 
                       className="text-xs text-[#3D5AFE] font-medium flex items-center gap-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <Plus size={12}/> {t.add}
                    </button>
                  </div>
                  {formData.reminders.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.reminders.map((time, idx) => (
                        <div key={idx} className="flex relative">
                          <input 
                            type="time" 
                            className="bg-[#F8F9FE] dark:bg-slate-950 p-2 pl-3 pr-8 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] text-sm w-[110px] text-slate-800 dark:text-slate-100 shrink-0"
                            value={time}
                            onChange={e => {
                              const newReminders = [...formData.reminders];
                              newReminders[idx] = e.target.value;
                              setFormData({...formData, reminders: newReminders});
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newReminders = formData.reminders.filter((_, i) => i !== idx);
                              setFormData({...formData, reminders: newReminders});
                            }}
                            aria-label={language === 'ru' ? 'Удалить напоминание' : 'Delete reminder'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#F44336] transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9E9E9E] dark:text-slate-400 pt-1">{t.no_reminders_set}</p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#7B61FF] tracking-[0.2px] mb-1 flex items-center gap-1">
                    ✨ {t.notes_ai_generated}
                  </label>
                  <textarea 
                    className="w-full bg-[#F8F9FE] dark:bg-slate-950 p-3 rounded-xl border border-[#E8E8F0] dark:border-slate-800 outline-none focus:border-[#3D5AFE] min-h-[80px] text-sm text-slate-800 dark:text-slate-100 transition-colors shrink-0" 
                    placeholder={t.notes_placeholder} 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                  <p className="text-[11px] text-[#9E9E9E] dark:text-slate-400 mt-1.5 leading-[1.3]">
                    {t.review_scanned_data}
                  </p>
                </div>

                {editingMedicationId && (
                  <div className="pt-6 pb-2 text-center">
                    <button 
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-sm text-[#F44336] font-medium px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors inline-block cursor-pointer"
                    >
                      {t.delete_medication}
                    </button>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-[#F0F0F5] dark:border-slate-800 p-4 shrink-0 z-20">
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      if (showDeleteConfirm) {
                        setShowDeleteConfirm(false);
                      } else {
                        setShowAdd(false);
                        setInteractionWarning(null);
                      }
                    }} 
                    className="flex-1 py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="button"
                    onClick={handleAdd}
                    disabled={isChecking || showDeleteConfirm}
                    className="flex-1 py-3 bg-[#3D5AFE] text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 transition-colors cursor-pointer"
                  >
                    {isChecking ? <><Loader2 size={18} className="animate-spin" /> {t.checking}</> : <><Save size={18} /> {editingMedicationId ? t.update_entry : t.save}</>}
                  </button>
                </div>
              </div>

              {/* Interaction Warning overlay */}
              <AnimatePresence>
                {interactionWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-24 left-4 right-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl p-4 shadow-lg z-30"
                  >
                    <div className="flex gap-3">
                      <div className="text-orange-500 mt-0.5">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-800 dark:text-orange-400 text-sm mb-1">{t.potential_interaction}</h4>
                        <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed mb-3 max-h-32 overflow-y-auto">
                           {interactionWarning}
                        </p>
                        <div className="flex gap-2">
                          <button 
                             onClick={() => setInteractionWarning(null)}
                             className="flex-1 text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                             {t.cancel}
                          </button>
                          <button 
                             onClick={saveMedication}
                             className="flex-1 text-xs font-bold bg-orange-500 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
                          >
                             {t.add_anyway}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delete Confirmation Bottom Sheet */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 dark:border-slate-800 z-50 flex flex-col p-6 pb-8"
                  >
                    <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 mx-auto mb-6"></div>
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-[#F44336] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        {t.delete_medication}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {t.delete_medication_confirm.replace('{name}', formData.name)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 relative z-10 bg-white dark:bg-slate-900">
                      <button 
                        onClick={() => {
                          handleDelete();
                          setShowDeleteConfirm(false);
                          setShowAdd(false);
                        }}
                        className="w-full py-3.5 bg-[#F44336] text-white rounded-xl font-bold transition-colors hover:bg-red-600 shadow-sm relative z-50 cursor-pointer"
                      >
                        {t.delete}
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative z-50 cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Medications;
