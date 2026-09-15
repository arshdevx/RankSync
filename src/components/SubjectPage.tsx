import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import type { Subject, ChapterData } from '../data/syllabus';
import { getActiveSyllabus, SUBJECTS } from '../data/syllabus';
import type { ChapterProgress } from '../lib/storage';
import { getCustomChapters, saveCustomChapter, deleteCustomChapter } from '../lib/storage';
import { getAppConfig } from '../lib/config';
import { ChapterRow } from './ChapterRow';
import { ProgressBar } from './ProgressBar';
import { AddChapterModal } from './AddChapterModal';
import { calculateChapterStatus } from '../lib/stats';
import type { ChapterLifecycleStatus } from '../lib/stats';

interface SubjectPageProps {
  subject: Subject;
  progress: Record<string, ChapterProgress>;
  onUpdate: (id: string, updates: Partial<ChapterProgress>) => void;
}

const COL_HEADERS = [
  { label: 'SYL', sub: 'Read', color: '#3b82f6', tip: 'Theory & Syllabus Read' },
  { label: 'QNS', sub: 'Solve', color: '#8b5cf6', tip: 'NCERT & PYQs Solved' },
  { label: 'TEST', sub: 'Test', color: '#f59e0b', tip: 'Chapter Test Attempted' },
  { label: 'REV', sub: 'Revise', color: '#10b981', tip: 'Formula & Notes Revised' },
];

