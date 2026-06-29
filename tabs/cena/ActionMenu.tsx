import React from 'react';
import type { ActionCategory, ResolvedAction } from '../../utils/actions';

export interface ActionMenuProps {
  actions?: Record<ActionCategory, ResolvedAction[]>;
  onSelectAction?: (action: ResolvedAction) => void;
}

const EMPTY: Record<ActionCategory, ResolvedAction[]> = { atacar: [], habilidade: [], forma: [], item: [], guarda: [] };

const CATS: { id: ActionCategory; label: string; key: string; primary?: boolean }[] = [
  { id: 'atacar', label: 'ATACAR', key: '1', primary: true },
  { id: 'habilidade', label: 'HABILIDADE', key: '2' },
  { id: 'forma', label: 'FORMA', key: '3' },
  { id: 'item', label: 'ITEM', key: '4' },
  { id: 'guarda', label: 'GUARDA', key: '5' },
];

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3, padding: 14, overflow: 'auto',
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};

const ActionMenu: React.FC<ActionMenuProps> = ({ actions = EMPTY, onSelectAction }) => {
  const [open, setOpen] = React.useState<ActionCategory | null>(null);
  return (
    <div style={PANEL}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
        <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '2px', color: '#6f6f76' }}>AÇÕES · CARTAS · ITENS</span>
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#E0102B,transparent)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {CATS.map(c => {
          const list = actions[c.id] ?? [];
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setOpen(isOpen ? null : c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: c.primary ? '12px 14px' : '11px 14px', cursor: 'pointer',
                  background: c.primary ? 'linear-gradient(100deg,#E0102B,#a60c20)' : '#15151a',
                  border: c.primary ? 'none' : '1px solid #2a2a30',
                  boxShadow: c.primary ? '0 4px 18px rgba(224,16,43,.35)' : 'none',
                  clipPath: 'polygon(0 0,100% 0,100% 72%,96% 100%,0 100%)' }}>
                <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: '2px', color: c.primary ? '#fff' : '#e9e9ee' }}>{c.label}</span>
                {list.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: c.primary ? 'rgba(255,255,255,.7)' : '#9a9aa1' }}>{list.length}</span>}
                <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: c.primary ? 'rgba(255,255,255,.7)' : '#6f6f76' }}>{c.key}</span>
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
                  {list.length === 0
                    ? <span style={{ fontSize: 12, color: '#7d7d85', fontStyle: 'italic', padding: '4px 0' }}>Nada nesta categoria.</span>
                    : list.map(a => (
                        <button key={a.id} onClick={() => onSelectAction?.(a)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '7px 10px', cursor: 'pointer',
                            background: '#15151a', border: '1px solid #26262c', color: '#e3e3e8',
                            fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 13 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0102B' }} />
                          <span style={{ flex: 1 }}>{a.name}</span>
                          {a.auraCost ? <span style={{ fontSize: 11, color: '#cfcfe6' }}>{a.auraCost}◆</span> : null}
                        </button>
                      ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionMenu;
