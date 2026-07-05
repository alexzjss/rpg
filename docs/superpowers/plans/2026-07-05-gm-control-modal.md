# GM Control Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Painel do Mestre" modal to the Cena tab, opened from a new gear button in `RosterPanel`, giving the GM controls to pause/resume turn advancement, reset all combatant vitals, bench/import combatants, clear the combat log, reroll initiative, and restart the encounter from scratch.

**Architecture:** New pure state-transition functions in `utils/cena.ts` and `utils/encounter.ts`, a new `resetVitals` helper in `utils/actions.ts`, a new presentational `GmControlModal` component wired into `CenaTab.tsx`, and small additions to `RosterPanel.tsx` (gear button + paused indicator) and to the shared CSS block in `SceneBackdrop.tsx`.

**Tech Stack:** React + TypeScript, Vitest + Testing Library, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-05-gm-control-modal-design.md`

**Known pre-existing state:** `tabs/CenaTab.test.tsx` currently has 3 failing tests unrelated to this feature (leftover from an in-progress refactor on this branch, confirmed via `npx vitest run tabs/CenaTab.test.tsx` before this plan was written: 11 passed / 3 failed). Do not attempt to fix those 3 as part of this plan — only make sure you don't add new failures.

---

### Task 1: `EncounterState.isPaused` + `CenaState.benchedCastIds` + pure helpers

**Files:**
- Modify: `utils/cena.ts:77-89` (EncounterState interface), `utils/cena.ts:112-119` (CenaState interface), `utils/cena.ts:129-140` (DEFAULT_ENCOUNTER), `utils/cena.ts:157-165` (createDefaultCena), `utils/cena.ts:200-203` (near setEncounterActive)
- Test: `utils/cena.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `utils/cena.test.ts`, right after the `describe('setEncounterActive', ...)` block (after line 111):

```ts
describe('setEncounterPaused', () => {
  it('liga e desliga a pausa sem mutar o original', () => {
    const cena = createDefaultCena();
    const paused = setEncounterPaused(cena, true);
    expect(paused.encounter.isPaused).toBe(true);
    expect(cena.encounter.isPaused).toBe(false);
    expect(setEncounterPaused(paused, false).encounter.isPaused).toBe(false);
  });
});

describe('benchCastMember / unbenchCastMember', () => {
  it('adiciona e remove um id sem duplicar, sem mutar o original', () => {
    const cena = createDefaultCena();
    const benched = benchCastMember(cena, 'p1');
    expect(benched.benchedCastIds).toEqual(['p1']);
    expect(cena.benchedCastIds).toEqual([]);
    expect(benchCastMember(benched, 'p1').benchedCastIds).toEqual(['p1']);
    expect(unbenchCastMember(benched, 'p1').benchedCastIds).toEqual([]);
  });
});

describe('clearLog', () => {
  it('esvazia o log sem mutar o original', () => {
    const cena = appendLog(createDefaultCena(), [logEntry('system', 'x')]);
    const cleared = clearLog(cena);
    expect(cleared.log).toEqual([]);
    expect(cena.log).toHaveLength(1);
  });
});
```

Also update the import line at the top of `utils/cena.test.ts` (line 2) to add the new names:

```ts
import { createDefaultCena, DEFAULT_SCENE, DEFAULT_ENCOUNTER, setScene, addNpcFromCharacter, mergeNpcLiveUpdates, removeNpc, syncNpcFromCharacter, toggleNpcHidden, toggleNpcPresent, setToken, setEncounterActive, setEncounterPaused, benchCastMember, unbenchCastMember, clearLog, logEntry, appendLog, updateNpcStats } from './cena';
```

Also add one assertion to the existing "cria um estado de cena vazio e coerente" test (around line 14-20), to cover the new `benchedCastIds` default:

```ts
  it('cria um estado de cena vazio e coerente', () => {
    const cena = createDefaultCena();
    expect(cena.scene).toEqual(DEFAULT_SCENE);
    expect(cena.npcRoster).toEqual([]);
    expect(cena.encounter).toEqual(DEFAULT_ENCOUNTER);
    expect(cena.log).toEqual([]);
    expect(cena.benchedCastIds).toEqual([]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run utils/cena.test.ts`
Expected: FAIL — `setEncounterPaused`, `benchCastMember`, `unbenchCastMember`, `clearLog` are not exported from `./cena`, and `cena.benchedCastIds` is `undefined`.

- [ ] **Step 3: Implement the data model changes**

In `utils/cena.ts`, modify the `EncounterState` interface (currently lines 77-89) to add `isPaused`:

```ts
/** Estado de combate v2. */
export interface EncounterState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  order: EncounterEntry[];
  turn: EncounterTurnState;
  /** Quando true, o mestre pausou o avanço de turno (próximo/anterior ficam bloqueados). */
  isPaused: boolean;
  /** id → já reagiu nesta rodada. */
  reactionsUsed: Record<string, boolean>;
  activeBuffs: ActiveBuff[];
  activeFormas: ActiveFormaState[];
  preparations: PreparationState[];
  fieldEffects: ActiveFieldEffect[];
}
```

Modify `CenaState` interface (currently lines 112-119) to add `benchedCastIds`:

```ts
/** Estado completo e próprio da aba Cena. */
export interface CenaState {
  scene: SceneState;
  npcRoster: NpcEntry[];
  encounter: EncounterState;
  log: CenaLogEntry[];
  /** Posições dos tokens no mapa, por id de participante (% do mapa, 0–100). */
  tokens: Record<string, { x: number; y: number }>;
  /** ids de personagens do elenco (role 'cast') temporariamente fora do combate atual. */
  benchedCastIds: string[];
}
```

