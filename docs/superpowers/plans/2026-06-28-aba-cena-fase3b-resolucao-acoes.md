# Aba "Cena" — Fase 3B: Resolução de Ações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar as ações resolvíveis no combate. O **menu P5** (ActionMenu) abre, por categoria, as ações reais do ator do turno (cartas/selos/armas/itens). Escolher uma ação → clicar no alvo (token no mapa ou linha do roster) → o sistema rola `diceRoll` vs `defense` do alvo, aplica dano/cura/condição no sucesso, desconta `auraCost`/`ammoCost` (bloqueia se faltar), e registra tudo no log. HP 0 já é tratado como "caído" (3A).

**Architecture:** Lógica pura de ações em **novo** `utils/actions.ts` (`normalizeAction*`, `actorActions`, `computeResolution`, `resolveAction`, `applyStatDelta`). Campo `defense` em `Character`. `utils/cena.ts` ganha `updateNpcStats`. O `ActionMenu` vira categorias-com-submenu (escolhe uma `ResolvedAction`). A `CenaTab` arma a ação, intercepta o clique no alvo e aplica o resultado roteando por `side` (party → `updateCharacterStats`; npc → `updateCena`/`updateNpcStats`; log → `appendLog`).

**Tech Stack:** React 19 + TS, Vite, Vitest + @testing-library/react (sem jest-dom; `afterEach(cleanup)`). Reusa `rollDice` (`utils/dice.ts`), `resolveCards/resolveSeals/resolveOwnedItems/resolveWeapons` e `ResolvedItem` (`utils/items.ts`), `logEntry/appendLog` (`utils/cena.ts`).

**Verificação global:** `npx vitest run` · `npx tsc --noEmit` (baseline = 3 erros pré-existentes: App.tsx 4760/5654, vitest.config.ts) · `npm run build`.

---

## Estrutura de arquivos (Fase 3B)

- **Modificar** `types.ts` — `Character.defense?: number` + `export const DEFAULT_DEFENSE = 10`.
- **Criar** `utils/actions.ts` — tipos + `normalizeCard/Seal/Weapon/Item`, `GUARD_ACTION`, `actorActions`, `applyStatDelta`, `computeResolution`, `resolveAction`. + `utils/actions.test.ts`.
- **Modificar** `utils/cena.ts` — `updateNpcStats`. **Modificar** `utils/cena.test.ts`.
- **Modificar** `tabs/cena/ActionMenu.tsx` — categorias com submenu + `onSelectAction`. **Modificar** `tabs/cena/ActionMenu.test.tsx`.
- **Modificar** `tabs/CenaTab.tsx` — armar ação, banner de alvo, intercepção do clique, aplicar resolução. **Modificar** `tabs/CenaTab.test.tsx`.

Convenção de teste: `import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/react'; afterEach(() => cleanup());`

---

## Task 1: Campo `defense` no Character

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Adicionar o campo e a constante**

Em `types.ts`, na interface `Character`, adicionar após `baseInitiative` (mantendo as demais linhas):
```ts
  baseInitiative: number;
  defense?: number;   // defesa para teste de acerto (default DEFAULT_DEFENSE)
```
E, logo após o fechamento da interface `Character` (após a linha `}` que encerra `export interface Character`), adicionar:
```ts
/** Defesa padrão quando o personagem não tem `defense` definido. */
export const DEFAULT_DEFENSE = 10;
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit 2>&1 | grep "error TS"`
Expected: só os 3 erros pré-existentes (adicionar um campo opcional não quebra nada).

Run: `npx vitest run`
Expected: suíte verde (nenhum teste afetado).

- [ ] **Step 3: Commit**
```bash
git add types.ts
git commit -m "feat(cena): campo defense no Character + DEFAULT_DEFENSE"
```

---

## Task 2: `utils/actions.ts` — normalização de ações

**Files:**
- Create: `utils/actions.ts`, `utils/actions.test.ts`

Unifica Card/Seal/Weapon/Item numa `ResolvedAction` e agrupa por categoria do menu P5.

- [ ] **Step 1: Testes (falham primeiro)**

