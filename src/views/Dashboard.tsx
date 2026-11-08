import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertCircle, TrendingUp, Calendar, ArrowRight, Plus, Camera, Sparkles, ImageIcon, Pill, Users, X, TestTubes, Activity, Stethoscope, Pen, CheckCircle2, HeartPulse } from 'lucide-react';
import { useHealth } from '../HealthContext';
import { Medication } from '../types';
import { calculateHealthScore } from '../services/riskEngine';

const Dashboard = () => {
  const { 
    labResults, 
    symptoms, 
    medications, 
    medicationLogs,
    aiReports, 
    activeMember, 
    members, 
    activeMemberId, 
    setActiveMemberId, 
    deleteMember, 
    t, 
    language, 
    setActiveTab,
    addMedicationLog,
    deleteMedicationLog,
    updateMedication
  } = useHealth();

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // If no members exist or no active member is selected
  if (!activeMemberId || members.length === 0) {
    return (
      <div className="p-4 space-y-6 flex flex-col items-center justify-center h-full pt-12">
        <div className="w-20 h-20 bg-medical-blue/10 dark:bg-medical-blue/20 rounded-full flex items-center justify-center text-medical-blue mb-4">
          <Users size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center">Welcome to Your Health Tracker</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm px-4">Please set up your profile to start tracking lab results, symptoms, and medications.</p>
        <button 
          onClick={() => setActiveTab('family')}
          className="bg-medical-blue text-white px-6 py-3 rounded-xl font-bold mt-4 shadow-lg shadow-medical-blue/20 cursor-pointer"
        >
          Create Profile
        </button>
      </div>
    );
  }

  // Compute upcoming or active medication for today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { nextMedName, nextMedTime, isOverdue, nextMed, isMedTaken, matchingLog } = useMemo(() => {
    const activeMeds = medications.filter(m => !m.endDate || m.endDate >= todayStr);
    
    if (activeMeds.length === 0) {
      return { 
        nextMedName: t.no_schedule, 
        nextMedTime: '--:--', 
        isOverdue: false, 
        nextMed: null, 
        isMedTaken: false, 
        matchingLog: null 
      };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check taken status for a specific medication and scheduled reminder time today
    const checkTaken = (med: Medication, reminderTime: string) => {
      const logsToday = medicationLogs.filter(log => 
        log.medicationId === med.id && 
        log.date === todayStr && 
        (log.status === 'taken' || log.status === 'partial')
      );
      if (logsToday.length === 0) return { taken: false, log: null };

      // 1. Direct match by scheduled note
      const directMatch = logsToday.find(l => 
        l.notes === `scheduled:${reminderTime}` || 
        l.notes === reminderTime
      );
      if (directMatch) return { taken: true, log: directMatch };

      // 2. Med has only 1 reminder
      const reminderCount = med.reminders?.length || 1;
      if (reminderCount <= 1) {
        return { taken: true, log: logsToday[0] };
      }

      // 3. Proximity match
      const [remH, remM] = reminderTime.split(':').map(Number);
      const reminderMinutes = (isNaN(remH) ? 9 : remH) * 60 + (isNaN(remM) ? 0 : remM);
      const proximityMatch = logsToday.find(l => {
        const [logH, logM] = l.time.split(':').map(Number);
        return Math.abs(((isNaN(logH) ? 0 : logH) * 60 + (isNaN(logM) ? 0 : logM)) - reminderMinutes) <= 180;
      });
      if (proximityMatch) return { taken: true, log: proximityMatch };

      // 4. Count match
      if (logsToday.length >= reminderCount) {
        return { taken: true, log: logsToday[logsToday.length - 1] };
      }

      return { taken: false, log: null };
    };

    interface Slot {
      med: Medication;
      time: string;
      minutes: number;
      isTaken: boolean;
      log: any;
      isOverdue: boolean;
      diffFromNow: number;
    }

    const allSlots: Slot[] = [];

    activeMeds.forEach(med => {
      const reminders = (med.reminders && med.reminders.length > 0) ? med.reminders : ['09:00'];
      reminders.forEach(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        const slotMinutes = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m);
        const diff = slotMinutes - currentMinutes;
        const { taken, log } = checkTaken(med, timeStr);
        const overdue = !taken && diff < 0;

        allSlots.push({
          med,
          time: timeStr,
          minutes: slotMinutes,
          isTaken: taken,
          log,
          isOverdue: overdue,
          diffFromNow: diff
        });
      });
    });

    if (allSlots.length === 0) {
      return { 
        nextMedName: t.no_schedule, 
        nextMedTime: '--:--', 
        isOverdue: false, 
        nextMed: null, 
        isMedTaken: false, 
        matchingLog: null 
      };
    }

    // PRIORITY 1: Overdue untaken doses today (earliest first)
    const overdueSlots = allSlots
      .filter(s => !s.isTaken && s.isOverdue)
      .sort((a, b) => a.minutes - b.minutes);

    if (overdueSlots.length > 0) {
      const top = overdueSlots[0];
      return {
        nextMedName: top.med.name,
        nextMedTime: top.time,
        isOverdue: true,
        nextMed: top.med,
        isMedTaken: false,
        matchingLog: null
      };
    }

    // PRIORITY 2: Upcoming untaken doses today (closest to now)
    const upcomingUntaken = allSlots
      .filter(s => !s.isTaken && s.diffFromNow >= 0)
      .sort((a, b) => a.diffFromNow - b.diffFromNow);

    if (upcomingUntaken.length > 0) {
      const top = upcomingUntaken[0];
      return {
        nextMedName: top.med.name,
        nextMedTime: top.time,
        isOverdue: false,
        nextMed: top.med,
        isMedTaken: false,
        matchingLog: null
      };
    }

    // PRIORITY 3: If all doses today were taken, pick the most recently taken dose today
    const takenToday = allSlots
      .filter(s => s.isTaken)
      .sort((a, b) => b.minutes - a.minutes);

    if (takenToday.length > 0) {
      const top = takenToday[0];
      return {
        nextMedName: top.med.name,
        nextMedTime: top.time,
        isOverdue: false,
        nextMed: top.med,
        isMedTaken: true,
        matchingLog: top.log
      };
    }

    // Fallback: earliest tomorrow
    const sortedAll = [...allSlots].sort((a, b) => a.minutes - b.minutes);
    const firstSlot = sortedAll[0];
    return {
      nextMedName: firstSlot.med.name,
      nextMedTime: firstSlot.time,
      isOverdue: false,
      nextMed: firstSlot.med,
      isMedTaken: firstSlot.isTaken,
      matchingLog: firstSlot.log
    };
  }, [medications, medicationLogs, todayStr, t.no_schedule]);

  const handleToggleMedTaken = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextMed || !activeMemberId) return;

    if (!isMedTaken) {
      // Mark as taken
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(50); } catch (_) {}
      }
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const newLog = {
        id: Date.now().toString(),
        medicationId: nextMed.id,
        memberId: activeMemberId,
        date: todayStr,
        time: `${hh}:${mm}`,
        status: 'taken' as const,
        notes: nextMedTime !== '--:--' ? `scheduled:${nextMedTime}` : undefined,
      };
      addMedicationLog(newLog);

      if (nextMed.inventory && nextMed.inventory > 0) {
        updateMedication({
          ...nextMed,
          inventory: nextMed.inventory - 1,
        });
      }

      setFeedbackToast(language === 'ru' ? 'Препарат принят! Запись сохранена' : 'Medication taken! Log saved');
      setTimeout(() => setFeedbackToast(null), 3000);
    } else {
      // Toggle back / undo
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(30); } catch (_) {}
      }
      if (matchingLog && deleteMedicationLog) {
        deleteMedicationLog(matchingLog.id);
      } else {
        // Find any today's log for this medication
        const fallbackLog = medicationLogs.find(l => 
          l.medicationId === nextMed.id && 
          l.date === todayStr && 
          (l.status === 'taken' || l.status === 'partial')
        );
        if (fallbackLog && deleteMedicationLog) {
          deleteMedicationLog(fallbackLog.id);
        }
      }

      if (nextMed.inventory !== undefined) {
        updateMedication({
          ...nextMed,
          inventory: nextMed.inventory + 1,
        });
      }

      setFeedbackToast(language === 'ru' ? 'Приём отменён' : 'Intake canceled');
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const formattedMedName = nextMedName !== t.no_schedule 
    ? nextMedName.charAt(0).toUpperCase() + nextMedName.slice(1).toLowerCase() 
    : (language === 'ru' ? 'Нет плановых приемов' : t.no_schedule);

  // Symptoms tracking
  const { sortedSymptoms, lastSymptomDate } = useMemo(() => {
    const sorted = [...symptoms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = sorted.length > 0 ? new Date(sorted[0].date).toLocaleDateString(language, { day: 'numeric', month: 'short' }) : null;
    return { sortedSymptoms: sorted, lastSymptomDate: lastDate };
  }, [symptoms, language]);

  // Overall Health Index from lab tests
  const healthStats = useMemo(() => {
    return calculateHealthScore(labResults || []);
  }, [labResults]);

  return (
    <div className="p-4 pt-4 space-y-2.5 pb-6">
      {/* 0. Health Balance Metric Bar */}
      {healthStats.totalEvaluated > 0 && (
        <button
          onClick={() => setActiveTab('insights')}
          className="w-full card-android !p-3 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-850 dark:via-slate-850 dark:to-indigo-950/30 border border-blue-100/80 dark:border-slate-750 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-700/60 transition-all text-left group cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
              healthStats.score >= 80 
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' 
                : healthStats.score >= 60 
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' 
                : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
            }`}>
              {healthStats.score}%
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                  {language === 'ru' ? 'Индекс здоровья' : 'Health Index'}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  healthStats.score >= 80 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                    : healthStats.score >= 60 
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                }`}>
                  {language === 'ru' ? (healthStats.score >= 80 ? 'Оптимально' : healthStats.score >= 60 ? 'Внимание' : 'Консультация') : healthStats.statusText}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {language === 'ru' 
                  ? `${healthStats.inRangeCount} из ${healthStats.totalEvaluated} показателей в норме` 
                  : `${healthStats.inRangeCount} of ${healthStats.totalEvaluated} tests in normal range`}
              </p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-medical-blue transition-all shrink-0 ml-2" />
        </button>
      )}

      {/* 1. Analyzes and Studies */}
      <div className="grid grid-cols-2 gap-2.5">
        <button 
          onClick={() => setActiveTab('labs')}
          className="card-android flex flex-col items-start justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-all w-full text-left min-h-[96px] !p-3.5 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TestTubes size={18} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base leading-tight">
              {language === 'ru' ? 'Анализы' : 'Lab Tests'}
            </span>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 line-clamp-2 leading-tight">
            {language === 'ru' ? 'Кровь, моча, маркеры' : 'Blood, urine, panels'}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('studies')}
          className="card-android flex flex-col items-start justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-all w-full text-left min-h-[96px] !p-3.5 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Activity size={18} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base leading-tight">
              {language === 'ru' ? 'Исследования' : 'Studies'}
            </span>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 line-clamp-2 leading-tight">
            {language === 'ru' ? 'МРТ, КТ, УЗИ' : 'MRI, CT, X-Ray'}
          </span>
        </button>
      </div>

      {/* 2. Consultations */}
      <button 
        onClick={() => setActiveTab('consultations')}
        className="card-android w-full flex items-center hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-all text-left gap-3 !p-3.5 group cursor-pointer"
      >
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center shrink-0 text-emerald-600 group-hover:scale-105 transition-transform">
          <Stethoscope size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
            {language === 'ru' ? 'Консультации' : 'Consultations'}
          </h3>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 truncate mt-0.5">
            {language === 'ru' ? 'Справки и заключения врачей' : 'Doctor reports and notes'}
          </p>
        </div>
        <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* 3. AI Features */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setActiveTab('insights')}
          className="bg-gradient-to-br from-purple-50/70 to-white dark:from-purple-950/25 dark:to-slate-850 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex flex-col items-start justify-between gap-2.5 hover:border-purple-300 dark:hover:border-purple-700/60 transition-all text-left min-h-[96px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles size={15} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{t.insights}</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
            {language === 'ru' ? 'Объясним ваши анализы простым языком' : 'We explain your tests in simple terms'}
          </p>
        </button>

        <button
          onClick={() => setActiveTab('consilium')}
          className="bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-950/25 dark:to-slate-850 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex flex-col items-start justify-between gap-2.5 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all text-left min-h-[96px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
              <Users size={15} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{t.consilium || 'AI Consilium'}</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
            {language === 'ru' ? 'Мнение консилиума ИИ-врачей' : 'Opinion of AI medical board'}
          </p>
        </button>
      </div>

      {/* 4. Symptoms & Next Medication */}
      <div className="space-y-2.5">
        {/* Symptom Log Horizontal */}
        <button 
          onClick={() => setActiveTab('diary')}
          className="card-android w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-all text-left !p-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 text-blue-600 group-hover:scale-105 transition-transform">
              <Pen size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{t.symptom_log}</h3>
              <span className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                {lastSymptomDate 
                  ? `${language === 'ru' ? 'Последн.:' : 'Last:'} ${lastSymptomDate}`
                  : (language === 'ru' ? 'Пока нет записей' : 'No records yet')}
              </span>
            </div>
          </div>
          <div className="h-8 px-3 rounded-xl border border-blue-600/30 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 pointer-events-none shrink-0 ml-2">
             {language === 'ru' ? 'Записать' : 'Log'}
          </div>
        </button>

        {/* Next Medication Horizontal */}
        <div className={`card-android w-full flex items-center justify-between !p-3 transition-colors ${isMedTaken ? '!border-emerald-200 dark:!border-emerald-900/40 !bg-[#F4FBF7] dark:!bg-emerald-950/20' : ''}`}>
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
             <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOverdue && !isMedTaken ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : isMedTaken ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'}`}>
                <Pill size={17} />
             </div>
             <div className="flex flex-col min-w-0">
               <span className="text-[11px] text-gray-400 dark:text-slate-500 mb-0.5 leading-none font-medium">
                 {language === 'ru' ? 'Следующий приём' : 'Next Medication'}
               </span>
               <div className="flex items-center gap-2 flex-wrap">
                 <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{nextMedTime}</span>
                 {isOverdue && !isMedTaken && (
                   <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                     {language === 'ru' ? 'Пропущено' : 'Overdue'}
                   </span>
                 )}
                 {isMedTaken && (
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                     {language === 'ru' ? 'Выполнено' : 'Completed'}
                   </span>
                 )}
               </div>
               <p className="text-xs font-medium text-gray-600 dark:text-slate-300 truncate mt-0.5">
                 {formattedMedName}
               </p>
             </div>
          </div>
          
          {nextMedTime !== '--:--' && (
            <button 
              id="btn-take-medication"
              type="button"
              onClick={handleToggleMedTaken}
              title={language === 'ru' 
                ? (isMedTaken ? 'Принято (нажмите, чтобы отменить)' : 'Принять препарат') 
                : (isMedTaken ? 'Taken (click to undo)' : 'Take medication')}
              aria-label={language === 'ru' 
                ? (isMedTaken ? 'Принято (нажмите, чтобы отменить)' : 'Принять препарат') 
                : (isMedTaken ? 'Taken (click to undo)' : 'Take medication')}
              className={`h-[38px] px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all duration-200 shrink-0 select-none cursor-pointer active:scale-95 ${
                isMedTaken 
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60' 
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/30 hover:shadow-md'
              }`}
            >
              <CheckCircle2 size={16} className={`transition-transform duration-200 ${isMedTaken ? 'text-emerald-700 dark:text-emerald-300 scale-105' : 'text-white'}`} />
              <span className="text-xs font-bold tracking-tight">
                {isMedTaken ? (language === 'ru' ? 'Принято' : 'Taken') : (language === 'ru' ? 'Принять' : 'Take')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Floating feedback toast */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none"
          >
            <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Entry of Diagnosis / Record */}
      <button 
        onClick={() => {
          setActiveTab('history');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-manual-entry'));
          }, 150);
        }}
        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-slate-800/80 dark:to-indigo-950/20 rounded-2xl p-3.5 flex items-center justify-between border border-medical-blue/20 hover:border-medical-blue/30 transition-all text-left gap-3 group shadow-sm mt-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-medical-blue/10 rounded-full flex items-center justify-center shrink-0 text-medical-blue">
            <Pen size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
              {language === 'ru' ? 'Ввод диагноза вручную' : 'Manual Diagnosis Entry'}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
              {language === 'ru' ? 'Внесите диагноз, рекомендации или результаты через ИИ-чат' : 'Enter diagnosis, advice or results via AI helper chat'}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-medical-blue group-hover:scale-110 transition-transform shrink-0">
          <Plus size={16} />
        </div>
      </button>
    </div>
  );
};

export default Dashboard;
