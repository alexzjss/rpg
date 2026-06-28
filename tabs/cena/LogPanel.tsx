import React from 'react';
import type { CenaLogEntry } from '../../utils/cena';

export interface LogPanelProps {
  log: CenaLogEntry[];
  notes: string;
  onNotesChange: (next: string) => void;
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
  textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', border: 'none',
  color: active ? 'var(--sec-accent)' : 'var(--text-muted)',
  borderBottom: active ? '2px solid var(--sec-accent)' : '2px solid transparent',
});

const LogPanel: React.FC<LogPanelProps> = ({ log, notes, onNotesChange }) => {
  const [tab, setTab] = React.useState<'log' | 'notes'>('log');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 14, overflow: 'hidden' }}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border-faint)' }}>
        <button role="tab" aria-selected={tab === 'log'} style={tabBtn(tab === 'log')} onClick={() => setTab('log')}>Log</button>
        <button role="tab" aria-selected={tab === 'notes'} style={tabBtn(tab === 'notes')} onClick={() => setTab('notes')}>Notas</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12 }}>
        {tab === 'log' ? (
          log.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Nada aconteceu ainda.</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
              {log.map(e => (
                <li key={e.id} style={{ fontSize: 12, color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-mid)', paddingLeft: 8 }}>
                  {e.text}
                </li>
              ))}
            </ul>
          )
        ) : (
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Anotações do mestre…"
            style={{ width: '100%', height: '100%', minHeight: 200, resize: 'none', background: 'var(--bg-base)',
              color: 'var(--text-primary)', border: '1px solid var(--border-faint)', borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default LogPanel;
