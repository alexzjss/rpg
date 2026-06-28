import React from 'react';
import type { Character } from '../../types';

export interface ActiveBarProps {
  active: Character | null;
  combat?: boolean;
}

function Bar({ label, current, max, gradient }: { label: string; current: number; max: number; gradient: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 34, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '1px', color: '#8a8a90' }}>{label}</span>
      <span style={{ flex: 1, height: 9, background: '#26262c', borderRadius: 2, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: gradient }} />
      </span>
      <span style={{ width: 42, textAlign: 'right', fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#e9e9ee' }}>{current}/{max}</span>
    </div>
  );
}

const ActiveBar: React.FC<ActiveBarProps> = ({ active, combat = false }) => {
  if (!active) return null;
  return (
    <div style={{ flex: 'none', alignSelf: 'center', width: 460, background: 'linear-gradient(180deg,#141417,#0e0e11)',
      border: combat ? '1px solid #3a1620' : '1px solid #2a2a30',
      ...(combat ? { boxShadow: '0 0 16px rgba(224,16,43,.4)' } : {}),
      borderRadius: 3, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, position: 'relative',
      clipPath: 'polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#E0102B' }} />
      {active.icon
        ? <img src={active.icon} alt="" style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E0102B' }} />
        : <div style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', background: '#15151a', border: '2px solid #E0102B' }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontFamily: "'Anton',sans-serif", fontSize: combat ? 26 : 22, letterSpacing: '2px', color: '#f1f1f4', lineHeight: 1, textTransform: 'uppercase' }}>{active.name}</span>
          {combat && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#fff', background: '#E0102B', padding: '2px 6px' }}>SEU TURNO</span>}
        </div>
        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Bar label="HP" current={active.currentHp} max={active.maxHp} gradient="linear-gradient(90deg,#B00C22,#E0102B)" />
          <Bar label="AURA" current={active.currentAura} max={active.maxAura} gradient="linear-gradient(90deg,#6f6f9e,#cfcfe6)" />
        </div>
      </div>
    </div>
  );
};

export default ActiveBar;
