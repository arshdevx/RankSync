import { getAppConfig } from './config';
import type { ChapterData } from '../data/syllabus';

export interface ChapterProgress {
  id: string;
  is_completed: boolean;
  completed_at: string | null;
  syllabus_done: boolean;
  questions_done: boolean;
  test_done: boolean;
  revision_done: boolean;
  test_score_obtained: number | null;
  test_score_total: number | null;
  is_weak: boolean;
  notes: string;
  weak_points: string;
}

export interface StudySession {
  date: string;
  duration_seconds: number;
}

export interface CompletionHistoryEntry {
  chapterId: string;
  timestamp: string;
}

export interface DailyTargetItem {
  chapterId: string;
  done: boolean;
}

export interface DailyTarget {
  date: string; // YYYY-MM-DD
  targetChaptersCount: number;
  targetQuestionsCount: number;
  targetStudyMinutes: number;
  selectedChapters: DailyTargetItem[];
  completedQuestionsCount: number;
  isPinned: boolean;
}

const TIMER_KEY = 'pcm_tracker_timer';
const HISTORY_KEY = 'pcm_tracker_completion_history';
const DAILY_TARGET_KEY = 'pcm_tracker_daily_target';
const CUSTOM_CHAPTERS_PREFIX = 'pcm_tracker_custom_chapters_';

export function getStorageKey(preset?: string): string {
  const p = preset || getAppConfig().gradePreset || 'cbse-12-pcm';
  if (p === 'cbse-12-pcm') return 'pcm_tracker_progress';
  return `pcm_tracker_progress_${p}`;
}

function loadAll(): Record<string, ChapterProgress> {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, ChapterProgress>): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
  if (typeof window !== 'undefined' && window.electronAPI?.saveLocalBackup) {
    window.electronAPI.saveLocalBackup(exportData()).catch(() => {});
  }
}

// ─── Custom Chapters CRUD ───────────────────────────────────────────────────

