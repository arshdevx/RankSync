import { useEffect, useRef, useCallback } from 'react';
import type { ReminderConfig } from '../lib/notifications';
import {
  playChime,
  sendNotification,
  requestNotificationPermission,
} from '../lib/notifications';

const WATER_MESSAGES = [
  '💧 Paani pi bhai! Hydrated reh.',
  '💧 Water break! Board prep thakawat deti hai, paani lete reh.',
  '💧 30 second ka paani break — deserve karta hai tu.',
  '💧 Ek glass paani — brain performance 10% up hoti hai. Sach mein.',
  '💧 Hydration check! Paani pi, phir back to grinding.',
];

const REVISION_MESSAGES = [
  '📖 Revision time! Ek chapter quick revise kar — 10 minutes.',
  '📖 Weak chapters dekh dashboard pe — unhe thoda time de ab.',
  '📖 Spaced repetition magic: abhi ek chapter revise kar.',
  '📖 Revision break — jo padha hai usse pukka kar.',
  '📖 15 min revision > 1 ghante passive reading. Ab karo.',
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useReminders(config: ReminderConfig) {
  const waterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revisionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const fireWater = useCallback(async () => {
    const cfg = configRef.current;
    if (!cfg.waterEnabled) return;
    const granted = await requestNotificationPermission();
    if (granted) {
      sendNotification('Hydration Break', getRandom(WATER_MESSAGES));
    }
    if (cfg.waterSound) playChime('water');
    if (typeof window !== 'undefined' && window.electronAPI?.showWaterOverlay) {
      window.electronAPI.showWaterOverlay().catch(() => {});
    }
  }, []);

  const fireRevision = useCallback(async () => {
    const cfg = configRef.current;
    if (!cfg.revisionEnabled) return;
    const granted = await requestNotificationPermission();
    if (granted) {
      sendNotification('📖 Revision Reminder', getRandom(REVISION_MESSAGES));
    }
    if (cfg.revisionSound) playChime('revision');
  }, []);

  // Water timer
  useEffect(() => {
    if (waterRef.current) clearInterval(waterRef.current);
    if (config.waterEnabled) {
      waterRef.current = setInterval(fireWater, config.waterIntervalMin * 60 * 1000);
    }
    return () => { if (waterRef.current) clearInterval(waterRef.current); };
  }, [config.waterEnabled, config.waterIntervalMin, fireWater]);

  // Revision timer
  useEffect(() => {
    if (revisionRef.current) clearInterval(revisionRef.current);
    if (config.revisionEnabled) {
      revisionRef.current = setInterval(fireRevision, config.revisionIntervalMin * 60 * 1000);
    }
    return () => { if (revisionRef.current) clearInterval(revisionRef.current); };
  }, [config.revisionEnabled, config.revisionIntervalMin, fireRevision]);

  return { fireWater, fireRevision };
}