const DEFAULT_PROGRESS: ChapterProgress = {
  id: '',
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

export const SubjectPage: React.FC<SubjectPageProps> = ({ subject, progress, onUpdate }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'weak' | 'needs_revision'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const config = getAppConfig();
  const [customChapters, setCustomChapters] = useState<ChapterData[]>(() => getCustomChapters(config.gradePreset));

  useEffect(() => {
    const handleSyllabusUpdate = () => {
      setCustomChapters(getCustomChapters(config.gradePreset));
    };
    window.addEventListener('pcm_syllabus_updated', handleSyllabusUpdate);
    return () => window.removeEventListener('pcm_syllabus_updated', handleSyllabusUpdate);
  }, [config.gradePreset]);

  const subjectInfo = SUBJECTS[subject];
  const allActiveChapters = getActiveSyllabus(config.gradePreset, customChapters);
  const chapters = allActiveChapters.filter(c => c.subject === subject);
  const subjectTotalMarks = chapters.reduce((acc, c) => acc + (c.marks || 0), 0) || subjectInfo.total;

  const handleAddChapter = (newChapter: ChapterData) => {
    saveCustomChapter(newChapter, config.gradePreset);
    setCustomChapters(getCustomChapters(config.gradePreset));
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (window.confirm('Are you sure you want to remove this custom chapter?')) {
      deleteCustomChapter(chapterId, config.gradePreset);
      setCustomChapters(getCustomChapters(config.gradePreset));
    }
  };

  // Independent Subject Metrics (Section 4 of requirements)
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => progress[c.id]?.is_completed).length;
  const remainingChapters = totalChapters - completedChapters;
  const chapterCompletionPct = totalChapters > 0
    ? Math.round((completedChapters / totalChapters) * 1000) / 10
    : 0;

  const totalTasks = totalChapters * 4;
  const doneTasks = chapters.reduce((acc, c) => {
    const p = progress[c.id];
    if (!p) return acc;
    return acc + [p.syllabus_done, p.questions_done, p.test_done, p.revision_done].filter(Boolean).length;
  }, 0);
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 1000) / 10 : 0;

  const weakChapters = chapters.filter(c => progress[c.id]?.is_weak);
  const needsRevisionChapters = chapters.filter(c => progress[c.id]?.is_completed && !progress[c.id]?.revision_done);
  const pendingChapters = chapters.filter(c => !progress[c.id]?.is_completed);

  // Filter pipeline
  const filtered = chapters
    .filter(c => {
      const name = c.name.toLowerCase();
      const unit = c.unit.toLowerCase();
      const q = search.toLowerCase();
      return !q || name.includes(q) || unit.includes(q);
    })
    .filter(c => {
      const st: ChapterLifecycleStatus = calculateChapterStatus(c.id, progress);
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pending') return !progress[c.id]?.is_completed;
      if (activeFilter === 'completed') return Boolean(progress[c.id]?.is_completed);
      if (activeFilter === 'weak') return st === 'weak' || Boolean(progress[c.id]?.is_weak);
      if (activeFilter === 'needs_revision') return st === 'needs_revision' || (progress[c.id]?.is_completed && !progress[c.id]?.revision_done);
      return true;
    });

  const units = [...new Set(chapters.map(c => c.unit))];
  const showGrouped = !search && activeFilter === 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="fade-in">
      {/* ── Subject Telemetry Header ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, textTransform: 'uppercase' }}>
                {subjectInfo.label}
              </h2>
              <span style={{
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: subjectInfo.color,
                background: `${subjectInfo.color}15`,
                border: `1px solid ${subjectInfo.color}35`,
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                THEORY // {subjectTotalMarks} MARKS
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 4, fontFamily: 'monospace' }}>
              {completedChapters}/{totalChapters} CHAPTERS COMPLETED · {doneTasks}/{totalTasks} TASKS ({taskPct}%)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: subjectInfo.color, fontFamily: 'monospace' }}>
              {chapterCompletionPct}%
            </div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
              {remainingChapters} CHAPTERS REMAINING
            </div>
          </div>
        </div>

        <ProgressBar value={chapterCompletionPct} color={subjectInfo.color} height={5} />

        {weakChapters.length > 0 && (
          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} /> WEAK CHAPTERS (&lt;50% SCORE):
            </span>
            {weakChapters.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSearch(c.name); setActiveFilter('all'); }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky Toolbar & Table Headers ── */}
      <div style={{
        position: 'sticky',
        top: -16,
        zIndex: 20,
        background: 'var(--bg-base)',
        paddingTop: 4,
        paddingBottom: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Search & Filter pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#71717a',
              pointerEvents: 'none',
            }} />
            <input
              className="search-input"
              placeholder={`Filter ${subjectInfo.label} chapters or units...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 5 Distinct Lifecycle Tabs */}
          {[
            { id: 'all' as const, label: `ALL (${chapters.length})` },
            { id: 'pending' as const, label: `PENDING (${pendingChapters.length})`, color: '#f59e0b' },
            { id: 'completed' as const, label: `DONE (${completedChapters})`, color: '#10b981' },
            { id: 'weak' as const, label: `WEAK (${weakChapters.length})`, color: '#ef4444' },
            { id: 'needs_revision' as const, label: `REVISE (${needsRevisionChapters.length})`, color: '#8b5cf6' },
          ].map(f => (
            <button
              key={f.id}
              className="btn"
              onClick={() => setActiveFilter(f.id)}
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: activeFilter === f.id ? 700 : 500,
                padding: '5px 10px',
                background: activeFilter === f.id ? '#1e1e26' : 'rgba(255,255,255,0.02)',
                borderColor: activeFilter === f.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                color: activeFilter === f.id ? '#ffffff' : (f.color ?? '#71717a'),
              }}
            >
              {f.label}
            </button>
          ))}

          {/* Add Custom Chapter Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 700,
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              marginLeft: 'auto',
            }}
          >
            <Plus size={12} /> Add Chapter
          </button>
        </div>

        {/* Sticky Table Column Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '18px 24px 1fr 30px 30px 30px 30px 84px',
          alignItems: 'center',
          gap: 10,
          padding: '7px 16px',
          background: '#121216',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <div />
          <div title="Master Chapter Completion" style={{ fontSize: 9, color: '#10b981', textAlign: 'center', fontFamily: 'monospace' }}>
            ✓
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#71717a', fontFamily: 'monospace', letterSpacing: 0.6, textTransform: 'uppercase' }}>
            CHAPTER NAME & STATUS
          </div>
          {COL_HEADERS.map(h => (
            <div key={h.label} title={h.tip} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: h.color, fontFamily: 'monospace' }}>{h.label}</div>
              <div style={{ fontSize: 8, color: '#52525b', textTransform: 'uppercase' }}>{h.sub}</div>
            </div>
          ))}
          <div style={{ fontSize: 9, fontWeight: 700, color: '#71717a', textAlign: 'center', fontFamily: 'monospace', letterSpacing: 0.5 }}>
            TEST SCORE
          </div>
        </div>
      </div>

      {/* ── Chapters Table ── */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 0', color: '#71717a', fontSize: 12 }}>
          {search ? `No chapters matching "${search}"` : `No ${activeFilter} chapters found`}
        </div>
      ) : showGrouped
        ? units.map(unit => {
          const unitChapters = filtered.filter(c => c.unit === unit);
          if (unitChapters.length === 0) return null;
          const unitDone = unitChapters.filter(c => progress[c.id]?.is_completed).length;

          return (
            <div key={unit} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Unit header bar */}
              <div style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', fontFamily: 'monospace', letterSpacing: 0.4 }}>
                  {unit.toUpperCase()}
                </span>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: unitDone === unitChapters.length ? '#10b981' : '#71717a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {unitDone === unitChapters.length && <CheckCircle2 size={11} style={{ color: '#10b981' }} />}
                  {unitDone}/{unitChapters.length} COMPLETED
                </span>
              </div>

              {unitChapters.map(chapter => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  progress={progress[chapter.id] ?? { ...DEFAULT_PROGRESS, id: chapter.id }}
                  onUpdate={onUpdate}
                  onDelete={handleDeleteChapter}
                />
              ))}
            </div>
          );
        })
        : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 10,
              color: '#71717a',
              fontFamily: 'monospace',
            }}>
              FILTERED: {filtered.length} CHAPTERS FOUND
            </div>
            {filtered.map(chapter => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                progress={progress[chapter.id] ?? { ...DEFAULT_PROGRESS, id: chapter.id }}
                onUpdate={onUpdate}
                onDelete={handleDeleteChapter}
              />
            ))}
          </div>
        )
      }

      {showAddModal && (
        <AddChapterModal
          initialSubject={subject}
          onSave={handleAddChapter}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