export function getCustomChapters(preset?: string): ChapterData[] {
  try {
    const p = preset || getAppConfig().gradePreset || 'cbse-12-pcm';
    const raw = localStorage.getItem(`${CUSTOM_CHAPTERS_PREFIX}${p}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomChapter(chapter: ChapterData, preset?: string): void {
  const p = preset || getAppConfig().gradePreset || 'cbse-12-pcm';
  const current = getCustomChapters(p);
  const exists = current.findIndex(c => c.id === chapter.id);
  let next: ChapterData[];
  if (exists >= 0) {
    next = [...current];
    next[exists] = chapter;
  } else {
    next = [...current, chapter];
  }
  localStorage.setItem(`${CUSTOM_CHAPTERS_PREFIX}${p}`, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_syllabus_updated', { detail: next }));
  }
}

export function deleteCustomChapter(chapterId: string, preset?: string): void {
  const p = preset || getAppConfig().gradePreset || 'cbse-12-pcm';
  const current = getCustomChapters(p);
  const next = current.filter(c => c.id !== chapterId);
  localStorage.setItem(`${CUSTOM_CHAPTERS_PREFIX}${p}`, JSON.stringify(next));
  // Also clean up its progress
  const progress = getAllProgress();
  if (progress[chapterId]) {
    delete progress[chapterId];
    saveAll(progress);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_syllabus_updated', { detail: next }));
    window.dispatchEvent(new CustomEvent('pcm_progress_updated'));
  }
}

export function getProgress(chapterId: string): ChapterProgress {
  const all = loadAll();
  const raw = all[chapterId];
  if (!raw) {
    return {
      id: chapterId,
      is_completed: false,
      completed_at: null,
      syllabus_done: false,
      questions_done: false,
      test_done: false,
      revision_done: false,
      test_score_obtained: null,
      test_score_total: null,
      is_weak: false,
      notes: '',
      weak_points: '',
    };
  }

  // Backwards compatibility migration if is_completed didn't exist
  const isAllTasksDone = raw.syllabus_done && raw.questions_done && raw.test_done && raw.revision_done;
  const isCompleted = typeof raw.is_completed === 'boolean' ? raw.is_completed : isAllTasksDone;

  return {
    ...raw,
    is_completed: isCompleted,
    completed_at: raw.completed_at ?? (isCompleted ? new Date().toISOString() : null),
    notes: raw.notes ?? '',
    weak_points: raw.weak_points ?? '',
  };
}

export function getAllProgress(): Record<string, ChapterProgress> {
  const all = loadAll();
  const result: Record<string, ChapterProgress> = {};
  for (const id in all) {
    result[id] = getProgress(id);
  }
  return result;
}

export function getCompletionHistory(): CompletionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordCompletionHistory(chapterId: string, isDone: boolean): void {
  const history = getCompletionHistory();
  if (isDone) {
    // Avoid exact duplicate on same day
    const nowIso = new Date().toISOString();
    history.push({ chapterId, timestamp: nowIso });
  } else {
    // Remove last completion entry for this chapter
    const idx = history.map(h => h.chapterId).lastIndexOf(chapterId);
    if (idx !== -1) history.splice(idx, 1);
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function setProgress(chapterId: string, updates: Partial<ChapterProgress>): void {
  const all = loadAll();
  const current = getProgress(chapterId);
  const merged: ChapterProgress = { ...current, ...updates };

  // If subtasks are all explicitly checked and is_completed wasn't explicitly passed, auto-complete
  const allTasksDone = merged.syllabus_done && merged.questions_done && merged.test_done && merged.revision_done;
  if (updates.is_completed === undefined && allTasksDone && !current.is_completed) {
    merged.is_completed = true;
  }

  // Handle timestamp and completion history
  if (merged.is_completed !== current.is_completed) {
    if (merged.is_completed) {
      merged.completed_at = new Date().toISOString();
      recordCompletionHistory(chapterId, true);
    } else {
      merged.completed_at = null;
      recordCompletionHistory(chapterId, false);
    }
    // Sync with today's target if present
    syncTargetWithChapter(chapterId, merged.is_completed);
  }

  // Auto-detect weak chapter: score < 50%
  if (merged.test_score_obtained !== null && merged.test_score_total !== null && merged.test_score_total > 0) {
    merged.is_weak = merged.test_score_obtained / merged.test_score_total < 0.5;
  }

  all[chapterId] = merged;
  saveAll(all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_progress_updated', { detail: { chapterId, progress: merged } }));
  }
}

// ─── Daily Target Model & Sync ────────────────────────────────────────────────

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayTarget(): DailyTarget {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(`${DAILY_TARGET_KEY}_${today}`);
    if (raw) {
      const parsed: DailyTarget = JSON.parse(raw);
      // Ensure sync with current progress states
      const allProg = getAllProgress();
      parsed.selectedChapters = (parsed.selectedChapters || []).map(sc => ({
        ...sc,
        done: allProg[sc.chapterId]?.is_completed ?? sc.done,
      }));
      return parsed;
    }
  } catch {}

  return {
    date: today,
    targetChaptersCount: 2,
    targetQuestionsCount: 40,
    targetStudyMinutes: 180, // 3 hours
    selectedChapters: [],
    completedQuestionsCount: 0,
    isPinned: true,
  };
}

export function saveTodayTarget(target: DailyTarget): void {
  const today = target.date || getTodayKey();
  localStorage.setItem(`${DAILY_TARGET_KEY}_${today}`, JSON.stringify(target));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_target_updated', { detail: target }));
  }
}

export function updateTodayTarget(patch: Partial<DailyTarget>): DailyTarget {
  const current = getTodayTarget();
  const next = { ...current, ...patch };
  saveTodayTarget(next);
  return next;
}

function syncTargetWithChapter(chapterId: string, isDone: boolean): void {
  const target = getTodayTarget();
  let changed = false;
  const updatedChapters = target.selectedChapters.map(sc => {
    if (sc.chapterId === chapterId && sc.done !== isDone) {
      changed = true;
      return { ...sc, done: isDone };
    }
    return sc;
  });

  if (changed) {
    target.selectedChapters = updatedChapters;
    saveTodayTarget(target);
  }
}

// ─── Study Sessions & Timer ──────────────────────────────────────────────────

export interface TimerState {
  isRunning: boolean;
  startedAt: number | null;
  accumulated: number; // seconds already accumulated today
  date: string; // YYYY-MM-DD
}

export function getTimerState(): TimerState {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) {
      return { isRunning: false, startedAt: null, accumulated: 0, date: today };
    }
    const parsed: Partial<TimerState> = JSON.parse(raw);

    // If already dated for today, return with sanitized fields
    if (parsed.date === today) {
      return {
        isRunning: Boolean(parsed.isRunning),
        startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
        accumulated: typeof parsed.accumulated === 'number' ? Math.max(0, parsed.accumulated) : 0,
        date: today,
      };
    }

    // Rollover: If previously running across days while app was closed or unattended,
    // safely credit the pre-midnight portion to the previous date (capped at 4h)
    if (parsed.date && parsed.date !== today && parsed.isRunning && parsed.startedAt) {
      const parts = parsed.date.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const endOfDay = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
        const duration = Math.max(0, Math.floor((endOfDay - parsed.startedAt) / 1000));
        const capped = Math.min(14400, duration);
        if (capped > 0) {
          saveStudySession(parsed.date, capped);
        }
      }
    }

    // Reset clean initial state for today
    const fresh: TimerState = { isRunning: false, startedAt: null, accumulated: 0, date: today };
    localStorage.setItem(TIMER_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return { isRunning: false, startedAt: null, accumulated: 0, date: today };
  }
}

export function setTimerState(state: Partial<TimerState>): void {
  const today = getTodayKey();
  const next: TimerState = {
    isRunning: Boolean(state.isRunning),
    startedAt: state.startedAt ?? null,
    accumulated: Math.max(0, state.accumulated ?? 0),
    date: state.date || today,
  };
  localStorage.setItem(TIMER_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_timer_updated', { detail: next }));
  }
}

export function getStudySessions(): Record<string, number> {
  try {
    const raw = localStorage.getItem('pcm_tracker_sessions');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStudySession(date: string, seconds: number): void {
  const sessions = getStudySessions();
  sessions[date] = (sessions[date] ?? 0) + seconds;
  localStorage.setItem('pcm_tracker_sessions', JSON.stringify(sessions));
}

export function getTodayStudyDurationSeconds(): number {
  const sessions = getStudySessions();
  const todayKey = getTodayKey();
  const timer = getTimerState();
  if (timer.date !== todayKey) {
    return sessions[todayKey] ?? 0;
  }
  const liveExtra = timer.isRunning && timer.startedAt ? Math.max(0, Math.floor((Date.now() - timer.startedAt) / 1000)) : 0;
  return (sessions[todayKey] ?? 0) + (timer.accumulated || 0) + liveExtra;
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export function exportData(): string {
  const progress = loadAll();
  const sessions = getStudySessions();
  const history = getCompletionHistory();
  const target = getTodayTarget();
  return JSON.stringify({
    progress,
    sessions,
    history,
    target,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.progress) {
      saveAll(parsed.progress);
    }
    if (parsed.sessions) {
      localStorage.setItem('pcm_tracker_sessions', JSON.stringify(parsed.sessions));
    }
    if (parsed.history) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(parsed.history));
    }
    if (parsed.target) {
      localStorage.setItem(`${DAILY_TARGET_KEY}_${getTodayKey()}`, JSON.stringify(parsed.target));
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Hydration / Water Intake ────────────────────────────────────────────────

const WATER_KEY = 'pcm_tracker_water_v1';

export interface DailyWaterLog {
  date: string;
  glasses: number;
  goal: number;
}

export function getTodayWater(): DailyWaterLog {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(WATER_KEY);
    if (!raw) return { date: today, glasses: 0, goal: 8 };
    const parsed = JSON.parse(raw);
    if (parsed.date === today) {
      return { date: today, glasses: parsed.glasses || 0, goal: parsed.goal || 8 };
    }
    return { date: today, glasses: 0, goal: parsed.goal || 8 };
  } catch {
    return { date: today, glasses: 0, goal: 8 };
  }
}

export function logWaterGlass(delta: number = 1): DailyWaterLog {
  const current = getTodayWater();
  const next = { ...current, glasses: Math.max(0, current.glasses + delta) };
  localStorage.setItem(WATER_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_water_updated', { detail: next }));
  }
  if (typeof window !== 'undefined' && window.electronAPI?.logWaterFromOverlay) {
    window.electronAPI.logWaterFromOverlay(next.glasses).catch(() => {});
  }
  return next;
}

export function setWaterGoal(goal: number): DailyWaterLog {
  const current = getTodayWater();
  const next = { ...current, goal: Math.max(1, goal) };
  localStorage.setItem(WATER_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_water_updated', { detail: next }));
  }
  return next;
}