Create `utils/actions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { normalizeCard, normalizeSeal, normalizeWeapon, normalizeItem, actorActions, GUARD_ACTION } from './actions';
import type { Card, Seal, Weapon } from '../types';
import type { ResolvedItem } from './items';

const card = (over: Partial<Card> = {}): Card => ({ id: 'c1', name: 'Golpe', image: '', auraCost: 2, type: 'ataque', description: '', ...over });
const seal = (over: Partial<Seal> = {}): Seal => ({ id: 's1', name: 'Selo', code: '', image: '', description: '', ...over });
const weapon = (over: Partial<Weapon> = {}): Weapon => ({ id: 'w1', name: 'Espada', description: '', image: '', ...over });
const item = (over: Partial<ResolvedItem> = {}): ResolvedItem => ({ id: 'i1', name: 'Poção', description: '', image: '', quantity: 1, ...over });

describe('normalizeCard', () => {
  it('ataque → categoria atacar; mapeia dano e custo', () => {
    const a = normalizeCard(card({ type: 'ataque', damage: 7, damageType: 'fogo', auraCost: 3, diceRoll: '1d20+2' }));
    expect(a.category).toBe('atacar');
    expect(a).toMatchObject({ source: 'card', damage: 7, damageType: 'fogo', auraCost: 3, diceRoll: '1d20+2', targeting: 'other' });
  });
  it('forma → categoria forma; outros tipos → habilidade', () => {
    expect(normalizeCard(card({ type: 'forma' })).category).toBe('forma');
    expect(normalizeCard(card({ type: 'reforço' })).category).toBe('habilidade');
  });
  it('diceRoll default 1d20', () => {
    expect(normalizeCard(card({ diceRoll: undefined })).diceRoll).toBe('1d20');
  });
});

describe('normalizeSeal', () => {
  it('cura sem dano → targeting self', () => {
    const a = normalizeSeal(seal({ healHp: 5, cost: { aura: 1 } }));
    expect(a.targeting).toBe('self');
    expect(a).toMatchObject({ source: 'seal', category: 'habilidade', healHp: 5, auraCost: 1 });
  });
  it('com dano → targeting other', () => {
    expect(normalizeSeal(seal({ damage: 4 })).targeting).toBe('other');
  });
});

describe('normalizeWeapon / normalizeItem', () => {
  it('arma usa combat* com fallback', () => {
    const a = normalizeWeapon(weapon({ combatDamage: 6, combatDiceRoll: '1d20+1' }));
    expect(a).toMatchObject({ source: 'weapon', category: 'atacar', damage: 6, diceRoll: '1d20+1', targeting: 'other' });
  });
  it('item de cura → self; categoria item', () => {
    const a = normalizeItem(item({ combatHeal: 8 }));
    expect(a).toMatchObject({ source: 'item', category: 'item', healHp: 8, targeting: 'self' });
  });
});

describe('actorActions', () => {
  it('agrupa por categoria e sempre inclui GUARDA', () => {
    const groups = actorActions({
      cards: [card({ type: 'ataque' }), card({ id: 'c2', type: 'forma' })],
      seals: [seal()],
      weapons: [weapon()],
      items: [item({ usableInCombat: true })],
    });
    expect(groups.atacar.map(a => a.source).sort()).toEqual(['card', 'weapon']);
    expect(groups.forma).toHaveLength(1);
    expect(groups.habilidade.map(a => a.source)).toEqual(['seal']);
    expect(groups.item).toHaveLength(1);
    expect(groups.guarda).toEqual([GUARD_ACTION]);
  });
  it('ignora itens não usáveis em combate', () => {
    const groups = actorActions({ cards: [], seals: [], weapons: [], items: [item({ usableInCombat: false })] });
    expect(groups.item).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/actions.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Create `utils/actions.ts`:
```ts
import type { Card, DamageType, Seal, Weapon } from '../types';
import type { ResolvedItem } from './items';

export type ActionCategory = 'atacar' | 'habilidade' | 'forma' | 'item' | 'guarda';

export interface ResolvedAction {
  source: 'card' | 'seal' | 'weapon' | 'item' | 'guard';
  id: string;
  name: string;
  category: ActionCategory;
  diceRoll: string;
  damage?: number;
  damageType?: DamageType;
  healHp?: number;
  healAura?: number;
  conditionName?: string;
  conditionDuration?: number;
  auraCost?: number;
  ammoCost?: number;
  targeting: 'self' | 'other';
}

