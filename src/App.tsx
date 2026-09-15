import { useState, useCallback, useEffect } from 'react';
import { LayoutDashboard, Atom, FlaskConical, Calculator, Settings2, Bell, Pin, PinOff, Droplet } from 'lucide-react';
import { getAllProgress, setProgress, getTodayWater, logWaterGlass } from './lib/storage';
import type { ChapterProgress } from './lib/storage';
import { loadReminderConfig, saveReminderConfig, sendNotification, playChime } from './lib/notifications';
import type { ReminderConfig } from './lib/notifications';
import { useReminders } from './hooks/useReminders';
import { Dashboard } from './components/Dashboard';
import { SubjectPage } from './components/SubjectPage';
import { Settings } from './components/Settings';
import { ReminderPanel } from './components/ReminderPanel';
import { WaterReminderOverlay } from './components/WaterReminderOverlay';
import type { Subject } from './data/syllabus';
import { getAppConfig } from './lib/config';
import type { AppConfig } from './lib/config';
import { PRESETS_META } from './data/syllabus';
import { SetupWizard } from './components/SetupWizard';
import { RankSyncLogo } from './components/RankSyncLogo';
import './index.css';

type Page = 'dashboard' | Subject | 'reminders';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [config, setConfigState] = useState<AppConfig>(() => getAppConfig());
  const [showInAppWaterOverlay, setShowInAppWaterOverlay] = useState(false);
  const [progress, setProgressState] = useState<Record<string, ChapterProgress>>(() => getAllProgress());
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(() => loadReminderConfig());
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [waterCount, setWaterCount] = useState(() => getTodayWater().glasses);

  // Active reminders hook (background interval for OS popups & chime)
  useReminders(reminderConfig);

  useEffect(() => {
    // Check initial Always-On-Top state
    if (window.electronAPI?.getAlwaysOnTop) {
      window.electronAPI.getAlwaysOnTop().then(setIsAlwaysOnTop);
    }

    // Real-time water sync (custom event + storage + Electron overlay IPC)
    const handleWaterUpdate = () => {
      setWaterCount(getTodayWater().glasses);
    };
    window.addEventListener('pcm_water_updated', handleWaterUpdate);
    window.addEventListener('storage', handleWaterUpdate);

    let unsub: (() => void) | undefined;
    if (window.electronAPI?.onSyncWaterCount) {
      unsub = window.electronAPI.onSyncWaterCount((count) => {
        setWaterCount(count);
      });
    }

    return () => {
      window.removeEventListener('pcm_water_updated', handleWaterUpdate);
      window.removeEventListener('storage', handleWaterUpdate);
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setProgressState(getAllProgress());
    };
    const handleConfigUpdate = () => {
      setProgressState({ ...getAllProgress() });
    };
    window.addEventListener('pcm_progress_updated', handleProgressUpdate);
    window.addEventListener('pcm_config_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('pcm_progress_updated', handleProgressUpdate);
      window.removeEventListener('pcm_config_updated', handleConfigUpdate);
    };
  }, []);

  const handleTogglePin = async () => {
    if (window.electronAPI?.toggleAlwaysOnTop) {
      const next = await window.electronAPI.toggleAlwaysOnTop();
      setIsAlwaysOnTop(next);
    }
  };

  const handleUpdate = useCallback((id: string, updates: Partial<ChapterProgress>) => {
    setProgress(id, updates);
    setProgressState(getAllProgress());
  }, []);

  const handleImport = useCallback(() => {
    setProgressState(getAllProgress());
  }, []);

  const handleReminderChange = useCallback((cfg: ReminderConfig) => {
    saveReminderConfig(cfg);
    setReminderConfig(cfg);
  }, []);

  const handleTestFire = useCallback((type: 'water' | 'revision') => {
    if (type === 'water') {
      if (window.electronAPI?.showWaterOverlay) {
        window.electronAPI.showWaterOverlay();
      } else {
        setShowInAppWaterOverlay(true);
      }
    } else {
      sendNotification('Revision Reminder', 'Spaced repetition: review weak topics and formula derivations.');
    }
  }, []);

  const navItems: { id: Page; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
    { id: 'physics', icon: <Atom size={14} />, label: 'Physics' },
    { id: 'chemistry', icon: <FlaskConical size={14} />, label: 'Chemistry' },
    { id: 'maths', icon: <Calculator size={14} />, label: 'Maths' },
  ];

  // If loaded as Electron overlay window for water reminder
  const isOverlayRoute = typeof window !== 'undefined' && window.location.hash.includes('overlay=water');
  if (isOverlayRoute) {
    return <WaterReminderOverlay isStandaloneOverlay={true} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#09090b' }}>
      {/* ── Precision Command Header ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#0d0d10',
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 14 }}>
          <RankSyncLogo size={20} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.8, color: '#f4f4f5', fontFamily: 'monospace' }}>
            RANKSYNC
          </span>
          <span style={{
            fontSize: 9,
            fontFamily: 'monospace',
            color: '#60a5fa',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '1px 5px',
            borderRadius: 3,
          }}>
            {PRESETS_META[config.gradePreset]?.badge || '12th Boards'}
          </span>
          {config.userName && (
            <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
              // {config.userName.toUpperCase()}
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-tab ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Reminders & Water Tab */}
        <button
          className={`nav-tab ${page === 'reminders' ? 'active' : ''}`}
          onClick={() => setPage('reminders')}
          style={{ position: 'relative' }}
        >
          <Bell size={14} />
          Reminders
          <span style={{
            fontSize: 9,
            fontFamily: 'monospace',
            background: waterCount >= 8 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.18)',
            color: waterCount >= 8 ? '#34d399' : '#60a5fa',
            padding: '1px 5px',
            borderRadius: 3,
            border: waterCount >= 8 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
          }}>
            {waterCount}/8
          </span>
        </button>

        {/* Right Tools: Hydration Quick Action + Always On Top + Settings */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Hydration Quick-Log Badge & Button */}
          <button
            type="button"
            onClick={() => {
              const next = logWaterGlass(1);
              setWaterCount(next.glasses);
              playChime('water');
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              handleTestFire('water');
            }}
            className="btn"
            style={{
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '4px 9px',
              background: waterCount >= 8 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.12)',
              borderColor: waterCount >= 8 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.3)',
              color: waterCount >= 8 ? '#34d399' : '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
            title={`Water Intake: ${waterCount}/8 glasses today\n• Click to log +1 glass (250ml)\n• Right-click to show reminder overlay`}
          >
            <Droplet size={12} fill={waterCount > 0 ? 'currentColor' : 'none'} />
            <span>{waterCount}/8</span>
          </button>

          {/* Always on Top Pin Button */}
          {window.electronAPI?.isElectron && (
            <button
              onClick={handleTogglePin}
              className="btn"
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                padding: '4px 9px',
                background: isAlwaysOnTop ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                borderColor: isAlwaysOnTop ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: isAlwaysOnTop ? '#60a5fa' : '#a1a1aa',
              }}
              title={isAlwaysOnTop ? "Disable Always on Top" : "Pin tracker window on top of all other apps"}
            >
              {isAlwaysOnTop ? <PinOff size={12} /> : <Pin size={12} />}
              {isAlwaysOnTop ? 'PINNED' : 'PIN ON TOP'}
            </button>
          )}

          {/* Settings */}
          <button
            className="btn"
            style={{ padding: '5px 8px' }}
            onClick={() => setShowSettings(true)}
            title="Settings & Target Dates"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </nav>

      {/* ── Main Workspace ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {page === 'dashboard' && (
            <Dashboard
              progress={progress}
              onNavigate={(subject) => setPage(subject)}
              onToggleChapter={(chapterId, isCompleted) => {
                handleUpdate(chapterId, { is_completed: isCompleted });
              }}
              onTriggerWaterOverlay={() => handleTestFire('water')}
            />
          )}
          {page === 'physics' && (
            <SubjectPage subject="physics" progress={progress} onUpdate={handleUpdate} />
          )}
          {page === 'chemistry' && (
            <SubjectPage subject="chemistry" progress={progress} onUpdate={handleUpdate} />
          )}
          {page === 'maths' && (
            <SubjectPage subject="maths" progress={progress} onUpdate={handleUpdate} />
          )}
          {page === 'reminders' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>
                  SYSTEM REMINDERS & HYDRATION
                </h2>
                <p style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace', marginTop: 2 }}>
                  Native desktop popups will display over any fullscreen applications or video players.
                </p>
              </div>
              <ReminderPanel
                config={reminderConfig}
                onChange={handleReminderChange}
                onTestFire={handleTestFire}
              />
            </div>
          )}
        </div>
      </main>

      {/* In-App Water Reminder Overlay (if triggered while app is active) */}
      {showInAppWaterOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <WaterReminderOverlay onClose={() => setShowInAppWaterOverlay(false)} />
        </div>
      )}

      {/* First-Launch / Re-opened Setup Wizard */}
      {(!config.isOnboarded || showSetupWizard) && (
        <SetupWizard
          onComplete={() => {
            setShowSetupWizard(false);
            setConfigState(getAppConfig());
            setProgressState(getAllProgress());
          }}
          isReconfiguring={config.isOnboarded}
          onCancel={() => setShowSetupWizard(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onImport={handleImport}
          onReopenWizard={() => setShowSetupWizard(true)}
        />
      )}
    </div>
  );
}

export default App;
