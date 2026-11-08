import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  ClipboardList,
  Users,
  Activity,
  Settings,
  Camera,
  Bell,
  Pill,
  X,
  Calendar,
  Search,
  KeyRound,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HealthProvider, useHealth } from "./HealthContext";
import Dashboard from "./views/Dashboard";
import { useMedicationReminders } from "./hooks/useMedicationReminders";
import { MedicationAlarmModal } from "./components/MedicationAlarmModal";
import { LoadingFallback } from "./components/LoadingFallback";

const LoginSelectionView = React.lazy(() => import("./views/LoginSelectionView"));
const Timeline = React.lazy(() => import("./views/Timeline"));
const FamilyProfiles = React.lazy(() => import("./views/FamilyProfiles"));
const Insights = React.lazy(() => import("./views/Insights"));
const SymptomsDiary = React.lazy(() => import("./views/SymptomsDiary"));
const SettingsView = React.lazy(() => import("./views/Settings"));
const Medications = React.lazy(() => import("./views/Medications"));
const ScanLab = React.lazy(() => import("./views/ScanLab"));
const ConsiliumView = React.lazy(() => import("./views/ConsiliumView"));
const MedicalHistory = React.lazy(() => import("./views/MedicalHistory"));

const AppContent = () => {
  const {
    members,
    activeMember,
    activeMemberId,
    setActiveMemberId,
    t,
    activeTab,
    setActiveTab,
    previousTab,
    setShowAddLabModal,
    medications,
    language,
  } = useHealth();
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const { inAppAlerts, removeAlert, activeAlarm, setActiveAlarm } =
    useMedicationReminders(medications);
  const { addMedicationLog, updateMedication } = useHealth();

  const handleAction = (
    alarmId: string,
    status: "taken" | "skipped" | "snoozed" | "partial",
    medId: string,
    scheduledTime?: string,
  ) => {
    if (typeof window !== "undefined" && "vibrate" in navigator && status === "taken") {
      try { navigator.vibrate(50); } catch (_) {}
    }
    const log = {
      id: Date.now().toString(),
      medicationId: medId,
      memberId: activeMemberId as string,
      date: new Date().toISOString().split("T")[0],
      time: `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
      status,
      notes: scheduledTime ? `scheduled:${scheduledTime}` : undefined,
    };
    addMedicationLog(log);
    removeAlert(alarmId);
    setActiveAlarm(null);

    if (status === "taken" || status === "partial") {
      const med = medications.find((m) => m.id === medId);
      if (med && med.inventory && med.inventory > 0) {
        updateMedication({
          ...med,
          inventory: med.inventory - (status === "partial" ? 0.5 : 1),
        });
      }
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard />;
      case "labs":
        return <Timeline filter="labs" />;
      case "studies":
        return <Timeline filter="studies" />;
      case "consultations":
        return <Timeline filter="consultations" />;
      case "family":
        return <FamilyProfiles />;
      case "medications":
        return <Medications />;
      case "insights":
        return <Insights />;
      case "consilium":
        return <ConsiliumView />;
      case "settings":
        return <SettingsView />;
      case "scan":
        return <ScanLab />;
      case "diary":
        return <SymptomsDiary />;
      case "history":
        return <MedicalHistory />;
      default:
        return <Dashboard />;
    }
  };

  if (showLogin) {
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <LoginSelectionView onContinue={() => setShowLogin(false)} />
      </React.Suspense>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden bg-medical-bg">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-600 dark:bg-amber-700 text-white text-[11px] font-semibold px-3 py-1.5 flex items-center justify-center gap-1.5 z-30 shadow-sm text-center select-none"
          >
            <WifiOff size={13} className="shrink-0" />
            <span>
              {language === "ru"
                ? "Офлайн-режим: медкарта доступна на устройстве. AI возобновится при сети."
                : "Offline mode: health record is available locally. AI will resume online."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className="p-4 flex items-center justify-between bg-white/80 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-20 border-b border-transparent dark:border-slate-800"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          setShowMemberPicker(false);
          setShowNotifications(false);
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMemberPicker(!showMemberPicker);
            }}
            aria-label={language === "ru" ? "Выбрать профиль" : "Select profile"}
            className="w-10 h-10 min-w-[40px] min-h-[40px] relative cursor-pointer outline-none"
          >
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
              {activeMember?.avatar ? (
                activeMember.avatar.startsWith("preset:") ? (
                  (() => {
                    const parts = activeMember.avatar.split(":");
                    const gradient = parts[1] || "from-cyan-400 to-blue-500";
                    const icon = parts[2] || "🧑";
                    return (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xl select-none`}>
                        {icon}
                      </div>
                    );
                  })()
                ) : (
                  <img
                    src={activeMember.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full bg-[#E8EAF6] dark:bg-slate-800 text-medical-blue dark:text-blue-400 flex items-center justify-center font-bold text-base select-none">
                  {activeMember?.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100 leading-tight">
              {t.welcome}, {activeMember?.name?.split(" ")[0]}
            </h1>
          </div>
        </div>
        <div className="flex gap-2 z-50">
          <button
            onClick={() => setActiveTab("settings")}
            aria-label={language === "ru" ? "Настройки" : "Settings"}
            className="w-[44px] h-[44px] p-[10px] text-slate-400 dark:text-slate-500 hover:text-medical-blue dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors rounded-full flex items-center justify-center"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={language === "ru" ? "Уведомления" : "Notifications"}
            className="w-[44px] h-[44px] p-[10px] text-slate-400 dark:text-slate-500 hover:text-medical-blue dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors rounded-full relative flex items-center justify-center"
          >
            <Bell size={20} />
            {inAppAlerts.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 bg-medical-red rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* In-App Alerts Overlay */}
      <div className="absolute top-20 left-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {inAppAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border-l-4 border-l-purple-500 rounded-xl shadow-lg dark:shadow-black/40 p-4 pointer-events-auto flex items-start gap-3"
            >
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950/40 text-purple-500 dark:text-purple-400 rounded-full flex items-center justify-center shrink-0">
                <Bell size={16} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {language === "ru" ? `Время принять ${alert.name}` : `Time for ${alert.name}`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === "ru" ? `Запланировано на ${alert.time}` : `Scheduled for ${alert.time}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAction(alert.id, "taken", alert.med.id, alert.time)}
                title={language === "ru" ? "Принять препарат" : "Take medication"}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
              >
                <CheckCircle2 size={14} />
                <span>{language === "ru" ? "Принять" : "Take"}</span>
              </button>
              <button
                onClick={() => removeAlert(alert.id)}
                aria-label={language === "ru" ? "Закрыть уведомление" : "Close notification"}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Member Picker Overlay */}
      <AnimatePresence>
        {showMemberPicker && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-black/40 border border-slate-100 dark:border-slate-700 p-4 z-30"
          >
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">
              {t.family_mgt}
            </h3>
            <div className="flex flex-col gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMemberId(member.id);
                    setShowMemberPicker(false);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${activeMember?.id === member.id ? "bg-medical-blue/10 dark:bg-medical-blue/20 text-medical-blue dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden select-none">
                    {member.avatar ? (
                      member.avatar.startsWith("preset:") ? (
                        (() => {
                          const parts = member.avatar.split(":");
                          const gradient = parts[1] || "from-cyan-400 to-blue-500";
                          const icon = parts[2] || "🧑";
                          return (
                            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-base select-none`}>
                              {icon}
                            </div>
                          );
                        })()
                      ) : (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                        {member.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-sm">{member.name}</span>
                </button>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab("family");
                    setShowMemberPicker(false);
                  }}
                  className="w-full py-1.5 flex items-center gap-2 justify-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-medical-blue dark:hover:text-blue-400 transition-colors"
                >
                  <Settings size={14} />{" "}
                  {language === "ru" ? "Управление профилями" : "Manage Family"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowLogin(true);
                    setShowMemberPicker(false);
                  }}
                  className="w-full py-1.5 flex items-center gap-2 justify-center text-xs font-extrabold text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                >
                  <KeyRound size={14} />{" "}
                  {language === "ru"
                    ? "Сменить профиль (Вход)"
                    : "Switch Profile (Login)"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-4 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                {language === "ru"
                  ? "Уведомления"
                  : t.notifications || "Notifications"}
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                aria-label={language === "ru" ? "Закрыть уведомления" : "Close notifications"}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto min-h-[100px] justify-center">
              {inAppAlerts.length > 0 ? (
                inAppAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-slate-50 dark:bg-slate-900 border-l-2 border-medical-blue rounded-lg p-3 flex gap-3 shadow-sm"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {alert.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {alert.time}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleAction(alert.id, "taken", alert.med.id, alert.time)
                      }
                      className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-sm"
                      type="button"
                      title={language === "ru" ? "Принять препарат" : "Take medication"}
                    >
                      <CheckCircle2 size={13} />
                      <span>{language === "ru" ? "Принять" : "Take"}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
                  <Bell size={24} className="mx-auto mb-2 opacity-50" />
                  {language === "ru"
                    ? "Нет новых уведомлений"
                    : t.no_notifications || "No new notifications"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Alarm Overlay */}
      <MedicationAlarmModal
        activeAlarm={activeAlarm}
        language={language}
        onAction={handleAction}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 ${activeTab === "scan" ? "overflow-hidden flex flex-col pb-[64px]" : "overflow-y-auto pb-24"}`}
        onClick={() => {
          setShowMemberPicker(false);
          setShowNotifications(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={activeTab === "scan" ? "flex-1 h-full flex flex-col" : ""}
          >
            <React.Suspense fallback={<LoadingFallback />}>
              {renderView()}
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 h-[64px] shadow-[0_-1px_0_#E5E7EB] dark:shadow-[0_-1px_0_#1e293b] px-6 flex justify-around items-center z-20 border-t border-transparent dark:border-slate-800">
        <NavButton
          active={activeTab === "home"}
          subtleActive={activeTab === "settings" && previousTab === "home"}
          onClick={() => setActiveTab("home")}
          icon={<Home size={24} />}
          label={t.home}
          tabId="home"
        />
        <NavButton
          active={activeTab === "scan"}
          subtleActive={activeTab === "settings" && previousTab === "scan"}
          onClick={() => setActiveTab("scan")}
          icon={<Camera size={24} />}
          label={language === "ru" ? "Сканер анализов" : t.scanner}
        />
        <NavButton
          active={activeTab === "history"}
          subtleActive={activeTab === "settings" && previousTab === "history"}
          onClick={() => setActiveTab("history")}
          icon={<ClipboardList size={24} />}
          label={language === "ru" ? "История" : "History"}
        />
        <NavButton
          active={activeTab === "medications"}
          subtleActive={activeTab === "settings" && previousTab === "medications"}
          onClick={() => setActiveTab("medications")}
          icon={<Pill size={24} />}
          label={t.medications}
        />
      </nav>
    </div>
  );
};

const NavButton = ({
  active,
  subtleActive,
  onClick,
  icon,
  label,
  tabId,
}: {
  active: boolean;
  subtleActive?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tabId?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center relative min-w-[64px] h-full ${active ? "text-medical-blue dark:text-blue-400" : subtleActive ? "text-medical-blue/40 dark:text-blue-400/40" : "text-slate-400 dark:text-slate-500"} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
  >
    {icon}
    <span className="text-[10px] font-semibold tracking-wide mt-1">{label}</span>
    {active && tabId === "home" && (
      <div className="absolute bottom-2 w-1 h-1 bg-medical-blue rounded-full" />
    )}
  </button>
);

export default function App() {
  return (
    <HealthProvider>
      <AppContent />
    </HealthProvider>
  );
}
