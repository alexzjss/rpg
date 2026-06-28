import React from 'react';
import type { Character } from '../../types';

export interface InitiativeTrackerProps {
  round: number;
  participants: Character[];
  activeId: string | null;
  onPrev?: () => void;
  onNext?: () => void;
}

const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({ round, participants, activeId, onPrev, onNext }) => (
  <div style={{ flex: 'none', background: 'linear-gradient(180deg,#101013,#0c0c0f)', border: '1px solid #1e1e24',
    borderRadius: 3, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 13, letterSpacing: '2px', color: '#E0102B', lineHeight: 1.1 }}>
      RODADA<br /><span style={{ color: '#f1f1f4', fontSize: 22 }}>{round}</span>
    </div>
    <div style={{ width: 1, height: 42, background: '#26262c' }} />
    {onPrev && (
      <button aria-label="Turno anterior" onClick={onPrev}
        style={{ flex: 'none', width: 26, height: 26, cursor: 'pointer', background: '#15151a', border: '1px solid #2a2a30', color: '#9a9aa1', borderRadius: 3, fontSize: 14, lineHeight: 1 }}>‹</button>
    )}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
      {participants.map(p => {
        const isActive = p.id === activeId;
        const down = p.currentHp <= 0;
        return (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: down ? 0.4 : (isActive ? 1 : 0.62) }}>
            <div style={{ width: isActive ? 50 : 40, height: isActive ? 50 : 40, borderRadius: '50%', overflow: 'hidden',
              border: isActive ? '2px solid #E0102B' : '2px solid #34343c',
              boxShadow: isActive ? '0 0 14px rgba(224,16,43,.6)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p.icon ? `url(${p.icon}) center/cover` : '#15151a',
              filter: down ? 'grayscale(1)' : 'none' }}>
              {!p.icon && <span style={{ fontFamily: "'Anton',sans-serif", fontSize: isActive ? 20 : 16, color: isActive ? '#E0102B' : '#9a9aa1' }}>{p.name.charAt(0).toUpperCase()}</span>}
            </div>
            <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: isActive ? 700 : 600, fontSize: 10,
              letterSpacing: '1px', color: isActive ? '#E0102B' : '#7d7d85', whiteSpace: 'nowrap' }}>
              {p.name.split(' ')[0].toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
    {onNext && (
      <button aria-label="Próximo turno" onClick={onNext}
        style={{ flex: 'none', width: 26, height: 26, cursor: 'pointer', background: '#E0102B', border: 'none', color: '#fff', borderRadius: 3, fontSize: 14, lineHeight: 1 }}>›</button>
    )}
    <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', color: '#8a8a90', textAlign: 'right' }}>
      SUA VEZ<br /><span style={{ color: '#E0102B' }}>0:24</span>
    </div>
  </div>
);

export default InitiativeTracker;
