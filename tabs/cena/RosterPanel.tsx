import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, Shield, Swords, Trash2 } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';
import { buildClockGradient } from '../../utils/roundClock';

export type ActiveRef = { id: string; side: 'party' | 'npc' };

export interface RosterPanelProps {
  party: Character[];
  npcRoster: NpcEntry[];
  importable: Character[];
  active: ActiveRef | null;
  currentTurnId?: string | null;
  round?: number;
  orderIds?: string[];
  onPrevTurn?: () => void;
  onNextTurn?: () => void;
  onEditCharacter?: (id: string) => void;
  onSelectActive: (ref: ActiveRef) => void;
  onImportNpc: (characterId: string) => void;
  onToggleHidden: (npcId: string) => void;
  onTogglePresent: (npcId: string) => void;
  onRemoveNpc: (npcId: string) => void;
}

const iconButton: React.CSSProperties = { background: 'transparent', border: 0, cursor: 'pointer', color: '#8c8378', padding: 3, display: 'flex' };

function Vital({ kind, current, max }: { kind: 'hp' | 'aura'; current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, current / max * 100)) : 0;
  return <span className={`cena-vital cena-vital--${kind}`}><i style={{ width: `${pct}%` }} /><b>{kind.toUpperCase()}</b><em>{current}/{max}</em></span>;
}

function RoundClock({ round, currentIndex, total }: { round: number; currentIndex: number; total: number }) {
  const lit = currentIndex < 0 ? 0 : currentIndex + 1;
  return (
    <div className="cena-round-clock">
      <div className="cena-round-clock__ring" style={{ background: buildClockGradient(total, lit) }} />
      <div className="cena-round-clock__face">
        <span>RODADA</span>
        <strong>{round}</strong>
      </div>
    </div>
  );
}

interface RowProps {
  char: Character;
  side: 'party' | 'npc';
  selected: boolean;
  current: boolean;
  position?: number;
  onClick: () => void;
  onEdit?: () => void;
  onInspect?: (char: Character, top: number) => void;
  onInspectEnd?: () => void;
  children?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ char, side, selected, current, position, onClick, onEdit, onInspect, onInspectEnd, children }) => (
  <div onClick={onClick} onDoubleClick={onEdit} onMouseEnter={event => onInspect?.(char, event.currentTarget.getBoundingClientRect().top)} onMouseLeave={onInspectEnd} title={onEdit ? `${char.name} · duplo clique para editar` : char.name} className={`cena-combatant ${side === 'npc' ? 'is-npc' : 'is-party'} ${selected ? 'is-selected' : ''} ${current ? 'is-current' : ''} ${char.bannerImage ? 'has-banner' : ''}`}>
    {(char.bannerImage || char.icon) && <div className={`cena-combatant__backdrop ${char.bannerImage ? 'is-custom' : ''}`} style={{ backgroundImage: `url(${char.bannerImage || char.icon})` }} />}
    {position !== undefined && <div className="cena-combatant__order-mark">{current ? 'AGORA' : position === 2 ? 'PRÓXIMO' : 'AGUARDA'}</div>}
    <div className="cena-combatant__portrait" style={char.icon ? { backgroundImage: `url(${char.icon})` } : undefined}>
      {!char.icon && char.name.charAt(0).toUpperCase()}
      {current && <span className="cena-combatant__turn" />}
    </div>
    <div className="cena-combatant__body">
      <div className="cena-combatant__title"><strong>{char.name}</strong><span>{side === 'party' ? 'ALIADO' : 'HOSTIL'}</span></div>
      <Vital kind="hp" current={char.currentHp} max={char.maxHp} />
      <Vital kind="aura" current={char.currentAura} max={char.maxAura} />
    </div>
    {children && <div className="cena-combatant__tools">{children}</div>}
  </div>
);

