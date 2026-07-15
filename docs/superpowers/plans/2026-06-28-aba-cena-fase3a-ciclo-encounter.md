# Aba "Cena" — Fase 3A: Ciclo do Encounter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar vida ao ciclo de combate: **Iniciar Combate** rola iniciativa (1d20 + baseInitiative) da party + NPCs presentes e monta a ordem; botões avançam/retrocedem turno (pulando caídos, incrementando rodada na volta); **Encerrar** limpa tudo. O `InitiativeTracker` passa a refletir a ordem real e o turno ativo. Sem resolução de ações (Fase 3B) nem condições automáticas (Fase 3C).

**Architecture:** Lógica de combate pura em **novo** `utils/encounter.ts` (iniciativa, avanço de turno, fim) — separado de `utils/cena.ts` (que mantém forma do estado + helpers de scene/npc/token e ganha helpers de log). A `CenaTab` deixa o toggle real (start/end), deriva o "ator do turno" de `encounter.order[turnIndex]`, e alimenta o `InitiativeTracker` com a ordem resolvida + handlers de turno.

**Tech Stack:** React 19 + TS, Vite, Vitest + @testing-library/react (sem jest-dom; `afterEach(cleanup)`). Reusa `rollDice` de `utils/dice.ts`.

**Verificação global:** `npx vitest run` · `npx tsc --noEmit` (baseline = 3 erros pré-existentes: App.tsx 4760/5654, vitest.config.ts) · `npm run build`.

---

## Estrutura de arquivos (Fase 3A)

- **Modificar** `utils/cena.ts` — helpers de log `logEntry`, `appendLog`.
- **Criar** `utils/encounter.ts` — `sortInitiative`, `rollInitiative`, `startEncounter`, `advanceTurn`, `prevTurn`, `endEncounter`.
- **Criar** `utils/encounter.test.ts`.
- **Modificar** `utils/cena.test.ts` — testes de `logEntry`/`appendLog`.
- **Modificar** `tabs/cena/InitiativeTracker.tsx` — esmaecer caídos + botões prev/next.
- **Modificar** `tabs/cena/InitiativeTracker.test.tsx`.
- **Modificar** `tabs/CenaTab.tsx` — start/end reais + ator do turno + fiação do tracker.
- **Modificar** `tabs/CenaTab.test.tsx`.

Convenção de teste: `import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/react'; afterEach(() => cleanup());`

---

## Task 1: Helpers de log + ciclo do encounter

**Files:**
- Modify: `utils/cena.ts`, `utils/cena.test.ts`
- Create: `utils/encounter.ts`, `utils/encounter.test.ts`

- [ ] **Step 1: Testes de log (falham primeiro)**

Em `utils/cena.test.ts`, adicionar `logEntry, appendLog` aos imports de `./cena` e:
```ts
describe('log helpers', () => {
  it('logEntry cria entrada com kind/text e id único', () => {
    const a = logEntry('system', 'Olá');
    const b = logEntry('roll', 'Rolagem');
    expect(a.kind).toBe('system');
    expect(a.text).toBe('Olá');
    expect(typeof a.timestamp).toBe('number');
    expect(a.id).not.toBe(b.id);
  });
  it('appendLog anexa sem mutar o original', () => {
    const cena = createDefaultCena();
    const next = appendLog(cena, [logEntry('system', 'x')]);
    expect(next.log).toHaveLength(1);
    expect(cena.log).toHaveLength(0);
    expect(next).not.toBe(cena);
  });
});
```

- [ ] **Step 2: Implementar log helpers**

Em `utils/cena.ts`, ao final do arquivo:
```ts
let _logSeq = 0;
/** Cria uma entrada de log com id único e timestamp atual. */
export function logEntry(kind: CenaLogEntry['kind'], text: string): CenaLogEntry {
  _logSeq += 1;
  return { id: `log-${Date.now()}-${_logSeq}`, kind, text, timestamp: Date.now() };
}
/** Anexa entradas ao log (imutável). */
export function appendLog(cena: CenaState, entries: CenaLogEntry[]): CenaState {
  return { ...cena, log: [...cena.log, ...entries] };
}
```

- [ ] **Step 3: Testes do encounter (falham primeiro)**