export function normalizeCard(card: Card): ResolvedAction {
  const category: ActionCategory = card.type === 'ataque' ? 'atacar' : card.type === 'forma' ? 'forma' : 'habilidade';
  return {
    source: 'card', id: card.id, name: card.name, category,
    diceRoll: card.diceRoll ?? '1d20',
    damage: card.damage, damageType: card.damageType,
    conditionName: card.conditionEffect, conditionDuration: card.conditionDuration,
    auraCost: card.auraCost, ammoCost: card.ammoCost,
    targeting: 'other',
  };
}

export function normalizeSeal(seal: Seal): ResolvedAction {
  const isHeal = !!(seal.healHp || seal.healAura) && !seal.damage;
  return {
    source: 'seal', id: seal.id, name: seal.name, category: 'habilidade',
    diceRoll: seal.diceRoll ?? '1d20',
    damage: seal.damage, damageType: seal.damageType,
    healHp: seal.healHp, healAura: seal.healAura,
    conditionName: seal.conditionEffect, conditionDuration: seal.conditionDuration,
    auraCost: seal.cost?.aura, ammoCost: seal.cost?.ammo,
    targeting: isHeal ? 'self' : 'other',
  };
}

export function normalizeWeapon(w: Weapon): ResolvedAction {
  const isHeal = !!w.combatHeal && !w.combatDamage;
  return {
    source: 'weapon', id: w.id, name: w.name, category: 'atacar',
    diceRoll: w.combatDiceRoll ?? '1d20',
    damage: w.combatDamage ?? w.damage, damageType: w.combatDamageType ?? w.damageType,
    healHp: w.combatHeal,
    conditionName: w.combatConditionEffect, conditionDuration: w.combatConditionDuration,
    ammoCost: w.combatAmmoCost,
    targeting: w.combatTargeting === 'self' || isHeal ? 'self' : 'other',
  };
}

export function normalizeItem(i: ResolvedItem): ResolvedAction {
  const isHeal = !!(i.combatHeal || i.combatAuraRecover) && !i.combatDamage;
  return {
    source: 'item', id: i.id, name: i.name, category: 'item',
    diceRoll: i.combatDiceRoll ?? '1d20',
    damage: i.combatDamage, damageType: i.combatDamageType,
    healHp: i.combatHeal, healAura: i.combatAuraRecover,
    conditionName: i.combatConditionEffect, conditionDuration: i.combatConditionDuration,
    ammoCost: i.combatAmmoCost,
    targeting: i.combatTargeting === 'self' || isHeal ? 'self' : 'other',
  };
}

/** Ação genérica "Guarda" (sempre disponível, alvo si mesmo, sem efeito além do log). */
export const GUARD_ACTION: ResolvedAction = {
  source: 'guard', id: 'guard', name: 'Guarda', category: 'guarda', diceRoll: '1d20', targeting: 'self',
};

