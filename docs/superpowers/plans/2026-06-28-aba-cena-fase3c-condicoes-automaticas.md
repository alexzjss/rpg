# Aba "Cena" — Fase 3C: Condições Automáticas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao **avançar para o turno** de um participante, processar automaticamente suas condições via `PRESET_CONDITIONS`: aplicar o efeito por turno (dano/cura), decrementar a duração e remover as expiradas — tudo registrado no log. Encerra a Fase 3 (combate-lite).

**Architecture:** Marca-se em `PRESET_CONDITIONS` quais condições têm efeito por turno (`perTurn?: 'damage' | 'heal'`). Função pura `tickConditions` em **novo** `utils/conditions.ts` computa o delta de HP, a nova lista de condições (decrementada/expirada) e o log. A `CenaTab` chama o tick no handler **Próximo turno** (após `advanceTurn`), aplicando ao ator do novo turno via o `applyDeltaTo` já existente (estendido para substituir a lista de condições).

**Tech Stack:** React 19 + TS, Vite, Vitest + @testing-library/react (sem jest-dom; `afterEach(cleanup)`). Reusa `PRESET_CONDITIONS` (`types.ts`), `logEntry/appendLog` (`utils/cena.ts`), `advanceTurn` (`utils/encounter.ts`), `applyStatDelta` (`utils/actions.ts`).

**Verificação global:** `npx vitest run` · `npx tsc --noEmit` (baseline = 3 erros pré-existentes: App.tsx 4760/5654, vitest.config.ts) · `npm run build`.

---

## Estrutura de arquivos (Fase 3C)

- **Modificar** `types.ts` — `PresetConditionTemplate.perTurn?: 'damage' | 'heal'` + marcar os presets aplicáveis.
- **Criar** `utils/conditions.ts` — `tickConditions`. + `utils/conditions.test.ts`.
- **Modificar** `tabs/CenaTab.tsx` — estender `applyDeltaTo` (substituir condições) + tick no "Próximo turno". + `tabs/CenaTab.test.tsx`.

Convenção de teste: `import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/react'; afterEach(() => cleanup());`

---

## Task 1: `perTurn` nos presets de condição

**Files:**
- Modify: `types.ts`

Marca quais condições aplicam efeito por turno. Dano por turno: Queimando, Eletrocutado, Envenenado, Sangrando. Cura por turno: Regenerando. As demais só contam duração.

- [ ] **Step 1: Adicionar o campo na interface**

Em `types.ts`, na interface `PresetConditionTemplate`, adicionar o campo (após `damageType?`):
```ts
  damageType?: DamageType;
  /** Efeito aplicado no início do turno do portador. */
  perTurn?: 'damage' | 'heal';
```

- [ ] **Step 2: Marcar os presets**

Em `PRESET_CONDITIONS`, adicionar `perTurn` aos objetos correspondentes (mantendo todos os demais campos):
- `Queimando` → adicionar `perTurn: 'damage',`
- `Eletrocutado` → adicionar `perTurn: 'damage',`
- `Envenenado` → adicionar `perTurn: 'damage',`
- `Sangrando` → adicionar `perTurn: 'damage',`
- `Regenerando` → adicionar `perTurn: 'heal',`

(Não marcar Molhado, Protegido, Amaldiçoado nem as comportamentais — elas não têm efeito de HP por turno nesta fase.)

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit 2>&1 | grep "error TS"`
Expected: só os 3 pré-existentes (campo opcional novo).

Run: `npx vitest run`
Expected: suíte verde.

- [ ] **Step 4: Commit**
```bash
git add types.ts
git commit -m "feat(cena): perTurn nos presets de condição (dano/cura por turno)"
```

---

## Task 2: `tickConditions` (puro)

**Files:**
- Create: `utils/conditions.ts`, `utils/conditions.test.ts`

- [ ] **Step 1: Testes (falham primeiro)**

Create `utils/conditions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { tickConditions } from './conditions';

