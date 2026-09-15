import React, { useState } from 'react';
import { Download, Upload, Trash2, X, Check } from 'lucide-react';
import { exportData, importData, getAllProgress } from '../lib/storage';
import { getAppConfig, saveAppConfig } from '../lib/config';

import type { SyllabusPreset, AppConfig } from '../lib/config';

interface SettingsProps {
  onClose: () => void;
  onImport: () => void;
  onReopenWizard?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose, onImport, onReopenWizard }) => {
  const [config, setConfig] = useState(() => getAppConfig());
  const [deadlineSaved, setDeadlineSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleConfigChange = <K extends keyof AppConfig>(field: K, value: AppConfig[K]) => {
    const updated = saveAppConfig({ [field]: value });
    setConfig(updated);
    setDeadlineSaved(true);
    setTimeout(() => setDeadlineSaved(false), 2000);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcm-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const ok = importData(text);
        if (ok) {
          setImportSuccess(true);
          setImportError('');
          setTimeout(() => { onImport(); onClose(); }, 1000);
        } else {
          setImportError('Invalid backup file. Please use a file exported from this app.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirmReset) {
      localStorage.clear();
      window.location.reload();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const progress = getAllProgress();
  const completedChapters = Object.values(progress).filter(p => p.is_completed).length;
  const totalDoneTasks = Object.values(progress).reduce((acc, p) => {
    return acc + [p.syllabus_done, p.questions_done, p.test_done, p.revision_done].filter(Boolean).length;
  }, 0);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="card fade-in"
        style={{ width: 440, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>System Settings & Target Configuration</h2>
          <button className="btn" style={{ padding: '4px 6px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* ── 1. Student Profile & Grade Preset ── */}
        <div style={{
          padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              STUDENT PROFILE & SYLLABUS
            </span>
            {deadlineSaved && (
              <span style={{ fontSize: 10, color: '#10b981', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={11} /> Saved
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                STUDENT NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Arsh"
                value={config.userName}
                onChange={e => handleConfigChange('userName', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  padding: '5px 8px',
                  color: '#ffffff',
                  fontSize: 12,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                ACTIVE SYLLABUS PRESET
              </label>
              <select
                value={config.gradePreset}
                onChange={e => handleConfigChange('gradePreset', e.target.value as SyllabusPreset)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  padding: '5px 8px',
                  color: '#ffffff',
                  fontSize: 12,
                }}
              >
                <option value="cbse-12-pcm" style={{ background: '#18181b' }}>Class 12th PCM (37 ch)</option>
                <option value="cbse-11-pcm" style={{ background: '#18181b' }}>Class 11th PCM (37 ch)</option>
                <option value="jee-pcm" style={{ background: '#18181b' }}>JEE Main (11th + 12th - 74 ch)</option>
                <option value="custom" style={{ background: '#18181b' }}>Custom Syllabus</option>
              </select>
            </div>
          </div>

          {onReopenWizard && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => { onClose(); onReopenWizard(); }}
                style={{ width: '100%', justifyContent: 'center', fontSize: 11, fontFamily: 'monospace' }}
              >
                ✨ Re-run Setup Roadmap Wizard
              </button>
            </div>
          )}
        </div>

        {/* ── 2. Target Deadlines Configuration (Scenario G) ── */}
        <div style={{
          padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              MILESTONE TARGET DATES
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div>
              <label style={{ fontSize: 9, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                1. SYLLABUS END
              </label>
              <input
                type="date"
                value={config.syllabusDeadline}
                onChange={e => handleConfigChange('syllabusDeadline', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  padding: '4px 6px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 9, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                2. MOCKS START
              </label>
              <input
                type="date"
                value={config.mockTestStartDate}
                onChange={e => handleConfigChange('mockTestStartDate', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  padding: '4px 6px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 9, color: '#71717a', fontFamily: 'monospace', display: 'block', marginBottom: 4 }}>
                3. FINAL EXAM
              </label>
              <input
                type="date"
                value={config.boardExamDate}
                onChange={e => handleConfigChange('boardExamDate', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  padding: '4px 6px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Data Telemetry ── */}
        <div style={{
          padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>Chapters Done</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#3b82f6', marginTop: 2 }}>
              {completedChapters} <span style={{ fontSize: 11, color: '#71717a' }}>/ 37</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>Tasks Done</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#10b981', marginTop: 2 }}>
              {totalDoneTasks} <span style={{ fontSize: 11, color: '#71717a' }}>/ 148</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>Storage Engine</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#f4f4f5', marginTop: 2 }}>
              100% Local
            </div>
          </div>
        </div>

        {/* ── 3. Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleExport} style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={14} /> Export Backup (.json)
          </button>
          <button className="btn" onClick={handleImport} style={{ width: '100%', justifyContent: 'center' }}>
            <Upload size={14} /> Import Backup (.json)
          </button>
          {importError && <p style={{ fontSize: 11, color: '#ef4444', textAlign: 'center' }}>{importError}</p>}
          {importSuccess && <p style={{ fontSize: 11, color: '#10b981', textAlign: 'center' }}>✓ Data restored successfully!</p>}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 4 }}>
            <button
              className={`btn ${confirmReset ? 'btn-danger' : ''}`}
              onClick={handleReset}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Trash2 size={14} />
              {confirmReset ? '⚠️ Confirm Reset All Progress (Cannot be undone)' : 'Reset All Progress'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