Create `utils/encounter.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sortInitiative, startEncounter, advanceTurn, prevTurn, endEncounter, type InitiativeParticipant } from './encounter';
import { createDefaultCena, type EncounterEntry, type EncounterState } from './cena';

const P = (id: string, side: 'party' | 'npc', baseInitiative: number): InitiativeParticipant =>
  ({ id, side, name: id, baseInitiative });

describe('sortInitiative', () => {
  it('ordena por total desc, empate por baseInitiative desc', () => {
    const order = sortInitiative([
      { id: 'a', side: 'party', baseInitiative: 1, total: 15 },
      { id: 'b', side: 'npc', baseInitiative: 5, total: 20 },
      { id: 'c', side: 'party', baseInitiative: 9, total: 15 },
    ]);
    expect(order.map(e => e.refId)).toEqual(['b', 'c', 'a']);
    expect(order[0]).toEqual({ refId: 'b', side: 'npc', initiative: 20 });
  });
});

describe('startEncounter', () => {
  it('ativa o encounter, monta a ordem e loga', () => {
    const next = startEncounter(createDefaultCena(), [P('a', 'party', 2), P('b', 'npc', 0)]);
    expect(next.encounter.isActive).toBe(true);
    expect(next.encounter.round).toBe(1);
    expect(next.encounter.turnIndex).toBe(0);
    expect(next.encounter.order).toHaveLength(2);
    // iniciativa total dentro do intervalo possível (1..20 + base)
    for (const e of next.encounter.order) {
      const base = e.refId === 'a' ? 2 : 0;
      expect(e.initiative).toBeGreaterThanOrEqual(1 + base);
      expect(e.initiative).toBeLessThanOrEqual(20 + base);
    }
    expect(next.log.length).toBeGreaterThanOrEqual(3); // system + 2 rolls
  });
});

describe('advanceTurn / prevTurn', () => {
  const enc = (turnIndex: number, round = 1): EncounterState => ({
    isActive: true, round, turnIndex,
    order: [
      { refId: 'a', side: 'party', initiative: 30 },
      { refId: 'b', side: 'npc', initiative: 20 },
      { refId: 'c', side: 'party', initiative: 10 },
    ] as EncounterEntry[],
  });
  const none = () => false;

  it('avança o turno', () => {
    expect(advanceTurn(enc(0), none).turnIndex).toBe(1);
  });
  it('dá a volta e incrementa a rodada', () => {
    const r = advanceTurn(enc(2, 1), none);
    expect(r.turnIndex).toBe(0);
    expect(r.round).toBe(2);
  });
  it('pula caídos', () => {
    const defeatedB = (e: EncounterEntry) => e.refId === 'b';
    expect(advanceTurn(enc(0), defeatedB).turnIndex).toBe(2);
  });
  it('todos caídos: não move', () => {
    expect(advanceTurn(enc(0), () => true).turnIndex).toBe(0);
  });
  it('prevTurn retrocede e decrementa rodada na volta (min 1)', () => {
    expect(prevTurn(enc(1), none).turnIndex).toBe(0);
    const r = prevTurn(enc(0, 2), none);
    expect(r.turnIndex).toBe(2);
    expect(r.round).toBe(1);
  });
});

describe('endEncounter', () => {
  it('desliga e limpa a ordem', () => {
    const started = startEncounter(createDefaultCena(), [P('a', 'party', 0)]);
    const ended = endEncounter(started);
    expect(ended.encounter.isActive).toBe(false);
    expect(ended.encounter.order).toEqual([]);
    expect(ended.encounter.round).toBe(1);
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run utils/cena.test.ts utils/encounter.test.ts`
Expected: FAIL (helpers/módulo inexistentes).

- [ ] **Step 5: Implementar `utils/encounter.ts`**

