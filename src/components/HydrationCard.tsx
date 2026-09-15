import React, { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, ExternalLink, Check } from 'lucide-react';
import { getTodayWater, logWaterGlass } from '../lib/storage';
import type { DailyWaterLog } from '../lib/storage';
import { playChime } from '../lib/notifications';

interface HydrationCardProps {
  onTriggerOverlay?: () => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({ onTriggerOverlay }) => {
  const [data, setData] = useState<DailyWaterLog>(() => getTodayWater());

  useEffect(() => {
    const handleUpdate = () => {
      setData(getTodayWater());
    };
    window.addEventListener('pcm_water_updated', handleUpdate);

    // Listen for sync events from Electron overlay window
    if (window.electronAPI?.onSyncWaterCount) {
      const unsub = window.electronAPI.onSyncWaterCount(() => {
        setData(getTodayWater());
      });
      return () => {
        window.removeEventListener('pcm_water_updated', handleUpdate);
        unsub();
      };
    }
    return () => {
      window.removeEventListener('pcm_water_updated', handleUpdate);
    };
  }, []);

  const addGlass = () => {
    const next = logWaterGlass(1);
    setData(next);
    playChime('water');
  };

  const removeGlass = () => {
    if (data.glasses > 0) {
      const next = logWaterGlass(-1);
      setData(next);
    }
  };

  const handleTestOverlay = () => {
    if (window.electronAPI?.showWaterOverlay) {
      window.electronAPI.showWaterOverlay();
    } else if (onTriggerOverlay) {
      onTriggerOverlay();
    }
  };

  const pct = Math.min(100, Math.round((data.glasses / data.goal) * 100));
  const currentMl = data.glasses * 250;
  const targetMl = data.goal * 250;

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
          }}>
            <Droplet size={13} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: '#a1a1aa', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            HYDRATION SYSTEM
          </span>
        </div>

        <button
          onClick={handleTestOverlay}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#60a5fa',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
          title="Open floating reminder window over all other apps"
        >
          <ExternalLink size={10} /> TEST OVERLAY POPUP
        </button>
      </div>

      {/* Main Counter */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
              {data.glasses}
            </span>
            <span style={{ fontSize: 14, color: '#71717a', fontFamily: 'monospace' }}>
              / {data.goal} GLASSES
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
            {currentMl} ml / {targetMl} ml consumed today
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: pct >= 100 ? '#10b981' : '#f4f4f5', fontFamily: 'monospace' }}>
            {pct}%
          </div>
          <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>
            {pct >= 100 ? 'TARGET MET' : 'DAILY GOAL'}
          </div>
        </div>
      </div>

      {/* Visual Glasses Bar */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: data.goal }).map((_, i) => {
          const isFilled = i < data.glasses;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 22,
                borderRadius: 4,
                background: isFilled ? '#2563eb' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isFilled ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFilled ? '#ffffff' : '#3f3f46',
                transition: 'all 0.2s ease',
              }}
              title={`Glass ${i + 1} (${(i + 1) * 250}ml)`}
            >
              {isFilled ? <Check size={11} strokeWidth={3} /> : <span style={{ fontSize: 9, fontFamily: 'monospace' }}>{i + 1}</span>}
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={addGlass}
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', padding: '8px 12px' }}
        >
          <Plus size={14} /> Drank 1 Glass (+250ml)
        </button>
        <button
          onClick={removeGlass}
          className="btn"
          style={{ padding: '8px 12px' }}
          disabled={data.glasses <= 0}
          title="Undo 1 glass"
        >
          <Minus size={13} />
        </button>
      </div>
    </div>
  );
};
