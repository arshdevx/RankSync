import React, { useState } from 'react';
import { Sparkles, Calendar, Target, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { getAppConfig, saveAppConfig } from '../lib/config';
import type { SyllabusPreset } from '../lib/config';
import { PRESETS_META } from '../data/syllabus';
import { RankSyncLogo } from './RankSyncLogo';

interface SetupWizardProps {
  onComplete: () => void;
  isReconfiguring?: boolean;
  onCancel?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  onComplete,
  isReconfiguring = false,
  onCancel,
}) => {
  const currentConfig = getAppConfig();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userName, setUserName] = useState(currentConfig.userName || '');
  const [selectedPreset, setSelectedPreset] = useState<SyllabusPreset>(currentConfig.gradePreset || 'cbse-12-pcm');
  const [syllabusDeadline, setSyllabusDeadline] = useState(currentConfig.syllabusDeadline || '2026-11-15');
  const [mockTestStartDate, setMockTestStartDate] = useState(currentConfig.mockTestStartDate || '2026-11-16');
  const [boardExamDate, setBoardExamDate] = useState(currentConfig.boardExamDate || '2027-02-05');
  const [dailyQuestions, setDailyQuestions] = useState(currentConfig.dailyQuestionsTarget || 20);
  const [dailyStudyHours, setDailyStudyHours] = useState(Math.round((currentConfig.dailyStudyMinutes || 240) / 60));

  // Compute live timeline days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(`${syllabusDeadline}T00:00:00`);
  const mockDate = new Date(`${mockTestStartDate}T00:00:00`);
  const examDate = new Date(`${boardExamDate}T00:00:00`);

  const theoryDays = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000));
  const revisionDays = Math.max(0, Math.ceil((examDate.getTime() - mockDate.getTime()) / 86400000));
  const totalDays = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86400000));

  const handleFinish = () => {
    saveAppConfig({
      userName: userName.trim() || 'Student',
      gradePreset: selectedPreset,
      syllabusDeadline,
      mockTestStartDate,
      boardExamDate,
      isOnboarded: true,
      dailyQuestionsTarget: dailyQuestions,
      dailyStudyMinutes: dailyStudyHours * 60,
    });
    onComplete();
  };

  const presetList: SyllabusPreset[] = ['cbse-12-pcm', 'cbse-11-pcm', 'jee-pcm', 'custom'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      className="fade-in"
    >
      <div
        style={{
          width: 580,
          maxWidth: '100%',
          maxHeight: '94vh',
          background: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(59, 130, 246, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header with Step indicator */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RankSyncLogo size={18} />
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#60a5fa', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {isReconfiguring ? 'RankSync // Roadmap Reconfiguration' : 'RankSync // Academic Mission Control Setup'}
              </span>
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 800, marginTop: 4, letterSpacing: -0.2 }}>
              {step === 1 && '1. Student Profile & Grade'}
              {step === 2 && '2. Milestone Timeline & Target Dates'}
              {step === 3 && '3. Daily Target Habits'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2, 3].map(s => (
              <div
                key={s}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  background: step === s ? '#3b82f6' : step > s ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                  color: step === s ? '#ffffff' : step > s ? '#10b981' : '#71717a',
                  border: step === s ? '1px solid #3b82f6' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {step > s ? <Check size={13} strokeWidth={3} /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: Student Name & Course Preset
             ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Your Name / Aspirant Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arsh (or your first name)"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: 6,
                    padding: '9px 12px',
                    fontSize: 14,
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.14)')}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Select Your Course / Grade
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presetList.map(presetId => {
                    const meta = PRESETS_META[presetId];
                    const isSelected = selectedPreset === presetId;
                    return (
                      <div
                        key={presetId}
                        onClick={() => setSelectedPreset(presetId)}
                        style={{
                          padding: '11px 14px',
                          borderRadius: 8,
                          border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              border: isSelected ? '5px solid #3b82f6' : '2px solid #52525b',
                              background: '#121215',
                            }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#ffffff' : '#e4e4e7' }}>
                                {meta.title}
                              </span>
                              <span style={{
                                fontSize: 10,
                                fontFamily: 'monospace',
                                color: isSelected ? '#3b82f6' : '#71717a',
                                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}>
                                {meta.badge}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                              {meta.description}
                            </div>
                          </div>
                        </div>

                        {meta.totalChapters > 0 && (
                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#a1a1aa' }}>
                            {meta.totalChapters} CH
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: Milestone Timeline & Expected Dates
             ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Live Roadmap Visualizer Card */}
              <div
                style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
                    Roadmap Timeline Simulation
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                    {totalDays} TOTAL DAYS TO EXAM
                  </span>
                </div>

                {/* Progress bar split */}
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                  <div
                    style={{
                      flex: Math.max(1, theoryDays),
                      background: '#3b82f6',
                      borderRadius: '4px 0 0 4px',
                    }}
                    title={`Theory & Syllabus: ${theoryDays} days`}
                  />
                  <div
                    style={{
                      flex: Math.max(1, revisionDays),
                      background: '#10b981',
                      borderRadius: '0 4px 4px 0',
                    }}
                    title={`Mock Papers & Revision: ${revisionDays} days`}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', color: '#a1a1aa' }}>
                  <span style={{ color: '#60a5fa' }}>● Theory Phase: {theoryDays} days</span>
                  <span style={{ color: '#34d399' }}>● Mocks & Revision: {revisionDays} days</span>
                </div>
              </div>

              {/* Date pickers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Calendar size={12} style={{ color: '#3b82f6' }} />
                    1. Expected Syllabus Completion Date
                  </label>
                  <p style={{ fontSize: 11, color: '#71717a', marginBottom: 6 }}>
                    Target date when all chapters, theory, and first-time notes should be finished.
                  </p>
                  <input
                    type="date"
                    value={syllabusDeadline}
                    onChange={e => setSyllabusDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#ffffff',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Target size={12} style={{ color: '#8b5cf6' }} />
                    2. Sample Papers & Mock Tests Start Date
                  </label>
                  <p style={{ fontSize: 11, color: '#71717a', marginBottom: 6 }}>
                    When you will actively begin full-length 3-hour sample papers and PYQ marathons.
                  </p>
                  <input
                    type="date"
                    value={mockTestStartDate}
                    onChange={e => setMockTestStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#ffffff',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Calendar size={12} style={{ color: '#10b981' }} />
                    3. Final Exam Target Date
                  </label>
                  <p style={{ fontSize: 11, color: '#71717a', marginBottom: 6 }}>
                    Date of Board Exams / JEE Main session.
                  </p>
                  <input
                    type="date"
                    value={boardExamDate}
                    onChange={e => setBoardExamDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#ffffff',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: Daily Target Habits
             ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Daily Questions Goal */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Daily Questions Practice Goal
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[15, 25, 40, 50].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDailyQuestions(q)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 6,
                        border: dailyQuestions === q ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                        background: dailyQuestions === q ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: dailyQuestions === q ? '#60a5fa' : '#a1a1aa',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                    >
                      {q} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Study Focus Goal */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Daily Study Focus Target (Hours)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[2, 4, 6, 8].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDailyStudyHours(h)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 6,
                        border: dailyStudyHours === h ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                        background: dailyStudyHours === h ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: dailyStudyHours === h ? '#34d399' : '#a1a1aa',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                    >
                      {h} Hours
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div
                style={{
                  padding: '14px 16px',
                  background: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  ✓ Roadmap Ready for {userName || 'You'}
                </div>
                <div style={{ fontSize: 12, color: '#d4d4d8', marginTop: 2 }}>
                  <strong>Course:</strong> {PRESETS_META[selectedPreset].title}
                </div>
                <div style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace' }}>
                  {theoryDays} days to finish syllabus · {revisionDays} days of dedicated mock tests & revision before final exams.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div>
            {step > 1 ? (
              <button
                type="button"
                className="btn"
                onClick={() => setStep((step - 1) as 1 | 2)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={13} /> Back
              </button>
            ) : isReconfiguring && onCancel ? (
              <button type="button" className="btn" onClick={onCancel}>
                Cancel
              </button>
            ) : (
              <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
                Class 12 / 11 / JEE Roadmap
              </span>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep((step + 1) as 2 | 3)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Next Step <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinish}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  background: '#10b981',
                  borderColor: '#10b981',
                }}
              >
                <Sparkles size={14} /> Launch My Roadmap
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
