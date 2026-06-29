import React from 'react';
import { Swords, X } from 'lucide-react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState, SceneState } from '../utils/cena';
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken, updateNpcStats, appendLog } from '../utils/cena';
import { actorActions, resolveAction, applyStatDelta, type ResolvedAction, type StatSnapshot } from '../utils/actions';
import { startEncounter, endEncounter, advanceTurn, prevTurn } from '../utils/encounter';
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

const CenaTab: React.FC<CenaTabProps> = ({ cena, characters, cards, seals, items, weapons, updateCena, updateCharacterStats }) => {
  const [active, setActive] = React.useState<ActiveRef | null>(null);
  const [armed, setArmed] = React.useState<ResolvedAction | null>(null);
  const combat = cena.encounter.isActive;

  const party = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const npcChars = characters.filter(c => (c.role ?? 'npc') === 'npc');
  const importable = npcChars.filter(c => !cena.npcRoster.some(n => n.id === c.id));
  const presentNpcs = cena.npcRoster.filter(n => n.present && !n.hidden);
  const participants: Character[] = [...party, ...presentNpcs];

  const byId = (id: string): Character | null =>
    party.find(c => c.id === id) ?? cena.npcRoster.find(n => n.id === id) ?? null;
  const initiativeParticipants = participants.map(p => ({
    id: p.id, side: (party.some(c => c.id === p.id) ? 'party' : 'npc') as 'party' | 'npc',
    name: p.name, baseInitiative: p.baseInitiative,
  }));
  const turnEntry = combat ? cena.encounter.order[cena.encounter.turnIndex] : undefined;
  const turnActor = turnEntry ? byId(turnEntry.refId) : null;
  const isDefeatedEntry = (e: { refId: string }) => { const c = byId(e.refId); return !!c && c.currentHp <= 0; };
  const orderedParticipants = cena.encounter.order.map(e => byId(e.refId)).filter((c): c is Character => !!c);

  const selectedChar: Character | null = !active
    ? null
    : active.side === 'party'
      ? party.find(c => c.id === active.id) ?? null
      : cena.npcRoster.find(n => n.id === active.id) ?? null;
  const activeChar: Character | null = combat ? turnActor : selectedChar;

  const activeCards = activeChar ? resolveCards(activeChar, cards) : [];
  const activeSeals = activeChar ? resolveSeals(activeChar, seals) : [];
  const activeItems = activeChar ? resolveOwnedItems(activeChar, items) : [];
  const activeWeapons = activeChar ? resolveWeapons(activeChar, weapons) : [];

  const snapOf = (c: Character): StatSnapshot => ({
    currentHp: c.currentHp, maxHp: c.maxHp, currentAura: c.currentAura, maxAura: c.maxAura,
    currentAmmo: c.currentAmmo, maxAmmo: c.maxAmmo, defense: c.defense,
    conditions: c.conditions ?? [],
  });

  const applyDeltaTo = (cur: CenaState, id: string, delta: { hp?: number; aura?: number; ammo?: number }, condition?: { name: string; duration: number }): CenaState => {
    const c = byId(id); if (!c) return cur;
    const stats = applyStatDelta(c, delta);
    const conditions = condition ? [...(c.conditions ?? []), condition] : c.conditions;
    const updates = { ...stats, ...(condition ? { conditions } : {}) };
    if (party.some(p => p.id === id)) { updateCharacterStats(id, updates); return cur; }
    return updateNpcStats(cur, id, updates);
  };

  const resolveOn = (targetId: string, action: ResolvedAction) => {
    if (!turnActor) return;
    const target = byId(targetId); if (!target) return;
    const res = resolveAction(turnActor.name, snapOf(turnActor), target.name, snapOf(target), action);
    let next = appendLog(cena, res.log);
    if (turnActor.id === targetId) {
      const merged = {
        hp: ((res.actorDelta.hp ?? 0) + (res.targetDelta.hp ?? 0)) || undefined,
        aura: ((res.actorDelta.aura ?? 0) + (res.targetDelta.aura ?? 0)) || undefined,
        ammo: ((res.actorDelta.ammo ?? 0) + (res.targetDelta.ammo ?? 0)) || undefined,
      };
      next = applyDeltaTo(next, turnActor.id, merged, res.conditionApplied);
    } else {
      next = applyDeltaTo(next, turnActor.id, res.actorDelta);
      next = applyDeltaTo(next, targetId, res.targetDelta, res.conditionApplied);
    }
    updateCena(next);
    setArmed(null);
  };

  const onSceneChange = (partial: Partial<SceneState>) => updateCena(setScene(cena, partial));
  const selectById = (id: string) => {
    if (party.some(c => c.id === id)) setActive({ id, side: 'party' });
    else if (cena.npcRoster.some(n => n.id === id)) setActive({ id, side: 'npc' });
  };

  const onSelectAction = (action: ResolvedAction) => {
    if (action.targeting === 'self' && turnActor) resolveOn(turnActor.id, action);
    else setArmed(action);
  };

  const onParticipantClick = (id: string) => {
    if (combat && armed) resolveOn(id, armed);
    else selectById(id);
  };

  const toggleBtn = (
    <button onClick={() => updateCena(combat ? endEncounter(cena) : startEncounter(cena, initiativeParticipants))}
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
        {combat && armed && (
          <div style={{ flex: 'none', padding: '8px 12px', background: '#1d0e12', border: '1px solid #3a1620', color: '#E0102B',
            fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ESCOLHA O ALVO DE {armed.name.toUpperCase()}</span>
            <button onClick={() => setArmed(null)} style={{ background: 'transparent', border: 'none', color: '#9a9aa1', cursor: 'pointer', fontSize: 12 }}>cancelar</button>
          </div>
        )}
        {combat
          ? <InitiativeTracker round={cena.encounter.round} participants={orderedParticipants} activeId={turnEntry?.refId ?? null}
              onPrev={() => updateCena({ ...cena, encounter: prevTurn(cena.encounter, isDefeatedEntry) })}
              onNext={() => updateCena({ ...cena, encounter: advanceTurn(cena.encounter, isDefeatedEntry) })} />
          : <SceneTitle scene={cena.scene} onSceneChange={onSceneChange} />}
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <MapBoard image={cena.scene.image} participants={participants} tokens={cena.tokens}
            activeId={combat ? (turnEntry?.refId ?? null) : (active?.id ?? null)}
            onMoveToken={(id, pos) => updateCena(setToken(cena, id, pos))}
            onSelect={onParticipantClick}
            combat={combat} enemyIds={presentNpcs.map(n => n.id)} />
        </div>
        <ActiveBar active={activeChar} combat={combat} />
      </div>

      {/* DIREITA */}
      <div style={col}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <RosterPanel
            party={party} npcRoster={cena.npcRoster} importable={importable} active={active}
            onSelectActive={ref => (combat && armed) ? onParticipantClick(ref.id) : setActive(ref)}
            onImportNpc={id => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); }}
            onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
            onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
            onRemoveNpc={id => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); }}
          />
        </div>
        <div style={combat ? { flex: 1, minHeight: 0 } : { height: 212, flex: 'none' }}>
          {combat ? <ActionMenu actions={actorActions({ cards: activeCards, seals: activeSeals, weapons: activeWeapons, items: activeItems })} onSelectAction={onSelectAction} /> : <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />}
        </div>
      </div>
    </div>
  );
};

export default CenaTab;