const RosterPanel: React.FC<RosterPanelProps> = ({
  party, npcRoster, importable, active, currentTurnId = null, round, orderIds = [], onPrevTurn, onNextTurn, onEditCharacter,
  onSelectActive, onImportNpc, onToggleHidden, onTogglePresent, onRemoveNpc,
}) => {
  const [filter, setFilter] = React.useState<'all' | 'party' | 'npcs'>('all');
  const [importing, setImporting] = React.useState(false);
  const [preview, setPreview] = React.useState<{ char: Character; top: number } | null>(null);
  const visibleNpcs = npcRoster.filter(npc => !npc.hidden);
  const hiddenNpcs = npcRoster.filter(npc => npc.hidden);
  const npcTools = (char: NpcEntry, hidden = false) => <>
    {!hidden && <button style={iconButton} title={char.present ? 'Presente' : 'Ausente'} onClick={event => { event.stopPropagation(); onTogglePresent(char.id); }}><span style={{ color: char.present ? '#ef476f' : '#6d665e' }}>●</span></button>}
    <button style={iconButton} title={hidden ? 'Revelar' : 'Ocultar'} onClick={event => { event.stopPropagation(); onToggleHidden(char.id); }}>{hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    <button style={iconButton} title="Remover" onClick={event => { event.stopPropagation(); onRemoveNpc(char.id); }}><Trash2 size={15} /></button>
  </>;
  const ordered = orderIds.map(id => {
    const ally = party.find(character => character.id === id);
    if (ally) return { char: ally, side: 'party' as const };
    const npc = visibleNpcs.find(character => character.id === id);
    return npc ? { char: npc, side: 'npc' as const } : null;
  }).filter((entry): entry is { char: Character; side: 'party' | 'npc' } => !!entry);

  const renderRow = (char: Character, side: 'party' | 'npc', index?: number) => <Row key={char.id} char={char} side={side}
    selected={active?.side === side && active.id === char.id} current={currentTurnId === char.id}
    position={index !== undefined ? index + 1 : undefined}
    onClick={() => onSelectActive({ id: char.id, side })} onEdit={onEditCharacter ? () => onEditCharacter(char.id) : undefined}
    onInspect={(inspected, top) => setPreview({ char: inspected, top })} onInspectEnd={() => setPreview(null)}>
    {side === 'npc' ? npcTools(char as NpcEntry) : undefined}
  </Row>;

  return <><section className="cena-roster">
    <header className="cena-section-head cena-combatants-head">
      {round ? <RoundClock round={round} currentIndex={orderIds.indexOf(currentTurnId ?? '')} total={orderIds.length} /> : <div><span>COMPANHIA</span><strong>COMBATENTES</strong></div>}
      {round ? <div className="cena-combatants-head__nav">
        <button aria-label="Turno anterior" onClick={onPrevTurn}><ChevronLeft size={18} /></button>
        <button aria-label="Próximo turno" onClick={onNextTurn}><ChevronRight size={18} /></button>
      </div> : <div role="tablist" aria-label="Filtrar combatentes" className="cena-roster__filters">
        <button role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>TODOS</button>
        <button role="tab" aria-selected={filter === 'party'} onClick={() => setFilter('party')}>PARTY {party.length}</button>
        <button role="tab" aria-selected={filter === 'npcs'} onClick={() => setFilter('npcs')}>NPCS {npcRoster.length}</button>
      </div>}
    </header>
    <div className="cena-roster__list">
      {!!round && <>
        {ordered.length ? ordered.map((entry, index) => renderRow(entry.char, entry.side, index)) : <p className="cena-roster__empty">Nenhum combatente na ordem.</p>}
      </>}
      {!round && (filter === 'all' || filter === 'party') && <><div className="cena-roster__divider">ALIADOS</div>{party.length ? party.map(char => renderRow(char, 'party')) : <p className="cena-roster__empty">Sem personagens no elenco.</p>}</>}
      {!round && (filter === 'all' || filter === 'npcs') && <><div className="cena-roster__divider">NPCS &amp; ADVERSÁRIOS</div>{visibleNpcs.map(char => renderRow(char, 'npc'))}</>}
      {(round || filter === 'npcs') && !!hiddenNpcs.length && <><div className="cena-roster__divider">OCULTOS ({hiddenNpcs.length})</div>{hiddenNpcs.map(char => <Row key={char.id} char={char} side="npc" selected={active?.side === 'npc' && active.id === char.id} current={false} onClick={() => onSelectActive({ id: char.id, side: 'npc' })} onEdit={onEditCharacter ? () => onEditCharacter(char.id) : undefined}>{npcTools(char, true)}</Row>)}</>}
      {(round || filter === 'npcs') && <button className="cena-roster__add" onClick={() => setImporting(value => !value)}><Plus size={15} /> Adicionar NPC</button>}
      {importing && <div className="cena-roster__import">{importable.length === 0 ? <p>Nenhum NPC disponível para importar.</p> : importable.map(char => <button key={char.id} onClick={() => { onImportNpc(char.id); setImporting(false); }}>{char.name}</button>)}</div>}
    </div>
  </section>{preview && createPortal(<div className="cena-floating-card" style={{ top: Math.max(16, Math.min(window.innerHeight - 280, preview.top - 16)) }}>
    <div className="cena-floating-card__portrait" style={preview.char.icon ? { backgroundImage: `url(${preview.char.icon})` } : undefined}>{!preview.char.icon && preview.char.name.charAt(0)}</div>
    <div className="cena-floating-card__heading"><span>COMBATENTE</span><strong>{preview.char.name}</strong></div>
    <div className="cena-floating-card__stats"><span><b>HP</b>{preview.char.currentHp}/{preview.char.maxHp}</span><span><b>AURA</b>{preview.char.currentAura}/{preview.char.maxAura}</span><span><b>DEF</b>{preview.char.defense ?? 10}</span></div>
    <div className="cena-floating-card__battle"><span><Swords size={12}/> INICIATIVA <b>{preview.char.baseInitiative >= 0 ? '+' : ''}{preview.char.baseInitiative}</b></span><span><Shield size={12}/> DEFESA <b>{preview.char.defense ?? 10}</b></span></div>
    <small>Duplo clique para editar</small>
  </div>, document.body)}</>;
};

export default RosterPanel;