Create `utils/encounter.ts`:
```ts
import { rollDice } from './dice';
import type { CenaState, CenaLogEntry, EncounterEntry, EncounterState } from './cena';
import { appendLog, logEntry } from './cena';

export interface InitiativeParticipant {
  id: string;
  side: 'party' | 'npc';
  name: string;
  baseInitiative: number;
}

/** Rola 1d20 + baseInitiative. */
export function rollInitiative(baseInitiative: number): number {
  return rollDice('1d20').total + baseInitiative;
}

/** Ordena por total desc; empate por baseInitiative desc. Puro. */
export function sortInitiative(
  rolled: { id: string; side: 'party' | 'npc'; baseInitiative: number; total: number }[],
): EncounterEntry[] {
  return [...rolled]
    .sort((a, b) => b.total - a.total || b.baseInitiative - a.baseInitiative)
    .map(r => ({ refId: r.id, side: r.side, initiative: r.total }));
}

/** Inicia o combate: rola iniciativa de todos, monta a ordem, loga. */
export function startEncounter(cena: CenaState, participants: InitiativeParticipant[]): CenaState {
  const rolled = participants.map(p => ({ ...p, total: rollInitiative(p.baseInitiative) }));
  const order = sortInitiative(rolled);
  const logs: CenaLogEntry[] = [
    logEntry('system', `Combate iniciado — ${order.length} combatente(s).`),
    ...rolled
      .slice()
      .sort((a, b) => b.total - a.total || b.baseInitiative - a.baseInitiative)
      .map(r => logEntry('roll', `${r.name} rolou iniciativa ${r.total}.`)),
  ];
  return appendLog({ ...cena, encounter: { isActive: true, round: 1, turnIndex: 0, order } }, logs);
}

/** Próximo turno: pula caídos; ao dar a volta, round++. Se todos caídos, não move. */
export function advanceTurn(enc: EncounterState, isDefeated: (e: EncounterEntry) => boolean): EncounterState {
  const n = enc.order.length;
  if (n === 0) return enc;
  let idx = enc.turnIndex;
  let round = enc.round;
  for (let step = 0; step < n; step++) {
    idx += 1;
    if (idx >= n) { idx = 0; round += 1; }
    if (!isDefeated(enc.order[idx])) return { ...enc, turnIndex: idx, round };
  }
  return enc;
}

/** Turno anterior: pula caídos; ao dar a volta, round-- (mín 1). */
export function prevTurn(enc: EncounterState, isDefeated: (e: EncounterEntry) => boolean): EncounterState {
  const n = enc.order.length;
  if (n === 0) return enc;
  let idx = enc.turnIndex;
  let round = enc.round;
  for (let step = 0; step < n; step++) {
    idx -= 1;
    if (idx < 0) { idx = n - 1; round = Math.max(1, round - 1); }
    if (!isDefeated(enc.order[idx])) return { ...enc, turnIndex: idx, round };
  }
  return enc;
}

/** Encerra o combate: desliga e limpa a ordem. */
export function endEncounter(cena: CenaState): CenaState {
  return { ...cena, encounter: { isActive: false, round: 1, turnIndex: 0, order: [] } };
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run utils/cena.test.ts utils/encounter.test.ts`
Expected: PASS. Depois `npx vitest run` → suíte verde.

- [ ] **Step 7: Commit**
```bash
git add utils/cena.ts utils/cena.test.ts utils/encounter.ts utils/encounter.test.ts
git commit -m "feat(cena): ciclo do encounter (iniciativa, turnos, log)"
```

---

## Task 2: InitiativeTracker — ordem real, caídos e botões de turno

**Files:**
- Modify: `tabs/cena/InitiativeTracker.tsx`, `tabs/cena/InitiativeTracker.test.tsx`

Adiciona: esmaecimento de caídos (currentHp ≤ 0), e props opcionais `onPrev`/`onNext` (renderiza setas ‹ › quando fornecidos).

- [ ] **Step 1: Estender o teste**