/** Agrupa as ações reais do ator por categoria do menu (GUARDA sempre presente). */
export function actorActions(args: { cards: Card[]; seals: Seal[]; weapons: Weapon[]; items: ResolvedItem[] }): Record<ActionCategory, ResolvedAction[]> {
  const out: Record<ActionCategory, ResolvedAction[]> = { atacar: [], habilidade: [], forma: [], item: [], guarda: [GUARD_ACTION] };
  for (const w of args.weapons) out.atacar.push(normalizeWeapon(w));
  for (const c of args.cards) { const a = normalizeCard(c); out[a.category].push(a); }
  for (const s of args.seals) out.habilidade.push(normalizeSeal(s));
  for (const i of args.items) if (i.usableInCombat) out.item.push(normalizeItem(i));
  return out;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/actions.test.ts`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
git add utils/actions.ts utils/actions.test.ts
git commit -m "feat(cena): normalização de ações (card/seal/weapon/item)"
```

---

## Task 3: Resolução pura (`applyStatDelta`, `computeResolution`, `resolveAction`)

**Files:**
- Modify: `utils/actions.ts`, `utils/actions.test.ts`

- [ ] **Step 1: Testes (falham primeiro)**

APPEND ao `utils/actions.test.ts`:
```ts
import { applyStatDelta, computeResolution, type StatSnapshot, type ResolvedAction as RA } from './actions';

const snap = (over: Partial<StatSnapshot> = {}): StatSnapshot => ({
  currentHp: 20, maxHp: 20, currentAura: 10, maxAura: 10, currentAmmo: 5, maxAmmo: 5, defense: 12, conditions: [], ...over,
});
const atk = (over: Partial<RA> = {}): RA => ({ source: 'card', id: 'a', name: 'Golpe', category: 'atacar', diceRoll: '1d20', targeting: 'other', damage: 6, ...over });

describe('applyStatDelta', () => {
  it('clampa HP/Aura/Ammo em [0,max]', () => {
    expect(applyStatDelta(snap({ currentHp: 5 }), { hp: -9 })).toMatchObject({ currentHp: 0 });
    expect(applyStatDelta(snap({ currentHp: 18 }), { hp: 9 })).toMatchObject({ currentHp: 20 });
    expect(applyStatDelta(snap({ currentAura: 2 }), { aura: -5 })).toMatchObject({ currentAura: 0 });
  });
});

describe('computeResolution', () => {
  it('acerto (total ≥ defesa) aplica dano e desconta custo', () => {
    const r = computeResolution('A', snap({ currentAura: 10 }), 'B', snap({ defense: 12 }), atk({ damage: 6, auraCost: 2 }), 15);
    expect(r.success).toBe(true);
    expect(r.targetDelta.hp).toBe(-6);
    expect(r.actorDelta.aura).toBe(-2);
    expect(r.log.length).toBeGreaterThanOrEqual(2);
  });
  it('erro (total < defesa) não aplica dano, mas desconta custo', () => {
    const r = computeResolution('A', snap(), 'B', snap({ defense: 18 }), atk({ damage: 6, auraCost: 2 }), 10);
    expect(r.success).toBe(false);
    expect(r.targetDelta.hp).toBeUndefined();
    expect(r.actorDelta.aura).toBe(-2);
  });
  it('cura (self) sempre sucede e cura HP/Aura', () => {
    const r = computeResolution('A', snap(), 'A', snap(), atk({ source: 'seal', damage: undefined, healHp: 5, targeting: 'self' }), 1);
    expect(r.success).toBe(true);
    expect(r.targetDelta.hp).toBe(5);
  });
  it('bloqueia se faltar aura', () => {
    const r = computeResolution('A', snap({ currentAura: 1 }), 'B', snap(), atk({ auraCost: 3 }), 20);
    expect(r.blocked).toBeTruthy();
    expect(r.actorDelta).toEqual({});
  });
  it('aplica condição no sucesso', () => {
    const r = computeResolution('A', snap(), 'B', snap({ defense: 5 }), atk({ conditionName: 'Queimando', conditionDuration: 3 }), 20);
    expect(r.conditionApplied).toEqual({ name: 'Queimando', duration: 3 });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/actions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

APPEND ao `utils/actions.ts`:
```ts
import { rollDice } from './dice';
import { DEFAULT_DEFENSE } from '../types';
import type { CenaLogEntry } from './cena';
import { logEntry } from './cena';

export interface StatSnapshot {
  currentHp: number; maxHp: number;
  currentAura: number; maxAura: number;
  currentAmmo: number; maxAmmo: number;
  defense?: number;
  conditions: { name: string; duration: number }[];
}

export interface StatDelta { hp?: number; aura?: number; ammo?: number }

export interface Resolution {
  blocked?: string;
  success: boolean;
  attackTotal: number;
  actorDelta: StatDelta;
  targetDelta: StatDelta;
  conditionApplied?: { name: string; duration: number };
  log: CenaLogEntry[];
}

/** Aplica um delta a stats, clampando cada um em [0, max]. */
export function applyStatDelta(
  s: { currentHp: number; maxHp: number; currentAura: number; maxAura: number; currentAmmo: number; maxAmmo: number },
  d: StatDelta,
): { currentHp: number; currentAura: number; currentAmmo: number } {
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));
  return {
    currentHp: clamp(s.currentHp + (d.hp ?? 0), s.maxHp),
    currentAura: clamp(s.currentAura + (d.aura ?? 0), s.maxAura),
    currentAmmo: clamp(s.currentAmmo + (d.ammo ?? 0), s.maxAmmo),
  };
}