Update `DEFAULT_ENCOUNTER` (currently lines 129-140) to add `isPaused: false`:

```ts
export const DEFAULT_ENCOUNTER: EncounterState = {
  isActive: false,
  round: 1,
  turnIndex: 0,
  order: [],
  turn: { majorUsed: false, minorUsed: false },
  isPaused: false,
  reactionsUsed: {},
  activeBuffs: [],
  activeFormas: [],
  preparations: [],
  fieldEffects: [],
};
```

Update `createDefaultCena` (currently lines 157-165) to add `benchedCastIds: []`:

```ts
/** Cria um CenaState novo com cópias independentes de scene e encounter. */
export function createDefaultCena(): CenaState {
  return {
    scene: { ...DEFAULT_SCENE },
    npcRoster: [],
    encounter: createDefaultEncounter(),
    log: [],
    tokens: {},
    benchedCastIds: [],
  };
}
```

Add three new functions right after `setEncounterActive` (currently ends at line 203):

```ts
/** Pausa/retoma o avanço de turno sem afetar o restante do combate. */
export function setEncounterPaused(cena: CenaState, paused: boolean): CenaState {
  return { ...cena, encounter: { ...cena.encounter, isPaused: paused } };
}

/** Marca um membro do elenco como fora do combate atual (sem removê-lo do elenco). No-op se já banido. */
export function benchCastMember(cena: CenaState, id: string): CenaState {
  if (cena.benchedCastIds.includes(id)) return cena;
  return { ...cena, benchedCastIds: [...cena.benchedCastIds, id] };
}

/** Reinclui um membro do elenco banido no combate atual. */
export function unbenchCastMember(cena: CenaState, id: string): CenaState {
  return { ...cena, benchedCastIds: cena.benchedCastIds.filter(existing => existing !== id) };
}

/** Esvazia o log de combate (mantém encounter intocado). */
export function clearLog(cena: CenaState): CenaState {
  return { ...cena, log: [] };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run utils/cena.test.ts`
Expected: PASS (all tests in the file, including the new ones).

- [ ] **Step 5: Commit**

```bash
git add utils/cena.ts utils/cena.test.ts
git commit -m "feat(cena): add encounter pause and cast bench state helpers"
```

---

### Task 2: `resetVitals` helper

