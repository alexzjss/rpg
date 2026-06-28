import React from 'react';
import type { CenaLogEntry } from '../../utils/cena';

export interface LogPanelProps {
  log: CenaLogEntry[];
  notes: string;
  onNotesChange: (next: string) => void;
}

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3,
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};
const tab = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '13px 0', textAlign: 'center', cursor: 'pointer',
  fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: active ? 700 : 600,
  fontSize: 13, letterSpacing: '2.5px', background: 'transparent', border: 'none',
  color: active ? '#E0102B' : '#5e5e66',
  borderBottom: active ? '2px solid #E0102B' : '2px solid transparent',
});

const LogPanel: React.FC<LogPanelProps> = ({ log, notes, onNotesChange }) => {
  const [view, setView] = React.useState<'log' | 'notes'>('log');
  return (
    <div style={PANEL}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid #1e1e24' }}>
        <button role="tab" aria-selected={view === 'log'} style={tab(view === 'log')} onClick={() => setView('log')}>LOG</button>
        <button role="tab" aria-selected={view === 'notes'} style={tab(view === 'notes')} onClick={() => setView('notes')}>NOTAS</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {view === 'log' ? (
          log.length === 0 ? (
            <div style={{ fontSize: 13, color: '#5a5a62', fontStyle: 'italic', letterSpacing: '.5px' }}>— Nada aconteceu ainda —</div>
          ) : (
            log.map(e => (
              <div key={e.id} style={{ background: '#15151a', borderLeft: '2px solid #6b6b74', padding: '10px 12px', borderRadius: '0 3px 3px 0' }}>
                <div style={{ fontSize: 14, color: '#cfcfd4', lineHeight: 1.35 }}>{e.text}</div>
              </div>
            ))
          )
        ) : (
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Anotações do mestre…"
            style={{ width: '100%', height: '100%', minHeight: 200, resize: 'none', background: '#0a0a0c',
              color: '#ececef', border: '1px solid #1e1e24', borderRadius: 3, padding: 12, fontSize: 14,
              fontFamily: "'Barlow Condensed',sans-serif", outline: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default LogPanel;
