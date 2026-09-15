import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#60a5fa',
  height = 6,
  showLabel = false,
  label,
}) => {
  return (
    <div style={{ width: '100%' }}>
      {(showLabel || label) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          {label && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>}
          {showLabel && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
      <div className="prog-track" style={{ height }}>
        <div
          className="prog-fill"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: color,
            opacity: value === 0 ? 0.3 : 1,
          }}
        />
      </div>
    </div>
  );
};
