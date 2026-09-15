import React, { useState } from 'react';
import { Droplet, BookOpen, Volume2, VolumeX, Play, ShieldAlert } from 'lucide-react';
import type { ReminderConfig } from '../lib/notifications';
import { saveReminderConfig, requestNotificationPermission, playChime } from '../lib/notifications';

interface ReminderPanelProps {
  config: ReminderConfig;
  onChange: (cfg: ReminderConfig) => void;
  onTestFire: (type: 'water' | 'revision') => void;
}

const WATER_INTERVALS = [15, 20, 30, 45, 60, 90];
const REVISION_INTERVALS = [30, 45, 60, 90, 120];

export const ReminderPanel: React.FC<ReminderPanelProps> = ({ config, onChange, onTestFire }) => {
  const [permStatus, setPermStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const update = (patch: Partial<ReminderConfig>) => {
    const next = { ...config, ...patch };
    saveReminderConfig(next);
    onChange(next);
  };

  const handleRequestPerm = async () => {
    const granted = await requestNotificationPermission();
    setPermStatus(granted ? 'granted' : 'denied');
  };

  const handleTestWaterOverlay = () => {
    if (window.electronAPI?.showWaterOverlay) {
      window.electronAPI.showWaterOverlay();
    } else {
      onTestFire('water');
      playChime('water');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Permission alert if running in browser and denied */}
      {!window.electronAPI?.isElectron && permStatus !== 'granted' && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, color: '#f4f4f5' }}>
              Browser notifications not enabled for system background popups.
            </span>
          </div>
          <button className="btn btn-primary" onClick={handleRequestPerm} style={{ fontSize: 11 }}>
            Enable Permission
          </button>
        </div>
      )}

      {/* ── 1. Water Reminder ── */}
      <div
        className="card"
        style={{
          borderColor: config.waterEnabled ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
            }}>
              <Droplet size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>
                Hydration System Reminder
              </div>
              <div style={{ fontSize: 11, color: '#71717a' }}>
                Pops up a dedicated interactive reminder window over all other apps
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => update({ waterEnabled: !config.waterEnabled })}
            style={{
              width: 42,
              height: 22,
              borderRadius: 11,
              background: config.waterEnabled ? '#2563eb' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${config.waterEnabled ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: config.waterEnabled ? 22 : 2,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: '#ffffff',
              transition: 'left 0.15s ease',
            }} />
          </button>
        </div>

        {config.waterEnabled && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            {/* Interval selector */}
            <div>
              <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace', marginBottom: 6, textTransform: 'uppercase' }}>
                TRIGGER INTERVAL (MINUTES)
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {WATER_INTERVALS.map(min => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => update({ waterIntervalMin: min })}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      background: config.waterIntervalMin === min ? '#1e293b' : 'rgba(255,255,255,0.03)',
                      borderColor: config.waterIntervalMin === min ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: config.waterIntervalMin === min ? '#60a5fa' : '#a1a1aa',
                      fontWeight: config.waterIntervalMin === min ? 700 : 400,
                    }}
                  >
                    {min}M
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => update({ waterSound: !config.waterSound })}
                className="btn"
                style={{ fontSize: 11, color: config.waterSound ? '#60a5fa' : '#71717a' }}
              >
                {config.waterSound ? <Volume2 size={13} /> : <VolumeX size={13} />}
                {config.waterSound ? 'Chime Sound Enabled' : 'Muted'}
              </button>

              <button
                type="button"
                onClick={handleTestWaterOverlay}
                className="btn btn-primary"
                style={{ fontSize: 11 }}
              >
                <Play size={12} /> Test Pop-up Over Apps
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Revision Reminder ── */}
      <div
        className="card"
        style={{
          borderColor: config.revisionEnabled ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa',
            }}>
              <BookOpen size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>
                Spaced Revision Reminder
              </div>
              <div style={{ fontSize: 11, color: '#71717a' }}>
                Prompts you to review weak topics & formula derivations
              </div>
            </div>
          </div>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => update({ revisionEnabled: !config.revisionEnabled })}
            style={{
              width: 42,
              height: 22,
              borderRadius: 11,
              background: config.revisionEnabled ? '#7c3aed' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${config.revisionEnabled ? '#8b5cf6' : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: config.revisionEnabled ? 22 : 2,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: '#ffffff',
              transition: 'left 0.15s ease',
            }} />
          </button>
        </div>

        {config.revisionEnabled && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace', marginBottom: 6, textTransform: 'uppercase' }}>
                TRIGGER INTERVAL (MINUTES)
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {REVISION_INTERVALS.map(min => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => update({ revisionIntervalMin: min })}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      background: config.revisionIntervalMin === min ? '#2e1065' : 'rgba(255,255,255,0.03)',
                      borderColor: config.revisionIntervalMin === min ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: config.revisionIntervalMin === min ? '#c4b5fd' : '#a1a1aa',
                      fontWeight: config.revisionIntervalMin === min ? 700 : 400,
                    }}
                  >
                    {min >= 60 ? `${min / 60}H` : `${min}M`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => update({ revisionSound: !config.revisionSound })}
                className="btn"
                style={{ fontSize: 11, color: config.revisionSound ? '#a78bfa' : '#71717a' }}
              >
                {config.revisionSound ? <Volume2 size={13} /> : <VolumeX size={13} />}
                {config.revisionSound ? 'Focus Bell Sound Enabled' : 'Muted'}
              </button>

              <button
                type="button"
                onClick={() => { onTestFire('revision'); playChime('revision'); }}
                className="btn"
                style={{ fontSize: 11 }}
              >
                <Play size={12} /> Test Notification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
