import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import type { Subject, ChapterData } from '../data/syllabus';
import { SUBJECTS } from '../data/syllabus';

interface AddChapterModalProps {
  initialSubject?: Subject;
  onSave: (chapter: ChapterData) => void;
  onClose: () => void;
}

export const AddChapterModal: React.FC<AddChapterModalProps> = ({
  initialSubject = 'physics',
  onSave,
  onClose,
}) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [marks, setMarks] = useState(5);
  const [priority, setPriority] = useState<'must-do' | 'high' | 'medium' | 'easy'>('high');

  const priorityLabels: Record<string, string> = {
    'must-do': 'Top Priority',
    high: 'High Yield',
    medium: 'Moderate',
    easy: 'Short & Scoring',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newChapter: ChapterData = {
      id: `custom-${subject}-${Date.now()}`,
      subject,
      name: name.trim(),
      unit: unit.trim() || 'Custom Added Topics',
      marks: Number(marks) || 4,
      priority,
      priorityLabel: priorityLabels[priority] || 'Custom',
    };

    onSave(newChapter);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      className="fade-in"
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 460, maxWidth: '100%', padding: '20px 22px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Plus size={15} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Add Custom Chapter / Topic</h2>
          </div>
          <button className="btn" style={{ padding: '4px 6px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subject selector */}
          <div>
            <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Subject
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['physics', 'chemistry', 'maths'] as Subject[]).map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubject(sub)}
                  style={{
                    padding: '7px 0',
                    borderRadius: 6,
                    border: subject === sub ? `1px solid ${SUBJECTS[sub].color}` : '1px solid rgba(255,255,255,0.08)',
                    background: subject === sub ? `${SUBJECTS[sub].color}18` : 'rgba(255,255,255,0.02)',
                    color: subject === sub ? '#ffffff' : '#71717a',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>{SUBJECTS[sub].emoji}</span>
                  <span>{SUBJECTS[sub].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Name */}
          <div>
            <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Chapter Name
            </label>
            <input
              type="text"
              placeholder="e.g. Basic Mathematics & Vectors"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: '8px 10px',
                color: '#ffffff',
                fontSize: 13,
              }}
            />
          </div>

          {/* Unit / Group */}
          <div>
            <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Unit / Section (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Unit I – Mathematical Tools"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: '8px 10px',
                color: '#ffffff',
                fontSize: 13,
              }}
            />
          </div>

          {/* Marks & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                Estimated Marks Weightage
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={marks}
                onChange={e => setMarks(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#ffffff',
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#ffffff',
                  fontSize: 13,
                }}
              >
                <option value="must-do" style={{ background: '#18181b' }}>Must Do / Top Priority</option>
                <option value="high" style={{ background: '#18181b' }}>High Yield</option>
                <option value="medium" style={{ background: '#18181b' }}>Moderate</option>
                <option value="easy" style={{ background: '#18181b' }}>Short & Scoring</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={13} /> Add Chapter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
