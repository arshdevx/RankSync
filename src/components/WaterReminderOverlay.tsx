import React, { useState, useEffect } from 'react';
import { Droplet, Plus, X, Clock, Check } from 'lucide-react';
import { getTodayWater, logWaterGlass } from '../lib/storage';
import { playChime } from '../lib/notifications';

interface WaterReminderOverlayProps {
  onClose?: () => void;
  isStandaloneOverlay?: boolean;
}

export const WaterReminderOverlay: React.FC<WaterReminderOverlayProps> = ({
  onClose,
  isStandaloneOverlay = false,
}) => {
  const [waterData, setWaterData] = useState(() => getTodayWater());
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => {
    // Play chime on popup entrance
    playChime('water');
  }, []);

  const handleDrink = () => {
    const updated = logWaterGlass(1);
    setWaterData(updated);
    setJustLogged(true);
    playChime('water');

    setTimeout(() => {
      if (window.electronAPI?.closeWaterOverlay) {
        window.electronAPI.closeWaterOverlay();
      }
      if (onClose) onClose();
    }, 900);
  };

  const handleDismiss = () => {
    if (window.electronAPI?.closeWaterOverlay) {
      window.electronAPI.closeWaterOverlay();
    }
    if (onClose) onClose();
  };

  const pct = Math.min(100, Math.round((waterData.glasses / waterData.goal) * 100));
  const mlCurrent = waterData.glasses * 250;
  const mlTarget = waterData.goal * 250;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isStandaloneOverlay ? '12px' : '0',
        background: isStandaloneOverlay ? 'transparent' : 'rgba(0,0,0,0.7)',
        backdropFilter: isStandaloneOverlay ? 'none' : 'blur(8px)',
        zIndex: 9999,
      }}
    >
      <div
        className="card fade-in"
        style={{
          width: 380,
          maxWidth: '100%',
          background: '#0d0d11',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 25px -5px rgba(59, 130, 246, 0.2)',
          borderRadius: 12,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          position: 'relative',
        }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Droplet size={15} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2, color: '#f4f4f5' }}>
                Hydration Break
              </div>
              <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Daily Target: {waterData.goal} Glasses ({mlTarget} ml)
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>

        {/* Meter row */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 9,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>
              {waterData.glasses} <span style={{ fontSize: 14, fontWeight: 500, color: '#a1a1aa' }}>/ {waterData.goal}</span>
            </div>
            <div style={{ fontSize: 11, color: '#71717a' }}>{mlCurrent} ml consumed today</div>
          </div>

          {/* Mini progress ring or bar */}
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginBottom: 4 }}>
              {pct}%
            </div>
            <div style={{ width: '100%', height: 6, background: '#1c1c24', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Tip */}
        <div style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.45 }}>
          Ek glass paani pi bhai — hydration se brain fatigue 15% kam hoti hai aur problem solving speed bani rehti hai.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <button
            onClick={handleDrink}
            disabled={justLogged}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: justLogged ? '#10b981' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {justLogged ? (
              <>
                <Check size={14} /> Logged! Refreshing...
              </>
            ) : (
              <>
                <Plus size={14} /> Drank 1 Glass (+250ml)
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#181820',
              color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Snooze"
          >
            <Clock size={13} /> Snooze
          </button>
        </div>
      </div>
    </div>
  );
};
