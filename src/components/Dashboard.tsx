import React from 'react';
import type { Subject } from '../data/syllabus';
import { PRESETS_META } from '../data/syllabus';
import type { ChapterProgress } from '../lib/storage';
import { getCompletionHistory, getTodayTarget } from '../lib/storage';
import { getAppConfig } from '../lib/config';
import { calculateDashboardStats } from '../lib/stats';
import type { DashboardStats, PaceStatus } from '../lib/stats';
import { TodayTargetCard } from './TodayTargetCard';
import { ProgressBar } from './ProgressBar';
import { StudyTimer } from './StudyTimer';
import { HydrationCard } from './HydrationCard';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  progress: Record<string, ChapterProgress>;
  onNavigate: (subject: Subject) => void;
  onToggleChapter: (chapterId: string, isCompleted: boolean) => void;
  onTriggerWaterOverlay?: () => void;
}

const STATUS_THEMES: Record<PaceStatus, { color: string; bg: string; border: string }> = {
  GET_STARTED: { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
  AHEAD: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  ON_TRACK: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  AT_RISK: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  BEHIND: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  COMPLETED: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
};

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  onNavigate,
  onToggleChapter,
  onTriggerWaterOverlay,
}) => {
  const config = getAppConfig();
  const history = getCompletionHistory();
  const todayTarget = getTodayTarget();

  // Central Single Source of Truth
  const stats: DashboardStats = calculateDashboardStats(progress, config, todayTarget, history);
  const statusTheme = STATUS_THEMES[stats.paceStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="fade-in">
      {/* ═══════════════════════════════════════════════════════════════
          LEVEL 1: TODAY'S TARGET WORKSPACE (Action Area First)
         ═══════════════════════════════════════════════════════════════ */}
      <TodayTargetCard
        onToggleChapter={onToggleChapter}
        onNavigateToSubject={onNavigate}
        nextBestAction={stats.nextBestAction}
      />

      {/* ═══════════════════════════════════════════════════════════════
          LEVEL 1 (CONT.): PCM PROGRESS & RUN-RATE TELEMETRY
         ═══════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top bar: Title + Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>
                {config.userName ? `${config.userName.toUpperCase()}'S ` : ''}PCM ROADMAP
              </h2>
              <span style={{
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#a1a1aa',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                {PRESETS_META[config.gradePreset]?.badge || 'Class 12'}
              </span>
              <span style={{
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: statusTheme.color,
                background: statusTheme.bg,
                border: `1px solid ${statusTheme.border}`,
                padding: '1px 7px',
                borderRadius: 4,
                letterSpacing: 0.5,
              }}>
                {stats.paceStatusLabel}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 4, fontFamily: 'monospace' }}>
              {stats.completedChapters} OF {stats.totalChapters} CHAPTERS COMPLETE · {stats.remainingChapters} REMAINING
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace', lineHeight: 1 }}>
              {stats.overallCompletionPct}%
            </div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', marginTop: 4 }}>
              TOTAL PCM SYLLABUS
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar value={stats.overallCompletionPct} color="#3b82f6" height={6} />

        {/* Dynamic Telemetry Metric Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {/* Required Pace */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Required Pace
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace', marginTop: 2 }}>
              {stats.requiredPaceChaptersPerDay} <span style={{ fontSize: 11, fontWeight: 500, color: '#71717a' }}>ch/day</span>
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
              {stats.daysPerChapterRequired > 0 ? `≈ 1 ch every ${stats.daysPerChapterRequired}d` : 'Target reached'}
            </div>
          </div>

          {/* Actual Pace */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Actual Velocity
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace', marginTop: 2 }}>
              {stats.actualPaceChaptersPerDay} <span style={{ fontSize: 11, fontWeight: 500, color: '#71717a' }}>ch/day</span>
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
              {stats.completedChapters === 0
                ? 'No chapters logged yet'
                : stats.chaptersAheadOrBehind >= 0
                ? `+${stats.chaptersAheadOrBehind} ch ahead`
                : `${stats.chaptersAheadOrBehind} ch behind`}
            </div>
          </div>

          {/* Syllabus Deadline */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Syllabus Deadline
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5', fontFamily: 'monospace', marginTop: 2 }}>
              {stats.daysToSyllabusDeadline} <span style={{ fontSize: 11, fontWeight: 500, color: '#71717a' }}>DAYS LEFT</span>
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
              Target: {config.syllabusDeadline}
            </div>
          </div>

          {/* Revision Window */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Revision Window
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', fontFamily: 'monospace', marginTop: 2 }}>
              {stats.revisionWindowDays} <span style={{ fontSize: 11, fontWeight: 500, color: '#71717a' }}>DAYS</span>
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
              PYQs & Mocks before Boards
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LEVEL 2: INDEPENDENT SUBJECT BREAKDOWN
         ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
          SUBJECT PERFORMANCE // ACCURATE BREAKDOWN
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {(['physics', 'chemistry', 'maths'] as Subject[]).map(subKey => {
            const s = stats.subjects[subKey];
            return (
              <div
                key={subKey}
                className="card"
                onClick={() => onNavigate(subKey)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '14px 16px',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2, textTransform: 'uppercase' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
                      {s.totalMarks} MARKS THEORY
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>
                      {s.chapterCompletionPct}%
                    </span>
                    <ArrowUpRight size={13} style={{ color: '#71717a' }} />
                  </div>
                </div>

                <ProgressBar value={s.chapterCompletionPct} color={s.color} height={4} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
                  <span>{s.completedChapters}/{s.totalChapters} CHAPTERS</span>
                  <span>{s.completedTasks}/{s.totalTasks} TASKS ({s.taskCompletionPct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LEVEL 3: WEAK CHAPTERS & SUPPORTING TOOLS
         ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Study Focus Timer */}
        <StudyTimer />

        {/* Hydration Widget (Restrained & Non-competing) */}
        <HydrationCard onTriggerOverlay={onTriggerWaterOverlay} />
      </div>

      {/* Weak / Needs Revision Priority Block */}
      {stats.weakChapters.length > 0 && (
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <AlertCircle size={13} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace', letterSpacing: 0.6, textTransform: 'uppercase' }}>
              CRITICAL WEAK SPOTS ({stats.weakChapters.length} CHAPTERS SCORING &lt; 50%)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.weakChapters.map(c => {
              const p = progress[c.id];
              const scoreText = p?.test_score_obtained !== null && p?.test_score_total
                ? `${p.test_score_obtained}/${p.test_score_total} (${Math.round((p.test_score_obtained / p.test_score_total) * 100)}%)`
                : 'Score pending';

              return (
                <div
                  key={c.id}
                  onClick={() => onNavigate(c.subject)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.04)',
                    border: '1px solid rgba(239, 68, 68, 0.18)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: stats.subjects[c.subject].color, fontWeight: 700 }}>
                      [{c.subject.slice(0, 3).toUpperCase()}]
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#f4f4f5' }}>{c.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>
                      {scoreText}
                    </span>
                    <ArrowUpRight size={12} style={{ color: '#71717a' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
