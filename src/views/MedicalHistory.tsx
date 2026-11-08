import React, { useState, useMemo, useEffect } from "react";
import { useHealth } from "../HealthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  FileText,
  Brain,
  Users,
  ChevronDown,
  ChevronRight,
  Calendar,
  Sparkles,
  Search,
  Stethoscope,
  Beaker,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  FileDown,
  Trash2,
  Plus,
  Settings2,
  Camera,
  Upload,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { translateParameter } from "../services/paramTranslator";
import { getStandardReferenceRange } from "../services/referenceRanges";
import { downloadReportAsPdf } from "../services/pdfService";
import { ManualEntryChat } from "./ManualEntryChat";
import { getAllDoctors, getDoctorById } from "../services/doctorRegistry";
import { LabResultTable } from "../components/LabResultTable";
import { EmptyState } from "../components/EmptyState";
import ParameterChartModal from "../components/ParameterChartModal";

interface HistoryItem {
  id: string;
  date: string;
  type: "analysis" | "study" | "consultation" | "consilium" | "ai_analysis";
  title: string;
  categoryName: string;
  doctorSpecialization?: string;
  labs?: any[];
  textValue?: string;
  notes?: string;
  content?: string;
}

const getPluralTitle = (n: number, lang: string) => {
  if (lang === 'ru') {
    const m10 = n % 10; const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return `${n} запись`;
    if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return `${n} записи`;
    return `${n} записей`;
  }
  if (lang === 'pl') {
    const m10 = n % 10; const m100 = n % 100;
    if (n === 1) return `1 wpis`;
    if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return `${n} wpisy`;
    return `${n} wpisów`;
  }
  if (lang === 'de') {
    return n === 1 ? `1 Eintrag` : `${n} Einträge`;
  }
  if (lang === 'es') {
    return `${n} registro${n !== 1 ? 's' : ''}`;
  }
  return `${n} record${n !== 1 ? 's' : ''}`;
};

  const MedicalHistory: React.FC = () => {
  const {
    labResults,
    aiReports,
    t,
    language,
    activeMember,
    activeMemberId,
    members,
    setActiveTab,
    deleteLabResult,
    deleteAIReport,
    addLabResult,
    addAIReport,
  } = useHealth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "analysis" | "study" | "consultation" | "ai"
  >("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [showDiscussion, setShowDiscussion] = useState<Record<string, boolean>>(
    {},
  );
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showManualChat, setShowManualChat] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [selectedChartParameter, setSelectedChartParameter] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenManual = () => {
      setShowManualChat(true);
    };
    window.addEventListener('open-manual-entry', handleOpenManual);
    return () => {
      window.removeEventListener('open-manual-entry', handleOpenManual);
    };
  }, []);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteItem = (item: HistoryItem) => {
    if (item.type === "consilium" || item.type === "ai_analysis") {
      deleteAIReport(item.id);
    } else if (item.type === "consultation") {
      deleteLabResult(item.id);
    } else if (item.type === "analysis" || item.type === "study") {
      if (item.labs && item.labs.length > 0) {
        item.labs.forEach((lab: any) => {
          deleteLabResult(lab.id);
        });
      }
    }
    setItemToDelete(null);
  };

  const toggleDiscussion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDiscussion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isRu = language === "ru";
  const allDoctors = getAllDoctors(language);

  // Centralized translation labels from translations system
  const labels = {
    title: t.history_title,
    subtitle: t.history_subtitle,
    searchPlaceholder: language === 'ru' ? 'Поиск по анализам, врачам...' : t.history_search_placeholder,
    all: t.history_filter_all,
    analysis: t.history_filter_labs,
    study: t.history_filter_studies,
    consultation: t.history_filter_consultations,
    ai: t.history_filter_ai,
    emptyHistory: t.history_empty,
    emptyHistoryDesc: t.history_empty_desc,
    referenceNorm: t.history_ref_norm,
    statusHigh: language === 'ru' ? "Выше нормы" : language === 'pl' ? "Powyżej normy" : language === 'de' ? "Über dem Normalwert" : language === 'es' ? "Por encima de lo normal" : "High",
    statusLow: language === 'ru' ? "Ниже нормы" : language === 'pl' ? "Poniżej normy" : language === 'de' ? "Unter dem Normalwert" : language === 'es' ? "Por debajo de lo normal" : "Low",
    statusNormal: language === 'ru' ? "В норме" : language === 'pl' ? "W normie" : language === 'de' ? "Normal" : language === 'es' ? "Normal" : "Normal",
    doctorSpecialization: t.history_doctor_specialization,
    notes: t.history_notes,
    findings: t.history_findings,
    aiAnalysis: t.history_ai_analysis,
    consilium: t.history_consilium,
    parameter: t.history_parameter,
    result: t.history_result,
    dateLabel: t.history_date_label,
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "Blood":
        return t.cat_blood;
      case "Biochemistry":
        return t.cat_biochemistry;
      case "Urinalysis":
        return t.cat_urinalysis;
      case "Imaging":
        return t.cat_imaging;
      case "Ultrasound":
        return t.cat_ultrasound;
      case "MRI":
        return t.cat_mri;
      case "CT":
        return t.cat_ct;
      case "Consultation":
        return t.cat_consultation;
      case "Other":
        return t.cat_other;
      default:
        return category;
    }
  };

  // Process and group medical records
  const historyItems = useMemo<HistoryItem[]>(() => {
    if (!activeMemberId) return [];

    const items: HistoryItem[] = [];

    // Grouping helper for labResults
    const groupedLabs: Record<
      string,
      {
        date: string;
        category: string;
        doctorSpecialization?: string;
        list: any[];
      }
    > = {};

    labResults.forEach((lab) => {
      const dateKey = lab.date.split("T")[0];
      const isLabType = ["Blood", "Biochemistry", "Urinalysis"].includes(
        lab.category,
      );
      const isStudyType = ["Imaging", "Ultrasound", "MRI", "CT"].includes(
        lab.category,
      );

      let groupKey = "";
      if (isLabType) {
        groupKey = `lab_${dateKey}_${lab.category}`;
      } else if (isStudyType) {
        groupKey = `study_${dateKey}`; // Group all studies on the exact same date together
      } else {
        groupKey = `consult_${dateKey}_${lab.doctorSpecialization || "other"}_${lab.id}`;
      }

      if (!groupedLabs[groupKey]) {
        groupedLabs[groupKey] = {
          date: lab.date,
          category: lab.category,
          doctorSpecialization: lab.doctorSpecialization,
          list: [],
        };
      }
      groupedLabs[groupKey].list.push(lab);
    });

    // Create history items from grouped standard medical documents
    Object.entries(groupedLabs).forEach(([key, group]) => {
      if (key.startsWith("lab_")) {
        items.push({
          id: key,
          date: group.date,
          type: "analysis",
          title: getCategoryTitle(group.category),
          categoryName: group.category,
          labs: group.list,
        });
      } else if (key.startsWith("study_")) {
        // Collect all unique parameters/titles
        const parameters = Array.from(
          new Set(group.list.map((lab) => lab.parameter).filter(Boolean)),
        );
        const categoriesList = Array.from(
          new Set(group.list.map((lab) => getCategoryTitle(lab.category))),
        );

        let title = "";
        if (parameters.length > 0) {
          title = parameters.join(", ");
        } else if (categoriesList.length > 0) {
          title = categoriesList.join(" / ");
        } else {
          title = getCategoryTitle(group.category);
        }

        // Combine text values with clean markdown formatting
        const combinedTexts: string[] = [];
        group.list.forEach((lab) => {
          const itemTitle = lab.parameter ? `### ${lab.parameter}` : "";
          const body = lab.textValue || lab.value?.toString() || "";
          const itemNotes = lab.notes
            ? `\n*${labels.notes}: ${lab.notes}*`
            : "";

          let block = "";
          if (itemTitle) {
            block += `${itemTitle}\n`;
          }
          if (body) {
            block += `${body}`;
          }
          if (itemNotes) {
            block += `${itemNotes}`;
          }
          if (block.trim()) {
            combinedTexts.push(block.trim());
          }
        });

        const allNotes = group.list.map((lab) => lab.notes).filter(Boolean);
        const combinedNotes =
          allNotes.length > 0 ? allNotes.join("; ") : undefined;

        items.push({
          id: key,
          date: group.date,
          type: "study",
          title: title,
          categoryName: group.category,
          textValue: combinedTexts.join("\n\n---\n\n"),
          notes: combinedNotes,
          labs: group.list,
        });
      } else {
        // Consultations
        group.list.forEach((lab) => {
          const consultPrefix = language === 'ru' ? 'Консультация' : language === 'pl' ? 'Konsultacja' : language === 'de' ? 'Konsultation' : language === 'es' ? 'Consulta' : 'Consultation';
          items.push({
            id: lab.id,
            date: lab.date,
            type: "consultation",
            title: lab.doctorSpecialization
              ? `${consultPrefix}: ${lab.doctorSpecialization}`
              : getCategoryTitle(group.category),
            categoryName: group.category,
            doctorSpecialization: lab.doctorSpecialization,
            textValue: lab.textValue || lab.value?.toString() || "",
            notes: lab.notes,
          });
        });
      }
    });

    // Add AI Reports
    aiReports.forEach((report) => {
      if (report.reportType === "consilium") {
        items.push({
          id: report.id,
          date: report.date,
          type: "consilium",
          title: report.title || labels.consilium,
          categoryName: "consilium",
          content: report.content,
        });
      } else {
        items.push({
          id: report.id,
          date: report.date,
          type: "ai_analysis",
          title: report.title || labels.aiAnalysis,
          categoryName: "ai_analysis",
          content: report.content,
          doctorSpecialization: report.doctorSpecialization,
        });
      }
    });

    // Sort chronologically (newest first)
    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [labResults, aiReports, activeMemberId, language]);

  // Combined search and tab filter
  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // 1. Tab Filters
      if (activeFilter !== "all") {
        if (
          activeFilter === "ai" &&
          !["consilium", "ai_analysis"].includes(item.type)
        )
          return false;
        if (activeFilter !== "ai" && item.type !== activeFilter) return false;
      }

      // 2. Search query matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesType = item.type.toLowerCase().includes(query);
        const matchesDoc = item.doctorSpecialization
          ?.toLowerCase()
          .includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesContent = item.content?.toLowerCase().includes(query);
        const matchesTextValue = item.textValue?.toLowerCase().includes(query);

        // search deeper in lab parameters
        let matchesLabs = false;
        if (item.labs) {
          matchesLabs = item.labs.some(
            (l) =>
              l.parameter.toLowerCase().includes(query) ||
              translateParameter(l.parameter, language)
                .toLowerCase()
                .includes(query),
          );
        }

        return (
          matchesTitle ||
          matchesType ||
          matchesDoc ||
          matchesNotes ||
          matchesContent ||
          matchesTextValue ||
          matchesLabs
        );
      }

      return true;
    });
  }, [historyItems, activeFilter, searchQuery, language]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40">
      {/* Title */}
      <div className="bg-white dark:bg-slate-800 px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ClipboardList className="text-medical-blue shrink-0" size={24} />
          {labels.title}
        </h2>
        <p className="text-[13px] text-[#757575] mt-1 pb-1">
          {historyItems.length > 0 ? `${getPluralTitle(historyItems.length, language)} · ${t.latest || 'latest'} ${new Date(historyItems[0].date).toLocaleDateString(language, {day: 'numeric', month: 'short', year: 'numeric'})}` : labels.subtitle}
        </p>
      </div>

      {/* Modern Search Row */}
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/60 flex flex-col gap-3 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0" style={{ flex: 1 }}>
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20 outline-none rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all font-medium"
              placeholder={labels.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button aria-label={language === 'ru' ? 'Фильтры' : 'Filters'} className={`w-[44px] h-[44px] shrink-0 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center transition-colors bg-white dark:bg-slate-900 relative cursor-pointer ${activeFilter !== "all" ? "text-medical-blue" : "text-slate-400"}`}>
            {activeFilter !== "all" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-medical-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 leading-none">1</div>}
            <Settings2 size={20} />
          </button>
        </div>

        {/* Categories Tab Selector */}
        <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pr-8">
          {(["all", "analysis", "study", "consultation", "ai"] as const).map(
            (tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-[14px] py-[10px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-medical-blue text-white shadow-md shadow-medical-blue/15 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            },
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-gradient-to-l from-white dark:from-slate-800 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto bg-[#F4F6FB] dark:bg-slate-900 content-area pb-[150px] relative flex flex-col">
          {filteredItems.length === 0 ? (
            <div className="m-4">
              <EmptyState
                icon={ClipboardList}
                title={labels.emptyHistory}
                description={labels.emptyHistoryDesc}
                actionLabel={t.capture_now || "Capture Now"}
                onAction={() => setActiveTab("scan")}
              />
            </div>
          ) : (
            Object.entries(filteredItems.reduce((acc: any, item) => {
              const dateObj = new Date(item.date);
              const monthYear = dateObj.toLocaleDateString(language, { month: 'long', year: 'numeric' });
              const formattedDate = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
              if (!acc[formattedDate]) acc[formattedDate] = [];
              acc[formattedDate].push(item);
              return acc;
            }, {})).map(([dateGroup, items]) => (
              <div key={dateGroup} className="flex flex-col">
                <div className="sticky top-0 z-20 bg-[#F4F6FB] dark:bg-slate-900 text-[13px] font-semibold text-[#546E7A] dark:text-slate-400 pt-6 pb-2 pl-1">
                  {dateGroup}
                </div>
                <div className="flex flex-col gap-3.5 p-4 relative">
                  {(items as any[]).map((item, index) => {
              const isExpanded = !!expandedItems[item.id];
              const isConsilium = item.type === "consilium";
              const isAIforPreceding = index < (items as any[]).length - 1 && item.type === "ai_analysis" && (items as any[])[index + 1].type === "analysis";

              // Choose styles & icon based on item type
              let badgeBg = "bg-medical-blue/10 text-medical-blue";
              let icon = <FileText size={18} />;

              if (item.type === "analysis") {
                badgeBg =
                  "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/40";
                icon = <Beaker size={18} />;
              } else if (item.type === "study") {
                badgeBg =
                  "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/40";
                icon = <FileText size={18} />;
              } else if (item.type === "consultation") {
                badgeBg =
                  "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-950/40";
                icon = <Stethoscope size={18} />;
              } else if (item.type === "consilium") {
                badgeBg =
                  "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-950/40";
                icon = <Users size={18} />;
              } else if (item.type === "ai_analysis") {
                badgeBg =
                  "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-950/40";
                icon = <Brain size={18} />;
              }

              // Safe parsing of Consilium AI board results
              let parsedConsilium: {
                conclusion?: string;
                discussion?: any[];
              } | null = null;
              if (item.type === "consilium" && item.content) {
                try {
                  parsedConsilium = JSON.parse(item.content);
                } catch (e) {
                  console.warn("Failed to parse history consilium JSON:", e);
                }
              }

              return (
                <div 
                  key={item.id} 
                  className={`card-android !p-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:border-slate-200 dark:hover:border-slate-700 overflow-hidden ${isAIforPreceding ? 'ml-4 border-l-2 !border-l-[#E8EAF6] dark:!border-l-slate-700' : ''}`}
                >
                  {/* Header Row */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 flex items-center justify-between text-left outline-none gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeBg}`}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{isConsilium ? (`${item.title} · ${new Date(item.date).toLocaleDateString(language, {day: 'numeric', month: 'short'})}`) : item.title}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                            <Calendar size={10} />
                            {new Date(item.date).toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {item.type === 'consilium' && (
                            <span className="bg-[#F3E5F5] text-[#7B1FA2] font-semibold text-[10px] px-2 py-0.5 rounded-full">
                              {t.ai_consilium || 'AI Consilium'}
                            </span>
                          )}
                          {item.type === 'ai_analysis' && (
                            <span className="bg-[#E8F4FD] text-[#0288D1] font-semibold text-[10px] px-2 py-0.5 rounded-full">
                              {t.ai_scanner || 'AI Scanner'}
                            </span>
                          )}
                          {item.type === 'analysis' && item.labs && item.labs.length > 0 && (() => {
                            const abnormalCount = item.labs.filter((l: any) => {
                              if (l.referenceRange && typeof l.value === 'number') {
                                return l.value < l.referenceRange.min || l.value > l.referenceRange.max;
                              }
                              return false;
                            }).length;
                            if (abnormalCount > 0) {
                              return (
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <AlertCircle size={10} />
                                  {language === 'ru' ? `${abnormalCount} откл.` : `${abnormalCount} flagged`}
                                </span>
                              );
                            }
                            return (
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 size={10} />
                                {language === 'ru' ? 'В норме' : 'Normal'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-slate-400 pl-1">
                      {isExpanded ? <ChevronDown size={20} className="text-medical-blue transition-transform" /> : <ChevronRight size={20} />}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-t border-slate-50 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/10"
                      >
                        <div className="p-4 space-y-4">
                          {/* LAB TABLES (For analyses) */}
                          {item.type === "analysis" && item.labs && (
                            <LabResultTable 
                              labs={item.labs} 
                              language={language} 
                              onSelectParameter={setSelectedChartParameter}
                            />
                          )}

                          {/* STUDY & CONSULTATION TEXTS (For narrative/image reports) */}
                          {(item.type === "study" ||
                            item.type === "consultation") && (
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 flex flex-col gap-3">
                              {item.doctorSpecialization && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {labels.doctorSpecialization}:
                                  </span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {item.doctorSpecialization}
                                  </span>
                                </div>
                              )}

                              {item.textValue && (
                                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100/70 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {item.textValue}
                                </div>
                              )}

                              {item.notes && (
                                <div className="flex items-start gap-1.5 text-xs text-slate-500 italic mt-1">
                                  <AlertCircle
                                    size={14}
                                    className="text-slate-400 shrink-0 mt-0.5"
                                  />
                                  <span>
                                    {labels.notes}: {item.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI CONSILIUM AND SPEAKER DISCUSSIONS */}
                          {item.type === "consilium" && parsedConsilium && (
                            <div className="space-y-4">
                              <div className="bg-gradient-to-br from-indigo-50/30 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/20 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-[0.06] pointer-events-none">
                                  <Sparkles
                                    size={72}
                                    className="text-medical-blue"
                                  />
                                </div>
                                <h5 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                  <CheckCircle2
                                    className="text-emerald-500 shrink-0"
                                    size={18}
                                  />
                                  {t.consilium_conclusion_title || "Consilium Conclusion"}
                                </h5>
                                <div className="prose prose-sm dark:prose-invert break-words text-slate-700 dark:text-slate-300 max-w-full leading-relaxed relative z-10">
                                  <ReactMarkdown>
                                    {parsedConsilium.conclusion || ""}
                                  </ReactMarkdown>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!activeMember) return;
                                    downloadReportAsPdf(
                                      "consilium",
                                      activeMember,
                                      {
                                        conclusion: parsedConsilium.conclusion,
                                        discussion:
                                          parsedConsilium.discussion || [],
                                        doctorsList: allDoctors,
                                      },
                                      language,
                                    );
                                  }}
                                  className="mt-4 w-full py-3 bg-medical-blue hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md shadow-medical-blue/10 flex items-center justify-center gap-2 relative z-10 text-xs transform active:scale-[0.98]"
                                >
                                  <FileDown size={14} />
                                  {t.download_consilium_pdf || "Download Consilium Report (PDF)"}
                                </button>
                              </div>

                              {parsedConsilium.discussion &&
                                parsedConsilium.discussion.length > 0 && (
                                  <div className="pt-2">
                                    <button
                                      onClick={(e) =>
                                        toggleDiscussion(item.id, e)
                                      }
                                      className="text-xs font-bold text-medical-blue hover:text-medical-blue/80 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      {showDiscussion[item.id] ? (
                                        <>
                                          <ChevronDown size={14} />
                                          {t.hide_discussion || "Hide discussion transcript"}
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight size={14} />
                                          {t.show_discussion || "Show discussion transcript"}
                                        </>
                                      )}
                                    </button>

                                    <AnimatePresence>
                                      {showDiscussion[item.id] && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{
                                            opacity: 1,
                                            height: "auto",
                                          }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="space-y-3 mt-3 overflow-hidden pl-2 border-l border-slate-200 dark:border-slate-700"
                                        >
                                          {parsedConsilium.discussion.map(
                                            (msg: any, idx: number) => {
                                              const doctor =
                                                allDoctors.find(
                                                  (d) => d.id === msg.doctorId,
                                                ) || allDoctors[0];
                                              return (
                                                <div
                                                  key={idx}
                                                  className="flex gap-2.5"
                                                >
                                                  <div
                                                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${doctor.bg} ${doctor.color}`}
                                                  >
                                                    <Users size={16} />
                                                  </div>
                                                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                      <h6 className="font-bold text-slate-800 dark:text-white text-xs">
                                                        {doctor.name}
                                                      </h6>
                                                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                        {doctor.spec}
                                                      </span>
                                                    </div>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                                      <ReactMarkdown>
                                                        {msg.text}
                                                      </ReactMarkdown>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

      {showManualChat && (
        <ManualEntryChat 
          onClose={() => setShowManualChat(false)}
          onSave={(data) => {
            // Check for structured diagnosis keys
            if (data.основной_диагноз || data.код_МКБ10) {
              const diagTitle = data.основной_диагноз || (t.diagnosis_without_name || 'Diagnosis without name');
              const icdStr = data.код_МКБ10 ? ` [${data.код_МКБ10}]` : '';
              const dateStr = data.дата_диагноза || new Date().toISOString().split('T')[0];

              let markdown = `### 📋 ${t.structured_diagnosis_summary || 'Structured Diagnosis Summary'}\n\n`;
              markdown += `**${t.primary_disease || 'Primary Disease'}:** ${diagTitle}\n`;
              if (data.код_МКБ10) {
                markdown += `**${t.icd10_code || 'ICD-10 Code'}:** ${data.код_МКБ10}\n`;
              }
              if (data.стадия) {
                markdown += `**${t.stage || 'Stage'}:** ${data.стадия}\n`;
              }
              if (data.степень_тяжести) {
                markdown += `**${t.severity || 'Severity'}:** ${data.степень_тяжести}\n`;
              }
              if (data.локализация) {
                markdown += `**${t.localization || 'Localization'}:** ${data.локализация}\n`;
              }

              markdown += `\n`;

              if (Array.isArray(data.сопутствующие_заболевания) && data.сопутствующие_заболевания.length > 0) {
                markdown += `#### 🩺 ${t.concomitant_diseases || 'Concomitant Diseases'}\n`;
                data.сопутствующие_заболевания.forEach((item: string) => {
                  markdown += `- ${item}\n`;
                });
                markdown += `\n`;
              }

              if (Array.isArray(data.осложнения) && data.осложнения.length > 0) {
                markdown += `#### ⚠️ ${t.complications || 'Complications'}\n`;
                data.осложнения.forEach((item: string) => {
                  markdown += `- ${item}\n`;
                });
                markdown += `\n`;
              }

              if (data.исходный_текст) {
                markdown += `***\n**${t.original_text || 'Original Text'}:**\n_${data.исходный_текст}_\n`;
              }

              addAIReport({
                id: Math.random().toString(36).substr(2, 9),
                date: dateStr,
                title: `${diagTitle}${icdStr}`,
                content: markdown,
                reportType: 'consultations'
              });

              window.dispatchEvent(new CustomEvent('scan-lab-success', { detail: data }));
              return;
            }

            const isNewFormat = !!data.document_type;
            const categoryObj = isNewFormat ? data.document_type : (data.category || 'Other');
            
            const normalizeCategoryInternal = (cat: string) => {
              if (!cat) return 'Other';
              const c = cat.toLowerCase();
              if (c.includes('consult') || c.includes('консульт') || c.includes('konsult')) return 'Consultation';
              if (c.includes('blood') || c.includes('кров')) return 'Blood';
              if (c.includes('bio') || c.includes('био')) return 'Biochemistry';
              if (c.includes('urin') || c.includes('моч') || c.includes('сеч')) return 'Urinalysis';
              if (c.includes('imag') || c.includes('рентг') || c.includes('знімк') || c.includes('obraz')) return 'Imaging';
              if (c.includes('ultrasound') || c.includes('узи') || c.includes('узд') || c.includes('usg') || c.includes('ultra')) return 'Ultrasound';
              if (c.includes('mri') || c.includes('мрт') || c.includes('rezonans')) return 'MRI';
              if (c.includes('ct') || c.includes('кт') || c.includes('tomograf')) return 'CT';
              return 'Other';
            };

            const safeCategory = normalizeCategoryInternal(categoryObj);
            const dateStr = data.document_date || new Date().toISOString().split('T')[0];

            // 1. Save individual indicators as labResults
            if (data.indicators && Array.isArray(data.indicators)) {
              data.indicators.forEach((ind: any) => {
                const paramName = ind.parameter || ind.name;
                if (paramName) {
                  addLabResult({
                    id: Math.random().toString(36).substr(2, 9),
                    date: dateStr + 'T00:00:00.000Z',
                    parameter: paramName,
                    value: ind.value !== null && ind.value !== undefined && !isNaN(Number(ind.value)) ? Number(ind.value) : 0,
                    textValue: ind.text_value || (typeof ind.value === 'string' ? ind.value : ''),
                    unit: ind.unit || '',
                    referenceRange: {
                      min: ind.reference_min !== null && ind.reference_min !== undefined ? Number(ind.reference_min) : (ind.ref_min !== null && ind.ref_min !== undefined ? Number(ind.ref_min) : 0),
                      max: ind.reference_max !== null && ind.reference_max !== undefined ? Number(ind.reference_max) : (ind.ref_max !== null && ind.ref_max !== undefined ? Number(ind.ref_max) : 0)
                    },
                    category: safeCategory as any,
                    notes: ind.status ? `Status: ${ind.status}` : `Input method: manual`,
                    doctorSpecialization: data.doctor || undefined
                  });
                }
              });
            }

            // 2. Save diagnosis / recommendations as an AI report so it is fully visible in Timeline
            let insightContent = '';
            if (data.diagnosis) {
              insightContent += `**Diagnosis:**\n${data.diagnosis}\n\n`;
            }
            if (data.recommendations) {
              insightContent += `**Recommendations:**\n${data.recommendations}\n\n`;
            }
            if (data.notes) {
              insightContent += `**Notes:**\n${data.notes}\n\n`;
            }
            
            if (insightContent) {
              addAIReport({
                id: Math.random().toString(36).substr(2, 9),
                date: dateStr,
                title: data.doctor ? `Consultation: ${data.doctor}` : (safeCategory === 'Consultation' ? 'Consultation Report' : 'Medical Report'),
                content: insightContent,
                doctorSpecialization: data.doctor || undefined,
                reportType: safeCategory === 'Consultation' ? 'consultations' : 'general'
              });
            } else if (safeCategory === 'Consultation' || data.doctor) {
              addAIReport({
                id: Math.random().toString(36).substr(2, 9),
                date: dateStr,
                title: data.doctor ? `Consultation: ${data.doctor}` : 'Consultation Report',
                content: data.notes || (language === 'ru' ? 'Консультация добавлена вручную.' : 'Consultation added manually.'),
                doctorSpecialization: data.doctor || undefined,
                reportType: 'consultations'
              });
            }

            window.dispatchEvent(new CustomEvent('scan-lab-success', { detail: data }));
          }}
        />
      )}
                                  </div>
                                )}
                            </div>
                          )}

                          {/* AI ANALYSIS (Extracted insights) */}
                          {item.type === "ai_analysis" && item.content && (
                            <div className="bg-gradient-to-br from-indigo-50/30 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/20 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-3 opacity-[0.06] pointer-events-none">
                                <Sparkles
                                  size={72}
                                  className="text-medical-blue"
                                />
                              </div>
                              <div className="prose prose-sm dark:prose-invert break-words text-slate-700 dark:text-slate-300 max-w-full leading-relaxed relative z-10 mb-4">
                                <ReactMarkdown>{item.content}</ReactMarkdown>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!activeMember) return;
                                  downloadReportAsPdf(
                                    "insight",
                                    activeMember,
                                    {
                                      insight: item.content || "",
                                      member: activeMember,
                                      labsCount: 0,
                                      symptomsCount: 0,
                                    },
                                    language,
                                  );
                                }}
                                className="w-full py-3 bg-medical-blue hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md shadow-medical-blue/10 flex items-center justify-center gap-2 relative z-10 text-xs transform active:scale-[0.98]"
                              >
                                <FileDown size={14} />
                                {isRu
                                  ? "Скачать консультацию в PDF"
                                  : "Download Consultation (PDF)"}
                              </button>
                            </div>
                          )}

                          {/* Unified record deletion bar */}
                          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-3 relative z-10">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {t.delete_record_hint || "Remove this medical record from history"}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/40 dark:border-slate-700/50 hover:border-rose-100 dark:hover:border-rose-950/40"
                            >
                              <Trash2 size={13} className="shrink-0" />
                              {t.delete_record || "Delete record"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
                </div>
              </div>
            ))
          )}
        <div className="fixed bottom-[72px] inset-x-0 mx-auto max-w-md h-[48px] bg-gradient-to-t from-[#F4F6FB] dark:from-slate-900 to-transparent pointer-events-none z-10" />
      </div>

      <div className="fixed bottom-[88px] inset-x-0 mx-auto max-w-md h-[52px] pointer-events-none z-40">
        <div 
          className="absolute right-4 w-[52px] h-[52px] bg-medical-blue rounded-2xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(61,90,254,0.4)] cursor-pointer hover:bg-blue-600 transition-colors pointer-events-auto"
          onClick={() => setShowAddSheet(true)}
        >
          <Plus size={24} />
        </div>
      </div>

      <AnimatePresence>
        {showAddSheet && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddSheet(false);
            }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-800 w-full rounded-t-3xl p-6 pb-12 flex flex-col gap-4 relative shadow-[0_-4px_24px_rgba(0,0,0,0.1)]"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2 mb-2">
                {t.add_record || 'Add Record'}
              </h3>
              
              <button onClick={() => { setShowAddSheet(false); setActiveTab("scan"); }} className="w-full flex items-center gap-3 p-4 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-medical-blue flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm">{t.scan_document || 'Scan Document'}</div>
                  <div className="text-[11px] text-slate-500">{t.scan_document_desc || 'AI extracts data from photo'}</div>
                </div>
              </button>

              <button onClick={() => { setShowAddSheet(false); document.getElementById('file-upload-history')?.click(); }} className="w-full flex items-center gap-3 p-4 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm">{t.upload_file || 'Upload File'}</div>
                  <div className="text-[11px] text-slate-500">{t.upload_file_desc || 'PDF or image from gallery'}</div>
                </div>
                <input type="file" id="file-upload-history" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                   //
                }}/>
              </button>

              <button onClick={() => { setShowAddSheet(false); setShowManualChat(true); }} className="w-full flex items-center gap-3 p-4 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm">{t.enter_manually_btn || 'Enter Manually'}</div>
                  <div className="text-[11px] text-slate-500">{t.enter_manually_desc || 'Fill the form yourself'}</div>
                </div>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            handleDeleteItem(itemToDelete);
          }
        }}
        title={t.delete_record_confirm_title || "Delete Medical Record?"}
        description={t.delete_record_confirm_desc || "Are you sure you want to delete this record from history? This data will be permanently erased."}
        confirmText={t.delete_btn || "Delete"}
        cancelText={t.cancel || "Cancel"}
      />

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
    </div>
  );
};

export default MedicalHistory;
