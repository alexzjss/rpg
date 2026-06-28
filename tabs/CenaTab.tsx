import React from 'react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent } from '../utils/cena';
import { resolveCards, resolveSeals, resolveOwnedItems, resolveWeapons } from '../utils/items';
import LogPanel from './cena/LogPanel';
import SceneStage from './cena/SceneStage';
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
 * Aba Cena — exploração (Fase 2A). Layout cockpit:
 *   [log] [  cena (ativo)  ] [roster]
 *   [selos][     cena      ][ações ]
 */
const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);

  const party = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const npcChars = characters.filter(c => (c.role ?? 'npc') === 'npc');
  const importable = npcChars.filter(c => !cena.npcRoster.some(n => n.id === c.id));

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

  return (
    <div style={{
      display: 'grid', gap: 12, height: '100%', minHeight: 0,
      gridTemplateColumns: '260px 1fr 300px',
      gridTemplateRows: '1fr 168px',
      gridTemplateAreas: `"log stage roster" "seals stage actions"`,
    }}>
      <div style={{ gridArea: 'log', minHeight: 0 }}>
        <LogPanel log={cena.log} notes={cena.scene.notes} onNotesChange={notes => onSceneChange({ notes })} />
      </div>

      <div style={{ gridArea: 'stage', minHeight: 0 }}>
        <SceneStage scene={cena.scene} active={activeChar} onSceneChange={onSceneChange} />
      </div>

      <div style={{ gridArea: 'roster', minHeight: 0 }}>
        <RosterPanel
          party={party}
          npcRoster={cena.npcRoster}
          importable={importable}
          active={active}
          onSelectActive={setActive}
          onImportNpc={id => {
            const char = npcChars.find(c => c.id === id);
            if (char) updateCena(addNpcFromCharacter(cena, char));
          }}
          onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
          onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
          onRemoveNpc={id => {
            updateCena(removeNpc(cena, id));
            setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev));
          }}
        />
      </div>

      <div style={{ gridArea: 'seals', minHeight: 0 }}>
        <SealsPanel seals={activeSeals} />
      </div>

      <div style={{ gridArea: 'actions', minHeight: 0 }}>
        <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />
      </div>
    </div>
  );
};

export default CenaTab;
