import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pill } from "lucide-react";
import { MedicationAlarm } from "../hooks/useMedicationReminders";

interface MedicationAlarmModalProps {
  activeAlarm: MedicationAlarm | null;
  language: string;
  onAction: (
    alarmId: string,
    status: "taken" | "skipped" | "partial" | "snoozed",
    medId: string
  ) => void;
}

export const MedicationAlarmModal: React.FC<MedicationAlarmModalProps> = ({
  activeAlarm,
  language,
  onAction,
}) => {
  return (
    <AnimatePresence>
      {activeAlarm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] bg-red-600/95 flex flex-col items-center justify-center p-6 text-white backdrop-blur-md"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6"
          >
            <Pill size={48} className="text-white" />
          </motion.div>
          <h2 className="text-4xl font-black mb-2 animate-pulse text-center">
            {activeAlarm.medication.name}
          </h2>
          <p className="text-xl font-medium mb-8 opacity-90">
            {activeAlarm.medication.dosage}
          </p>

          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() =>
                onAction(
                  activeAlarm.id,
                  "taken",
                  activeAlarm.medication.id
                )
              }
              className="w-full bg-white text-red-600 text-xl font-bold py-5 rounded-2xl shadow-xl hover:bg-slate-100 transition-colors cursor-pointer"
              type="button"
            >
              {language === "ru" ? "Принял(а)" : "Taken"}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  onAction(
                    activeAlarm.id,
                    "partial",
                    activeAlarm.medication.id
                  )
                }
                className="bg-red-700/50 hover:bg-red-700 border border-white/20 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                type="button"
              >
                {language === "ru" ? "Частично" : "Partial"}
              </button>
              <button
                onClick={() =>
                  onAction(
                    activeAlarm.id,
                    "snoozed",
                    activeAlarm.medication.id
                  )
                }
                className="bg-red-700/50 hover:bg-red-700 border border-white/20 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                type="button"
              >
                {language === "ru" ? "Отложить" : "Snooze 10m"}
              </button>
            </div>

            <button
              onClick={() =>
                onAction(
                  activeAlarm.id,
                  "skipped",
                  activeAlarm.medication.id
                )
              }
              className="w-full bg-transparent text-white/50 py-3 rounded-xl hover:text-white/80 transition-colors text-sm mt-4 uppercase tracking-widest font-bold cursor-pointer"
              type="button"
            >
              {language === "ru" ? "Пропустить" : "Skip"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
