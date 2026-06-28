import React from 'react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken } from '../utils/cena';
import { resolveCards, resolveSeals, resolveOwnedItems, resolveWeapons } from '../utils/items';
import LogPanel from './cena/LogPanel';
import SceneTitle from './cena/SceneTitle';
import MapBoard from './cena/MapBoard';
import ActiveBar from './cena/ActiveBar';
import RosterPanel, { type ActiveRef } from './cena/RosterPanel';
import { SealsPanel, ActionsPanel } from './cena/ActivePanels';

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

/**
 * Aba Cena — Exploração (Fase 2C, estética Crimson). Layout em 3 colunas:
 *   [log]   [ SceneTitle / MapBoard / ActiveBar ]   [roster]
 *   [selos] [             (centro)             ]   [actions]
 */
const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);

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

  return (
    <div style={{ display: 'grid', gap: 14, height: '100%', minHeight: 0, color: '#ececef',
      gridTemplateColumns: '318px 1fr 364px', gridTemplateRows: '1fr 212px',
      gridTemplateAreas: `"log stage roster" "selos stage actions"` }}>

      <div style={{ gridArea: 'log', minHeight: 0 }}>
        <LogPanel log={cena.log} notes={cena.scene.notes} onNotesChange={notes => onSceneChange({ notes })} />
      </div>

      <div style={{ gridArea: 'stage', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SceneTitle scene={cena.scene} onSceneChange={onSceneChange} />
        <MapBoard image={cena.scene.image} participants={participants} tokens={cena.tokens}
          activeId={active?.id ?? null}
          onMoveToken={(id, pos) => updateCena(setToken(cena, id, pos))}
          onSelect={selectById} />
        <ActiveBar active={activeChar} />
      </div>

      <div style={{ gridArea: 'roster', minHeight: 0 }}>
        <RosterPanel
          party={party} npcRoster={cena.npcRoster} importable={importable} active={active}
          onSelectActive={setActive}
          onImportNpc={id => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); }}
          onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
          onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
          onRemoveNpc={id => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); }}
        />
      </div>

      <div style={{ gridArea: 'selos', minHeight: 0 }}>
        <SealsPanel seals={activeSeals} />
      </div>

      <div style={{ gridArea: 'actions', minHeight: 0 }}>
        <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />
      </div>
    </div>
  );
};

export default CenaTab;