/** Resolução pura dado o total já rolado (determinística). */
export function computeResolution(
  actorName: string, actor: StatSnapshot,
  targetName: string, target: StatSnapshot,
  action: ResolvedAction, attackTotal: number,
): Resolution {
  const auraCost = action.auraCost ?? 0;
  const ammoCost = action.ammoCost ?? 0;
  if (actor.currentAura < auraCost) {
    return { blocked: 'Aura insuficiente', success: false, attackTotal: 0, actorDelta: {}, targetDelta: {}, log: [logEntry('system', `${actorName}: Aura insuficiente para ${action.name}.`)] };
  }
  if (actor.currentAmmo < ammoCost) {
    return { blocked: 'Munição insuficiente', success: false, attackTotal: 0, actorDelta: {}, targetDelta: {}, log: [logEntry('system', `${actorName}: Munição insuficiente para ${action.name}.`)] };
  }

  const actorDelta: StatDelta = {};
  if (auraCost) actorDelta.aura = -auraCost;
  if (ammoCost) actorDelta.ammo = -ammoCost;

  const log: CenaLogEntry[] = [];
  const isSelf = action.targeting === 'self';
  const hasDamage = (action.damage ?? 0) > 0;

  let success = true;
  if (!isSelf && hasDamage) {
    const def = target.defense ?? DEFAULT_DEFENSE;
    success = attackTotal >= def;
    log.push(logEntry('roll', `${actorName} usa ${action.name}: rola ${attackTotal} vs defesa ${def} — ${success ? 'ACERTO' : 'ERRO'}.`));
  } else {
    log.push(logEntry('roll', `${actorName} usa ${action.name}.`));
  }

  const targetDelta: StatDelta = {};
  let conditionApplied: { name: string; duration: number } | undefined;
  if (success) {
    if (hasDamage) {
      targetDelta.hp = -(action.damage ?? 0);
      log.push(logEntry('damage', `${targetName} sofre ${action.damage} de dano${action.damageType ? ` (${action.damageType})` : ''}.`));
    }
    if (action.healHp) {
      targetDelta.hp = (targetDelta.hp ?? 0) + action.healHp;
      log.push(logEntry('damage', `${targetName} recupera ${action.healHp} de HP.`));
    }
    if (action.healAura) {
      targetDelta.aura = (targetDelta.aura ?? 0) + action.healAura;
      log.push(logEntry('damage', `${targetName} recupera ${action.healAura} de Aura.`));
    }
    if (action.conditionName) {
      conditionApplied = { name: action.conditionName, duration: action.conditionDuration ?? 1 };
      log.push(logEntry('condition', `${targetName} recebe ${action.conditionName}.`));
    }
  }
  return { success, attackTotal, actorDelta, targetDelta, conditionApplied, log };
}

