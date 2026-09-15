import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Edit3, Plus, ArrowRight, Zap, X } from 'lucide-react';
import { SYLLABUS, SUBJECTS } from '../data/syllabus';
import type { Subject } from '../data/syllabus';
import {
  getTodayTarget,
  saveTodayTarget,
  getTodayStudyDurationSeconds,
} from '../lib/storage';
import type { DailyTarget } from '../lib/storage';
import type { NextBestAction } from '../lib/stats';

interface TodayTargetCardProps {
  onToggleChapter: (chapterId: string, isCompleted: boolean) => void;
  onNavigateToSubject: (subject: Subject) => void;
  nextBestAction: NextBestAction | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const TodayTargetCard: React.FC<TodayTargetCardProps> = ({
  onToggleChapter,
  onNavigateToSubject,
  nextBestAction,
}) => {
  const [target, setTarget] = useState<DailyTarget>(() => getTodayTarget());
  const [isEditing, setIsEditing] = useState(false);
  const [studySeconds, setStudySeconds] = useState(() => getTodayStudyDurationSeconds());

  // Form state for editing target
  const [editChaptersCount, setEditChaptersCount] = useState(target.targetChaptersCount);
  const [editQuestionsCount, setEditQuestionsCount] = useState(target.targetQuestionsCount);
  const [editStudyMinutes, setEditStudyMinutes] = useState(target.targetStudyMinutes);
  const [editSelectedIds, setEditSelectedIds] = useState<string[]>(
    target.selectedChapters.map(sc => sc.chapterId)
  );

  // Sync study timer live every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setStudySeconds(getTodayStudyDurationSeconds());
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Listen for target and timer updates
  useEffect(() => {
    const handleUpdated = () => {
      setTarget(getTodayTarget());
      setStudySeconds(getTodayStudyDurationSeconds());
    };
    window.addEventListener('pcm_target_updated', handleUpdated);
    window.addEventListener('pcm_timer_updated', handleUpdated);
    window.addEventListener('pcm_progress_updated', handleUpdated);
    return () => {
      window.removeEventListener('pcm_target_updated', handleUpdated);
      window.removeEventListener('pcm_timer_updated', handleUpdated);
      window.removeEventListener('pcm_progress_updated', handleUpdated);
    };
  }, []);

  const handleToggleItem = (chapterId: string) => {
    const item = target.selectedChapters.find(sc => sc.chapterId === chapterId);
    const newDone = !item?.done;

    const updated = {
      ...target,
      selectedChapters: target.selectedChapters.map(sc =>
        sc.chapterId === chapterId ? { ...sc, done: newDone } : sc
      ),
    };
    saveTodayTarget(updated);
    setTarget(updated);

    // Sync with main syllabus progress
    onToggleChapter(chapterId, newDone);
  };

  const handleAddQuestions = (amount: number) => {
    const nextQ = Math.max(0, target.completedQuestionsCount + amount);
    const updated = { ...target, completedQuestionsCount: nextQ };
    saveTodayTarget(updated);
    setTarget(updated);
  };

  const handleOpenEdit = () => {
    setEditChaptersCount(target.targetChaptersCount);
    setEditQuestionsCount(target.targetQuestionsCount);
    setEditStudyMinutes(target.targetStudyMinutes);
    setEditSelectedIds(target.selectedChapters.map(sc => sc.chapterId));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const currentCompleted = target.selectedChapters.filter(sc => sc.done).map(sc => sc.chapterId);
    const newItems = editSelectedIds.map(id => ({
      chapterId: id,
      done: currentCompleted.includes(id),
    }));

    const updated: DailyTarget = {
      ...target,
      targetChaptersCount: editChaptersCount,
      targetQuestionsCount: editQuestionsCount,
      targetStudyMinutes: editStudyMinutes,
      selectedChapters: newItems,
    };

    saveTodayTarget(updated);
    setTarget(updated);
    setIsEditing(false);
  };

  const toggleSelectForToday = (chapterId: string) => {
    if (editSelectedIds.includes(chapterId)) {
      setEditSelectedIds(editSelectedIds.filter(id => id !== chapterId));
    } else {
      setEditSelectedIds([...editSelectedIds, chapterId]);
    }
  };

  const completedChaptersInTarget = target.selectedChapters.filter(sc => sc.done).length;
  const targetStudySeconds = target.targetStudyMinutes * 60;
  const studyProgressPct = Math.min(100, Math.round((studySeconds / Math.max(1, targetStudySeconds)) * 100));
  const questionsProgressPct = Math.min(100, Math.round((target.completedQuestionsCount / Math.max(1, target.targetQuestionsCount)) * 100));

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      className="card fade-in"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: '#101014',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <Target size={14} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: '#f4f4f5', fontFamily: 'monospace' }}>
              TODAY'S TARGET
            </div>
            <div style={{ fontSize: 11, color: '#71717a' }}>{dateFormatted}</div>
          </div>
        </div>

        <button
          onClick={handleOpenEdit}
          className="btn"
          style={{ fontSize: 11, padding: '4px 9px', fontFamily: 'monospace' }}
        >
          <Edit3 size={12} /> Set Daily Plan
        </button>
      </div>

      {/* ── 3 Main Metric Pillars ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {/* Chapters Goal */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            Chapters Target
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace', marginTop: 2 }}>
            {completedChaptersInTarget}{' '}
            <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>
              / {target.targetChaptersCount || target.selectedChapters.length || 2}
            </span>
          </div>
        </div>

        {/* Questions Goal */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Questions Solved
            </span>
            <span style={{ fontSize: 10, color: '#8b5cf6', fontFamily: 'monospace' }}>{questionsProgressPct}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace' }}>
              {target.completedQuestionsCount}{' '}
              <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>/ {target.targetQuestionsCount}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => handleAddQuestions(5)}
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c4b5fd',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
                title="Add 5 questions"
              >
                +5
              </button>
              <button
                onClick={() => handleAddQuestions(10)}
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c4b5fd',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
                title="Add 10 questions"
              >
                +10
              </button>
            </div>
          </div>
        </div>

        {/* Study Time Goal */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Focus Time
            </span>
            <span style={{ fontSize: 10, color: '#10b981', fontFamily: 'monospace' }}>{studyProgressPct}%</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontFamily: 'monospace', marginTop: 2 }}>
            {formatDuration(studySeconds)}{' '}
            <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>
              / {Math.round(target.targetStudyMinutes / 60)}h
            </span>
          </div>
        </div>
      </div>

      {/* ── Today's Assigned Chapters Checklist ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', letterSpacing: 0.6, textTransform: 'uppercase' }}>
          ASSIGNED CHAPTERS FOR TODAY
        </div>

        {target.selectedChapters.length === 0 ? (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, color: '#71717a' }}>
              No chapters assigned yet for today. Click "Set Daily Plan" to select 1–3 chapters.
            </span>
            <button
              onClick={handleOpenEdit}
              className="btn btn-primary"
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              <Plus size={12} /> Assign Chapters
            </button>
          </div>
        ) : (
          target.selectedChapters.map(({ chapterId, done }) => {
            const ch = SYLLABUS.find(c => c.id === chapterId);
            if (!ch) return null;
            const subColor = SUBJECTS[ch.subject].color;

            return (
              <div
                key={chapterId}
                onClick={() => handleToggleItem(chapterId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: done ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${done ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: done ? '#10b981' : '#52525b',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0,
                    }}
                  >
                    {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>

                  <div>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: subColor,
                        marginRight: 6,
                      }}
                    >
                      [{SUBJECTS[ch.subject].label.toUpperCase()}]
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: done ? '#71717a' : '#f4f4f5',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {ch.name}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
                    {ch.marks}M
                  </span>
                  {done && (
                    <span style={{ fontSize: 10, color: '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>
                      ✓ COMPLETED
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Next Best Action Recommendation ── */}
      {nextBestAction && (
        <div
          style={{
            marginTop: 2,
            padding: '10px 14px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' }}>
                NEXT BEST ACTION // {SUBJECTS[nextBestAction.chapter.subject].label.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#f4f4f5', marginTop: 1 }}>
                {nextBestAction.chapter.name} → <span style={{ color: '#a1a1aa' }}>{nextBestAction.nextTaskLabel}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToSubject(nextBestAction.chapter.subject)}
            className="btn"
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              padding: '4px 8px',
              color: '#60a5fa',
              borderColor: 'rgba(59, 130, 246, 0.3)',
            }}
          >
            Start Now <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* ── Edit Plan Modal ── */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsEditing(false)}
        >
          <div
            className="card fade-in"
            style={{
              width: 520,
              maxWidth: '92vw',
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#0e0e12',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              padding: '20px 22px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Set Today's Study Target</h3>
                <p style={{ fontSize: 11, color: '#71717a' }}>
                  Choose 1–3 priority chapters, question target, and focus hours.
                </p>
              </div>
              <button className="btn" style={{ padding: 4 }} onClick={() => setIsEditing(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Target Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                  CHAPTERS TARGET
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editChaptersCount}
                  onChange={e => setEditChaptersCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                  QUESTIONS TARGET
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={editQuestionsCount}
                  onChange={e => setEditQuestionsCount(parseInt(e.target.value) || 10)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                  STUDY MINUTES
                </label>
                <input
                  type="number"
                  min={30}
                  step={30}
                  value={editStudyMinutes}
                  onChange={e => setEditStudyMinutes(parseInt(e.target.value) || 60)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {/* Select Chapters from Syllabus */}
            <div>
              <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 8 }}>
                SELECT CHAPTERS FOR TODAY ({editSelectedIds.length} SELECTED)
              </label>
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {SYLLABUS.map(c => {
                  const isSelected = editSelectedIds.includes(c.id);
                  const subColor = SUBJECTS[c.subject].color;
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleSelectForToday(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: subColor, fontWeight: 700 }}>
                          [{c.subject.slice(0, 3).toUpperCase()}]
                        </span>
                        <span style={{ fontSize: 12, color: '#f4f4f5' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
                        {c.marks}M
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Save Today's Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
