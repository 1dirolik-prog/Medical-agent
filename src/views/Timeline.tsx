import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useHealth } from '../HealthContext';
import { Activity, Beaker, Pill, AlertTriangle, Sparkles, Trash2, ChevronDown, ChevronRight, Brain, Plus, Stethoscope, Pencil, Check, X, Download, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { translateParameter } from '../services/paramTranslator';
import { getStandardReferenceRange } from '../services/referenceRanges';
import { getAIHealthInsights } from '../services/gemini';
import { downloadReportAsPdf } from '../services/pdfService';
import ParameterChartModal from '../components/ParameterChartModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EditableDateGroup } from '../components/EditableDateGroup';

const Timeline = ({ filter = 'all' }: { filter?: 'all' | 'labs' | 'studies' | 'consultations' }) => {
  const { labResults, symptoms, medications, aiReports, t, language, activeMember, activeMemberId, members, setActiveTab, deleteLabResultsByDate, deleteSymptom, deleteLabResult, deleteAIReport, addAIReport, updateAIReport, updateLabResultsDate } = useHealth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedChartParameter, setSelectedChartParameter] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [labToDelete, setLabToDelete] = useState<string | null>(null);
  const [symptomToDelete, setSymptomToDelete] = useState<string | null>(null);
  const [aiReportToDelete, setAiReportToDelete] = useState<string | null>(null);

  const handleConfirmDeleteLab = (id: string) => { setLabToDelete(id); };
  const handleConfirmDeleteSymptom = (id: string) => { setSymptomToDelete(id); };
  const handleConfirmDeleteAIReport = (id: string) => { setAiReportToDelete(id); };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePDF = async () => {
    if (!contentRef.current) return;
    try {
      setIsGeneratingPdf(true);
      
      // Wait for animations and layout to settle before capturing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const ignoredElements = contentRef.current.querySelectorAll('[data-html2canvas-ignore]');
      ignoredElements.forEach(el => (el as HTMLElement).style.display = 'none');

      const dataUrl = await toPng(contentRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      ignoredElements.forEach(el => (el as HTMLElement).style.display = '');

      // Create an image to get intrinsic dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = img.height * imgWidth / img.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`timeline-${filter}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!activeMemberId || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 pt-12">
        <h2 className="text-xl font-bold text-slate-800">No Profile Selected</h2>
        <p className="text-sm text-slate-500">Please select or create a profile to view timeline.</p>
        <button 
          onClick={() => setActiveTab('family')}
          className="px-6 py-3 bg-medical-blue text-white rounded-xl font-bold mt-2"
        >
          Go to Profiles
        </button>
      </div>
    );
  }

  const categories = useMemo(() => {
    let cats = ['Blood', 'Biochemistry', 'Urinalysis', 'Imaging', 'Ultrasound', 'MRI', 'CT', 'Consultation', 'Other'];
    if (filter === 'labs') {
      cats = ['Blood', 'Biochemistry', 'Urinalysis'];
    } else if (filter === 'studies') {
      cats = ['Imaging', 'Ultrasound', 'MRI', 'CT', 'Other'];
    } else if (filter === 'consultations') {
      cats = ['Consultation'];
    }
    return cats;
  }, [filter]);

  const sections = useMemo(() => {
    const getSectionEvents = (category: string) => {
      return labResults
        .filter(lab => (lab.category || 'Other') === category)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const generatedSections: any[] = categories.flatMap(cat => {
      const labs = getSectionEvents(cat);

      if (cat === 'Consultation') {
        const bySpec: Record<string, any[]> = {};
        labs.forEach(lab => {
          const spec = lab.doctorSpecialization || getCategoryName(cat, t);
          if (!bySpec[spec]) bySpec[spec] = [];
          bySpec[spec].push(lab);
        });
        
        return Object.entries(bySpec).map(([spec, items]) => {
          if (selectedSpecializations.length > 0 && !selectedSpecializations.includes(spec) && spec !== getCategoryName(cat, t)) {
            return null;
          }
          return {
            id: `consultation_${spec}`,
            title: spec,
            icon: <Stethoscope size={18} />,
            color: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-500/10',
            items,
            type: 'LAB'
          };
        }).filter(Boolean) as any[];
      }

      return {
        id: cat,
        title: getCategoryName(cat, t),
        icon: <Beaker size={18} />,
        color: 'text-medical-blue',
        bg: 'bg-medical-blue/10',
        items: labs,
        type: 'LAB'
      };
    }).filter(s => s.items.length > 0);

    if (filter === 'all') {
      const symptomEvents = [...symptoms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (symptomEvents.length > 0) {
        generatedSections.push({
          id: 'Symptoms',
          title: t.symptom_log,
          icon: <AlertTriangle size={18} />,
          color: 'text-medical-yellow',
          bg: 'bg-medical-yellow/10',
          items: symptomEvents,
          type: 'SYMPTOM'
        });
      }

      const medicationEvents = [...medications].sort((a, b) => new Date(b.startDate || Date.now()).getTime() - new Date(a.startDate || Date.now()).getTime());
      if (medicationEvents.length > 0) {
        generatedSections.push({
          id: 'Medications',
          title: t.medications || 'Medications',
          icon: <Pill size={18} />,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10',
          items: medicationEvents,
          type: 'MEDICATION'
        });
      }
    }
    
    return generatedSections;
  }, [categories, labResults, filter, t, selectedSpecializations, symptoms, medications]);

  const filteredAIReports = useMemo(() => {
    return aiReports.filter(report => {
      if (filter === 'all') return true;
      if (filter === 'labs' && report.reportType === 'labs') return true;
      if (filter === 'studies' && report.reportType === 'studies') return true;
      if (filter === 'consultations' && report.reportType === 'consultations') {
        if (selectedSpecializations.length > 0) {
          if (!report.doctorSpecialization) return false;
          return selectedSpecializations.includes(report.doctorSpecialization);
        }
        return true;
      }
      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [aiReports, filter, selectedSpecializations]);

  const allConsultationSpecializations = React.useMemo(() => {
    if (filter !== 'consultations') return [];
    const specializations = new Set<string>();
    aiReports.forEach(report => {
      if (report.reportType === 'consultations' && report.doctorSpecialization) {
        specializations.add(report.doctorSpecialization);
      }
    });
    return Array.from(specializations);
  }, [aiReports, filter]);

  const finalSections = sections.filter(s => s.id !== 'AIReports');
  if (filteredAIReports.length > 0) {
    finalSections.push({
      id: 'AIReports',
      title: filter === 'all' ? (t.ai_health_insights || 'AI Reports') : 
             filter === 'labs' ? (language === 'ru' ? 'ИИ Анализ анализов' : 'AI Lab Insights') :
             filter === 'consultations' ? (language === 'ru' ? 'ИИ Анализ консультации' : 'AI Consultation Insights') :
             (language === 'ru' ? 'ИИ Анализ исследований' : 'AI Study Insights'),
      icon: <Brain size={18} />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      items: filteredAIReports,
      type: 'AI_REPORT'
    });
  }

  const handleGenerateAnalysis = async () => {
    if (!activeMember) return;
    setIsGenerating(true);
    try {
      const relevantLabs = filter === 'all' 
        ? labResults 
        : labResults.filter(lab => categories.includes(lab.category || 'Other'));

      const result = await getAIHealthInsights(
        activeMember, 
        relevantLabs, 
        filter === 'all' || filter === 'labs' ? symptoms : [], 
        t.insights_prompt_language
      );
      
      addAIReport({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        title: filter === 'all' ? (t.health_ai_insight || 'Health AI Insight') : 
               filter === 'labs' ? (language === 'ru' ? 'Анализ: ' : 'Lab Analysis: ') + new Date().toLocaleDateString(language) :
               filter === 'consultations' ? (language === 'ru' ? 'Консультация: ' : 'Consultation Analysis: ') + new Date().toLocaleDateString(language) :
               (language === 'ru' ? 'Исследование: ' : 'Study Analysis: ') + new Date().toLocaleDateString(language),
        content: result,
        reportType: filter === 'labs' ? 'labs' : filter === 'studies' ? 'studies' : filter === 'consultations' ? 'consultations' : 'general'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  let title = t.timeline_title;
  if (filter === 'labs') title = language === 'ru' ? 'Анализы' : language === 'de' ? 'Laborwerte' : language === 'pl' ? 'Badania' : language === 'es' ? 'Análisis' : 'Lab Tests';
  if (filter === 'studies') title = language === 'ru' ? 'Исследования' : language === 'de' ? 'Untersuchungen' : language === 'pl' ? 'Obrazowe' : language === 'es' ? 'Estudios' : 'Studies';
  if (filter === 'consultations') title = language === 'ru' ? 'Консультации' : language === 'de' ? 'Konsultationen' : language === 'pl' ? 'Konsultacje' : language === 'es' ? 'Consultas' : 'Consultations';

  return (
    <div className="p-4 space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
        <div className="flex items-center gap-2" data-html2canvas-ignore>
          {filter === 'all' && (
            <button 
              onClick={handlePDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 text-slate-500 hover:text-medical-blue transition-colors px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {isGeneratingPdf ? <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
              PDF
            </button>
          )}
          {filter !== 'all' && (
            <>
              <button 
                onClick={handlePDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1 text-slate-500 hover:text-medical-blue transition-colors px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {isGeneratingPdf ? <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                PDF
              </button>
              <button 
                onClick={() => setActiveTab('scan')}
                className="flex items-center gap-1 bg-medical-blue/10 text-medical-blue dark:bg-medical-blue/20 px-3 py-1.5 rounded-full font-bold text-xs hover:bg-medical-blue/20 transition-colors"
              >
                <Plus size={14} />
                {language === 'ru' ? 'Добавить' : 'Add'}
              </button>
            </>
          )}
        </div>
      </div>

      {filter === 'consultations' && allConsultationSpecializations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" data-html2canvas-ignore>
          {allConsultationSpecializations.map(spec => (
            <button
              key={spec}
              onClick={() => {
                setSelectedSpecializations(prev => 
                  prev.includes(spec) 
                    ? prev.filter(s => s !== spec)
                    : [...prev, spec]
                )
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedSpecializations.includes(spec) ? 'bg-medical-blue text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
            >
              {spec}
            </button>
          ))}
        </div>
      )}
      
      {finalSections.length === 0 ? (
        <div className="text-center p-12 text-slate-400">
           <Activity size={48} className="mx-auto mb-4 opacity-20" />
           <p>{t.timeline_empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {finalSections.map((section, index) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-android overflow-hidden"
            >
              <button 
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between p-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.bg} ${section.color}`}>
                    {section.icon}
                  </div>
                  <div className="flex flex-col items-start">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{section.title}</h3>
                    <span className="text-xs text-slate-500">{section.items.length} {t.entries || 'entries'}</span>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedSection === section.id ? <ChevronDown /> : <ChevronRight />}
                </div>
              </button>

              <AnimatePresence>
                {(expandedSection === section.id || isGeneratingPdf) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-700 mt-4"
                  >
                    {section.type === 'LAB' && (['Blood', 'Biochemistry', 'Urinalysis', 'Imaging', 'Ultrasound', 'MRI', 'CT', 'Other'].includes(section.id) || section.id.startsWith('consultation_')) ? (
                      <div className="w-full pt-4 space-y-6 pb-2">
                         {Array.from(new Set<string>(section.items.map((i: any) => new Date(i.date).toDateString()))).map(dateStr => {
                           const dItems = section.items.filter((i: any) => new Date(i.date).toDateString() === dateStr);
                           const displayDate = new Date(dItems[0].date).toLocaleDateString(language);
                           return (
                             <div key={dateStr} className="overflow-x-auto w-full border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl shadow-sm">
                               <EditableDateGroup 
                                 dateStr={dItems[0].date} 
                                 displayDate={displayDate} 
                                 sectionTitle={section.title} 
                                 onSave={newDate => updateLabResultsDate(dItems[0].date, newDate, dItems.map((i: any) => i.id))} 
                               />
                               <table className="w-full text-xs text-left min-w-[600px]">
                                 <thead>
                                   <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
                                     <th className="py-2 px-3 font-medium w-1/4">{language === 'ru' ? 'Показатель' : t.parameter || 'Parameter'}</th>
                                     <th className="py-2 px-2 font-medium">{language === 'ru' ? 'Результат' : t.result || 'Result'}</th>
                                     <th className="py-2 px-2 font-medium">{language === 'ru' ? 'Ед. изм.' : t.unit || 'Unit'}</th>
                                     <th className="py-2 px-2 font-medium">{language === 'ru' ? 'Норма' : 'Norm'}</th>
                                     <th className="py-2 px-2 font-medium">{language === 'ru' ? 'Статус' : 'Status'}</th>
                                     <th className="py-2 px-2 font-medium w-1/5">{language === 'ru' ? 'Комментарий' : 'Comment'}</th>
                                     <th className="py-2 px-2"></th>
                                   </tr>
                                 </thead>
                                 <tbody className="bg-white dark:bg-slate-900">
                                   {dItems.map((item: any) => (
                                     <LabTableRow 
                                        key={item.id} 
                                        item={item} 
                                        t={t} 
                                        lang={language} 
                                        activeMember={activeMember} 
                                        deleteLabResult={handleConfirmDeleteLab}
                                        openChart={(param: string) => setSelectedChartParameter(param)}
                                      />
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                           );
                         })}
                      </div>
                    ) : (
                      <div className="pt-4 space-y-4">
                        {section.items.map((item: any) => (
                           <div key={item.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-600 ml-2">
                              <EventItem 
                                 item={{...item, type: section.type === 'LAB' ? 'LAB' : section.type}} 
                                 t={t} 
                                 lang={language} 
                                 activeMember={activeMember} 
                                 deleteLabResult={handleConfirmDeleteLab}
                                 deleteSymptom={handleConfirmDeleteSymptom}
                                 deleteAIReport={handleConfirmDeleteAIReport}
                                 updateAIReport={updateAIReport}
                              />
                           </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {selectedChartParameter && (
         <ParameterChartModal
            parameter={selectedChartParameter}
            data={labResults}
            onClose={() => setSelectedChartParameter(null)}
            t={t}
            language={language}
            activeMember={activeMember}
         />
      )}

      <ConfirmDialog
        isOpen={labToDelete !== null}
        onClose={() => setLabToDelete(null)}
        onConfirm={() => {
          if (labToDelete) {
            deleteLabResult(labToDelete);
          }
        }}
        title={language === 'ru' ? 'Удалить показатель анализа?' : 'Delete Lab Parameter?'}
        description={
          language === 'ru'
            ? 'Вы уверены, что хотите безвозвратно удалить этот показатель анализа из медицинской карты?'
            : 'Are you sure you want to permanently delete this lab parameter from the medical card?'
        }
        confirmText={language === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={language === 'ru' ? 'Отмена' : 'Cancel'}
      />

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
            ? 'Вы уверены, что хотите удалить эту запись о самочувствии?'
            : 'Are you sure you want to delete this wellbeing record?'
        }
        confirmText={language === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={language === 'ru' ? 'Отмена' : 'Cancel'}
      />

      <ConfirmDialog
        isOpen={aiReportToDelete !== null}
        onClose={() => setAiReportToDelete(null)}
        onConfirm={() => {
          if (aiReportToDelete) {
            deleteAIReport(aiReportToDelete);
          }
        }}
        title={language === 'ru' ? 'Удалить медицинский отчет?' : 'Delete Medical Report?'}
        description={
          language === 'ru'
            ? 'Вы уверены, что хотите удалить этот отчет или заключение консилиума?'
            : 'Are you sure you want to delete this report or consilium conclusion?'
        }
        confirmText={language === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={language === 'ru' ? 'Отмена' : 'Cancel'}
      />
    </div>
  );
};

const EventItem = ({ item, t, lang, activeMember, deleteLabResult, deleteSymptom, deleteAIReport, updateAIReport }: any) => {
  const date = item.date || item.startDate || Date.now();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return '';
    }
  });

  const handleSaveDate = () => {
    if (updateAIReport && item.type === 'AI_REPORT') {
      updateAIReport(item.id, { date: new Date(newDate).toISOString() });
    }
    // We only support editable date for AI_REPORT here since LAB dates are edited via EditableDateGroup wrapper.
    // However, if there are other types to be editable, handle them here.
    setIsEditingDate(false);
  };
  
  return (
    <div className="flex flex-col gap-2 relative group">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
           {getEventTitle(item, t, lang)}
        </h4>
        {isEditingDate ? (
           <div className="flex bg-slate-50 border border-slate-200 rounded p-1 items-center gap-1">
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-transparent text-xs outline-none" autoFocus/>
              <button onClick={handleSaveDate} className="text-green-600" aria-label="Save"><Check size={12}/></button>
              <button onClick={() => setIsEditingDate(false)} className="text-red-600" aria-label="Cancel"><X size={12}/></button>
           </div>
        ) : (
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
             {new Date(date).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' })}
             {item.type === 'AI_REPORT' && (
               <button onClick={() => setIsEditingDate(true)} className="p-0.5 text-slate-400 hover:text-medical-blue transition-colors" aria-label="Edit">
                 <Pencil size={12} />
               </button>
             )}
           </span>
        )}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {getEventDescription(item, t, lang, activeMember, deleteLabResult, deleteSymptom, deleteAIReport, updateAIReport)}
      </div>
    </div>
  );
};

const getCategoryName = (category: string, t: any) => {
  switch(category) {
    case 'Blood': return t.cat_blood;
    case 'Biochemistry': return t.cat_biochemistry;
    case 'Urinalysis': return t.cat_urinalysis;
    case 'Imaging': return t.cat_imaging;
    case 'Ultrasound': return t.cat_ultrasound;
    case 'MRI': return t.cat_mri;
    case 'CT': return t.cat_ct;
    case 'Consultation': return t.cat_consultation || 'Consultation';
    case 'Other': return t.cat_other;
    default: return t.lab_group || category;
  }
};

const getEventTitle = (event: any, t: any, lang: any) => {
  switch (event.type) {
    case 'LAB': return translateParameter(event.parameter, lang);
    case 'SYMPTOM': return `${t.symptom_log} (${event.symptoms.length})`;
    case 'MEDICATION': return `${event.name}`;
    case 'AI_REPORT': return event.title || 'AI Report';
    default: return t.health_update || 'Update';
  }
};

const getEventDescription = (event: any, t: any, lang: any, activeMember: any, deleteLabResult?: (id: string) => void, deleteSymptom?: (id: string) => void, deleteAIReport?: (id: string) => void, updateAIReport?: (id: string, overrides: any) => void) => {
  switch (event.type) {
    case 'LAB': {
      const standardRange = activeMember ? getStandardReferenceRange(event.parameter, activeMember.age, activeMember.sex) : null;
      let refText = '';
      let isOutOfRange = false;
      
      if (standardRange) {
        if (standardRange.text) refText = standardRange.text;
        else if (standardRange.min !== undefined && standardRange.max !== undefined) {
          refText = `${standardRange.min} - ${standardRange.max}`;
          isOutOfRange = event.value < standardRange.min || event.value > standardRange.max;
        }
      } else if (event.referenceRange) {
        if (!(event.referenceRange.min === 0 && event.referenceRange.max === 0)) {
          refText = `${event.referenceRange.min} - ${event.referenceRange.max}`;
          isOutOfRange = event.value < event.referenceRange.min || event.value > event.referenceRange.max;
        }
      }
      return (
        <span className="flex flex-col gap-1 items-start mt-1 relative w-full pr-8">
          {event.textValue ? (
             <div className="text-sm whitespace-pre-wrap max-w-full text-slate-700 dark:text-slate-300 mt-1">{typeof event.textValue === 'string' ? event.textValue : JSON.stringify(event.textValue)}</div>
          ) : (
            <span>
              {t.result || 'Result'}: <strong className={isOutOfRange ? "text-medical-red" : "text-slate-700 dark:text-slate-300"}>{event.value}</strong> {event.unit}
              {refText && <span className="ml-2 text-xs text-slate-400 tracking-wide font-normal">(Norm: {refText})</span>}
            </span>
          )}
          {event.notes && (
             <span className="inline-flex items-center gap-1 bg-medical-blue/10 text-medical-blue px-2 py-0.5 rounded text-[10px] font-bold w-auto border border-medical-blue/20 mt-1">
               <Sparkles size={10} /> {event.notes}
             </span>
          )}
          {deleteLabResult && (
            <button 
              onClick={() => deleteLabResult(event.id)}
              aria-label={lang === 'ru' ? 'Удалить' : 'Delete'}
              className="absolute right-0 top-0 p-2 text-slate-300 hover:text-medical-red dark:hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </span>
      );
    }
    case 'SYMPTOM': return (
      <div className="relative pr-8">
        <p>{t.severity || 'Severity'}: {event.severity}/5. {t.reported || 'Reported'}: {Array.isArray(event.symptoms) ? event.symptoms.join(', ') : String(event.symptoms)}.</p>
        {deleteSymptom && (
          <button 
            onClick={() => deleteSymptom(event.id)}
            aria-label={lang === 'ru' ? 'Удалить' : 'Delete'}
            className="absolute right-0 top-0 p-2 text-slate-300 hover:text-medical-red dark:hover:text-red-400 transition-colors flex items-center h-full"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
    case 'MEDICATION': 
      const endDate = event.endDate ? new Date(event.endDate) : null;
      const isOngoing = !endDate || endDate >= new Date();
      const duration = event.endDate ? ` ${t.until || 'until'} ${new Date(event.endDate).toLocaleDateString(lang)}` : ` (${t.ongoing || 'ongoing'})`;
      return `${t.dosage || 'Dosage'}: ${event.dosage}, ${event.frequency}${duration}. ${event.notes || ''}`;
    case 'AI_REPORT':
      return <AIReportItem event={event} updateAIReport={updateAIReport} deleteAIReport={deleteAIReport} t={t} activeMember={activeMember} language={lang} />;
    default: return null;
  }
};

const AIReportItem = ({ event, updateAIReport, deleteAIReport, t, activeMember, language }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [docSpec, setDocSpec] = useState(event.doctorSpecialization || '');

  const handleSave = () => {
    updateAIReport(event.id, {
      doctorSpecialization: docSpec.trim()
    });
    setIsEditing(false);
  };

  const handleDownloadPdf = () => {
    if (!activeMember) return;
    const isRu = language === 'ru';
    
    if (event.reportType === 'consilium') {
      try {
        const parsed = JSON.parse(event.content);
        
        // Define standard doctors matching Consilium view with support for all 5 languages
        const allDoctors = [
          { 
            id: 'therapist', 
            name: language === 'ru' ? 'Терапевт' : language === 'pl' ? 'Internista' : language === 'es' ? 'Terapeuta/Médico general' : language === 'de' ? 'Therapeut' : 'Therapist', 
            spec: language === 'ru' ? 'Общая медицина' : language === 'pl' ? 'Medycyna ogólna' : language === 'es' ? 'Medicina general' : language === 'de' ? 'Allgemeinmedizin' : 'General medicine' 
          },
          { 
            id: 'cardiologist', 
            name: language === 'ru' ? 'Кардиолог' : language === 'pl' ? 'Kardiolog' : language === 'es' ? 'Cardiólogo' : language === 'de' ? 'Kardiologe' : 'Cardiologist', 
            spec: language === 'ru' ? 'Сердце и сосуды' : language === 'pl' ? 'Serce i naczynia' : language === 'es' ? 'Corazón y vasos' : language === 'de' ? 'Herz und Gefäße' : 'Heart and vessels' 
          },
          { 
            id: 'neurologist', 
            name: language === 'ru' ? 'Невролог' : language === 'pl' ? 'Neurolog' : language === 'es' ? 'Neurólogo' : language === 'de' ? 'Neurologe' : 'Neurologist', 
            spec: language === 'ru' ? 'Нервная система' : language === 'pl' ? 'Układ nerwowy' : language === 'es' ? 'Sistema nervioso' : language === 'de' ? 'Nervensystem' : 'Nervous system' 
          },
          { 
            id: 'gastroenterologist', 
            name: language === 'ru' ? 'Гастроэнтеролог' : language === 'pl' ? 'Gastroenterolog' : language === 'es' ? 'Gastroenterólogo' : language === 'de' ? 'Gastroenterologe' : 'Gastroenterologist', 
            spec: language === 'ru' ? 'ЖКТ и пищеварение' : language === 'pl' ? 'Układ pokarmowy' : language === 'es' ? 'Tracto gastrointestinal y digestión' : language === 'de' ? 'Magen-Darm-Trakt und Verdauung' : 'GI tract and digestion' 
          },
          { 
            id: 'endocrinologist', 
            name: language === 'ru' ? 'Эндокринолог' : language === 'pl' ? 'Endokrynolog' : language === 'es' ? 'Endocrinólogo' : language === 'de' ? 'Endokrinologe' : 'Endocrinologist', 
            spec: language === 'ru' ? 'Гормоны и эндокринная система' : language === 'pl' ? 'Układ hormonalny' : language === 'es' ? 'Hormonas y sistema endocrino' : language === 'de' ? 'Hormone und endokrines System' : 'Hormones and endocrines' 
          },
          { 
            id: 'pediatrician', 
            name: language === 'ru' ? 'Педиатр' : language === 'pl' ? 'Pediatra' : language === 'es' ? 'Pediatra' : language === 'de' ? 'Kinderarzt' : 'Pediatrician', 
            spec: language === 'ru' ? 'Детское здоровье' : language === 'pl' ? 'Zdrowie dziecięce' : language === 'es' ? 'Salud infantil' : language === 'de' ? 'Kindergesundheit' : 'Children health' 
          }
        ];

        downloadReportAsPdf('consilium', activeMember, {
          conclusion: parsed.conclusion,
          discussion: parsed.discussion || [],
          doctorsList: allDoctors
        }, language);
      } catch (e) {
        // Fallback for non-JSON or parsed content
        downloadReportAsPdf('insight', activeMember, {
          insight: event.content,
          member: activeMember,
          labsCount: 0,
          symptomsCount: 0
        }, language);
      }
    } else {
      downloadReportAsPdf('insight', activeMember, {
        insight: event.content,
        member: activeMember,
        labsCount: 0,
        symptomsCount: 0
      }, language);
    }
  };

  return (
    <div className="relative pr-8">
      {isEditing ? (
        <div className="mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{(t as any).doctor_specialization || 'Doctor Specialization'}</label>
            <input 
              value={docSpec}
              onChange={e => setDocSpec(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200" 
              placeholder="e.g. ENT, Surgeon" 
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
              Cancel
            </button>
            <button onClick={handleSave} className="px-3 py-1 rounded bg-medical-blue text-white text-xs font-bold">
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {event.doctorSpecialization && (
            <span className="bg-medical-blue/10 text-medical-blue px-2 py-1 rounded-md text-xs font-bold border border-medical-blue/20">
              {event.doctorSpecialization}
            </span>
          )}
          {event.reportType === 'consultations' && updateAIReport && (
            <button onClick={() => setIsEditing(true)} className="text-[10px] text-medical-blue hover:underline uppercase font-bold ml-1">
              {(t as any).edit || 'Edit'}
            </button>
          )}

          <button 
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 rounded border border-slate-200/50 dark:border-slate-700/50 transition-colors uppercase"
          >
            <FileDown size={12} />
            PDF
          </button>
        </div>
      )}

      <div className="prose prose-sm dark:prose-invert break-words">
         <ReactMarkdown>{typeof event.content === 'string' ? event.content : JSON.stringify(event.content)}</ReactMarkdown>
      </div>
      {deleteAIReport && (
        <button 
          onClick={() => deleteAIReport(event.id)}
          aria-label={language === 'ru' ? 'Удалить' : 'Delete'}
          className="absolute right-0 top-0 p-2 text-slate-300 hover:text-medical-red dark:hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const LabTableRow = ({ item, t, lang, activeMember, deleteLabResult, openChart }: any) => {
  const standardRange = activeMember ? getStandardReferenceRange(item.parameter, activeMember.age, activeMember.sex) : null;
  let refText = '—';
  let isOutOfRange = false;
  let isHigh = false;
  let isLow = false;
  
  if (standardRange) {
    if (standardRange.text) refText = standardRange.text;
    else if (standardRange.min !== undefined && standardRange.max !== undefined) {
      refText = `${standardRange.min} - ${standardRange.max}`;
      isOutOfRange = item.value < standardRange.min || item.value > standardRange.max;
      isLow = item.value < standardRange.min;
      isHigh = item.value > standardRange.max;
    }
  } else if (item.referenceRange) {
    if (!(item.referenceRange.min === 0 && item.referenceRange.max === 0)) {
      refText = `${item.referenceRange.min} - ${item.referenceRange.max}`;
      isOutOfRange = item.value < item.referenceRange.min || item.value > item.referenceRange.max;
      isLow = item.value < item.referenceRange.min;
      isHigh = item.value > item.referenceRange.max;
    }
  }

  const statusEl = isHigh ? (
     <span className="text-medical-red font-bold flex items-center gap-1">↑ {lang === 'ru' ? 'Выше' : 'High'}</span>
  ) : isLow ? (
     <span className="text-medical-red font-bold flex items-center gap-1">↓ {lang === 'ru' ? 'Ниже' : 'Low'}</span>
  ) : (
     <span className="text-medical-green font-bold">{lang === 'ru' ? 'Норма' : 'Normal'}</span>
  );

  return (
    <tr 
      className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
      onClick={() => openChart && !item.textValue && openChart(item.parameter)}
    >
      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 w-1/4">{translateParameter(item.parameter, lang)}</td>
      {item.textValue ? (
        <td className="py-3 px-2 font-normal whitespace-pre-wrap text-slate-700 dark:text-slate-300" colSpan={4}>
          {typeof item.textValue === 'string' ? item.textValue : JSON.stringify(item.textValue)}
        </td>
      ) : (
        <>
          <td className="py-3 px-2 font-bold">
            <span className={isOutOfRange ? "text-medical-red" : "text-slate-800 dark:text-slate-200"}>{item.value}</span>
          </td>
          <td className="py-3 px-2 text-slate-500">{item.unit || '—'}</td>
          <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{refText}</td>
          <td className="py-3 px-2 whitespace-nowrap">{statusEl}</td>
        </>
      )}
      <td className="py-3 px-2 max-w-[120px] truncate text-xs text-slate-500 w-1/5" title={item.notes}>{item.notes || '—'}</td>
      <td className="py-3 px-2 text-right">
        {deleteLabResult && (
          <button 
            onClick={(e) => { e.stopPropagation(); deleteLabResult(item.id); }}
            className="p-1.5 text-slate-300 hover:text-medical-red dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
            aria-label={lang === 'ru' ? 'Удалить' : 'Delete'}
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  );
};

export default Timeline;
