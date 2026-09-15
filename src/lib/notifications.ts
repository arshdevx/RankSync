// Notification permission request
export async function requestNotificationPermission(): Promise<boolean> {
  if (window.electronAPI?.isElectron) return true;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string) {
  if (window.electronAPI?.showNativeNotification) {
    window.electronAPI.showNativeNotification(title, body);
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: title, // prevent duplicate stacking
    requireInteraction: false,
  });
}

// ─── Web Audio Chime ────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export type SoundType = 'water' | 'revision' | 'gentle';

export function playChime(type: SoundType = 'gentle') {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    if (type === 'water') {
      // Bubbly, rising arpeggio: D4 → F#4 → A4 → D5
      playNote(ctx, 293.66, now, 0.3);
      playNote(ctx, 369.99, now + 0.18, 0.3);
      playNote(ctx, 440.0, now + 0.36, 0.3);
      playNote(ctx, 587.33, now + 0.54, 0.45, 'sine');
    } else if (type === 'revision') {
      // Focused, steady double-bell: E4 → E5
      playNote(ctx, 329.63, now, 0.35, 'triangle');
      playNote(ctx, 659.25, now + 0.25, 0.5, 'triangle');
      playNote(ctx, 329.63, now + 0.7, 0.3, 'triangle');
    } else {
      // Gentle single soft bell
      playNote(ctx, 528, now, 0.6, 'sine');
    }
  } catch {
    // Audio context blocked — ignore silently
  }
}

function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  // Envelope: quick attack, smooth decay
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// ─── Reminder Settings ───────────────────────────────────────────────────────
export interface ReminderConfig {
  waterEnabled: boolean;
  waterIntervalMin: number; // minutes
  waterSound: boolean;
  revisionEnabled: boolean;
  revisionIntervalMin: number; // minutes
  revisionSound: boolean;
}

const REMINDER_KEY = 'pcm_reminders';

export function loadReminderConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          waterEnabled: false,
          waterIntervalMin: 30,
          waterSound: true,
          revisionEnabled: false,
          revisionIntervalMin: 60,
          revisionSound: true,
        };
  } catch {
    return {
      waterEnabled: false,
      waterIntervalMin: 30,
      waterSound: true,
      revisionEnabled: false,
      revisionIntervalMin: 60,
      revisionSound: true,
    };
  }
}

export function saveReminderConfig(cfg: ReminderConfig) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(cfg));
}