/** Resolve a ação rolando o dado de ataque (default 1d20). */
export function resolveAction(
  actorName: string, actor: StatSnapshot,
  targetName: string, target: StatSnapshot,
  action: ResolvedAction,
): Resolution {
  const attackTotal = rollDice(action.diceRoll || '1d20').total;
  return computeResolution(actorName, actor, targetName, target, action, attackTotal);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/actions.test.ts`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
git add utils/actions.ts utils/actions.test.ts
git commit -m "feat(cena): resolução pura de ações (rola vs defesa, custos, log)"
```

---

## Task 4: `updateNpcStats` em cena.ts

**Files:**
- Modify: `utils/cena.ts`, `utils/cena.test.ts`

- [ ] **Step 1: Teste (falha primeiro)**

APPEND ao `utils/cena.test.ts` (adicionar `updateNpcStats` aos imports de `./cena`; `fakeChar` já existe no arquivo):
```ts
describe('updateNpcStats', () => {
  it('mescla updates no NPC alvo sem mutar o original', () => {
    const cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a'));
    const next = updateNpcStats(cena, 'a', { currentHp: 3, conditions: [{ name: 'Queimando', duration: 2 }] });
    expect(next.npcRoster[0].currentHp).toBe(3);
    expect(next.npcRoster[0].conditions).toEqual([{ name: 'Queimando', duration: 2 }]);
    expect(cena.npcRoster[0].currentHp).toBe(10);
    expect(next).not.toBe(cena);
  });
  it('no-op para id inexistente', () => {
    const cena = createDefaultCena();
    expect(updateNpcStats(cena, 'x', { currentHp: 1 }).npcRoster).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run utils/cena.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

APPEND ao `utils/cena.ts`:
```ts
/** Mescla updates de stats/condições num NPC do roster (imutável). */
export function updateNpcStats(cena: CenaState, npcId: string, updates: Partial<Character>): CenaState {
  return { ...cena, npcRoster: cena.npcRoster.map(n => n.id === npcId ? { ...n, ...updates } : n) };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run utils/cena.test.ts`
Expected: PASS. Depois `npx vitest run`.

- [ ] **Step 5: Commit**
```bash
git add utils/cena.ts utils/cena.test.ts
git commit -m "feat(cena): updateNpcStats (escrita de stats/condições no roster)"
```

---

## Task 5: ActionMenu — categorias com submenu de ações reais

**Files:**
- Modify: `tabs/cena/ActionMenu.tsx`, `tabs/cena/ActionMenu.test.tsx`

Cada categoria (ATACAR/HABILIDADE/FORMA/ITEM/GUARDA) mostra a contagem e, ao clicar, expande a lista das ações reais daquela categoria; clicar numa ação chama `onSelectAction(action)`.

- [ ] **Step 1: Substituir o teste**

Substituir `tabs/cena/ActionMenu.test.tsx` por:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ActionMenu from './ActionMenu';
import type { ResolvedAction, ActionCategory } from '../../utils/actions';
import { GUARD_ACTION } from '../../utils/actions';

afterEach(() => cleanup());

const ra = (over: Partial<ResolvedAction>): ResolvedAction => ({
  source: 'card', id: 'a', name: 'Golpe', category: 'atacar', diceRoll: '1d20', targeting: 'other', ...over,
});
const groups = (over: Partial<Record<ActionCategory, ResolvedAction[]>> = {}): Record<ActionCategory, ResolvedAction[]> => ({
  atacar: [], habilidade: [], forma: [], item: [], guarda: [GUARD_ACTION], ...over,
});

describe('ActionMenu', () => {
  it('mostra as categorias', () => {
    render(<ActionMenu actions={groups()} />);
    for (const label of ['ATACAR', 'HABILIDADE', 'FORMA', 'ITEM', 'GUARDA']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
  it('abre a categoria e seleciona uma ação real', () => {
    const onSelectAction = vi.fn();
    render(<ActionMenu actions={groups({ atacar: [ra({ name: 'Bola de Fogo' })] })} onSelectAction={onSelectAction} />);
    fireEvent.click(screen.getByText('ATACAR'));
    fireEvent.click(screen.getByText('Bola de Fogo'));
    expect(onSelectAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bola de Fogo' }));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/cena/ActionMenu.test.tsx`
Expected: FAIL (props antigas).

- [ ] **Step 3: Implementar**

Substituir `tabs/cena/ActionMenu.tsx` por:
```tsx
import React from 'react';
import type { ActionCategory, ResolvedAction } from '../../utils/actions';

export interface ActionMenuProps {
  actions?: Record<ActionCategory, ResolvedAction[]>;
  onSelectAction?: (action: ResolvedAction) => void;
}

const EMPTY: Record<ActionCategory, ResolvedAction[]> = { atacar: [], habilidade: [], forma: [], item: [], guarda: [] };

const CATS: { id: ActionCategory; label: string; key: string; primary?: boolean }[] = [
  { id: 'atacar', label: 'ATACAR', key: '1', primary: true },
  { id: 'habilidade', label: 'HABILIDADE', key: '2' },
  { id: 'forma', label: 'FORMA', key: '3' },
  { id: 'item', label: 'ITEM', key: '4' },
  { id: 'guarda', label: 'GUARDA', key: '5' },
];

const PANEL: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: '#101013', border: '1px solid #1e1e24', borderRadius: 3, padding: 14, overflow: 'auto',
  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)',
};

const ActionMenu: React.FC<ActionMenuProps> = ({ actions = EMPTY, onSelectAction }) => {
  const [open, setOpen] = React.useState<ActionCategory | null>(null);
  return (
    <div style={PANEL}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
        <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '2px', color: '#6f6f76' }}>AÇÕES · CARTAS · ITENS</span>
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#E0102B,transparent)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {CATS.map(c => {
          const list = actions[c.id] ?? [];
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setOpen(isOpen ? null : c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: c.primary ? '12px 14px' : '11px 14px', cursor: 'pointer',
                  background: c.primary ? 'linear-gradient(100deg,#E0102B,#a60c20)' : '#15151a',
                  border: c.primary ? 'none' : '1px solid #2a2a30',
                  boxShadow: c.primary ? '0 4px 18px rgba(224,16,43,.35)' : 'none',
                  clipPath: 'polygon(0 0,100% 0,100% 72%,96% 100%,0 100%)' }}>
                <span style={{ flex: 1, textAlign: 'left', fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: '2px', color: c.primary ? '#fff' : '#e9e9ee' }}>{c.label}</span>
                {list.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: c.primary ? 'rgba(255,255,255,.7)' : '#9a9aa1' }}>{list.length}</span>}
                <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: c.primary ? 'rgba(255,255,255,.7)' : '#6f6f76' }}>{c.key}</span>
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
                  {list.length === 0
                    ? <span style={{ fontSize: 12, color: '#7d7d85', fontStyle: 'italic', padding: '4px 0' }}>Nada nesta categoria.</span>
                    : list.map(a => (
                        <button key={a.id} onClick={() => onSelectAction?.(a)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '7px 10px', cursor: 'pointer',
                            background: '#15151a', border: '1px solid #26262c', color: '#e3e3e8',
                            fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 13 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0102B' }} />
                          <span style={{ flex: 1 }}>{a.name}</span>
                          {a.auraCost ? <span style={{ fontSize: 11, color: '#cfcfe6' }}>{a.auraCost}◆</span> : null}
                        </button>
                      ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionMenu;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tabs/cena/ActionMenu.test.tsx`
Expected: PASS. Depois `npx vitest run` (a CenaTab ainda renderiza `<ActionMenu />` sem props — `actions` cai no default `EMPTY`, sem quebrar; será fiado na Task 6).

- [ ] **Step 5: Commit**
```bash
git add tabs/cena/ActionMenu.tsx tabs/cena/ActionMenu.test.tsx
git commit -m "feat(cena): ActionMenu com submenu de ações reais"
```

---

## Task 6: CenaTab — armar ação, mirar e aplicar a resolução

**Files:**
- Modify: `tabs/CenaTab.tsx`, `tabs/CenaTab.test.tsx`

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

describe('CenaTab — iniciar/encerrar (3A intacto)', () => {
  it('Iniciar Combate monta a ordem', () => {
    const updateCena = vi.fn();
    render(<CenaTab {...props(createDefaultCena(), [cast('p1', 'Shinkai')], { updateCena })} />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar combate/i }));
    expect(updateCena.mock.calls[0][0].encounter.order).toHaveLength(1);
  });
});

