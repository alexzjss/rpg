import React from 'react';

export interface ActionMenuProps {
  onAction?: (id: string) => void;
}

interface ActionDef { id: string; label: string; key: string; primary?: boolean; badge?: string }
const ACTIONS: ActionDef[] = [
  { id: 'atacar', label: 'ATACAR', key: '1', primary: true },
  { id: 'habilidade', label: 'HABILIDADE', key: '2' },
  { id: 'forma', label: 'FORMA', key: '3', badge: '1◆' },
  { id: 'item', label: 'ITEM', key: '4' },
  { id: 'guarda', label: 'GUARDA', key: '5' },
];

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3, padding: 14,
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};

const ActionMenu: React.FC<ActionMenuProps> = ({ onAction }) => (
  <div style={PANEL}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
      <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '2px', color: '#6f6f76' }}>AÇÕES · CARTAS · ITENS</span>
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#E0102B,transparent)' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      {ACTIONS.map(a => (
        <button key={a.id} onClick={() => onAction?.(a.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: a.primary ? '12px 14px' : '11px 14px', cursor: 'pointer',
            background: a.primary ? 'linear-gradient(100deg,#E0102B,#a60c20)' : '#15151a',
            border: a.primary ? 'none' : '1px solid #2a2a30',
            boxShadow: a.primary ? '0 4px 18px rgba(224,16,43,.35)' : 'none',
            clipPath: 'polygon(0 0,100% 0,100% 72%,96% 100%,0 100%)' }}>
          <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: '2px', color: a.primary ? '#fff' : '#e9e9ee' }}>{a.label}</span>
          {a.badge && <span style={{ fontSize: 11, fontWeight: 700, color: '#9a9aa1' }}>{a.badge}</span>}
          <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: a.primary ? 'rgba(255,255,255,.7)' : '#6f6f76' }}>{a.key}</span>
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 11, borderTop: '1px solid #1e1e24' }}>
      <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '1px', color: '#6f6f76' }}>
        RECURSO <span style={{ color: '#E0102B', fontWeight: 700 }}>3◆</span> disponível
      </span>
    </div>
  </div>
);

export default ActionMenu;
