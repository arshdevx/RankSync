import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, AlertCircle, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import type { ChapterData } from '../data/syllabus';
import { PRIORITY_COLORS, SUBJECTS } from '../data/syllabus';
import type { ChapterProgress } from '../lib/storage';
import { calculateChapterStatus } from '../lib/stats';
import type { ChapterLifecycleStatus } from '../lib/stats';

interface CheckboxProps {
  done: boolean;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  color: string;
  label: string;
}

const TaskCheckbox: React.FC<CheckboxProps> = ({ done, onClick, title, color, label }) => (
  <button
    type="button"
    className={`cb-wrap ${done ? 'done' : ''}`}
    onClick={onClick}
    title={title}
    style={{
      color,
      borderColor: done ? color : 'rgba(255,255,255,0.12)',
      background: done ? `${color}18` : 'rgba(255,255,255,0.02)',
    }}
    aria-label={label}
  >
    {done && <Check size={13} strokeWidth={3} />}
  </button>
);

interface ChapterRowProps {
  chapter: ChapterData;
  progress: ChapterProgress;
  onUpdate: (id: string, updates: Partial<ChapterProgress>) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<ChapterLifecycleStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'NOT STARTED', color: '#71717a', bg: 'rgba(255,255,255,0.03)' },
  in_progress: { label: 'IN PROGRESS', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
  completed: { label: 'COMPLETED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  weak: { label: 'WEAK SPOT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  needs_revision: { label: 'NEEDS REVISION', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
};

export const ChapterRow: React.FC<ChapterRowProps> = ({ chapter, progress, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [scoreInput, setScoreInput] = useState(
    progress.test_score_obtained !== null && progress.test_score_total !== null
      ? `${progress.test_score_obtained}/${progress.test_score_total}`
      : ''
  );

  const priorityColor = PRIORITY_COLORS[chapter.priority];
  const subjectColor = SUBJECTS[chapter.subject].color;
  const status = calculateChapterStatus(chapter.id, { [chapter.id]: progress });
  const statusBadge = STATUS_CONFIG[status];

  const toggleSubtask = (field: 'syllabus_done' | 'questions_done' | 'test_done' | 'revision_done') => {
    onUpdate(chapter.id, { [field]: !progress[field] });
  };

  const toggleChapterComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompleted = !progress.is_completed;
    onUpdate(chapter.id, {
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
    });
  };

  const handleScoreBlur = () => {
    const match = scoreInput.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
    if (match) {
      const obtained = parseInt(match[1]);
      const total = parseInt(match[2]);
      if (obtained <= total) {
        onUpdate(chapter.id, { test_score_obtained: obtained, test_score_total: total, test_done: true });
        return;
      }
    }
    if (scoreInput.trim() === '') {
      onUpdate(chapter.id, { test_score_obtained: null, test_score_total: null });
    }
  };

  const pct =
    progress.test_score_obtained !== null && progress.test_score_total !== null && progress.test_score_total > 0
      ? Math.round((progress.test_score_obtained / progress.test_score_total) * 100)
      : null;

  const scoreColor = pct === null ? '#71717a' : pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  const doneTasksCount = [progress.syllabus_done, progress.questions_done, progress.test_done, progress.revision_done].filter(Boolean).length;

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* ── Main row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '18px 24px 1fr 30px 30px 30px 30px 84px',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          transition: 'background 0.1s ease',
          background: expanded ? 'rgba(255,255,255,0.02)' : 'transparent',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Expand caret */}
        <span style={{ color: expanded ? '#ffffff' : '#52525b', display: 'flex' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        {/* Master Chapter Complete Button */}
        <button
          type="button"
          onClick={toggleChapterComplete}
          style={{
            background: 'none',
            border: 'none',
            color: progress.is_completed ? '#10b981' : 'rgba(255,255,255,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all 0.15s ease',
          }}
          title={progress.is_completed ? "Chapter completed! Click to mark incomplete" : "Click to mark entire chapter completed"}
        >
          {progress.is_completed ? (
            <CheckCircle2 size={18} />
          ) : (
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }} />
          )}
        </button>

        {/* Chapter info & Status Badge */}
        <div style={{ minWidth: 0, paddingRight: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {progress.is_weak && (
              <span title="Scored below 50% or marked as weak concept" style={{ display: 'flex', color: '#ef4444' }}>
                <AlertCircle size={12} />
              </span>
            )}
            <span style={{
              fontSize: 13,
              fontWeight: progress.is_completed ? 400 : 500,
              color: progress.is_completed ? '#71717a' : '#f4f4f5',
              textDecoration: progress.is_completed ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {chapter.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {/* Dynamic lifecycle status badge */}
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: 0.5,
              color: statusBadge.color,
              background: statusBadge.bg,
              border: `1px solid ${statusBadge.color}35`,
              padding: '1px 5px',
              borderRadius: 3,
            }}>
              {statusBadge.label}
            </span>

            <span style={{
              fontSize: 9,
              fontWeight: 600,
              fontFamily: 'monospace',
              color: priorityColor,
            }}>
              {chapter.priorityLabel.toUpperCase()}
            </span>

            <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
              {chapter.marks}M
            </span>

            <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
              [{doneTasksCount}/4 tasks]
            </span>
          </div>
        </div>

        {/* Subtask Checkboxes */}
        <TaskCheckbox
          done={progress.syllabus_done}
          onClick={e => { e.stopPropagation(); toggleSubtask('syllabus_done'); }}
          title="Syllabus & Theory Studied"
          color="#3b82f6"
          label="Syllabus"
        />

        <TaskCheckbox
          done={progress.questions_done}
          onClick={e => { e.stopPropagation(); toggleSubtask('questions_done'); }}
          title="NCERT & PYQs Solved"
          color="#8b5cf6"
          label="Questions"
        />

        <TaskCheckbox
          done={progress.test_done}
          onClick={e => { e.stopPropagation(); toggleSubtask('test_done'); }}
          title="Chapter Test Attempted"
          color="#f59e0b"
          label="Test"
        />

        <TaskCheckbox
          done={progress.revision_done}
          onClick={e => { e.stopPropagation(); toggleSubtask('revision_done'); }}
          title="Formula Sheet & Notes Revised"
          color="#10b981"
          label="Revision"
        />

        {/* Test Score Input */}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <input
            className="score-input"
            placeholder="e.g. 21/40"
            value={scoreInput}
            onChange={e => setScoreInput(e.target.value)}
            onBlur={handleScoreBlur}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
          {pct !== null && (
            <span style={{ fontSize: 10, color: scoreColor, fontWeight: 700, fontFamily: 'monospace' }}>
              {pct}%
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded Drawer ── */}
      {expanded && (
        <div
          className="fade-in"
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Telemetry row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
              <span>WEIGHTAGE: <strong style={{ color: subjectColor }}>{chapter.marks}M</strong></span>
              <span>·</span>
              <span>STATUS: <strong style={{ color: statusBadge.color }}>{statusBadge.label}</strong></span>
              <span>·</span>
              <span>TASKS: <strong>{doneTasksCount}/4</strong></span>
              {pct !== null && (
                <>
                  <span>·</span>
                  <span>SCORE: <strong style={{ color: scoreColor }}>{progress.test_score_obtained}/{progress.test_score_total} ({pct}%)</strong></span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {chapter.id.startsWith('custom-') && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(chapter.id)}
                  className="btn"
                  style={{ fontSize: 11, padding: '4px 8px', fontFamily: 'monospace', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  title="Delete custom chapter"
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
              <button
                type="button"
                onClick={toggleChapterComplete}
                className={`btn ${progress.is_completed ? '' : 'btn-primary'}`}
                style={{ fontSize: 11, padding: '4px 10px', fontFamily: 'monospace' }}
              >
                {progress.is_completed ? 'Mark Incomplete' : '✓ Mark Chapter Completed'}
              </button>
            </div>
          </div>

          {/* Two-column note & weak points */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Weak Points */}
            <div>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#ef4444',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'monospace',
              }}>
                <AlertCircle size={11} /> Weak Points & Concepts to Revisit
              </div>
              <textarea
                className="notes-area"
                rows={3}
                placeholder="Ex: Derivation of Lens Maker formula confuse hoti hai, Kirchhoff numericals mai sign conventions..."
                value={progress.weak_points ?? ''}
                onChange={e => onUpdate(chapter.id, { weak_points: e.target.value })}
                style={{
                  background: 'rgba(239, 68, 68, 0.03)',
                  borderColor: progress.weak_points?.trim() ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                }}
              />
            </div>

            {/* Notes / Formulas */}
            <div>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#a1a1aa',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'monospace',
              }}>
                <FileText size={11} /> Key Formulas & Memorization Notes
              </div>
              <textarea
                className="notes-area"
                rows={3}
                placeholder="Ex: Snell's law: n1 sin i = n2 sin r, Critical angle: sin C = 1/n..."
                value={progress.notes ?? ''}
                onChange={e => onUpdate(chapter.id, { notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