describe('tickConditions', () => {
  it('aplica dano por turno e decrementa a duração', () => {
    const r = tickConditions('Shinkai', [{ name: 'Queimando', duration: 2 }]);
    expect(r.delta.hp).toBe(-3); // Queimando defaultValue = 3
    expect(r.conditions).toEqual([{ name: 'Queimando', duration: 1 }]);
    expect(r.log.length).toBeGreaterThanOrEqual(1);
  });
  it('aplica cura por turno (Regenerando)', () => {
    const r = tickConditions('Shinkai', [{ name: 'Regenerando', duration: 3 }]);
    expect(r.delta.hp).toBe(3); // Regenerando defaultValue = 3
    expect(r.conditions[0].duration).toBe(2);
  });
  it('remove condição expirada (duração chega a 0) e loga', () => {
    const r = tickConditions('Shinkai', [{ name: 'Envenenado', duration: 1 }]);
    expect(r.delta.hp).toBe(-2); // efeito ainda aplica neste turno
    expect(r.conditions).toEqual([]);
    expect(r.log.some(l => /expirou/i.test(l.text))).toBe(true);
  });
  it('condição comportamental (sem perTurn) só conta duração, sem delta', () => {
    const r = tickConditions('Shinkai', [{ name: 'Paralisado', duration: 2 }]);
    expect(r.delta).toEqual({});
    expect(r.conditions).toEqual([{ name: 'Paralisado', duration: 1 }]);
  });
  it('condição desconhecida só decrementa', () => {
    const r = tickConditions('Shinkai', [{ name: 'Inexistente', duration: 2 }]);
    expect(r.delta).toEqual({});
    expect(r.conditions).toEqual([{ name: 'Inexistente', duration: 1 }]);
  });
  it('soma múltiplas condições de dano', () => {
    const r = tickConditions('Shinkai', [{ name: 'Queimando', duration: 2 }, { name: 'Envenenado', duration: 2 }]);
    expect(r.delta.hp).toBe(-5); // -3 -2
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/conditions.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Create `utils/conditions.ts`:
```ts
import { PRESET_CONDITIONS } from '../types';
import type { CenaLogEntry } from './cena';
import { logEntry } from './cena';

export interface TickResult {
  delta: { hp?: number; aura?: number; ammo?: number };
  conditions: { name: string; duration: number }[];
  log: CenaLogEntry[];
}

/**
 * Processa as condições no início do turno do portador:
 * aplica dano/cura por turno (via PRESET_CONDITIONS.perTurn), decrementa a
 * duração e remove as expiradas. Puro.
 */
export function tickConditions(holderName: string, conditions: { name: string; duration: number }[]): TickResult {
  const log: CenaLogEntry[] = [];
  let hp = 0;
  const next: { name: string; duration: number }[] = [];

  for (const cond of conditions) {
    const preset = PRESET_CONDITIONS.find(p => p.name === cond.name);
    const value = preset?.defaultValue ?? 0;
    if (preset?.perTurn === 'damage' && value) {
      hp -= value;
      log.push(logEntry('condition', `${holderName} sofre ${value} de ${cond.name}.`));
    } else if (preset?.perTurn === 'heal' && value) {
      hp += value;
      log.push(logEntry('condition', `${holderName} recupera ${value} de HP (${cond.name}).`));
    }
    const dur = cond.duration - 1;
    if (dur > 0) {
      next.push({ name: cond.name, duration: dur });
    } else {
      log.push(logEntry('condition', `${cond.name} expirou em ${holderName}.`));
    }
  }

  return { delta: hp !== 0 ? { hp } : {}, conditions: next, log };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/conditions.test.ts`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
git add utils/conditions.ts utils/conditions.test.ts
git commit -m "feat(cena): tickConditions (efeitos de condição por turno)"
```

---

## Task 3: Tick no avanço de turno (CenaTab)

**Files:**
- Modify: `tabs/CenaTab.tsx`, `tabs/CenaTab.test.tsx`

READ `tabs/CenaTab.tsx` primeiro (as linhas mudaram entre fases). O `applyDeltaTo` existe (da 3B) e o handler `onNext` do `InitiativeTracker` faz `updateCena({ ...cena, encounter: advanceTurn(cena.encounter, isDefeatedEntry) })`.

- [ ] **Step 1: Atualizar o teste**

Substituir `tabs/CenaTab.test.tsx` por:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CenaTab from './CenaTab';
import { createDefaultCena } from '../utils/cena';
import { startEncounter } from '../utils/encounter';
import type { Character, Seal } from '../types';

afterEach(() => cleanup());

function cast(id: string, name: string, over: Partial<Character> = {}): Character {
  return { id, name, icon: '', maxHp: 20, currentHp: 20, maxAura: 10, currentAura: 10,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'cast', ...over };
}
const props = (cena: any, characters: Character[], over: any = {}) => ({
  cena, characters, cards: [], seals: [], items: [], weapons: [], updateCena: () => {}, updateCharacterStats: () => {}, ...over,
});

describe('CenaTab — iniciar/encerrar + resolução (3A/3B intactos)', () => {
  it('Iniciar Combate monta a ordem', () => {
    const updateCena = vi.fn();
    render(<CenaTab {...props(createDefaultCena(), [cast('p1', 'Shinkai')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    expect(updateCena.mock.calls[0][0].encounter.order).toHaveLength(1);
  });

  it('cura self resolve imediatamente (party)', () => {
    const heal: Seal = { id: 'sh', name: 'Cura', code: '', image: '', description: '', healHp: 5 };
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    const updateCharacterStats = vi.fn();
    render(<CenaTab {...props(cena, [cast('p1', 'Shinkai', { currentHp: 10, sealIds: ['sh'] })], { seals: [heal], updateCharacterStats })} />);
    fireEvent.click(screen.getByText('HABILIDADE'));
    fireEvent.click(screen.getByRole('button', { name: /cura/i }));
    expect(updateCharacterStats).toHaveBeenCalled();
    expect(updateCharacterStats.mock.calls[0][1].currentHp).toBe(15);
  });
});

describe('CenaTab — condições automáticas (3C)', () => {
  it('avançar para o turno aplica o dano de condição ao ator do novo turno', () => {
    const cena = { ...createDefaultCena(), encounter: { isActive: true, round: 1, turnIndex: 0, order: [
      { refId: 'p1', side: 'party' as const, initiative: 20 },
      { refId: 'p2', side: 'party' as const, initiative: 10 },
    ] } };
    const updateCharacterStats = vi.fn();
    const p1 = cast('p1', 'Shinkai');
    const p2 = cast('p2', 'Mikhail', { currentHp: 20, conditions: [{ name: 'Queimando', duration: 2 }] });
    render(<CenaTab {...props(cena, [p1, p2], { updateCharacterStats })} />);
    fireEvent.click(screen.getByRole('button', { name: /próximo turno/i }));
    // p2 entra no turno → Queimando aplica -3 e decrementa
    const call = updateCharacterStats.mock.calls.find(c => c[0] === 'p2');
    expect(call).toBeTruthy();
    expect(call![1].currentHp).toBe(17);
    expect(call![1].conditions).toEqual([{ name: 'Queimando', duration: 1 }]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL (sem tick no avanço).

- [ ] **Step 3: Implementar**

Em `tabs/CenaTab.tsx`:

(a) Imports — adicionar:
```tsx
import { tickConditions } from '../utils/conditions';
```

(b) Estender `applyDeltaTo` para permitir SUBSTITUIR a lista de condições (além de anexar uma). Trocar a assinatura/corpo atual de `applyDeltaTo` por:
```tsx
  const applyDeltaTo = (cur: CenaState, id: string, delta: { hp?: number; aura?: number; ammo?: number }, condition?: { name: string; duration: number }, replaceConditions?: { name: string; duration: number }[]): CenaState => {
    const c = byId(id); if (!c) return cur;
    const stats = applyStatDelta(c, delta);
    const conditions = replaceConditions !== undefined ? replaceConditions : (condition ? [...(c.conditions ?? []), condition] : c.conditions);
    const changedConds = replaceConditions !== undefined || !!condition;
    const updates = { ...stats, ...(changedConds ? { conditions } : {}) };
    if (party.some(p => p.id === id)) { updateCharacterStats(id, updates); return cur; }
    return updateNpcStats(cur, id, updates);
  };
```

(c) Trocar o `onNext` do `InitiativeTracker` para avançar o turno E aplicar o tick ao ator do novo turno:
```tsx
              onNext={() => {
                const encNext = advanceTurn(cena.encounter, isDefeatedEntry);
                const entry = encNext.order[encNext.turnIndex];
                const actor = entry ? byId(entry.refId) : null;
                let next: CenaState = { ...cena, encounter: encNext };
                if (actor) {
                  const tick = tickConditions(actor.name, actor.conditions ?? []);
                  next = appendLog(next, tick.log);
                  next = applyDeltaTo(next, actor.id, tick.delta, undefined, tick.conditions);
                }
                updateCena(next);
              }}
```
(O `onPrev` continua igual — retroceder não re-processa condições.)

- [ ] **Step 4: Verificar tudo**

Run: `npx vitest run tabs/CenaTab.test.tsx` → PASS.
Run: `npx vitest run` → suíte verde.
Run: `npx tsc --noEmit 2>&1 | grep "error TS"` → só os 3 pré-existentes; nada em tabs/* ou utils/*.
Run: `npm run build` → sucesso.

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`. Em combate, com um participante portando uma condição de dano (ex.: aplicada por uma ação na 3B, ou semeada):
- Clicar **Próximo turno** até chegar ao portador → o log mostra o efeito da condição (ex.: "sofre 3 de Queimando"), o HP cai, e a duração decrementa; ao expirar, o log avisa e a condição some.
- Condições comportamentais (Paralisado etc.) só contam duração.

- [ ] **Step 6: Commit**
```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): condições automáticas no início do turno"
```

---

## Self-Review (cobertura vs. spec 3C)

- **Efeito por turno via PRESET_CONDITIONS:** Tasks 1 (`perTurn`) + 2 (`tickConditions`). ✔
- **Decrementa duração e remove expiradas, com log:** Task 2. ✔
- **Aplica no início do turno do ator:** Task 3 (tick no `onNext` ao ator do novo turno). ✔
- **Escrita roteada (party→Character, npc→roster):** Task 3 (`applyDeltaTo` estendido com `replaceConditions`). ✔
- **Comportamentais só contam duração:** Tasks 1 (não marcadas) + 2 (sem delta). ✔
- **Placeholder scan / tipos:** sem TBD; `TickResult`, `tickConditions`, `perTurn` consistentes. ✔

## Notas / fora de escopo
- O tick ocorre no **avançar turno** (forward). O 1º ator do round 1 só processa quando o turno cicla de volta — aceitável nesta fase.
- Penalidades de dado (Amaldiçoado/Cego) e bloqueio de ação (Paralisado/Dormindo/Desnorteado/Confuso) **não** são automatizados (apenas contam duração) — fora do escopo.
- **Fase 2B — editor de NPC.** **Fase 4 — limpeza do legado** (apagar CombatTab/JourneyTab/components/combat/*, Cozinhar/Forjar/Loja, combatMigration, campos de grid).
