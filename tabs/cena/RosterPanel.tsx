import React from 'react';
import { Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';

export type ActiveRef = { id: string; side: 'party' | 'npc' };

export interface RosterPanelProps {
  party: Character[];
  npcRoster: NpcEntry[];
  importable: Character[];
  active: ActiveRef | null;
  onSelectActive: (ref: ActiveRef) => void;
  onImportNpc: (characterId: string) => void;
  onToggleHidden: (npcId: string) => void;
  onTogglePresent: (npcId: string) => void;
  onRemoveNpc: (npcId: string) => void;
}

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3,
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};
const tab = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '13px 0', textAlign: 'center', cursor: 'pointer',
  fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: active ? 700 : 600, fontSize: 13,
  letterSpacing: '2.5px', background: 'transparent', border: 'none',
  color: active ? '#E0102B' : '#5e5e66', borderBottom: active ? '2px solid #E0102B' : '2px solid transparent',
});
const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#7d7d85', padding: 3, display: 'flex' };

interface RowProps { char: Character; selected: boolean; onClick: () => void; children?: React.ReactNode }
const Row: React.FC<RowProps> = ({ char, selected, onClick, children }) => {
  const pct = char.maxHp > 0 ? Math.max(0, Math.min(100, (char.currentHp / char.maxHp) * 100)) : 0;
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', cursor: 'pointer', borderRadius: 3,
      background: selected ? 'linear-gradient(90deg,#1d0e12,#15151a)' : '#15151a',
      border: selected ? '1px solid #3a1620' : '1px solid #22222a',
      borderLeft: selected ? '3px solid #E0102B' : '1px solid #22222a' }}>
      {char.icon
        ? <img src={char.icon} alt="" style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', objectFit: 'cover', border: selected ? '2px solid #E0102B' : '2px solid #34343c' }} />
        : <div style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: '#0a0a0c', border: selected ? '2px solid #E0102B' : '2px solid #34343c' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '.5px', color: selected ? '#E0102B' : '#e9e9ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</span>
          {selected && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#fff', background: '#E0102B', padding: '1px 5px', borderRadius: 2 }}>ATIVO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span style={{ flex: 1, height: 6, background: '#26262c', borderRadius: 2, overflow: 'hidden' }}>
            <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: selected ? '#E0102B' : '#7a7a82' }} />
          </span>
          <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: '#9a9aa1' }}>{char.currentHp}/{char.maxHp}</span>
        </div>
      </div>
      {children}
    </div>
  );
};

const RosterPanel: React.FC<RosterPanelProps> = ({
  party, npcRoster, importable, active, onSelectActive, onImportNpc, onToggleHidden, onTogglePresent, onRemoveNpc,
}) => {
  const [view, setView] = React.useState<'party' | 'npcs'>('party');
  const [importing, setImporting] = React.useState(false);
  const visibleNpcs = npcRoster.filter(n => !n.hidden);
  const hiddenNpcs = npcRoster.filter(n => n.hidden);

  return (
    <div style={PANEL}>
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid #1e1e24' }}>
        <button role="tab" aria-selected={view === 'party'} style={tab(view === 'party')} onClick={() => setView('party')}>PARTY <span style={{ color: '#6f6f76' }}>{party.length}</span></button>
        <button role="tab" aria-selected={view === 'npcs'} style={tab(view === 'npcs')} onClick={() => setView('npcs')}>NPCS{npcRoster.length > 0 ? <span style={{ color: '#E0102B' }}> {npcRoster.length}</span> : null}</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {view === 'party' ? (
          party.length === 0
            ? <p style={{ color: '#7d7d85', fontSize: 13, fontStyle: 'italic', padding: 8 }}>Sem personagens no elenco.</p>
            : party.map(c => (
                <Row key={c.id} char={c} selected={active?.side === 'party' && active.id === c.id} onClick={() => onSelectActive({ id: c.id, side: 'party' })} />
              ))
        ) : (
          <>
            {visibleNpcs.map(n => (
              <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id} onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                <button style={iconBtn} title={n.present ? 'Presente' : 'Ausente'} onClick={e => { e.stopPropagation(); onTogglePresent(n.id); }}>
                  <span style={{ fontSize: 14, color: n.present ? '#E0102B' : '#7d7d85' }}>●</span>
                </button>
                <button style={iconBtn} title="Ocultar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><Eye size={14} /></button>
                <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
              </Row>
            ))}

            {hiddenNpcs.length > 0 && (
              <>
                <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#6f6f76', padding: '6px 4px 2px' }}>OCULTOS ({hiddenNpcs.length})</div>
                {hiddenNpcs.map(n => (
                  <Row key={n.id} char={n} selected={active?.side === 'npc' && active.id === n.id} onClick={() => onSelectActive({ id: n.id, side: 'npc' })}>
                    <button style={iconBtn} title="Revelar" onClick={e => { e.stopPropagation(); onToggleHidden(n.id); }}><EyeOff size={14} /></button>
                    <button style={iconBtn} title="Remover" onClick={e => { e.stopPropagation(); onRemoveNpc(n.id); }}><Trash2 size={14} /></button>
                  </Row>
                ))}
              </>
            )}

            <button onClick={() => setImporting(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, padding: 9,
                background: '#15151a', border: '1px dashed #3a1620', color: '#E0102B',
                fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                clipPath: 'polygon(0 0,100% 0,100% 72%,90% 100%,0 100%)' }}>
              <Plus size={14} /> Adicionar NPC
            </button>

            {importing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2, padding: 6, background: '#0a0a0c', border: '1px solid #1e1e24', borderRadius: 3 }}>
                {importable.length === 0
                  ? <p style={{ color: '#7d7d85', fontSize: 12, fontStyle: 'italic', padding: 4 }}>Nenhum NPC disponível para importar.</p>
                  : importable.map(c => (
                      <button key={c.id} onClick={() => { onImportNpc(c.id); setImporting(false); }}
                        style={{ textAlign: 'left', padding: '7px 9px', background: 'transparent', border: 'none', cursor: 'pointer',
                          color: '#cfcfd4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>
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