**Files:**
- Modify: `utils/actions.ts:1` (import), `utils/actions.ts:150-160` (near `applyStatDelta`)
- Test: `utils/actions.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `utils/actions.test.ts`, at the end of the file (after the last `describe` block, currently ending around line 60+):

```ts
describe('resetVitals', () => {
  it('restaura HP/Aura/Munição ao máximo e limpa condições/efeitos ativos', () => {
    const character: any = {
      maxHp: 20, currentHp: 3, maxAura: 10, currentAura: 1, maxAmmo: 4, currentAmmo: 0,
      conditions: [{ name: 'Queimando', duration: 2 }],
      activeEffects: [{ effect: { name: 'Queimadura' }, stacks: 1, remaining: 2 }],
    };
    expect(resetVitals(character)).toEqual({
      currentHp: 20, currentAura: 10, currentAmmo: 4, conditions: [], activeEffects: [],
    });
  });

  it('não mexe em maxHp/maxAura/maxAmmo', () => {
    const character: any = { maxHp: 20, currentHp: 20, maxAura: 10, currentAura: 10, maxAmmo: 4, currentAmmo: 4, conditions: [], activeEffects: [] };
    const result: any = resetVitals(character);
    expect(result.maxHp).toBeUndefined();
    expect(result.maxAura).toBeUndefined();
    expect(result.maxAmmo).toBeUndefined();
  });
});
```

Update the import line at the top of `utils/actions.test.ts` (line 2):

```ts
import { normalizeCard, normalizeSeal, normalizeWeapon, normalizeItem, actorActions, GUARD_ACTION, resetVitals } from './actions';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run utils/actions.test.ts`
Expected: FAIL — `resetVitals` is not exported from `./actions`.

- [ ] **Step 3: Implement `resetVitals`**

In `utils/actions.ts`, change the type-only import on line 1 to include `Character`:

```ts
import type { Card, Character, DamageType, Seal, Weapon } from '../types';
```

Add the function right after `applyStatDelta` (which currently ends at line 160):

```ts
/** Cura total de mestre: restaura HP/Aura/Munição ao máximo e remove condições/efeitos ativos. */
export function resetVitals(c: Character): Partial<Character> {
  return { currentHp: c.maxHp, currentAura: c.maxAura, currentAmmo: c.maxAmmo, conditions: [], activeEffects: [] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run utils/actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/actions.ts utils/actions.test.ts
git commit -m "feat(actions): add resetVitals GM helper for full heal + condition clear"
```

---

### Task 3: `rerollInitiativeOrder`

**Files:**
- Modify: `utils/encounter.ts:1-19` (imports/types), append new function near `sortInitiative`/`startEncounter` (after line 54)
- Test: `utils/encounter.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `utils/encounter.test.ts`, right after the `describe('startEncounter', ...)` block (after line 37):

```ts
describe('rerollInitiativeOrder', () => {
  it('rerola e reordena, resetando turnIndex/turn/reactionsUsed e preservando round/fieldEffects', () => {
    const base: EncounterState = {
      ...createDefaultEncounter(), isActive: true, round: 3, turnIndex: 1,
      turn: { majorUsed: true, minorUsed: true },
      reactionsUsed: { a: true },
      fieldEffects: [{ id: 'fx1', sourceId: 'a', sourceName: 'A', entryId: 'e1', effect: {} as any, roundsRemaining: 2 }],
      order: [
        { refId: 'a', side: 'party', initiative: 5 },
        { refId: 'b', side: 'npc', initiative: 30 },
      ],
    };
    const { encounter, log } = rerollInitiativeOrder(base, [P('a', 'party', 0), P('b', 'npc', 0)]);
    expect(encounter.turnIndex).toBe(0);
    expect(encounter.turn).toEqual({ majorUsed: false, minorUsed: false });
    expect(encounter.reactionsUsed).toEqual({});
    expect(encounter.round).toBe(3);
    expect(encounter.fieldEffects).toEqual(base.fieldEffects);
    expect(encounter.order).toHaveLength(2);
    expect(log.length).toBeGreaterThanOrEqual(3);
    expect(log[0].text).toContain('rerolada');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run utils/encounter.test.ts`
Expected: FAIL — `rerollInitiativeOrder` is not exported from `./encounter`.

- [ ] **Step 3: Implement `rerollInitiativeOrder`**

In `utils/encounter.ts`, add the following right after `startEncounter` (which currently ends at line 54):

```ts
export interface RerollResult { encounter: EncounterState; log: CenaLogEntry[] }

/**
 * Re-rola a iniciativa dos participantes informados e reordena o turno.
 * Zera turnIndex e os slots/reações da rodada, mas preserva round, fieldEffects,
 * preparations e activeBuffs — pensada para o mestre corrigir a ordem no meio do combate.
 */
export function rerollInitiativeOrder(
  enc: EncounterState,
  participants: InitiativeParticipant[],
): RerollResult {
  const rolled = participants.map(p => {
    let detail!: RollResult;
    const total = rollInitiative(p.baseInitiative, roll => { detail = roll; });
    return { ...p, total, detail };
  });
  const order = sortInitiative(rolled);
  const orderedRolls = rolled.slice().sort((a, b) => b.total - a.total || b.baseInitiative - a.baseInitiative);
  const rollLogs = orderedRolls.map(r => logEntry('roll', `${r.name} rolou iniciativa ${r.total}.`, {
    notation: r.detail.notation, total: r.detail.total,
    individualRolls: r.detail.individualRolls, numSides: r.detail.numSides,
    bonus: r.detail.bonus, actorLabel: r.name, success: true,
  }));
  const log: CenaLogEntry[] = [logEntry('system', 'A iniciativa foi rerolada pelo mestre.'), ...rollLogs];
  return {
    encounter: { ...enc, order, turnIndex: 0, turn: { majorUsed: false, minorUsed: false }, reactionsUsed: {} },
    log,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run utils/encounter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/encounter.ts utils/encounter.test.ts
git commit -m "feat(encounter): add rerollInitiativeOrder for mid-combat GM correction"
```

---

### Task 4: Persist `benchedCastIds` in saves (`ensureCena`)

**Files:**
- Modify: `utils/database.ts:216-232`

There is no existing test file for `utils/database.ts` (confirmed: no `database.test.ts` in the repo). This task has no automated test — verify manually per Step 2 below.

- [ ] **Step 1: Update `ensureCena`**

In `utils/database.ts`, modify the `ensureCena` function (currently lines 216-232) to add the `benchedCastIds` field to the returned object:

```ts
function ensureCena(raw: any): CenaState {
  if (!raw || typeof raw !== 'object') return createDefaultCena();
  const base = createDefaultCena();
  const { backgroundImage: _legacyBackground, ...scene } = raw.scene ?? {};
  return {
    scene: { ...base.scene, ...scene },
    npcRoster: Array.isArray(raw.npcRoster) ? raw.npcRoster.map((npc: any) => { const { deslocamento, ...rest } = npc; return { ...rest, speed:Number.isFinite(npc.speed)?npc.speed:Number.isFinite(deslocamento)?deslocamento:(npc.baseInitiative??0), conditions: Array.isArray(npc.conditions) ? npc.conditions : [], activeEffects: Array.isArray(npc.activeEffects) ? npc.activeEffects : [] }; }) : [],
    encounter: { ...base.encounter, ...(raw.encounter ?? {}),
      order: Array.isArray(raw.encounter?.order) ? raw.encounter.order : [],
      activeBuffs: Array.isArray(raw.encounter?.activeBuffs) ? raw.encounter.activeBuffs : [],
      activeFormas: Array.isArray(raw.encounter?.activeFormas) ? raw.encounter.activeFormas : [],
      preparations: Array.isArray(raw.encounter?.preparations) ? raw.encounter.preparations : [],
      reactionsUsed: (raw.encounter?.reactionsUsed && typeof raw.encounter.reactionsUsed === 'object') ? raw.encounter.reactionsUsed : {} },
    log: Array.isArray(raw.log) ? raw.log : [],
    tokens: (raw.tokens && typeof raw.tokens === 'object') ? raw.tokens : {},
    benchedCastIds: Array.isArray(raw.benchedCastIds) ? raw.benchedCastIds : [],
  };
}
```

(Only the last line, `benchedCastIds: ...`, is new. `encounter.isPaused` is already covered by the existing `{ ...base.encounter, ...(raw.encounter ?? {}) }` spread — old saves without the field fall back to `base.encounter.isPaused` which is `false`.)

- [ ] **Step 2: Type-check the project**

Run: `npx tsc --noEmit`
Expected: no new errors related to `utils/database.ts` or `utils/cena.ts` (there may be pre-existing unrelated errors elsewhere on this WIP branch — only check that nothing new appears in these two files).

- [ ] **Step 3: Commit**

```bash
git add utils/database.ts
git commit -m "fix(database): preserve benchedCastIds across cena saves/loads"
```

---

### Task 5: CSS for the GM panel button, paused tag, and modal

**Files:**
- Modify: `tabs/cena/SceneBackdrop.tsx` (the big inline `<style>` block, currently ending right before line 275's `@media(prefers-reduced-motion:reduce)` line)

There's no visual test for raw CSS; this task is verified visually in Task 8 once the components consuming these classes exist. For now just add the rules.

- [ ] **Step 1: Add the new CSS rules**

In `tabs/cena/SceneBackdrop.tsx`, find this line (the `@media(prefers-reduced-motion:reduce)` line, currently the second-to-last line inside the style template literal):

```
      @media(prefers-reduced-motion:reduce){.cena-backdrop__weather,.cena-token,.cena-turn-card,.cena-command,.cena-floating-card,.cena-cinematic-event{animation:none!important}.cena-target-fx__aura,.cena-target-fx__aura:before,.cena-target-fx__aura i,.cena-target-fx__aura b,.cena-target-fx__condition,.cena-target-fx__condition:before,.cena-target-fx__number,.cena-combatant__result-glow{animation-duration:.01ms!important;animation-iteration-count:1!important}.cena-journal-drawer{transition:none}}
```

Insert a new line immediately **before** it with:

```
      .cena-combatants-head__nav button:disabled{opacity:.35;cursor:not-allowed;filter:grayscale(.4)}
      .cena-combatants-head__pause-tag{align-self:center;padding:3px 8px;color:#ffd9a0;background:rgba(180,45,68,.22);border:1px solid #b8425a;font:800 9px 'Barlow Semi Condensed',sans-serif;letter-spacing:1.4px;border-radius:3px}
      .cena-combatants-head__gm-btn{width:38px;height:36px;display:grid;place-items:center;color:#e8d7b9;background:linear-gradient(145deg,#3d3427,#201c17);border:1px solid #6d5c42;cursor:pointer;border-radius:4px}
      .cena-combatants-head__gm-btn:hover{filter:brightness(1.2)}
      .cena-gm-modal .cena-editor{max-width:560px}
      .cena-gm-modal__section{padding:16px 22px;border-bottom:1px solid #3a3448}
      .cena-gm-modal__section:last-of-type{border-bottom:0}
      .cena-gm-modal__section h3{margin:0 0 4px;font:600 15px Georgia,serif;color:#f0e4d2}
      .cena-gm-modal__section p{margin:0 0 10px;color:#9f97ad;font-size:12px}
      .cena-gm-modal__row{display:flex;gap:8px;flex-wrap:wrap}
      .cena-gm-modal__row button{flex:1;min-width:140px;padding:10px 12px;color:#e9daee;background:#272236;border:1px solid #6d5a79;font:700 11px 'Barlow Semi Condensed',sans-serif;letter-spacing:.6px;cursor:pointer}
      .cena-gm-modal__row button.is-danger{color:#ffd9de;background:#3a1620;border-color:#8a3345}
      .cena-gm-modal__list{display:flex;flex-direction:column;gap:5px;max-height:180px;overflow:auto;margin-top:8px}
      .cena-gm-modal__list-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;background:#171724;border:1px solid #423c52;color:#e4d8c8;font-size:12px}
      .cena-gm-modal__list-row button{padding:5px 9px;color:#d1c5b5;background:#211b28;border:1px solid #5a4f68;cursor:pointer;font-size:10px;letter-spacing:.5px}
```

- [ ] **Step 2: Sanity check the file still parses**

Run: `npx tsc --noEmit`
Expected: no new errors (this is a template string change only, should be a no-op for the type checker).

- [ ] **Step 3: Commit**

```bash
git add tabs/cena/SceneBackdrop.tsx
git commit -m "style(cena): add CSS for GM panel button and modal"
```

---

### Task 6: `RosterPanel` — gear button + paused indicator

**Files:**
- Modify: `tabs/cena/RosterPanel.tsx:1-4` (imports), `tabs/cena/RosterPanel.tsx:12-29` (props interface), `tabs/cena/RosterPanel.tsx:118-121` (component signature), `tabs/cena/RosterPanel.tsx:148-158` (header render)
- Test: `tabs/cena/RosterPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `tabs/cena/RosterPanel.test.tsx`, at the end of the `describe('RosterPanel', ...)` block (after the last test, currently ending around line 129):

```ts
  it('mostra o botão do painel do mestre e dispara onOpenGmPanel', () => {
    const onOpenGmPanel = vi.fn();
    const party = [fakeChar('p1', { role: 'cast', name: 'Doravar' })];
    render(
      <RosterPanel party={party} npcRoster={[]} importable={[]} active={null} round={1}
        orderIds={['p1']} currentTurnId="p1" onOpenGmPanel={onOpenGmPanel}
        onSelectActive={() => {}} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    expect(onOpenGmPanel).toHaveBeenCalled();
  });

  it('quando pausado, desabilita os botões de turno e mostra a tag PAUSADO', () => {
    const party = [fakeChar('p1', { role: 'cast', name: 'Doravar' })];
    render(
      <RosterPanel party={party} npcRoster={[]} importable={[]} active={null} round={1}
        orderIds={['p1']} currentTurnId="p1" turnControlsDisabled
        onSelectActive={() => {}} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    expect(screen.getByText('PAUSADO')).toBeTruthy();
    expect(screen.getByRole('button', { name: /turno anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /próximo turno/i })).toBeDisabled();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: FAIL — no element matches `/painel do mestre/i`; `turnControlsDisabled` prop doesn't exist yet so buttons aren't disabled and `PAUSADO` text isn't rendered.

- [ ] **Step 3: Implement the gear button and paused state**

In `tabs/cena/RosterPanel.tsx`, update the lucide-react import (line 3):

```ts
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, Settings, Shield, Swords, Trash2 } from 'lucide-react';
```

Add two new optional props to `RosterPanelProps` (after `onRemoveNpc: (npcId: string) => void;` on line 28):

```ts
  onRemoveNpc: (npcId: string) => void;
  onOpenGmPanel?: () => void;
  turnControlsDisabled?: boolean;
```

Update the component signature (currently lines 118-121) to destructure the new props:

```ts
const RosterPanel: React.FC<RosterPanelProps> = ({
  party, npcRoster, importable, active, currentTurnId = null, targetFeedback = null, round, orderIds = [], onPrevTurn, onNextTurn, onEditCharacter,
  onSelectActive, onImportNpc, onToggleHidden, onTogglePresent, onRemoveNpc, onOpenGmPanel, turnControlsDisabled = false,
}) => {
```

Update the header render (currently lines 148-158):

```tsx
    <header className="cena-section-head cena-combatants-head">
      {round ? <RoundClock round={round} currentIndex={orderIds.indexOf(currentTurnId ?? '')} total={orderIds.length} /> : <div><span>COMPANHIA</span><strong>COMBATENTES</strong></div>}
      {round ? <div className="cena-combatants-head__nav">
        {turnControlsDisabled && <span className="cena-combatants-head__pause-tag">PAUSADO</span>}
        <button aria-label="Turno anterior" disabled={turnControlsDisabled} onClick={onPrevTurn}><ChevronLeft size={18} /></button>
        <button aria-label="Próximo turno" disabled={turnControlsDisabled} onClick={onNextTurn}><ChevronRight size={18} /></button>
        {onOpenGmPanel && <button aria-label="Painel do mestre" className="cena-combatants-head__gm-btn" onClick={onOpenGmPanel}><Settings size={16} /></button>}
      </div> : <div role="tablist" aria-label="Filtrar combatentes" className="cena-roster__filters">
        <button role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>TODOS</button>
        <button role="tab" aria-selected={filter === 'party'} onClick={() => setFilter('party')}>PARTY {party.length}</button>
        <button role="tab" aria-selected={filter === 'npcs'} onClick={() => setFilter('npcs')}>NPCS {npcRoster.length}</button>
      </div>}
    </header>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tabs/cena/RosterPanel.test.tsx`
Expected: PASS (all tests in the file, including the 2 new ones).

- [ ] **Step 5: Commit**

```bash
git add tabs/cena/RosterPanel.tsx tabs/cena/RosterPanel.test.tsx
git commit -m "feat(roster): add GM panel button and paused turn-controls state"
```

---

### Task 7: `GmControlModal` component

**Files:**
- Create: `tabs/cena/GmControlModal.tsx`

This is a pure presentational component with no dice/game logic of its own — like `CombatantEditor.tsx`, it has no dedicated test file. It's exercised through `CenaTab.test.tsx` in Task 9. Write it directly (no TDD loop for this task, matching the existing pattern for this kind of file in this codebase).

- [ ] **Step 1: Create the component**

Create `tabs/cena/GmControlModal.tsx`:

```tsx
import React from 'react';
import { Settings, X } from 'lucide-react';
import type { Character } from '../../types';
import type { NpcEntry } from '../../utils/cena';

export interface GmControlModalProps {
  isPaused: boolean;
  round: number;
  fullCast: Character[];
  benchedIds: string[];
  npcRoster: NpcEntry[];
  importableNpcs: Character[];
  onTogglePause: () => void;
  onToggleBench: (id: string) => void;
  onImportNpc: (id: string) => void;
  onRemoveNpc: (id: string) => void;
  onResetAllStatus: () => void;
  onClearLog: () => void;
  onRerollInitiative: () => void;
  onEndCombat: () => void;
  onClose: () => void;
}

const GmControlModal: React.FC<GmControlModalProps> = ({
  isPaused, round, fullCast, benchedIds, npcRoster, importableNpcs,
  onTogglePause, onToggleBench, onImportNpc, onRemoveNpc,
  onResetAllStatus, onClearLog, onRerollInitiative, onEndCombat, onClose,
}) => (
  <div className="cena-editor-backdrop cena-gm-modal" role="dialog" aria-modal="true" aria-label="Painel do mestre">
    <div className="cena-editor">
      <header>
        <Settings size={28} aria-hidden />
        <div><span>MESTRE</span><h2>Painel do Mestre</h2><p>Rodada {round}</p></div>
        <button aria-label="Fechar painel do mestre" onClick={onClose}><X size={20} /></button>
      </header>

      <section className="cena-gm-modal__section">
        <h3>Combate</h3>
        <p>{isPaused ? 'O avanço de turno está pausado.' : 'O combate está correndo normalmente.'}</p>
        <div className="cena-gm-modal__row">
          <button onClick={onTogglePause}>{isPaused ? 'RETOMAR COMBATE' : 'PAUSAR COMBATE'}</button>
          <button onClick={onRerollInitiative}>REROLAR INICIATIVA</button>
          <button className="is-danger" onClick={onEndCombat}>REINICIAR COMBATE</button>
        </div>
      </section>

      <section className="cena-gm-modal__section">
        <h3>Status</h3>
        <p>Cura todo mundo ao máximo e remove condições/efeitos ativos.</p>
        <div className="cena-gm-modal__row">
          <button className="is-danger" onClick={onResetAllStatus}>REINICIAR STATUS DE TODOS</button>
        </div>
      </section>

      <section className="cena-gm-modal__section">
        <h3>Combatentes</h3>
        <p>Elenco</p>
        <div className="cena-gm-modal__list">
          {fullCast.map(character => {
            const benched = benchedIds.includes(character.id);
            return <div className="cena-gm-modal__list-row" key={character.id}>
              <span>{character.name}</span>
              <button onClick={() => onToggleBench(character.id)}>{benched ? 'REINCLUIR' : 'BANIR'}</button>
            </div>;
          })}
        </div>
        <p>NPCs no combate</p>
        <div className="cena-gm-modal__list">
          {npcRoster.length === 0 && <span style={{ color: '#746e65', fontSize: 12 }}>Nenhum NPC na cena.</span>}
          {npcRoster.map(npc => <div className="cena-gm-modal__list-row" key={npc.id}>
            <span>{npc.name}</span>
            <button onClick={() => onRemoveNpc(npc.id)}>REMOVER</button>
          </div>)}
        </div>
        <p>Adicionar NPC</p>
        <div className="cena-gm-modal__list">
          {importableNpcs.length === 0 && <span style={{ color: '#746e65', fontSize: 12 }}>Nenhum NPC disponível.</span>}
          {importableNpcs.map(character => <div className="cena-gm-modal__list-row" key={character.id}>
            <span>{character.name}</span>
            <button onClick={() => onImportNpc(character.id)}>ADICIONAR</button>
          </div>)}
        </div>
      </section>

      <section className="cena-gm-modal__section">
        <h3>Log</h3>
        <div className="cena-gm-modal__row">
          <button className="is-danger" onClick={onClearLog}>LIMPAR LOG DE COMBATE</button>
        </div>
      </section>
    </div>
  </div>
);

export default GmControlModal;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from `tabs/cena/GmControlModal.tsx` (it's not wired into `CenaTab.tsx` yet, so it should compile standalone — an unused-file warning, if any, is not an error and is resolved in Task 8).

- [ ] **Step 3: Commit**

```bash
git add tabs/cena/GmControlModal.tsx
git commit -m "feat(cena): add GmControlModal component"
```

---

### Task 8: Wire `GmControlModal` into `CenaTab`

**Files:**
- Modify: `tabs/CenaTab.tsx:1-22` (imports), `tabs/CenaTab.tsx:54-67` (state), `tabs/CenaTab.tsx:78` (party filter), `tabs/CenaTab.tsx:489` area (new handlers, before the `return`), `tabs/CenaTab.tsx:520-537` (RosterPanel wiring), `tabs/CenaTab.tsx:542-546` area (modal render)

No new test file changes in this task — integration tests come in Task 9. This task is verified by running the full `CenaTab.test.tsx` suite at the end and confirming no new failures (baseline: 11 passed / 3 pre-existing failures, per the plan header).

- [ ] **Step 1: Update imports**

In `tabs/CenaTab.tsx`, change line 5 (import from `'../utils/cena'`) to:

```ts
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken, updateNpcStats, appendLog, logEntry, setEncounterPaused, benchCastMember, unbenchCastMember, clearLog } from '../utils/cena';
```

Change line 6 (import from `'../utils/actions'`) to:

```ts
import { actorActions, normalizeArsenalCard, resolveAction, applyStatDelta, resetVitals, type ResolvedAction, type StatSnapshot } from '../utils/actions';
```

Change line 7 (import from `'../utils/encounter'`) to:

```ts
import { startEncounter, advanceTurn, prevTurn, reorderEncounter, tickFieldEffects, rerollInitiativeOrder } from '../utils/encounter';
```

Add a new import line after the `CombatantEditor` import (currently line 16):

```ts
import GmControlModal from './cena/GmControlModal';
```

- [ ] **Step 2: Add the `gmModalOpen` state**

In `tabs/CenaTab.tsx`, add a new line right after `const [editingId, setEditingId] = React.useState<string | null>(null);` (currently line 62):

```ts
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [gmModalOpen, setGmModalOpen] = React.useState(false);
```

- [ ] **Step 3: Exclude benched cast members from `party`, add `fullCast`**

In `tabs/CenaTab.tsx`, change line 78 from:

```ts
  const party = characters.filter(c => (c.role ?? 'npc') === 'cast');
```

to:

```ts
  const fullCast = characters.filter(c => (c.role ?? 'npc') === 'cast');
  const party = fullCast.filter(c => !cena.benchedCastIds.includes(c.id));
```

- [ ] **Step 4: Extract shared NPC import/remove handlers**

In `tabs/CenaTab.tsx`, find the `onSceneChange`/`selectById` block (currently lines 355-359):

```ts
  const onSceneChange = (partial: Partial<SceneState>) => updateCena(setScene(cena, partial));
  const selectById = (id: string) => {
    if (party.some(c => c.id === id)) setActive({ id, side: 'party' });
    else if (cena.npcRoster.some(n => n.id === id)) setActive({ id, side: 'npc' });
  };
```

Add two new functions right after it:

```ts
  const importNpc = (id: string) => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); };
  const removeNpcFromCombat = (id: string) => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); };
```

Then update the `RosterPanel` usage (currently lines 532 and 535) to use them instead of the inline lambdas:

```tsx
            onImportNpc={importNpc}
```

```tsx
            onRemoveNpc={removeNpcFromCombat}
```

(These replace `onImportNpc={id => { const c = npcChars.find(x => x.id === id); if (c) updateCena(addNpcFromCharacter(cena, c)); }}` and `onRemoveNpc={id => { updateCena(removeNpc(cena, id)); setActive(prev => (prev?.side === 'npc' && prev.id === id ? null : prev)); }}` respectively — same behavior, now named and reusable.)

- [ ] **Step 5: Add GM action handlers**

In `tabs/CenaTab.tsx`, add the following right after `goNextTurn` ends (currently the closing `};` on line 489, right before the `return (`):

```ts
  const onTogglePause = () => updateCena(setEncounterPaused(cena, !cena.encounter.isPaused));

  const onToggleBench = (id: string) =>
    updateCena(cena.benchedCastIds.includes(id) ? unbenchCastMember(cena, id) : benchCastMember(cena, id));

  const onResetAllStatus = () => {
    if (!window.confirm('Reiniciar o status de todos os combatentes (cura total e remove condições)?')) return;
    fullCast.forEach(character => updateCharacterStats(character.id, resetVitals(character)));
    updateCena({ ...cena, npcRoster: cena.npcRoster.map(npc => ({ ...npc, ...resetVitals(npc) })) });
  };

  const onClearLog = () => {
    if (!window.confirm('Limpar todo o log de combate?')) return;
    updateCena(clearLog(cena));
  };

  const onRerollInitiative = () => {
    if (!window.confirm('Rerolar a iniciativa de todos os presentes?')) return;
    const { encounter, log } = rerollInitiativeOrder(cena.encounter, initiativeParticipants);
    updateCena(appendLog({ ...cena, encounter }, log));
  };

  const onEndCombat = () => {
    if (!window.confirm('Reiniciar o combate do zero? Isso limpa o log e sorteia uma nova iniciativa.')) return;
    updateCena(startEncounter({ ...cena, log: [] }, initiativeParticipants));
    setGmModalOpen(false);
  };
```

- [ ] **Step 6: Pass the new props to `RosterPanel` and render the modal**

In `tabs/CenaTab.tsx`, update the `RosterPanel` element (currently lines 522-536) to add `onOpenGmPanel` and `turnControlsDisabled`:

```tsx
          <RosterPanel
            party={party} npcRoster={cena.npcRoster} importable={importable} active={active}
            currentTurnId={turnEntry?.refId ?? null}
            targetFeedback={targetEffect}
            round={combat ? cena.encounter.round : undefined}
            orderIds={combat ? cena.encounter.order.map(entry => entry.refId) : []}
            onPrevTurn={combat ? () => updateCena({ ...cena, encounter: prevTurn(cena.encounter, isDefeatedEntry) }) : undefined}
            onNextTurn={combat ? goNextTurn : undefined}
            onEditCharacter={setEditingId}
            onSelectActive={ref => (combat && armed) ? onParticipantClick(ref.id) : setActive(ref)}
            onImportNpc={importNpc}
            onToggleHidden={id => updateCena(toggleNpcHidden(cena, id))}
            onTogglePresent={id => updateCena(toggleNpcPresent(cena, id))}
            onRemoveNpc={removeNpcFromCombat}
            onOpenGmPanel={() => setGmModalOpen(true)}
            turnControlsDisabled={cena.encounter.isPaused}
          />
```

Add the modal render right after the `CombatantEditor` block (currently lines 542-546, ending with `}} />}`):

```tsx
      {gmModalOpen && <GmControlModal
        isPaused={cena.encounter.isPaused}
        round={cena.encounter.round}
        fullCast={fullCast}
        benchedIds={cena.benchedCastIds}
        npcRoster={cena.npcRoster}
        importableNpcs={importable}
        onTogglePause={onTogglePause}
        onToggleBench={onToggleBench}
        onImportNpc={importNpc}
        onRemoveNpc={removeNpcFromCombat}
        onResetAllStatus={onResetAllStatus}
        onClearLog={onClearLog}
        onRerollInitiative={onRerollInitiative}
        onEndCombat={onEndCombat}
        onClose={() => setGmModalOpen(false)}
      />}
