import { useState, useEffect, useRef } from "react";
import { Medication } from "../types";

export interface MedicationAlarm {
  id: string;
  medication: Medication;
  time: string;
  level: 1 | 2 | 3;
}

export interface InAppAlert {
  id: string;
  name: string;
  time: string;
  med: Medication;
}

export const useMedicationReminders = (medications: Medication[]) => {
  const [inAppAlerts, setInAppAlerts] = useState<InAppAlert[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<MedicationAlarm | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentHHMM = `${hours}:${minutes}`;

      const activeMeds = medications.filter(
        (m) => !m.endDate || new Date(m.endDate) >= now,
      );

      activeMeds.forEach((med) => {
        if (med.reminders?.includes(currentHHMM)) {
          const notifId = `${med.id}-${currentHHMM}-${now.toDateString()}`;
          if (!triggeredRef.current.has(notifId)) {
            triggeredRef.current.add(notifId);

            const isCritical = med.importance === "critical";
            const isImportant = med.importance === "important" || isCritical;
            const level = isCritical ? 3 : isImportant ? 2 : 1;

            // Full screen alarm for critical/important meds
            const alarm: MedicationAlarm = {
              id: notifId,
              medication: med,
              time: currentHHMM,
              level,
            };
            setActiveAlarm(alarm);

            if ("vibrate" in navigator && navigator.vibrate) {
              if (isCritical) {
                navigator.vibrate([1000, 500, 1000, 500, 1000]); // SOS pattern
              } else if (isImportant) {
                navigator.vibrate([500, 200, 500]);
              } else {
                navigator.vibrate([200]);
              }
            }

            if ("speechSynthesis" in window && isImportant) {
              const utterance = new SpeechSynthesisUtterance(
                `It is time to take ${med.name}`,
              );
              window.speechSynthesis.speak(utterance);
            }

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const title = isCritical
                ? `CRITICAL: ${med.name}`
                : isImportant
                  ? `IMPORTANT: ${med.name}`
                  : `Reminder: ${med.name}`;
              const notifyOptions: NotificationOptions = {
                body: `It is time to take your medication: ${med.dosage || ""}`,
                requireInteraction: isCritical,
                icon: "/favicon.svg",
              };

              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.ready
                  .then((registration) => {
                    registration.showNotification(title, notifyOptions);
                  })
                  .catch(() => {
                    new Notification(title, notifyOptions);
                  });
              } else {
                new Notification(title, notifyOptions);
              }
            }

            setInAppAlerts((prev) => [
              ...prev,
              { id: notifId, name: med.name, time: currentHHMM, med },
            ]);
          }
        }
      });
    }, 1000 * 30); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [medications]);

  const removeAlert = (id: string) => {
    setInAppAlerts((prev) => prev.filter((a) => a.id !== id));
    if (activeAlarm?.id === id) setActiveAlarm(null);
  };

  return { inAppAlerts, removeAlert, activeAlarm, setActiveAlarm };
};
