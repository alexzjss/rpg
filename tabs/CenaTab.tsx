import React from 'react';
import { Swords, X } from 'lucide-react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken, setEncounterActive } from '../utils/cena';
import { resolveCards, resolveSeals, resolveOwnedItems, resolveWeapons } from '../utils/items';
import LogPanel from './cena/LogPanel';
import SceneTitle from './cena/SceneTitle';
import MapBoard from './cena/MapBoard';
import ActiveBar from './cena/ActiveBar';
import RosterPanel, { type ActiveRef } from './cena/RosterPanel';
import { SealsPanel, ActionsPanel } from './cena/ActivePanels';
import InitiativeTracker from './cena/InitiativeTracker';
import ActionMenu from './cena/ActionMenu';

export interface CenaTabProps {
  cena: CenaState;
  characters: Character[];
  cards: Card[];
  seals: Seal[];
  items: Item[];
  weapons: Weapon[];
  updateCena: (next: CenaState) => void;
  updateCharacterStats: (charId: string, updates: Partial<Character>) => void;
}

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 };

const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);
  const combat = cena.encounter.isActive;

  const party = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const npcChars = characters.filter(c => (c.role ?? 'npc') === 'npc');
  const importable = npcChars.filter(c => !cena.npcRoster.some(n => n.id === c.id));
  const presentNpcs = cena.npcRoster.filter(n => n.present && !n.hidden);
  const participants: Character[] = [...party, ...presentNpcs];

  const activeChar: Character | null = !active
    ? null
    : active.side === 'party'
      ? party.find(c => c.id === active.id) ?? null
      : cena.npcRoster.find(n => n.id === active.id) ?? null;

  const activeCards = activeChar ? resolveCards(activeChar, cards) : [];
  const activeSeals = activeChar ? resolveSeals(activeChar, seals) : [];
  const activeItems = activeChar ? resolveOwnedItems(activeChar, items) : [];
  const activeWeapons = activeChar ? resolveWeapons(activeChar, weapons) : [];

  const onSceneChange = (partial: Partial<SceneState>) => updateCena(setScene(cena, partial));
  const selectById = (id: string) => {
    if (party.some(c => c.id === id)) setActive({ id, side: 'party' });
    else if (cena.npcRoster.some(n => n.id === id)) setActive({ id, side: 'npc' });
  };

  const toggleBtn = (
    <button onClick={() => updateCena(setEncounterActive(cena, !combat))}
      style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', cursor: 'pointer',
        fontFamily: "'Anton',sans-serif", fontSize: 16, letterSpacing: '2px',
        background: combat ? '#15151a' : 'linear-gradient(100deg,#E0102B,#a60c20)',
        border: combat ? '1px solid #3a1620' : 'none', color: combat ? '#9a9aa1' : '#fff',
        boxShadow: combat ? 'none' : '0 4px 18px rgba(224,16,43,.35)',
        clipPath: 'polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)' }}>
      {combat ? <X size={16} /> : <Swords size={16} />}
      {combat ? 'ENCERRAR COMBATE' : 'INICIAR COMBATE'}
    </button>
  );

  return (
    <div style={{ display: 'grid', gap: 14, height: '100%', minHeight: 0, color: '#ececef', gridTemplateColumns: '318px 1fr 364px' }}>

      {/* ESQUERDA */}
      <div style={col}>
        <div style={{ flex: 1, minHeight: 0 }}><LogPanel log={cena.log} notes={cena.scene.notes} onNotesChange={notes => onSceneChange({ notes })} /></div>
        <div style={{ height: 212, flex: 'none' }}><SealsPanel seals={activeSeals} /></div>
      </div>

      {/* CENTRO */}
      <div style={col}>
        {toggleBtn}
        {combat
          ? <InitiativeTracker round={cena.encounter.round} participants={participants} activeId={active?.id ?? null} />
          : <SceneTitle scene={cena.scene} onSceneChange={onSceneChange} />}
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <MapBoard image={cena.scene.image} participants={participants} tokens={cena.tokens}
            activeId={active?.id ?? null}
            onMoveToken={(id, pos) => updateCena(setToken(cena, id, pos))}
            onSelect={selectById}
            combat={combat} enemyIds={presentNpcs.map(n => n.id)} />
        </div>
        <ActiveBar active={activeChar} combat={combat} />
      </div>

      {/* DIREITA */}
      <div style={col}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <RosterPanel
            party={party} npcRoster={cena.npcRoster} importable={importable} active={active}
            onSelectActive={setActive}
            onImportNpc={id => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); }}
            onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
            onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
            onRemoveNpc={id => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); }}
          />
        </div>
        <div style={combat ? { flex: 1, minHeight: 0 } : { height: 212, flex: 'none' }}>
          {combat ? <ActionMenu /> : <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />}
        </div>
      </div>
    </div>
  );
};

export default CenaTab;