```

- [ ] **Step 7: Type-check and run the existing CenaTab test suite**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: 11 passed, 3 failed (same pre-existing baseline as before this task — no new failures introduced).

- [ ] **Step 8: Commit**

```bash
git add tabs/CenaTab.tsx
git commit -m "feat(cena): wire GM control modal into CenaTab"
```

---

### Task 9: Integration tests for the GM panel in `CenaTab`

**Files:**
- Modify: `tabs/CenaTab.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block at the end of `tabs/CenaTab.test.tsx` (after the last existing `describe` block, currently ending at line 222):

```ts
describe('CenaTab — painel do mestre', () => {
  afterEach(() => vi.restoreAllMocks());

  const combatCena = (over: Partial<ReturnType<typeof createDefaultCena>> = {}) => ({
    ...createDefaultCena(),
    encounter: { ...createDefaultEncounter(), isActive: true, round: 2, turnIndex: 0, order: [
      { refId: 'p1', side: 'party' as const, initiative: 20 },
      { refId: 'p2', side: 'party' as const, initiative: 10 },
    ] },
    ...over,
  });

  it('abre o painel e alterna pausar/retomar o combate', () => {
    const updateCena = vi.fn();
    render(<CenaTab {...props(combatCena(), [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    expect(screen.getByRole('dialog', { name: /painel do mestre/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /pausar combate/i }));
    expect(updateCena.mock.calls[0][0].encounter.isPaused).toBe(true);
  });

  it('pausado desabilita os botões de turno no roster', () => {
    render(<CenaTab {...props(combatCena({ encounter: { ...combatCena().encounter, isPaused: true } }), [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')])} />);
    expect(screen.getByRole('button', { name: /próximo turno/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /turno anterior/i })).toBeDisabled();
  });

  it('banir um membro do elenco o remove da ordem de combate', () => {
    const updateCena = vi.fn();
    render(<CenaTab {...props(combatCena(), [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^banir$/i })[0]);
    expect(updateCena.mock.calls[0][0].benchedCastIds).toEqual(['p1']);
  });

  it('reinicia o status de todos os combatentes após confirmar', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const updateCharacterStats = vi.fn();
    const updateCena = vi.fn();
    const wounded = cast('p1', 'Shinkai', { currentHp: 3, currentAura: 1, conditions: [{ name: 'Queimando', duration: 2 }] });
    render(<CenaTab {...props(combatCena(), [wounded, cast('p2', 'Mikhail')], { updateCharacterStats, updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    fireEvent.click(screen.getByRole('button', { name: /reiniciar status de todos/i }));
    expect(updateCharacterStats).toHaveBeenCalledWith('p1', expect.objectContaining({ currentHp: 20, currentAura: 10, conditions: [] }));
    expect(updateCharacterStats).toHaveBeenCalledWith('p2', expect.objectContaining({ currentHp: 20, currentAura: 10 }));
  });

  it('não reinicia o status se o mestre cancelar a confirmação', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const updateCharacterStats = vi.fn();
    render(<CenaTab {...props(combatCena(), [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')], { updateCharacterStats })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    fireEvent.click(screen.getByRole('button', { name: /reiniciar status de todos/i }));
    expect(updateCharacterStats).not.toHaveBeenCalled();
  });

  it('limpa o log de combate após confirmar', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const updateCena = vi.fn();
    const cena = { ...combatCena(), log: [{ id: 'old', kind: 'system' as const, text: 'registro', timestamp: 1 }] };
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    fireEvent.click(screen.getByRole('button', { name: /limpar log de combate/i }));
    expect(updateCena.mock.calls[0][0].log).toEqual([]);
  });

  it('rerola a iniciativa após confirmar', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const updateCena = vi.fn();
    render(<CenaTab {...props(combatCena(), [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    fireEvent.click(screen.getByRole('button', { name: /rerolar iniciativa/i }));
    const nextEncounter = updateCena.mock.calls[0][0].encounter;
    expect(nextEncounter.turnIndex).toBe(0);
    expect(nextEncounter.order.map((entry: any) => entry.refId).sort()).toEqual(['p1', 'p2']);
  });

  it('reinicia o combate do zero após confirmar', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const updateCena = vi.fn();
    const cena = { ...combatCena(), log: [{ id: 'old', kind: 'system' as const, text: 'registro', timestamp: 1 }] };
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai'), cast('p2', 'Mikhail')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /painel do mestre/i }));
    fireEvent.click(screen.getByRole('button', { name: /reiniciar combate/i }));
    const [next] = updateCena.mock.calls.at(-1)!;
    expect(next.log).not.toEqual([]);
    expect(next.encounter.isActive).toBe(true);
    expect(next.encounter.round).toBe(1);
    expect(screen.queryByRole('dialog', { name: /painel do mestre/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL on all the new tests in the "painel do mestre" block (no gear button exists yet if Task 8 wasn't completed first — if Tasks 1-8 are already done at this point, this step should mostly PASS already except for anything you got wrong; treat any failure here as a real signal to fix, not an expected-fail step, since Task 8 already wired the feature).

> Note: unlike earlier tasks, this task's tests exercise code that Task 8 already implemented. If you're executing tasks strictly in order, these tests should pass on the first try — that's fine, it still confirms the integration end-to-end. Run this step anyway and treat any red test as a real bug to fix in `tabs/CenaTab.tsx`, `tabs/cena/GmControlModal.tsx`, or `tabs/cena/RosterPanel.tsx`.

- [ ] **Step 3: Fix any failures, then confirm green**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: 11 + 8 = 19 passed, 3 failed (the same 3 pre-existing, unrelated failures from the baseline — no more, no less).

- [ ] **Step 4: Commit**

```bash
git add tabs/CenaTab.test.tsx
git commit -m "test(cena): cover GM control modal integration in CenaTab"
```

---

### Task 10: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the pre-existing baseline, plus all new tests from Tasks 1, 2, 3, 6, 9 passing. No new failures anywhere in the repo.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no new type errors attributable to files touched in this plan (`utils/cena.ts`, `utils/actions.ts`, `utils/encounter.ts`, `utils/database.ts`, `tabs/cena/SceneBackdrop.tsx`, `tabs/cena/RosterPanel.tsx`, `tabs/cena/GmControlModal.tsx`, `tabs/CenaTab.tsx`).

- [ ] **Step 3: Manual smoke test via dev server**

Start the dev server, open the Cena tab with an active combat, click the gear icon next to the turn controls, and confirm:
- The modal opens with sections Combate / Status / Combatentes / Log.
- "PAUSAR COMBATE" toggles to "RETOMAR COMBATE" and disables the turn arrows with a "PAUSADO" tag.
- "BANIR" on a cast member removes them from the map/roster; "REINCLUIR" brings them back.
- "REINICIAR STATUS DE TODOS" (after confirming) fully heals everyone and clears their condition badges.
- "LIMPAR LOG DE COMBATE" empties the journal drawer.
- "REROLAR INICIATIVA" reshuffles the turn order card list.
- "REINICIAR COMBATE" resets round to 1 and clears the log, closing the modal.

- [ ] **Step 4: Final commit (only if smoke testing turned up fixes)**

If Step 3 required any code changes, commit them with an appropriately scoped message. If no changes were needed, there is nothing to commit for this task.
