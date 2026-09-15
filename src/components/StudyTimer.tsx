import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, BookOpen } from 'lucide-react';
import { getTimerState, setTimerState, saveStudySession, getStudySessions, getTodayKey } from '../lib/storage';

function fmt(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const StudyTimer: React.FC = () => {
  const [elapsed, setElapsed] = useState(() => {
    const today = getTodayKey();
    const state = getTimerState();
    if (state.date === today && state.isRunning && state.startedAt !== null) {
      const extra = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
      return state.accumulated + extra;
    }
    return state.date === today ? state.accumulated : 0;
  });

  const [running, setRunning] = useState(() => {
    const today = getTodayKey();
    const state = getTimerState();
    return Boolean(state.date === today && state.isRunning && state.startedAt !== null);
  });

  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const [sessions, setSessions] = useState(() => getStudySessions());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accRef = useRef<number>(getTimerState().accumulated);
  const startRef = useRef<number | null>(getTimerState().isRunning ? getTimerState().startedAt : null);
  const currentDayRef = useRef(todayKey);

  // Synchronize state from storage
  const syncFromStorage = useCallback(() => {
    const today = getTodayKey();
    setTodayKey(today);
    currentDayRef.current = today;
    setSessions(getStudySessions());

    const state = getTimerState();
    if (state.date === today && state.isRunning && state.startedAt !== null) {
      const extra = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
      accRef.current = state.accumulated;
      startRef.current = state.startedAt;
      setElapsed(state.accumulated + extra);
      setRunning(true);
    } else {
      accRef.current = state.date === today ? state.accumulated : 0;
      startRef.current = null;
      setElapsed(accRef.current);
      setRunning(false);
    }
  }, []);

  // Rollover handler for midnight (12:00:00 AM)
  const handleMidnightRollover = useCallback((prevDay: string, nextDay: string) => {
    const now = new Date();
    // Midnight timestamp of today (00:00:00.000 local time)
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

    if (running && startRef.current !== null) {
      // Time studied before midnight belongs to prevDay
      const beforeMidnight = Math.max(0, Math.floor((midnight - startRef.current) / 1000));
      if (beforeMidnight > 0) {
        saveStudySession(prevDay, beforeMidnight);
      }

      // New day starts fresh from midnight
      startRef.current = midnight;
      accRef.current = 0;
      const sinceMidnight = Math.max(0, Math.floor((Date.now() - midnight) / 1000));
      setElapsed(sinceMidnight);
      setTimerState({
        isRunning: true,
        startedAt: midnight,
        accumulated: 0,
        date: nextDay,
      });
    } else {
      // If paused, reset today's accumulator to 0
      accRef.current = 0;
      startRef.current = null;
      setElapsed(0);
      setTimerState({
        isRunning: false,
        startedAt: null,
        accumulated: 0,
        date: nextDay,
      });
    }

    currentDayRef.current = nextDay;
    setTodayKey(nextDay);
    setSessions(getStudySessions());

    // Broadcast day change to Daily Target and Hydration
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pcm_target_updated'));
      window.dispatchEvent(new CustomEvent('pcm_water_updated'));
    }
  }, [running]);

  // External event listeners
  useEffect(() => {
    const handleExternalUpdate = () => {
      syncFromStorage();
    };

    window.addEventListener('pcm_timer_updated', handleExternalUpdate);
    return () => {
      window.removeEventListener('pcm_timer_updated', handleExternalUpdate);
    };
  }, [syncFromStorage]);

  // Main 1-second ticker + midnight rollover watcher
  useEffect(() => {
    const tick = () => {
      const nowKey = getTodayKey();

      // Check if midnight (12:00 AM) just passed
      if (nowKey !== currentDayRef.current) {
        handleMidnightRollover(currentDayRef.current, nowKey);
        return;
      }

      if (running) {
        const extra = startRef.current ? Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)) : 0;
        setElapsed(accRef.current + extra);
      }
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, handleMidnightRollover]);

  const toggle = () => {
    const today = getTodayKey();
    if (running) {
      // Pause
      const extra = startRef.current ? Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)) : 0;
      accRef.current += extra;
      startRef.current = null;
      setRunning(false);
      setTimerState({
        isRunning: false,
        startedAt: null,
        accumulated: accRef.current,
        date: today,
      });
      if (extra > 0) {
        saveStudySession(today, extra);
        setSessions(getStudySessions());
      }
    } else {
      // Start
      const now = Date.now();
      startRef.current = now;
      setRunning(true);
      setTimerState({
        isRunning: true,
        startedAt: now,
        accumulated: accRef.current,
        date: today,
      });
    }
  };

  const reset = () => {
    const today = getTodayKey();
    if (running && startRef.current) {
      const extra = Math.max(0, Math.floor((Date.now() - startRef.current) / 1000));
      if (extra > 0) {
        saveStudySession(today, extra);
        setSessions(getStudySessions());
      }
    }
    accRef.current = 0;
    startRef.current = null;
    setRunning(false);
    setElapsed(0);
    setTimerState({
      isRunning: false,
      startedAt: null,
      accumulated: 0,
      date: today,
    });
  };

  // Today's total session time
  const todayTotal = (sessions[todayKey] ?? 0) + elapsed;


  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={15} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
          Study Timer
        </span>
        {running && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 600,
            background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: 4,
          }}>● LIVE</span>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="timer-display" style={{ color: running ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
          {fmt(elapsed)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Today total: {fmt(todayTotal)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className={`btn ${running ? 'btn-danger' : 'btn-primary'}`} onClick={toggle} style={{ flex: 1 }}>
          {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Start</>}
        </button>
        <button className="btn" onClick={reset} title="Reset timer">
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
