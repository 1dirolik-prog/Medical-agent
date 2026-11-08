import React, { useState, useEffect } from 'react';
import { useHealth } from '../HealthContext';
import { Users, AlertTriangle, Activity, Pill, Star, ArrowLeft, RefreshCw, ChevronDown, CheckCircle2, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { requestConsilium } from '../services/gemini';
import { downloadReportAsPdf } from '../services/pdfService';
import { getAllDoctors } from '../services/doctorRegistry';
import { MarkdownViewer } from '../components/MarkdownViewer';

const ConsiliumView = () => {
  const { activeMember, labResults, symptoms, medications, t, language, setActiveTab, aiReports, addAIReport } = useHealth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const allDoctors = getAllDoctors(language);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>(['cardiologist', 'endocrinologist', 'neurologist', 'therapist']);
  const [simDiscussion, setSimDiscussion] = useState<{ doctor: any; text: string }[]>([]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(0);
      setSimDiscussion([]);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 20) {
            return prev + Math.floor(Math.random() * 4) + 3; // fast start
          } else if (prev < 50) {
            return prev + Math.floor(Math.random() * 3) + 2; 
          } else if (prev < 80) {
            return prev + Math.floor(Math.random() * 2) + 1;
          } else if (prev < 98) {
            return prev + 1;
          } else {
            return 98;
          }
        });
      }, 250);
    } else {
      setProgress(0);
      setSimDiscussion([]);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (loading && progress > 0) {
      const activeDocs = allDoctors.filter(d => selectedDoctors.includes(d.id));
      if (!activeDocs.length) return;
      
      const addMsg = (idx: number, ruText: string, enText: string) => {
        setSimDiscussion(curr => {
          if (curr.length === idx) {
            return [...curr, { doctor: activeDocs[idx % activeDocs.length], text: language === 'ru' ? ruText : enText }];
          }
          return curr;
        });
      };

      if (progress > 10) addMsg(0, 'Анализирую базовые параметры и жалобы...', 'Analyzing baseline parameters and symptoms...');
      if (progress > 30) addMsg(1, 'Сопоставляю результаты тестов с анамнезом.', 'Correlating test results with anamnesis.');
      if (progress > 55) addMsg(2, 'Риски умеренные. Смотрю схему лечения.', 'Risks are moderate. Reviewing treatment scheme.');
      if (progress > 75) addMsg(3, 'Взаимодействий препаратов не обнаружено. Совместимость в норме.', 'No drug interactions found. Compatibility is fine.');
      if (progress > 90) addMsg(4, 'Согласовано. Подготавливаю итоговое решение консилиума.', 'Agreed. Compiling final board decision.');
    }
  }, [progress, loading, language, selectedDoctors]); // removed allDoctors from deps as it's computed

  const memberReports = aiReports || [];
  const consiliumHistory = React.useMemo(() => {
    return memberReports.filter(r => r.reportType === 'consilium').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memberReports]);

  const toggleDoctor = (id: string) => {
    setSelectedDoctors(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleRequestConsilium = async () => {
    if (!activeMember || selectedDoctors.length === 0) {
      setError(language === 'ru' ? 'Выберите хотя бы одного врача' : 'Select at least one doctor');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const activeDoctors = allDoctors.filter(d => selectedDoctors.includes(d.id));
      const boardDoctors = activeDoctors.map(d => ({ id: d.id, name: d.name, spec: d.spec }));
      const result = await requestConsilium(activeMember, labResults, symptoms, medications, language, boardDoctors, aiReports);
      setReport(result);
      
      addAIReport({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        title: language === 'ru' ? 'Медицинский Консилиум' : 'Medical Consilium',
        content: JSON.stringify(result),
        reportType: 'consilium',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate consilium report');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryReport = (r: any) => {
    try {
      const parsed = JSON.parse(r.content);
      setReport(parsed);
      setShowHistory(false);
    } catch (e) {
      console.error("Failed to parse history report", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-blue-900 pt-12 pb-6 px-4 rounded-b-3xl shadow-lg relative overflow-hidden shrink-0 z-10">
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (showHistory || report) {
                  setShowHistory(false);
                  setReport(null);
                  setError('');
                } else {
                  setActiveTab('home');
                }
              }}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {!report ? (showHistory ? (language === 'ru' ? 'История консилиумов' : 'Consilium History') : (t.consilium || 'AI Consilium')) : (language === 'ru' ? 'Заключение' : 'Report')}
              </h1>
              <p className="text-indigo-200 text-xs mt-1">{t.consilium_desc || 'AI medical board review'}</p>
            </div>
          </div>
          {!loading && !report && !showHistory && (
            <button 
              onClick={() => setShowHistory(true)}
              className="px-3 py-1.5 bg-white/10 rounded-full text-white text-xs font-bold flex items-center gap-1"
            >
              {language === 'ru' ? 'История' : 'History'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 content-area space-y-6">
        {showHistory && !report && !loading && (
          <div className="space-y-3">
             {consiliumHistory.length === 0 ? (
               <div className="card-android !p-6 text-center text-slate-500 text-sm">
                 {language === 'ru' ? 'История пуста. Запустите консилиум для сохранения результатов.' : 'History is empty. Run a consilium to save results.'}
               </div>
             ) : (
               consiliumHistory.map(r => (
                 <div key={r.id} onClick={() => loadHistoryReport(r)} className="card-android cursor-pointer hover:border-medical-blue/50 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                       <Users size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-slate-800 dark:text-white">{r.title}</h4>
                       <p className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}

        {!showHistory && !report && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4 relative">
              <Users size={32} className="relative z-10" />
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {language === 'ru' ? 'Собрать консилиум врачей' : 'Request Medical Board'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-[280px]">
              {language === 'ru' ? 'Выберите ИИ-агентов, которые проанализируют вашу историю и проведут дискуссию.' : 'Select AI agents to analyze your history and discuss findings.'}
            </p>

            <div className="w-full text-left mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 block">
                {language === 'ru' ? 'Доступные специалисты' : 'Available Specialists'}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {allDoctors.map(doctor => {
                  const isSelected = selectedDoctors.includes(doctor.id);
                  return (
                    <button
                      key={doctor.id}
                      onClick={() => toggleDoctor(doctor.id)}
                      className={`card-android flex flex-col items-start !p-3 text-left transition-all ${isSelected ? '!border-medical-blue bg-medical-blue/5' : 'border-slate-200 dark:border-slate-700'} hover:border-medical-blue/50`}
                    >
                      <span className={`font-bold text-sm ${isSelected ? 'text-medical-blue' : 'text-slate-800 dark:text-white'}`}>{doctor.name}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-medical-blue/70' : 'text-slate-400'}`}>{doctor.spec}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={handleRequestConsilium}
              className="bg-medical-blue text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-medical-blue/20 hover:bg-blue-600 transition-colors w-full flex items-center justify-center gap-2"
            >
              <Users size={20} />
              {t.request_consilium || 'Request Consilium'}
            </button>
          </div>
        )}

        {loading && (
          <div className="card-android flex flex-col items-center max-w-md mx-auto my-8 relative overflow-hidden !p-6 shadow-xl">
            {/* Background elements */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Circle Percentage Indicator */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-4 mt-2 object-contain">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-slate-100 dark:stroke-slate-700"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-medical-blue transition-all duration-300"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                  {progress}%
                </span>
              </div>
            </div>
            
            <div className="text-xs font-medium text-[#757575] mb-6 tracking-wide">
              {language === 'ru' ? 'Осталось ~15–30 сек' : 'Time remaining ~15–30 sec'}
            </div>

            {/* Stepper details */}
            <div className="w-full mb-6 text-center">
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                {progress < 25 ? (language === 'ru' ? 'Сбор консилиума' : 'Assembling board specialists') :
                 progress < 55 ? (language === 'ru' ? 'Изучение симптомов' : 'Studying symptoms & complaints') :
                 progress < 85 ? (language === 'ru' ? 'Проверка взаимодействий' : 'Checking drug interactions & risks') :
                                 (language === 'ru' ? 'Формирование заключения' : 'Formulating unified conclusion')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm px-4 mx-auto leading-relaxed">
                {progress < 25 ? (language === 'ru' ? 'Анализ вашей медкарты и истории анализов' : 'Checking your medical profile & timeline labs') :
                 progress < 55 ? (language === 'ru' ? 'Групповой анализ активных симптомов и текущей терапии' : 'Group analysis of active symptoms and medications') :
                 progress < 85 ? (language === 'ru' ? 'Обсуждение совместимости препаратов и скрытых противопоказаний' : 'Discussing drug compatibility and matching feedback') :
                                 (language === 'ru' ? 'Совместный план действий, альтернативные диагнозы и рекомендации' : 'Consolidating joint board options & recommended next steps')}
              </p>
            </div>

            {/* Stage Indicators */}
            <div className="w-full border-t border-slate-50 dark:border-slate-700/50 pt-4 space-y-2 text-left">
              {[
                { threshold: 0, nextThreshold: 25, num: 1, label_ru: 'Анализ анамнеза и медкарты', label_en: 'Analyzing anamnesis & medical chart' },
                { threshold: 25, nextThreshold: 55, num: 2, label_ru: 'Разбор жалоб и результатов анализов', label_en: 'Reviewing symptoms & lab results' },
                { threshold: 55, nextThreshold: 85, num: 3, label_ru: 'Проверка нежелательных взаимодействий лекарств', label_en: 'Auditing adverse drug interactions' },
                { threshold: 85, nextThreshold: 100, num: 4, label_ru: 'Генерация коллегиального решения', label_en: 'Formulating board consensus' }
              ].map((step, idx) => {
                const isPassed = progress >= step.nextThreshold;
                const isActive = progress >= step.threshold && progress < step.nextThreshold;
                const isFuture = progress < step.threshold;

                return (
                  <div 
                    key={idx}
                    className={`flex items-center gap-3 text-xs transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/20 border-l-[3px] border-medical-blue rounded-lg px-3 py-2 -ml-3' : 'py-1'}`}
                  >
                    <div className={`shrink-0 flex items-center justify-center ${isPassed ? 'w-5 h-5 bg-[#00C853] text-white rounded-full text-[10px] font-bold' : isActive ? 'w-6 h-6 rounded-full border-2 border-medical-blue border-t-transparent animate-spin' : 'w-5 h-5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold'}`}>
                      {isPassed ? '✓' : isActive ? '' : step.num}
                    </div>
                    <span className={`font-semibold ${isPassed ? 'text-[#00C853] line-through opacity-60' : isActive ? 'text-medical-blue' : 'text-slate-400'}`}>
                      {language === 'ru' ? step.label_ru : step.label_en}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Simulated Live Discussion */}
            {simDiscussion.length > 0 && (
              <div className="w-full mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex flex-col gap-3 h-[180px] overflow-hidden">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">
                  {language === 'ru' ? 'Внутренний чат' : 'Internal Chat'}
                </div>
                <div className="flex flex-col gap-3 justify-end h-full relative overflow-hidden">
                   <AnimatePresence initial={false}>
                      {simDiscussion.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                          <div className={`w-6 h-6 rounded-full flex shrink-0 items-center justify-center text-[10px] ${msg.doctor.bg} ${msg.doctor.color}`}>
                             <Users size={12} />
                          </div>
                          <div className="flex-1">
                             <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {msg.doctor.name}
                             </div>
                             <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                                {msg.text}
                             </div>
                          </div>
                        </motion.div>
                      ))}
                   </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="card-android !p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                {language === 'ru' ? 'Заключение Консилиума' : 'Consilium Conclusion'}
              </h3>
              <MarkdownViewer content={report.conclusion} />
            </div>

            <button 
              type="button"
              onClick={() => {
                if (!activeMember) return;
                downloadReportAsPdf('consilium', activeMember, {
                  conclusion: report.conclusion,
                  discussion: report.discussion,
                  doctorsList: allDoctors
                }, language);
              }}
              className="w-full py-4 bg-medical-blue hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-medical-blue/20 flex items-center justify-center gap-2"
            >
              <FileDown size={18} />
              {language === 'ru' ? 'СКАЧАТЬ ЗАКЛЮЧЕНИЕ КОНСИЛИУМА (PDF)' : 
               language === 'pl' ? 'POBIERZ OPINIĘ KONSYLIUM (PDF)' :
               language === 'es' ? 'DESCARGAR INFORME DE CONSILIO (PDF)' :
               language === 'de' ? 'KONZILIUMSBERICHT HERUNTERLADEN (PDF)' :
               'DOWNLOAD CONSILIUM REPORT (PDF)'}
            </button>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                {language === 'ru' ? 'Ход обсуждения' : 'Discussion Transcript'}
              </h4>
              
              {report.discussion && report.discussion.map((msg: any, idx: number) => {
                const doctor = allDoctors.find(d => d.id === msg.doctorId) || allDoctors[0];
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="flex gap-3"
                  >
                    <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${doctor.bg} ${doctor.color}`}>
                      <Users size={20} />
                    </div>
                    <div className="card-android rounded-tl-none flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{doctor.name}</h4>
                        <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">{doctor.spec}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        <MarkdownViewer content={msg.text} showCopyButton={false} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button 
              onClick={() => { setReport(null); setError(''); }}
              className="w-full py-4 text-medical-blue font-bold text-sm bg-medical-blue/10 rounded-2xl hover:bg-medical-blue/20 transition-colors flex items-center justify-center gap-2"
            >
               <RefreshCw size={16} />
               {language === 'ru' ? 'Новый консилиум' : 'New consilium'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsiliumView;