describe('CenaTab — resolução (3B)', () => {
  it('cura self resolve imediatamente e grava no ator (party)', () => {
    const heal: Seal = { id: 'sh', name: 'Cura', code: '', image: '', description: '', healHp: 5 };
    let cena = createDefaultCena();
    cena = startEncounter(cena, [{ id: 'p1', side: 'party', name: 'Shinkai', baseInitiative: 0 }]);
    const updateCharacterStats = vi.fn();
    const p1 = cast('p1', 'Shinkai', { currentHp: 10, sealIds: ['sh'] });
    render(<CenaTab {...props(cena, [p1], { seals: [heal], updateCharacterStats })} />);
    // abre HABILIDADE e seleciona a cura (self → resolve já)
    fireEvent.click(screen.getByText('HABILIDADE'));
    fireEvent.click(screen.getByText('Cura'));
    expect(updateCharacterStats).toHaveBeenCalled();
    const [, updates] = updateCharacterStats.mock.calls[0];
    expect(updates.currentHp).toBe(15);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tabs/CenaTab.test.tsx`
Expected: FAIL (sem resolução).

- [ ] **Step 3: Implementar**

Em `tabs/CenaTab.tsx`:

(a) Imports — adicionar:
```tsx
import { setScene, addNpcFromCharacter, removeNpc, toggleNpcHidden, toggleNpcPresent, setToken, updateNpcStats, appendLog } from '../utils/cena';
import { actorActions, resolveAction, applyStatDelta, type ResolvedAction, type StatSnapshot } from '../utils/actions';
```
(substitui a linha de import de `../utils/cena` existente para incluir `updateNpcStats, appendLog`; mantém os demais.)

(b) Estado da ação armada — após `const [active, setActive] = ...`:
```tsx
  const [armed, setArmed] = React.useState<ResolvedAction | null>(null);
```

(c) Snapshot + resolução. Após as derivações de `turnActor`/`byId` (e antes do `return`), adicionar:
```tsx
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

  const onSelectAction = (action: ResolvedAction) => {
    if (action.targeting === 'self' && turnActor) resolveOn(turnActor.id, action);
    else setArmed(action);
  };

  const onParticipantClick = (id: string) => {
    if (combat && armed) resolveOn(id, armed);
    else selectById(id);
  };
```
> Nota: `updateCharacterStats` aplica direto no Character (party); as mudanças de NPC + log vão juntas num único `updateCena(next)`. Se ator e alvo forem o mesmo (cura/guarda), os deltas são mesclados para não se sobrescreverem.

(d) Trocar o `onSelect` do MapBoard de `onSelect={selectById}` para `onSelect={onParticipantClick}`.

(e) No RosterPanel, trocar `onSelectActive={setActive}` por:
```tsx
            onSelectActive={ref => (combat && armed) ? onParticipantClick(ref.id) : setActive(ref)}
```

(f) No bloco direito de combate, passar as ações reais ao ActionMenu:
```tsx
          {combat
            ? <ActionMenu actions={actorActions({ cards: activeCards, seals: activeSeals, weapons: activeWeapons, items: activeItems })} onSelectAction={onSelectAction} />
            : <ActionsPanel cards={activeCards} items={activeItems} weapons={activeWeapons} />}
```

(g) Banner de alvo — quando `armed`, mostrar um aviso. Logo abaixo de `{toggleBtn}` no centro, adicionar:
```tsx
        {combat && armed && (
          <div style={{ flex: 'none', padding: '8px 12px', background: '#1d0e12', border: '1px solid #3a1620', color: '#E0102B',
            fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ESCOLHA O ALVO DE {armed.name.toUpperCase()}</span>
            <button onClick={() => setArmed(null)} style={{ background: 'transparent', border: 'none', color: '#9a9aa1', cursor: 'pointer', fontSize: 12 }}>cancelar</button>
          </div>
        )}
```

- [ ] **Step 4: Verificar tudo**

Run: `npx vitest run tabs/CenaTab.test.tsx` → PASS.
Run: `npx vitest run` → suíte verde.
Run: `npx tsc --noEmit 2>&1 | grep "error TS"` → só os 3 pré-existentes; nada em tabs/* ou utils/*.
Run: `npm run build` → sucesso.

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`. Com pelo menos 1 `cast` (com selo/carta de dano e/ou um NPC presente):
- Iniciar Combate. No menu da direita, clicar **HABILIDADE/ATACAR** abre as ações reais do ator.
- Escolher uma de **dano** → aparece o banner "ESCOLHA O ALVO…"; clicar num token/linha → rola vs defesa, aplica dano (ou erra), desconta custo, e o log mostra a rolagem/dano. HP 0 esmaece o alvo no tracker.
- Escolher uma ação de **cura (self)** → resolve no próprio ator imediatamente.
- "cancelar" desarma. Encerrar volta à exploração.

- [ ] **Step 6: Commit**
```bash
git add tabs/CenaTab.tsx tabs/CenaTab.test.tsx
git commit -m "feat(cena): resolução de ações no combate (armar, mirar, aplicar)"
```

---

## Self-Review (cobertura vs. spec 3B)

- **Menu P5 → submenus de ações reais:** Tasks 2 (`actorActions`) + 5 (ActionMenu). ✔
- **Escolher ação → clicar alvo (token/roster):** Task 6 (`armed`, `onParticipantClick`, banner). ✔
- **Rola vs defesa do alvo; dano flat/cura/condição:** Tasks 1 (`defense`) + 3 (`computeResolution`). ✔
- **Custos descontados; bloqueia se faltar:** Task 3. ✔
- **Escrita roteada (party→Character, npc→roster) + log:** Tasks 4 (`updateNpcStats`) + 6 (`applyDeltaTo`/`resolveOn`). ✔
- **Self-target (cura/guarda) resolve no ator; deltas mesclados:** Task 6. ✔
- **HP 0 → caído:** já da 3A (tracker esmaece; `isDefeatedEntry`). ✔
- **Placeholder scan / tipos:** sem TBD; `ResolvedAction`, `StatSnapshot`, `Resolution`, `actorActions`, `applyStatDelta`, `updateNpcStats` consistentes. ✔

## Fora de escopo (próximo plano)
- **Fase 3C — Condições automáticas:** `tickConditions` (via `PRESET_CONDITIONS`) no início do turno (dano/cura/penalidade, decremento, expiração) + log.
- Onde editar `defense` da party (default 10 por ora).
- **Fase 2B — editor de NPC.** **Fase 4 — limpeza do legado.**