APPEND ao `tabs/cena/InitiativeTracker.test.tsx` (mantendo imports/afterEach/`ch`):
```tsx
import { fireEvent } from '@testing-library/react';

describe('InitiativeTracker — turnos e caídos', () => {
  it('chama onNext/onPrev nos botões', () => {
    const onNext = vi.fn(); const onPrev = vi.fn();
    render(<InitiativeTracker round={1} participants={[ch('p1', 'Shinkai')]} activeId="p1" onPrev={onPrev} onNext={onNext} />);
    fireEvent.click(screen.getByRole('button', { name: /próximo turno/i }));
    fireEvent.click(screen.getByRole('button', { name: /turno anterior/i }));
    expect(onNext).toHaveBeenCalled();
    expect(onPrev).toHaveBeenCalled();
  });
});
```
Adicionar `vi` ao import do vitest no topo do arquivo (`import { describe, it, expect, vi, afterEach } from 'vitest';`).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/InitiativeTracker.test.tsx`
Expected: FAIL (sem botões).

- [ ] **Step 3: Implementar**

Em `tabs/cena/InitiativeTracker.tsx`:
- Estender props:
```tsx
export interface InitiativeTrackerProps {
  round: number;
  participants: Character[];
  activeId: string | null;
  onPrev?: () => void;
  onNext?: () => void;
}
```
- Desestruturar `({ round, participants, activeId, onPrev, onNext })`.
- No avatar de cada participante, quando `p.currentHp <= 0`, aplicar `filter: 'grayscale(1)'` e `opacity: 0.4` (sobrescrevendo o opacity do ativo/normal). Concretamente, computar `const down = p.currentHp <= 0;` e no style do contêiner do participante usar `opacity: down ? 0.4 : (isActive ? 1 : 0.62)` e no avatar `filter: down ? 'grayscale(1)' : 'none'`.
- Antes da fileira de participantes (logo após o divisor vertical), inserir o botão anterior; depois da fileira (antes do "SUA VEZ"), o próximo — ambos só quando os handlers existem:
```tsx
      {onPrev && (
        <button aria-label="Turno anterior" onClick={onPrev}
          style={{ flex: 'none', width: 26, height: 26, cursor: 'pointer', background: '#15151a', border: '1px solid #2a2a30', color: '#9a9aa1', borderRadius: 3, fontSize: 14, lineHeight: 1 }}>‹</button>
      )}
```
e
```tsx
      {onNext && (
        <button aria-label="Próximo turno" onClick={onNext}
          style={{ flex: 'none', width: 26, height: 26, cursor: 'pointer', background: '#E0102B', border: 'none', color: '#fff', borderRadius: 3, fontSize: 14, lineHeight: 1 }}>›</button>
      )}
```
(Posicione `onPrev` imediatamente antes do `<div>` da fileira `flex:1`, e `onNext` imediatamente depois dele.)

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/InitiativeTracker.test.tsx`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/InitiativeTracker.tsx tabs/cena/InitiativeTracker.test.tsx
git commit -m "feat(cena): InitiativeTracker com turnos e caídos"
```

---

## Task 3: CenaTab — start/end reais + ator do turno + fiação

**Files:**
- Modify: `tabs/CenaTab.tsx`, `tabs/CenaTab.test.tsx`

- [ ] **Step 1: Atualizar o teste**

Substituir `tabs/CenaTab.test.tsx` por:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena, addNpcFromCharacter } from '../utils/cena';
import { startEncounter } from '../utils/encounter';
import type { Character } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 12, maxAura: 6, currentAura: 6,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast' };
}
const props = (cena: any, characters: Character[], updateCena: any) => ({
  cena, characters, cards: [], seals: [], items: [], weapons: [], updateCena, updateCharacterStats: () => {},
});

describe('CenaTab — iniciar/encerrar combate', () => {
  it('Iniciar Combate monta a ordem de iniciativa (party + NPCs presentes)', () => {
    const cena = createDefaultCena();
    const updateCena = vi.fn();
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai')], updateCena)} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    const next = updateCena.mock.calls[0][0];
    expect(next.encounter.isActive).toBe(true);
    expect(next.encounter.order).toHaveLength(1);
    expect(next.encounter.order[0].refId).toBe('p1');
  });

  it('com encounter ativo destaca o ator do turno no ActiveBar', () => {
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai')], () => {})} />);
    expect(screen.getByText(/seu turno/i)).toBeTruthy(); // ActiveBar em combate
    expect(screen.getByText(/rodada/i)).toBeTruthy();
  });

  it('Encerrar Combate limpa a ordem', () => {
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    const updateCena = vi.fn();
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai')], updateCena)} />);
    fireEvent.click(screen.getByRole('button', { name: /encerrar combate/i }));
    const next = updateCena.mock.calls[0][0];
    expect(next.encounter.isActive).toBe(false);
    expect(next.encounter.order).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL (toggle ainda só usa setEncounterActive; sem ator do turno real).

- [ ] **Step 3: Implementar**

Em `tabs/CenaTab.tsx`:
- Trocar o import de encounter helpers — adicionar:
```tsx
import { startEncounter, endEncounter, advanceTurn, prevTurn } from '../utils/encounter';
```
- Remover `setEncounterActive` do import de `../utils/cena` (não é mais usado aqui; manter os demais).
- Logo após `const combat = cena.encounter.isActive;`, adicionar a resolução de participante e do ator do turno:
```tsx
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
```
  (Defina `byId`/`participants` ANTES dessas linhas — `participants` já existe; mova o bloco acima para depois de `participants` e de `party`/`npcRoster`.)
- Em combate, o personagem em foco é o **ator do turno**, não a seleção manual. Trocar a derivação de `activeChar`:
```tsx
  const selectedChar: Character | null = !active
    ? null
    : active.side === 'party'
      ? party.find(c => c.id === active.id) ?? null
      : cena.npcRoster.find(n => n.id === active.id) ?? null;
  const activeChar: Character | null = combat ? turnActor : selectedChar;
