import React from 'react';
import { Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';

export type ActiveRef = { id: string; side: 'party' | 'npc' };

export interface RosterPanelProps {
  party: Character[];
  npcRoster: NpcEntry[];
  /** Personagens role==='npc' ainda não no roster (para importar). */
  importable: Character[];
  active: ActiveRef | null;
  onSelectActive: (ref: ActiveRef) => void;
  onImportNpc: (characterId: string) => void;
  onToggleHidden: (npcId: string) => void;
  onTogglePresent: (npcId: string) => void;
  onRemoveNpc: (npcId: string) => void;
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
  textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', border: 'none',
  color: active ? 'var(--sec-accent)' : 'var(--text-muted)',
  borderBottom: active ? '2px solid var(--sec-accent)' : '2px solid transparent',
});

interface RowProps { char: Character; selected: boolean; onClick: () => void; children?: React.ReactNode }

const Row: React.FC<RowProps> = ({ char, selected, onClick, children }) => {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', cursor: 'pointer',
      borderRadius: 10, background: selected ? 'var(--bg-raised)' : 'transparent',
      border: selected ? '1px solid var(--border-gold)' : '1px solid transparent' }}>
      {char.icon
        ? <img src={char.icon} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-base)' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>HP {char.currentHp}/{char.maxHp}</div>
      </div>
      {children}
    </div>
  );
};

const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 3 };

const RosterPanel: React.FC<RosterPanelProps> = ({
  party, npcRoster, importable, active, onSelectActive, onImportNpc, onToggleHidden, onTogglePresent, onRemoveNpc,
}) => {
  const [tab, setTab] = React.useState<'party' | 'npcs'>('party');
  const [importing, setImporting] = React.useState(false);
  const visibleNpcs = npcRoster.filter(n => !n.hidden);
  const hiddenNpcs = npcRoster.filter(n => n.hidden);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 14, overflow: 'hidden' }}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border-faint)' }}>
        <button role="tab" aria-selected={tab === 'party'} style={tabBtn(tab === 'party')} onClick={() => setTab('party')}>Party</button>
        <button role="tab" aria-selected={tab === 'npcs'} style={tabBtn(tab === 'npcs')} onClick={() => setTab('npcs')}>NPCs</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tab === 'party' ? (
          party.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: 8 }}>Sem personagens no elenco.</p>
            : party.map(c => (
                <Row key={c.id} char={c} selected={active?.side === 'party' && active.id === c.id}
                  onClick={() => onSelectActive({ id: c.id, side: 'party' })} />
              ))
        ) : (
          <>
            {visibleNpcs.map(n => (
              <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id}
                onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                <button style={iconBtn} title={n.present ? 'Presente' : 'Ausente'}
                  onClick={e => { e.stopPropagation(); onTogglePresent(n.id); }}>
                  <span style={{ fontSize: 14, color: n.present ? 'var(--sec-accent)' : 'var(--text-muted)' }}>●</span>
                </button>
                <button style={iconBtn} title="Ocultar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><Eye size={14} /></button>
                <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
              </Row>
            ))}

            {hiddenNpcs.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 8px 2px' }}>
                  Ocultos ({hiddenNpcs.length})
                </div>
                {hiddenNpcs.map(n => (
                  <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id}
                    onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                    <button style={iconBtn} title="Revelar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><EyeOff size={14} /></button>
                    <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
                  </Row>
                ))}
              </>
            )}

            <button onClick={() => setImporting(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: '8px',
                background: 'var(--bg-raised)', border: '1px dashed var(--border-gold)', borderRadius: 10,
                color: 'var(--sec-accent)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
              <Plus size={14} /> Adicionar NPC
            </button>

            {importing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, padding: 6,
                background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border-faint)' }}>
                {importable.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', padding: 4 }}>Nenhum NPC disponível para importar.</p>
                  : importable.map(c => (
                      <button key={c.id} onClick={() => { onImportNpc(c.id); setImporting(false); }}
                        style={{ textAlign: 'left', padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-secondary)', fontSize: 12, borderRadius: 6 }}>
                        {c.name}
                      </button>
                    ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RosterPanel;
