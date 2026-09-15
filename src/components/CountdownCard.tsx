import React, { useState, useEffect } from 'react';
import { Target, Award, Clock } from 'lucide-react';

// Milestone target dates
const SYLLABUS_TARGET = new Date('2026-11-15T00:00:00');
const EXAM_TARGET = new Date('2027-02-05T00:00:00');
const BASE_START_DATE = new Date('2026-09-13T00:00:00');

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeRemaining(target: Date, now: Date): TimeRemaining {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { totalMs: diff, days, hours, minutes, seconds };
}

export const CountdownCard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Real-time 1-second interval clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sylRem = getTimeRemaining(SYLLABUS_TARGET, currentDate);
  const examRem = getTimeRemaining(EXAM_TARGET, currentDate);

  // Determine current phase
  const isSyllabusPhase = currentDate < SYLLABUS_TARGET;
  const isRevisionPhase = !isSyllabusPhase && currentDate < EXAM_TARGET;

  // Timeline progress % (from 13 Sep 2026 to 05 Feb 2027)
  const totalTimelineDuration = EXAM_TARGET.getTime() - BASE_START_DATE.getTime();
  const currentTimelineElapsed = Math.max(0, currentDate.getTime() - BASE_START_DATE.getTime());
  const timelinePct = Math.min(100, Math.max(0, (currentTimelineElapsed / totalTimelineDuration) * 100));

  const syllabusMilestonePct = ((SYLLABUS_TARGET.getTime() - BASE_START_DATE.getTime()) / totalTimelineDuration) * 100;

  // Formatted date strings
  const todayFormatted = currentDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  const timeFormatted = currentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toUpperCase();

  const phaseBadge = isSyllabusPhase
    ? { text: 'PHASE 1 : SYLLABUS GRIND', color: '#3b82f6' }
    : isRevisionPhase
    ? { text: 'PHASE 2 : PAPERS & REVISION', color: '#8b5cf6' }
    : { text: 'BOARD EXAM PHASE', color: '#f59e0b' };

  return (
    <div className="card fade-in" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Telemetry & Real-Time Date Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: '#f4f4f5', fontFamily: 'monospace' }}>
            TODAY: {todayFormatted} • {timeFormatted}
          </span>
        </div>

        <div style={{
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: 700,
          color: phaseBadge.color,
          background: `${phaseBadge.color}15`,
          border: `1px solid ${phaseBadge.color}35`,
          padding: '2px 8px',
          borderRadius: 4,
          letterSpacing: 0.6,
        }}>
          {phaseBadge.text}
        </div>
      </div>

      {/* 3 Real-Time Metric Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {/* 1. Syllabus Deadline */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#71717a' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Syllabus Deadline (15 Nov)
            </span>
            <Target size={12} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace' }}>
              {sylRem.days}d {sylRem.hours}h
            </span>
            <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
              {String(sylRem.minutes).padStart(2, '0')}m {String(sylRem.seconds).padStart(2, '0')}s
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
            Run-rate: ~{(sylRem.days / 37).toFixed(1)} days per chapter
          </div>
        </div>

        {/* 2. Revision Phase */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#71717a' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Revision Phase
            </span>
            <Clock size={12} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace' }}>
              82
            </span>
            <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
              days reserved (Nov 15 → Feb 5)
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
            Dedicated to 10-Year PYQs & Mock Papers
          </div>
        </div>

        {/* 3. Board Exam Day */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#71717a' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Board Exam (05 Feb)
            </span>
            <Award size={12} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
              {examRem.days}d {examRem.hours}h
            </span>
            <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
              {String(examRem.minutes).padStart(2, '0')}m {String(examRem.seconds).padStart(2, '0')}s
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#52525b', marginTop: 2, fontFamily: 'monospace' }}>
            CBSE Class 12 Theory Exam
          </div>
        </div>
      </div>

      {/* Dynamic Live Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
          {/* Base track */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 4,
            background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
          }}>
            {/* Phase 1 fill */}
            <div style={{
              position: 'absolute', left: 0, width: `${syllabusMilestonePct}%`,
              height: '100%', background: '#3b82f6',
            }} />
            {/* Phase 2 fill */}
            <div style={{
              position: 'absolute', left: `${syllabusMilestonePct}%`, width: `${100 - syllabusMilestonePct}%`,
              height: '100%', background: 'rgba(139, 92, 246, 0.4)',
            }} />
          </div>

          {/* Current Live Day Needle (Updates in Real-Time) */}
          <div style={{
            position: 'absolute',
            left: `${timelinePct}%`,
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#ffffff',
            border: '2px solid #10b981',
            boxShadow: '0 0 8px #10b981',
            zIndex: 3,
          }} title={`Live Position: ${todayFormatted}`} />

          {/* Milestone 1: Nov 15 */}
          <div style={{
            position: 'absolute',
            left: `${syllabusMilestonePct}%`,
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#3b82f6',
            zIndex: 2,
          }} />

          {/* Milestone 2: Feb 05 */}
          <div style={{
            position: 'absolute',
            right: 0,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#f59e0b',
            zIndex: 2,
          }} />
        </div>

        {/* Labels below (Dynamically shows TODAY's real date) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>
            LIVE: {currentDate.getDate()} {currentDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
          </span>
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>
            15 NOV [SYLLABUS DEADLINE]
          </span>
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>
            05 FEB [BOARD EXAM]
          </span>
        </div>
      </div>
    </div>
  );
};