```
  (substitui o `activeChar` atual; os `resolve*` de cards/seals/items/weapons continuam usando `activeChar`.)
- Trocar o `onClick` do `toggleBtn` para start/end reais:
```tsx
    <button onClick={() => updateCena(combat ? endEncounter(cena) : startEncounter(cena, initiativeParticipants))}
```
- No `InitiativeTracker`, passar a ordem resolvida, o ator do turno e os handlers:
```tsx
          ? <InitiativeTracker round={cena.encounter.round} participants={orderedParticipants} activeId={turnEntry?.refId ?? null}
              onPrev={() => updateCena({ ...cena, encounter: prevTurn(cena.encounter, isDefeatedEntry) })}
              onNext={() => updateCena({ ...cena, encounter: advanceTurn(cena.encounter, isDefeatedEntry) })} />
```
- No `MapBoard`, em combate destacar o ator do turno: trocar `activeId={active?.id ?? null}` por `activeId={combat ? (turnEntry?.refId ?? null) : (active?.id ?? null)}`.

> Nota: a seleção manual (`active`) continua valendo na exploração e seguirá útil na 3B (escolher alvo). Em combate, o ActiveBar/Selos/Ações refletem o ator do turno.

- [ ] **Step 4: Verificar tudo**

Run: `npx vitest run tabs/CenaTab.test.tsx` → PASS.
Run: `npx vitest run` → suíte verde.
Run: `npx tsc --noEmit 2>&1 | grep "error TS"` → só os 3 pré-existentes; nada em tabs/* ou utils/*.
Run: `npm run build` → sucesso.

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`. Na aba Cena com pelo menos 1 personagem `cast`:
- **Iniciar Combate** → o tracker mostra a ordem por iniciativa, com o 1º como ativo (SEU TURNO). Log registra "Combate iniciado" + rolagens.
- Setas ‹ › avançam/retrocedem o turno; ao dar a volta, a RODADA incrementa. Um participante com HP 0 fica esmaecido e é pulado.
- **Encerrar Combate** → volta à exploração; a ordem some.

- [ ] **Step 6: Commit**
```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): toggle real de combate + ator do turno"
```

---

## Self-Review (cobertura vs. spec 3A)

- **Iniciativa auto (1d20+baseInitiative), ordenada:** Task 1 (`rollInitiative`/`sortInitiative`/`startEncounter`). ✔
- **Ordem real + ativo do turno no tracker:** Tasks 2 + 3 (`orderedParticipants`, `turnEntry`). ✔
- **Avançar/retroceder turno, round na volta, pular caídos:** Tasks 1 (`advanceTurn`/`prevTurn`) + 2 (botões) + 3 (`isDefeatedEntry`). ✔
- **Encerrar limpa:** Task 1 (`endEncounter`) + 3. ✔
- **Log de início/rolagens:** Task 1 (`startEncounter` + log helpers). ✔
- **Caído (HP≤0) esmaecido:** Task 2. ✔
- **Placeholder scan / tipos:** sem TBD; `InitiativeParticipant`, `EncounterEntry`, `EncounterState`, `logEntry`/`appendLog` consistentes. ✔

## Fora de escopo (próximos planos)
- **Fase 3B — Resolução de ações:** `defense` em Character, `normalizeAction`, fluxo de alvo (clicar), `resolveAction` (rola vs defesa, dano/cura/condição, custos), `applyStatDelta`, log. Os botões de ação (ActionMenu / chips) ficam inertes até a 3B.
- **Fase 3C — Condições automáticas** (tick por rodada via PRESET_CONDITIONS).
- **Fase 2B — editor de NPC.** **Fase 4 — limpeza do legado.**
