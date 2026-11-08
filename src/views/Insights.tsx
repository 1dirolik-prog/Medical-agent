import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { motion } from 'motion/react';
import { Sparkles, Brain, Stethoscope, ChevronRight, X, Camera, ImageIcon, ArrowLeft, FileDown, AlertTriangle, Activity, CheckCircle2, ShieldAlert, Sliders, HeartPulse } from 'lucide-react';
import { getAIHealthInsights } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { downloadReportAsPdf } from '../services/pdfService';
import { detectSyndromes, calculateHealthScore, simulateLifestyleChange } from '../services/riskEngine';

const Insights = () => {
  const { activeMember, labResults, symptoms, t, addAIReport, activeMemberId, aiReports, members, setActiveTab, language } = useHealth();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{data: string, mimeType: string, url: string}[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fiberIncrease, setFiberIncrease] = useState(10);

  const memberReports = aiReports || [];
  const insightHistory = React.useMemo(() => {
    return memberReports.filter(r => r.reportType !== 'consilium').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memberReports]);

  // Automated pattern detection & balance score
  const healthStats = React.useMemo(() => {
    return calculateHealthScore(labResults || []);
  }, [labResults]);

  const clinicalAlerts = React.useMemo(() => {
    return detectSyndromes(labResults || [], language);
  }, [labResults, language]);

  // Find user's latest LDL or fallback to typical baseline
  const baselineLDL = React.useMemo(() => {
    if (!labResults) return 3.4;
    const ldl = labResults.find(r => r.parameter.toLowerCase().includes('ldl') || r.parameter.toLowerCase().includes('лпнп'));
    return ldl ? Number(ldl.value) : 3.4;
  }, [labResults]);

  const lifestyleProjection = React.useMemo(() => {
    return simulateLifestyleChange(baselineLDL, fiberIncrease);
  }, [baselineLDL, fiberIncrease]);

  if (!activeMemberId || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 pt-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Profile Selected</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Please select or create a profile to generate AI health insights.</p>
        <button 
          onClick={() => setActiveTab('family')}
          className="px-6 py-3 bg-medical-blue text-white rounded-xl font-bold mt-2 cursor-pointer"
        >
          Go to Profiles
        </button>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => {
        return new Promise<{data: string, mimeType: string, url: string}>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              resolve({
                data: event.target.result,
                mimeType: file.type,
                url: URL.createObjectURL(file)
              });
            }
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImages).then(loadedImages => {
        setImages(prev => [...prev, ...loadedImages]);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateInsights = async () => {
    if (!activeMember) return;
    setLoading(true);
    const result = await getAIHealthInsights(
      activeMember, 
      labResults, 
      symptoms, 
      t.insights_prompt_language,
      images.length > 0 ? images : undefined
    );
    setInsight(result);
    setLoading(false);
    
    // Save the report automatically
    addAIReport({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      title: t.health_ai_insight || 'Health AI Insight',
      content: result
    });
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {(showHistory || insight) && (
              <button onClick={() => { setShowHistory(false); setInsight(null); }} className="w-8 h-8 flex justify-center items-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                 <ArrowLeft size={16} />
              </button>
            )}
            {showHistory ? (t.history || 'History') : (t.ai_health_insights)}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.powered_by_ai}</p>
        </div>
        {!insight && !loading && !showHistory && (
          <button 
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t.history || 'History'}
          </button>
        )}
      </header>

      {showHistory && !insight && !loading && (
        <div className="space-y-3">
           {insightHistory.length === 0 ? (
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
               {language === 'ru' ? 'История пуста. Запустите анализ для сохранения результатов.' : 'History is empty. Run an analysis to save results.'}
             </div>
           ) : (
             insightHistory.map(r => (
               <div key={r.id} onClick={() => { setInsight(r.content); setShowHistory(false); }} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-medical-blue/50 dark:hover:border-medical-blue/50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-medical-blue/10 dark:bg-medical-blue/20 flex items-center justify-center text-medical-blue shrink-0">
                     <Brain size={20} />
                   </div>
                   <div>
                     <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{r.title}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(r.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 </div>
               </div>
             ))
           )}
        </div>
      )}

      {/* Main View */}
      {!insight && !loading && !showHistory && (
        <div className="space-y-4">
          {/* Health Index / Summary Card */}
          {healthStats.totalEvaluated > 0 && (
            <div className="card-android p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-850 dark:to-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-medical-blue/10 text-medical-blue flex items-center justify-center">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'ru' ? 'Индекс параметров анализов' : 'Lab Balance Score'}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'ru' ? `Оценено показателей: ${healthStats.totalEvaluated}` : `Evaluated parameters: ${healthStats.totalEvaluated}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${healthStats.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : healthStats.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {healthStats.score}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${healthStats.score >= 80 ? 'bg-emerald-500' : healthStats.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${healthStats.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} /> {healthStats.inRangeCount} {language === 'ru' ? 'в норме' : 'in range'}
                </span>
                {healthStats.outOfRangeCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={13} /> {healthStats.outOfRangeCount} {language === 'ru' ? 'отклонений' : 'deviations'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Instant Clinical Pattern Alerts */}
          {clinicalAlerts.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-medical-blue" />
                {language === 'ru' ? 'Выявленные клинические синдромы и риски' : 'Detected Clinical Syndromes & Risks'}
              </h3>
              {clinicalAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    alert.priority === 'RED'
                      ? 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-950 dark:text-red-100'
                      : alert.priority === 'YELLOW'
                      ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-100'
                      : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.priority === 'RED'
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
                        : alert.priority === 'YELLOW'
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
                    }`}>
                      <AlertTriangle size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm leading-tight mb-1">{alert.title}</h4>
                      <p className="text-xs leading-relaxed opacity-90">{alert.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hero Action: Generate deep AI report */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={generateInsights}
            className="card-android bg-gradient-to-br from-medical-blue to-blue-700 p-6 text-center text-white cursor-pointer relative overflow-hidden shadow-md shadow-medical-blue/20"
          >
            <Sparkles className="mx-auto mb-3" size={28} />
            <h3 className="text-base font-bold mb-1.5">{t.analyze_my_health}</h3>
            <p className="text-white/80 text-xs mb-4 max-w-xs mx-auto">
              {t.gemini_scan_desc}
            </p>
            <div className="inline-flex items-center gap-1.5 bg-white text-medical-blue px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs">
              {t.start_analysis} <ChevronRight size={15} />
            </div>
          </motion.div>

          {/* Scanner Attachment Box */}
          <div className="card-android p-4 bg-white dark:bg-slate-900">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
               <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                 <Camera size={15} className="text-medical-blue"/>
                 {t.scanner || "Scanner"}
               </h4>
               <div className="flex items-center gap-2 flex-wrap">
                 <label className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium cursor-pointer flex items-center gap-1.5 active:bg-slate-200 dark:active:bg-slate-700 transition-colors">
                   <Camera size={14} />
                   {t.take_photo || "Take Photo"}
                   <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                 </label>
                 <label className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium cursor-pointer flex items-center gap-1.5 active:bg-slate-200 dark:active:bg-slate-700 transition-colors">
                   <ImageIcon size={14} />
                   {t.from_gallery || "Gallery"}
                   <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
               </div>
             </div>
             {images.length > 0 ? (
               <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                 {images.map((img, idx) => (
                   <div key={idx} className="relative shrink-0 snap-center">
                     <img src={img.url} alt="upload" className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-800" />
                     <button 
                       onClick={() => removeImage(idx)}
                       className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                     >
                       <X size={11} />
                     </button>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">
                 {t.upload_reports_desc || "Upload lab reports or symptom photos to include in your analysis."}
               </p>
             )}
          </div>

          {/* Interactive "What-If" Lifestyle Simulator */}
          <div className="card-android p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Sliders size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {language === 'ru' ? 'Имитатор образа жизни (What-If)' : 'Lifestyle Impact Simulator'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'ru' ? 'Оцените прогноз снижения рисков при коррекции рациона' : 'Simulate projected risk reduction with lifestyle changes'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  <span>{language === 'ru' ? 'Дополнительная растворимая клетчатка:' : 'Extra dietary soluble fiber:'}</span>
                  <span className="text-medical-blue font-bold">+{fiberIncrease} г/день</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="25"
                  step="5"
                  value={fiberIncrease}
                  onChange={(e) => setFiberIncrease(Number(e.target.value))}
                  className="w-full accent-medical-blue cursor-pointer"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">
                    {language === 'ru' ? 'Прогноз изменения LDL холестерина' : 'Estimated LDL reduction'}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    -{lifestyleProjection.percentage}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">
                    {language === 'ru' ? 'Расчётный уровень' : 'Projected level'}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    ~{lifestyleProjection.newValue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="card-android p-12 text-center space-y-4 bg-white dark:bg-slate-900">
           <div className="w-12 h-12 border-4 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto" />
           <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">{t.consulting_ai}</p>
        </div>
      )}

      {insight && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card-android bg-white dark:bg-slate-900 prose prose-sm max-w-none p-5">
            <div className="markdown-body">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              if (!activeMember) return;
              downloadReportAsPdf('insight', activeMember, {
                insight: insight,
                member: activeMember,
                labsCount: labResults?.length || 0,
                symptomsCount: symptoms?.length || 0
              }, language || 'en');
            }}
            className="w-full py-3.5 bg-medical-blue hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-medical-blue/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <FileDown size={18} />
            {language === 'ru' ? 'СОХРАНИТЬ КОНСУЛЬТАЦИЮ В PDF' : 
             language === 'pl' ? 'ZAPISZ KONSULTACJĘ W PDF' :
             language === 'es' ? 'GUARDAR CONSULTA EN PDF' :
             language === 'de' ? 'KONSULTATION ALS PDF SPEICHERN' :
             'EXPORT CONSULTATION TO PDF'}
          </button>

          <div className="card-android bg-medical-red/5 dark:bg-medical-red/10 border-medical-red/10 dark:border-medical-red/20 p-4">
            <div className="flex gap-3">
              <Stethoscope className="text-medical-red shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-medical-red text-sm">{t.doctor_visit_prep}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {t.doctor_visit_prep_desc}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setInsight(null)}
            className="w-full text-center text-slate-400 dark:text-slate-500 text-sm font-medium py-3 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
          >
            {t.clear_and_reanalyze}
          </button>
        </motion.div>
      )}
      
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
        {t.insights_disclaimer}
      </p>
    </div>
  );
};

export default Insights;

