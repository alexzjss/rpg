# Grimório v2 — Fase 1: Fundação (tipos + motor + persistência) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a fundação do sistema unificado — tipos `GrimoireEntry`/`Effect`/`CombatProfile`, motor puro de resolução em 3 etapas (custos → acerto → efeitos), afinidades + interações elementais, encounter v2 (slots, reações, buffs) e o store `grimoire` no IndexedDB — sem tocar em nenhuma UI.

**Architecture:** Módulos puros novos (`utils/grimoire.ts`, `utils/elements.ts`, `utils/resolve.ts`) + extensões nos módulos existentes (`utils/cena.ts`, `utils/encounter.ts`, `utils/database.ts`, `types.ts`). O sistema antigo (Card/Seal/Weapon/Item, `utils/actions.ts`) permanece intacto e funcional até as Fases 2–3; nada aqui é breaking. Todas as funções de rolagem aceitam um `Roller` injetável para testes determinísticos.

**Tech Stack:** TypeScript, Vite, vitest (`npm test` = `vitest run --passWithNoTests`). Sem libs novas.

**Spec:** `docs/superpowers/specs/2026-07-02-grimorio-unificado-combate-v2-design.md`

**Fases seguintes (documentos próprios, escritos após esta fase):**
- Fase 2 — Grimório UI (catálogo único + EntryEditor substituem a aba Arsenal).
- Fase 3 — Combate v2 na Cena (slots/reações/painel passo a passo) + limpeza final (apagar Card/Seal/Weapon/Item, stores antigos, `components/combat/*`, PlayerMirror, `utils/actions.ts`).

**Verificação global (usar em todo task):**
- Testes: `npm test` (roda vitest uma vez).
- Tipos: `npx tsc --noEmit` — há erros PRÉ-EXISTENTES no repo; o critério é **não introduzir erros novos** (compare com a saída antes da sua mudança).

---

### Task 1: Tipos base em `types.ts` (Element, Affinity, GrimoireHolding, campos do Character)

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Adicionar os tipos novos**

Em `types.ts`, logo APÓS a linha `export type DamageType = ...` (linha ~3), adicionar:

```ts
/** Elemento de dano do sistema unificado (mesma união do DamageType legado). */
export type Element = DamageType;

/** Afinidade elemental de uma ficha: fraco ×1.5, resistente ×0.5, imune ×0. */
export type Affinity = 'fraco' | 'resistente' | 'imune';

/** Posse de uma entrada do grimório por um personagem. */
export interface GrimoireHolding {
  entryId: string;
  /** Unidades possuídas (consumíveis). Ausente = 1. */
  quantity?: number;
  /** Nível escolhido no módulo de níveis da entrada. Ausente = perfil base. */
  level?: number;
}
```

- [ ] **Step 2: Adicionar os campos novos ao `Character`**

Na interface `Character` (após `ownedItems?: OwnedItem[];`), adicionar:

```ts
  /** Acervo unificado do grimório (substituirá cardIds/sealIds/weaponIds/ownedItems na Fase 3). */
  grimoire?: GrimoireHolding[];
  /** Afinidades elementais: fraco / resistente / imune por elemento. */
  affinities?: Partial<Record<Element, Affinity>>;
```

- [ ] **Step 3: Verificar que não há erros novos de tipo**

Run: `npx tsc --noEmit`
Expected: mesma lista de erros de antes da mudança (nenhum erro novo).

Run: `npm test`
Expected: todos os testes existentes passam.

- [ ] **Step 4: Commit**

```bash
git add types.ts
git commit -m "feat(grimorio): tipos base Element/Affinity/GrimoireHolding + campos no Character"
```

---

### Task 2: `utils/grimoire.ts` — entidade unificada + helpers

**Files:**
- Create: `utils/grimoire.ts`
- Test: `utils/grimoire.test.ts`

- [ ] **Step 1: Escrever os testes (falhando)**

Criar `utils/grimoire.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  GUARD_ENTRY,
  checkRequirements,
  effectiveCombat,
  resolveHoldings,
  type GrimoireEntry,
  type RequirementContext,
} from './grimoire';

const sword: GrimoireEntry = {
  id: 'e1', name: 'Espada', image: '', description: '', category: 'arma',
  combat: {
    actionType: 'principal', targeting: 'inimigo', attackDice: '1d20',
    effects: [{ kind: 'damage', dice: '2d6', element: 'normal' }],
  },
};

const potion: GrimoireEntry = {
  id: 'e2', name: 'Poção', image: '', description: '', category: 'item',
  consumable: true,
  combat: { actionType: 'menor', targeting: 'self', effects: [{ kind: 'heal', stat: 'hp', dice: '1d8' }] },
};

const leveled: GrimoireEntry = {
  id: 'e3', name: 'Bola de Fogo', image: '', description: '', category: 'habilidade',
  combat: {
    actionType: 'principal', targeting: 'inimigo', attackDice: '1d20',
    costs: { aura: 2 }, effects: [{ kind: 'damage', dice: '1d6', element: 'fogo' }],
  },
  levels: [{
    level: 2, name: 'Bola de Fogo II',
    combat: {
      actionType: 'principal', targeting: 'inimigo', attackDice: '1d20',
      costs: { aura: 4 }, effects: [{ kind: 'damage', dice: '2d6', element: 'fogo' }],
    },
  }],
};

const catalog = [sword, potion, leveled];

describe('resolveHoldings', () => {
  it('reconstrói entradas com quantidade e nível, ignorando órfãs', () => {
    const out = resolveHoldings(
      [{ entryId: 'e2', quantity: 3 }, { entryId: 'e3', level: 2 }, { entryId: 'morto' }],
      catalog,
    );
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe('Poção');
    expect(out[0].quantity).toBe(3);
    expect(out[1].heldLevel).toBe(2);
    expect(out[1].quantity).toBe(1); // default
  });

  it('aceita holdings undefined', () => {
    expect(resolveHoldings(undefined, catalog)).toEqual([]);
  });
});

describe('effectiveCombat', () => {
  it('sem nível retorna o perfil base', () => {
    expect(effectiveCombat(leveled)?.costs?.aura).toBe(2);
  });
  it('com nível existente retorna o perfil do nível', () => {
    expect(effectiveCombat(leveled, 2)?.costs?.aura).toBe(4);
  });
  it('nível inexistente cai no perfil base', () => {
    expect(effectiveCombat(leveled, 9)?.costs?.aura).toBe(2);
  });
});

describe('GUARD_ENTRY', () => {
  it('é ação menor self com buff de +2 defesa por 1 rodada', () => {
    expect(GUARD_ENTRY.combat?.actionType).toBe('menor');
    expect(GUARD_ENTRY.combat?.targeting).toBe('self');
    expect(GUARD_ENTRY.combat?.effects).toEqual([{ kind: 'buff', stat: 'defesa', value: 2, duration: 1 }]);
  });
});

describe('checkRequirements', () => {
  const ctx: RequirementContext = {
    characterId: 'c1',
    holdings: [{ entryId: 'e2', quantity: 2 }],
    currentHp: 10, maxHp: 20, currentAura: 5, maxAura: 10,
  };

  it('sem requisitos retorna null', () => {
    expect(checkRequirements(undefined, ctx)).toBeNull();
    expect(checkRequirements([], ctx)).toBeNull();
  });
  it('specificCharacter bloqueia outro personagem', () => {
    expect(checkRequirements([{ type: 'specificCharacter', characterId: 'c1' }], ctx)).toBeNull();
    expect(checkRequirements([{ type: 'specificCharacter', characterId: 'c2' }], ctx)).toMatch(/exclusiv/i);
  });
  it('linkedEntry exige possuir a entrada', () => {
    expect(checkRequirements([{ type: 'linkedEntry', entryId: 'e2' }], ctx)).toBeNull();
    expect(checkRequirements([{ type: 'linkedEntry', entryId: 'e9' }], ctx)).toMatch(/requer/i);
  });
  it('entryCount exige a quantidade', () => {
    expect(checkRequirements([{ type: 'entryCount', entryId: 'e2', quantity: 2 }], ctx)).toBeNull();
    expect(checkRequirements([{ type: 'entryCount', entryId: 'e2', quantity: 3 }], ctx)).toMatch(/requer/i);
  });
  it('minHp/minAura são percentuais 0-100', () => {
    expect(checkRequirements([{ type: 'minHp', value: 50 }], ctx)).toBeNull();   // 10/20 = 50%
    expect(checkRequirements([{ type: 'minHp', value: 51 }], ctx)).toMatch(/hp/i);
    expect(checkRequirements([{ type: 'minAura', value: 50 }], ctx)).toBeNull(); // 5/10 = 50%
    expect(checkRequirements([{ type: 'minAura', value: 60 }], ctx)).toMatch(/aura/i);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/grimoire.test.ts`
Expected: FAIL (módulo `./grimoire` não existe).

- [ ] **Step 3: Implementar `utils/grimoire.ts`**

```ts
import type { Affinity, Element, GrimoireHolding } from '../types';

export type EntryCategory = 'arma' | 'habilidade' | 'selo' | 'item';
export type ActionType = 'principal' | 'menor' | 'reação';
export type Targeting = 'self' | 'aliado' | 'inimigo' | 'qualquer';
export type BuffStat = 'defesa' | 'acerto' | 'dano';

/** Um efeito composável — a unidade básica de tudo no grimório. */
export type Effect =
  | { kind: 'damage'; dice: string; element: Element }
  | { kind: 'heal'; stat: 'hp' | 'aura' | 'ammo'; dice: string }
  | { kind: 'condition'; name: string; duration: number; value?: number }
  | { kind: 'buff'; stat: BuffStat; value: number; duration: number };

/** Como a entrada se usa em combate (ausente = entrada narrativa). */
export interface CombatProfile {
  actionType: ActionType;
  targeting: Targeting;
  /** Ex: '1d20+2'. Ausente = sem teste de acerto (auto-acerto, ex. cura). */
  attackDice?: string;
  costs?: { aura?: number; ammo?: number; hp?: number };
  effects: Effect[];
}

export type Requirement =
  | { type: 'specificCharacter'; characterId: string }
  | { type: 'linkedEntry'; entryId: string }
  | { type: 'entryCount'; entryId: string; quantity: number }
  | { type: 'minHp'; value: number }    // % 0-100
  | { type: 'minAura'; value: number }; // % 0-100

export interface EntryLevel { level: number; name?: string; combat: CombatProfile }

export interface FormaModule {
  color: string; icon?: string;
  /** Rodadas; 0 = permanente até encerrar o combate. */
  duration: number;
  hpBonus?: number; auraBonus?: number;
  grantedEntryIds: string[];
}

export interface ComboModule {
  minUsers: number; maxUsers?: number;
  diceMode: 'sum' | 'highest';
  preparationRounds?: number;
}

/** A entidade única do grimório (substitui Card/Seal/Weapon/Item nas Fases 2-3). */
export interface GrimoireEntry {
  id: string; name: string; image: string; description: string;
  category: EntryCategory;
  isHidden?: boolean; code?: string;
  combat?: CombatProfile;
  levels?: EntryLevel[];
  forma?: FormaModule;
  combo?: ComboModule;
  requirements?: Requirement[];
  /** Decrementa 1 unidade da posse ao usar. */
  consumable?: boolean;
}

/** Entrada do catálogo com a posse anexada. */
export interface ResolvedHolding extends GrimoireEntry {
  quantity: number;
  heldLevel?: number;
}

/** Reconstrói o acervo de um personagem a partir do catálogo (ignora órfãs). */
export function resolveHoldings(
  holdings: GrimoireHolding[] | undefined,
  catalog: GrimoireEntry[],
): ResolvedHolding[] {
  const out: ResolvedHolding[] = [];
  for (const h of holdings ?? []) {
    const tpl = catalog.find(e => e.id === h.entryId);
    if (!tpl) continue;
    out.push({ ...tpl, quantity: h.quantity ?? 1, heldLevel: h.level });
  }
  return out;
}

/** Perfil de combate efetivo: o do nível escolhido, ou o base. */
export function effectiveCombat(entry: GrimoireEntry, level?: number): CombatProfile | undefined {
  if (level != null && entry.levels) {
    const l = entry.levels.find(x => x.level === level);
    if (l) return l.combat;
  }
  return entry.combat;
}

/** Ação embutida "Guarda": menor, self, +2 defesa até o próximo turno. */
export const GUARD_ENTRY: GrimoireEntry = {
  id: 'builtin-guard',
  name: 'Guarda',
  image: '',
  description: '+2 de defesa até o início do seu próximo turno.',
  category: 'habilidade',
  combat: {
    actionType: 'menor',
    targeting: 'self',
    effects: [{ kind: 'buff', stat: 'defesa', value: 2, duration: 1 }],
  },
};

export interface RequirementContext {
  characterId: string;
  holdings: GrimoireHolding[];
  currentHp: number; maxHp: number;
  currentAura: number; maxAura: number;
}

/** Retorna o motivo do bloqueio do primeiro requisito não atendido, ou null. */
export function checkRequirements(
  reqs: Requirement[] | undefined,
  ctx: RequirementContext,
): string | null {
  for (const r of reqs ?? []) {
    switch (r.type) {
      case 'specificCharacter':
        if (ctx.characterId !== r.characterId) return 'Exclusivo de outro personagem';
        break;
      case 'linkedEntry':
        if (!ctx.holdings.some(h => h.entryId === r.entryId)) return 'Requer uma entrada vinculada';
        break;
      case 'entryCount': {
        const h = ctx.holdings.find(x => x.entryId === r.entryId);
        if ((h?.quantity ?? (h ? 1 : 0)) < r.quantity) return `Requer ${r.quantity}× de uma entrada`;
        break;
      }
      case 'minHp':
        if (ctx.maxHp <= 0 || (ctx.currentHp / ctx.maxHp) * 100 < r.value) return `Requer HP ≥ ${r.value}%`;
        break;
      case 'minAura':
        if (ctx.maxAura <= 0 || (ctx.currentAura / ctx.maxAura) * 100 < r.value) return `Requer Aura ≥ ${r.value}%`;
        break;
    }
  }
  return null;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/grimoire.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add utils/grimoire.ts utils/grimoire.test.ts
git commit -m "feat(grimorio): GrimoireEntry unificado + effects/profile/requisitos/holdings"
```

---

### Task 3: `utils/elements.ts` — afinidades + interações elementais

**Files:**
- Create: `utils/elements.ts`
- Test: `utils/elements.test.ts`

- [ ] **Step 1: Escrever os testes (falhando)**

Criar `utils/elements.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { affinityMultiplier, elementInteraction } from './elements';

describe('affinityMultiplier', () => {
  it('fraco 1.5, resistente 0.5, imune 0, ausente 1', () => {
    expect(affinityMultiplier('fraco')).toBe(1.5);
    expect(affinityMultiplier('resistente')).toBe(0.5);
    expect(affinityMultiplier('imune')).toBe(0);
    expect(affinityMultiplier(undefined)).toBe(1);
  });
});

describe('elementInteraction', () => {
  it('água aplica Molhado (2 rodadas)', () => {
    const r = elementInteraction('água', []);
    expect(r.addConditions).toEqual([{ name: 'Molhado', duration: 2 }]);
    expect(r.multiplier).toBe(1);
  });

  it('água apaga Queimando', () => {
    const r = elementInteraction('água', [{ name: 'Queimando', duration: 3 }]);
    expect(r.removeConditions).toContain('Queimando');
  });

  it('raio em alvo Molhado ganha bônus flat e consome Molhado', () => {
    const r = elementInteraction('raio', [{ name: 'Molhado', duration: 2 }]);
    expect(r.flatBonus).toBe(5); // defaultValue do preset Molhado
    expect(r.removeConditions).toContain('Molhado');
  });

  it('raio em alvo seco não muda nada', () => {
    const r = elementInteraction('raio', []);
    expect(r.flatBonus).toBe(0);
    expect(r.removeConditions).toEqual([]);
  });

  it('fogo em alvo Molhado é reduzido à metade e consome Molhado', () => {
    const r = elementInteraction('fogo', [{ name: 'Molhado', duration: 2 }]);
    expect(r.multiplier).toBe(0.5);
    expect(r.removeConditions).toContain('Molhado');
  });

  it('fogo em alvo Queimando renova a duração de Queimando', () => {
    const r = elementInteraction('fogo', [{ name: 'Queimando', duration: 1 }]);
    expect(r.renewConditions).toEqual([{ name: 'Queimando', duration: 3 }]); // defaultDuration do preset
  });

  it('elemento neutro não interage', () => {
    const r = elementInteraction('normal', [{ name: 'Molhado', duration: 2 }]);
    expect(r).toEqual({ multiplier: 1, flatBonus: 0, removeConditions: [], renewConditions: [], addConditions: [], notes: [] });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/elements.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `utils/elements.ts`**

```ts
import { PRESET_CONDITIONS } from '../types';
import type { Affinity, Condition, Element } from '../types';

/** fraco ×1.5, resistente ×0.5, imune ×0, sem afinidade ×1. */
export function affinityMultiplier(aff?: Affinity): number {
  if (aff === 'fraco') return 1.5;
  if (aff === 'resistente') return 0.5;
  if (aff === 'imune') return 0;
  return 1;
}

/** O que uma interação elemental faz com o dano e as condições do alvo. */
export interface InteractionResult {
  multiplier: number;
  flatBonus: number;
  removeConditions: string[];
  renewConditions: { name: string; duration: number }[];
  addConditions: { name: string; duration: number }[];
  /** Frases curtas para o log ("o alvo Molhado amplifica o raio (+5)"). */
  notes: string[];
}

const WET_BONUS = PRESET_CONDITIONS.find(p => p.name === 'Molhado')?.defaultValue ?? 0;
const BURN_DURATION = PRESET_CONDITIONS.find(p => p.name === 'Queimando')?.defaultDuration ?? 3;

/**
 * Tabela de interações elemento × condições do alvo (data-driven no futuro;
 * hoje as 5 regras do spec, num único lugar).
 */
export function elementInteraction(element: Element, targetConditions: Condition[]): InteractionResult {
  const has = (n: string) => targetConditions.some(c => c.name === n);
  const res: InteractionResult = {
    multiplier: 1, flatBonus: 0,
    removeConditions: [], renewConditions: [], addConditions: [], notes: [],
  };

  if (element === 'água') {
    res.addConditions.push({ name: 'Molhado', duration: 2 });
    res.notes.push('a água encharca o alvo (Molhado, 2 rodadas)');
    if (has('Queimando')) {
      res.removeConditions.push('Queimando');
      res.notes.push('as chamas se apagam (remove Queimando)');
    }
  }

  if (element === 'raio' && has('Molhado')) {
    res.flatBonus = WET_BONUS;
    res.removeConditions.push('Molhado');
    res.notes.push(`o alvo Molhado amplifica o raio (+${WET_BONUS})`);
  }

  if (element === 'fogo') {
    if (has('Molhado')) {
      res.multiplier = 0.5;
      res.removeConditions.push('Molhado');
      res.notes.push('a água reduz o fogo (dano ÷2, consome Molhado)');
    }
    if (has('Queimando')) {
      res.renewConditions.push({ name: 'Queimando', duration: BURN_DURATION });
      res.notes.push('as chamas se reavivam (renova Queimando)');
    }
  }

  return res;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/elements.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/elements.ts utils/elements.test.ts
git commit -m "feat(grimorio): afinidades e tabela de interações elementais"
```

---

### Task 4: `utils/resolve.ts` — Etapa 1 do motor (custos)

**Files:**
- Create: `utils/resolve.ts`
- Test: `utils/resolve.test.ts`

- [ ] **Step 1: Escrever os testes (falhando)**

Criar `utils/resolve.test.ts` (o helper `snap` e `seqRoller` serão reusados pelas tasks 5-7):

```ts
import { describe, expect, it } from 'vitest';
import type { RollResult } from './dice';
import { payCosts, type ActionInput, type CombatantSnapshot, type Roller } from './resolve';

/** Snapshot de combatente com defaults convenientes. */
export function snap(partial: Partial<CombatantSnapshot> = {}): CombatantSnapshot {
  return {
    id: 'x', name: 'X',
    currentHp: 20, maxHp: 20, currentAura: 10, maxAura: 10, currentAmmo: 5, maxAmmo: 5,
    conditions: [],
    ...partial,
  };
}

/** Roller determinístico: devolve a fila de resultados na ordem chamada. */
export function seqRoller(seq: Array<Partial<RollResult> & { total: number }>): Roller {
  let i = 0;
  return (notation: string): RollResult => {
    const s = seq[Math.min(i++, seq.length - 1)];
    const dieRoll = s.dieRoll ?? s.total;
    return {
      total: s.total, dieRoll, bonus: s.bonus ?? s.total - dieRoll,
      notation, individualRolls: s.individualRolls ?? [dieRoll],
      numSides: s.numSides ?? 20, numDice: s.numDice ?? 1,
    };
  };
}

const strike: ActionInput = {
  name: 'Golpe',
  profile: {
    actionType: 'principal', targeting: 'inimigo', attackDice: '1d20',
    costs: { aura: 3, ammo: 1 },
    effects: [{ kind: 'damage', dice: '2d6', element: 'normal' }],
  },
};

describe('payCosts', () => {
  it('paga aura/munição como delta negativo', () => {
    const r = payCosts(snap({ name: 'A' }), strike);
    expect(r.blocked).toBeUndefined();
    expect(r.actorDelta).toEqual({ aura: -3, ammo: -1 });
  });

  it('bloqueia sem aura', () => {
    const r = payCosts(snap({ currentAura: 2 }), strike);
    expect(r.blocked).toBe('Aura insuficiente');
    expect(r.actorDelta).toEqual({});
    expect(r.log[0].text).toContain('Aura insuficiente');
  });

  it('bloqueia sem munição', () => {
    const r = payCosts(snap({ currentAmmo: 0 }), strike);
    expect(r.blocked).toBe('Munição insuficiente');
  });

  it('custo de HP não pode derrubar o ator', () => {
    const blood: ActionInput = { name: 'Rito', profile: { actionType: 'principal', targeting: 'inimigo', costs: { hp: 5 }, effects: [] } };
    expect(payCosts(snap({ currentHp: 5 }), blood).blocked).toBe('HP insuficiente');
    expect(payCosts(snap({ currentHp: 6 }), blood).actorDelta).toEqual({ hp: -5 });
  });

  it('sem custos, delta vazio', () => {
    const free: ActionInput = { name: 'Livre', profile: { actionType: 'menor', targeting: 'self', effects: [] } };
    expect(payCosts(snap(), free)).toEqual({ actorDelta: {}, log: [] });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/resolve.test.ts`
Expected: FAIL (módulo `./resolve` não existe).

- [ ] **Step 3: Implementar o início de `utils/resolve.ts`**

```ts
import { rollDice, type RollResult } from './dice';
import { DEFAULT_DEFENSE, PRESET_CONDITIONS } from '../types';
import type { Affinity, Condition, Element } from '../types';
import type { BuffStat, CombatProfile } from './grimoire';
import { affinityMultiplier, elementInteraction, type InteractionResult } from './elements';
import { logEntry, type CenaLogEntry } from './cena';

export type Roller = (notation: string) => RollResult;

export interface StatDelta { hp?: number; aura?: number; ammo?: number }

/** Snapshot mínimo de um combatente para o motor (party ou NPC). */
export interface CombatantSnapshot {
  id: string; name: string;
  currentHp: number; maxHp: number;
  currentAura: number; maxAura: number;
  currentAmmo: number; maxAmmo: number;
  defense?: number;
  conditions: Condition[];
  affinities?: Partial<Record<Element, Affinity>>;
}

/** Ação pronta para resolver (nome da entrada + perfil de combate efetivo). */
export interface ActionInput {
  name: string;
  profile: CombatProfile;
}

// ─────────────────────────────────────────────────────────────────
// Etapa 1 — custos
// ─────────────────────────────────────────────────────────────────
export interface CostResult {
  blocked?: string;
  actorDelta: StatDelta;
  log: CenaLogEntry[];
}

/** Verifica e paga os custos da ação (delta negativo no ator). */
export function payCosts(actor: CombatantSnapshot, action: ActionInput): CostResult {
  const c = action.profile.costs ?? {};
  const fail = (reason: string): CostResult =>
    ({ blocked: reason, actorDelta: {}, log: [logEntry('system', `${actor.name}: ${reason} para ${action.name}.`)] });

  if ((c.aura ?? 0) > actor.currentAura) return fail('Aura insuficiente');
  if ((c.ammo ?? 0) > actor.currentAmmo) return fail('Munição insuficiente');
  if ((c.hp ?? 0) >= actor.currentHp && (c.hp ?? 0) > 0) return fail('HP insuficiente');

  const delta: StatDelta = {};
  if (c.aura) delta.aura = -c.aura;
  if (c.ammo) delta.ammo = -c.ammo;
  if (c.hp) delta.hp = -c.hp;
  return { actorDelta: delta, log: [] };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/resolve.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/resolve.ts utils/resolve.test.ts
git commit -m "feat(combate-v2): motor etapa 1 — verificação e pagamento de custos"
```

---

### Task 5: `utils/resolve.ts` — Etapa 2 do motor (acerto, crítico, reação)

**Files:**
- Modify: `utils/resolve.ts`
- Test: `utils/resolve.test.ts`

- [ ] **Step 1: Adicionar os testes (falhando)**

Acrescentar ao final de `utils/resolve.test.ts` (import adicional: `rollAttack`):

```ts
import { rollAttack } from './resolve';

describe('rollAttack', () => {
  const atk: ActionInput = {
    name: 'Golpe',
    profile: { actionType: 'principal', targeting: 'inimigo', attackDice: '1d20', effects: [] },
  };

  it('acerta quando total >= defesa (com bônus e penalidade nomeados)', () => {
    const roll = seqRoller([{ total: 12, individualRolls: [12] }]);
    const out = rollAttack(snap({ id: 'a', name: 'Atacante' }), snap({ id: 'b', defense: 12 }), atk, { roll });
    expect(out.attempted).toBe(true);
    expect(out.hit).toBe(true);
    expect(out.attackTotal).toBe(12);
    expect(out.defenseValue).toBe(12);
  });

  it('erra quando total < defesa', () => {
    const roll = seqRoller([{ total: 9, individualRolls: [9] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), atk, { roll });
    expect(out.hit).toBe(false);
  });

  it('usa DEFAULT_DEFENSE (10) quando o alvo não tem defesa', () => {
    const roll = seqRoller([{ total: 10, individualRolls: [10] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b' }), atk, { roll });
    expect(out.defenseValue).toBe(10);
    expect(out.hit).toBe(true);
  });

  it('buff de defesa entra na defesa efetiva', () => {
    const roll = seqRoller([{ total: 11, individualRolls: [11] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), atk, { roll, defenseBonus: 2 });
    expect(out.defenseValue).toBe(12);
    expect(out.hit).toBe(false);
  });

  it('buff de acerto soma no total', () => {
    const roll = seqRoller([{ total: 9, individualRolls: [9] }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), atk, { roll, attackBonus: 1 });
    expect(out.attackTotal).toBe(10);
    expect(out.hit).toBe(true);
  });

  it('Amaldiçoado penaliza a rolagem (valor do preset = 2)', () => {
    const roll = seqRoller([{ total: 11, individualRolls: [11] }]);
    const actor = snap({ id: 'a', conditions: [{ name: 'Amaldiçoado', duration: 2 }] });
    const out = rollAttack(actor, snap({ id: 'b', defense: 10 }), atk, { roll });
    expect(out.attackTotal).toBe(9);
    expect(out.hit).toBe(false);
  });

  it('nat 20 é crítico e acerta mesmo abaixo da defesa', () => {
    const roll = seqRoller([{ total: 20, individualRolls: [20], numSides: 20 }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 30 }), atk, { roll });
    expect(out.crit).toBe(true);
    expect(out.hit).toBe(true);
  });

  it('nat 1 é erro automático mesmo acima da defesa', () => {
    const roll = seqRoller([{ total: 21, dieRoll: 1, bonus: 20, individualRolls: [1], numSides: 20 }]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 5 }), atk, { roll });
    expect(out.fumble).toBe(true);
    expect(out.hit).toBe(false);
  });

  it('reação substitui a defesa fixa pela rolagem do alvo', () => {
    const roll = seqRoller([
      { total: 15, individualRolls: [15] }, // acerto do atacante
      { total: 16, individualRolls: [16] }, // reação do alvo
    ]);
    const out = rollAttack(snap({ id: 'a' }), snap({ id: 'b', defense: 5 }), atk, { roll, reactionDice: '1d20+3' });
    expect(out.reactionRoll?.total).toBe(16);
    expect(out.defenseValue).toBe(16);
    expect(out.hit).toBe(false);
  });

  it('sem attackDice ou em si mesmo não há teste (auto-acerto)', () => {
    const heal: ActionInput = { name: 'Cura', profile: { actionType: 'principal', targeting: 'self', effects: [] } };
    const self = snap({ id: 'a' });
    const out = rollAttack(self, self, heal);
    expect(out.attempted).toBe(false);
    expect(out.hit).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/resolve.test.ts`
Expected: FAIL (`rollAttack` não exportado).

- [ ] **Step 3: Implementar a etapa 2 em `utils/resolve.ts`**

Acrescentar ao final do arquivo:

```ts
// ─────────────────────────────────────────────────────────────────
// Etapa 2 — acerto (crítico, fumble, reação)
// ─────────────────────────────────────────────────────────────────
export interface AttackOptions {
  /** Buffs de acerto do atacante (soma no total). */
  attackBonus?: number;
  /** Buffs de defesa do alvo (soma na defesa fixa). */
  defenseBonus?: number;
  /** Se o alvo reage: notation da reação; substitui a defesa fixa. */
  reactionDice?: string;
  roll?: Roller;
}

export interface AttackOutcome {
  /** false = ação sem teste (self/sem attackDice): hit é true direto. */
  attempted: boolean;
  roll?: RollResult;
  natural?: number;
  attackTotal?: number;
  defenseValue?: number;
  reactionRoll?: RollResult;
  crit: boolean;
  fumble: boolean;
  hit: boolean;
  log: CenaLogEntry[];
}

function conditionAttackPenalty(conditions: Condition[]): number {
  if (!conditions.some(c => c.name === 'Amaldiçoado')) return 0;
  return PRESET_CONDITIONS.find(p => p.name === 'Amaldiçoado')?.defaultValue ?? 0;
}

/** Rola o teste de acerto contra a defesa efetiva (ou a reação do alvo). */
export function rollAttack(
  actor: CombatantSnapshot,
  target: CombatantSnapshot,
  action: ActionInput,
  opts: AttackOptions = {},
): AttackOutcome {
  const roll = opts.roll ?? rollDice;
  const needsTest = !!action.profile.attackDice && actor.id !== target.id;

  if (!needsTest) {
    return {
      attempted: false, crit: false, fumble: false, hit: true,
      log: [logEntry('roll', `${actor.name} usa ${action.name}.`)],
    };
  }

  const r = roll(action.profile.attackDice!);
  const natural = r.numDice === 1 ? r.individualRolls[0] : undefined;
  const crit = natural !== undefined && natural === r.numSides;
  const fumble = natural === 1;

  const penalty = conditionAttackPenalty(actor.conditions);
  const attackTotal = r.total + (opts.attackBonus ?? 0) - penalty;

  let defenseValue: number;
  let reactionRoll: RollResult | undefined;
  if (opts.reactionDice) {
    reactionRoll = roll(opts.reactionDice);
    defenseValue = reactionRoll.total;
  } else {
    defenseValue = (target.defense ?? DEFAULT_DEFENSE) + (opts.defenseBonus ?? 0);
  }

  const hit = !fumble && (crit || attackTotal >= defenseValue);

  const mods = [
    opts.attackBonus ? `+${opts.attackBonus} bônus` : '',
    penalty ? `−${penalty} Amaldiçoado` : '',
  ].filter(Boolean).join(', ');
  const verdict = fumble ? 'ERRO CRÍTICO (nat 1)' : crit ? 'CRÍTICO!' : hit ? 'ACERTO' : 'ERRO';
  const defLabel = reactionRoll ? `reação ${defenseValue}` : `defesa ${defenseValue}`;
  const log = [logEntry('roll',
    `${actor.name} usa ${action.name}: rola ${attackTotal}${mods ? ` (${mods})` : ''} vs ${defLabel} — ${verdict}.`)];

  return { attempted: true, roll: r, natural, attackTotal, defenseValue, reactionRoll, crit, fumble, hit, log };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/resolve.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/resolve.ts utils/resolve.test.ts
git commit -m "feat(combate-v2): motor etapa 2 — acerto com crítico, nat 1 e reação"
```

---

### Task 6: `utils/resolve.ts` — Etapa 3 do motor (dano + interações + afinidades + demais efeitos)

**Files:**
- Modify: `utils/resolve.ts`
- Test: `utils/resolve.test.ts`

- [ ] **Step 1: Adicionar os testes (falhando)**

Acrescentar ao final de `utils/resolve.test.ts` (import adicional: `applyEffects`):

```ts
import { applyEffects } from './resolve';

describe('applyEffects', () => {
  it('rola o dano e aplica como delta negativo de HP', () => {
    const roll = seqRoller([{ total: 8, dieRoll: 8 }]);
    const r = applyEffects('A', snap({ id: 'b' }), [{ kind: 'damage', dice: '2d6', element: 'normal' }], { roll });
    expect(r.damages[0].final).toBe(8);
    expect(r.targetDelta).toEqual({ hp: -8 });
  });

  it('crítico dobra os dados (não o bônus fixo)', () => {
    const roll = seqRoller([{ total: 10, dieRoll: 7, bonus: 3 }]); // 2d6+3 → dados 7
    const r = applyEffects('A', snap({ id: 'b' }), [{ kind: 'damage', dice: '2d6+3', element: 'normal' }], { roll, crit: true });
    expect(r.damages[0].final).toBe(17); // 7*2 + 3
  });

  it('afinidade fraco ×1.5 (arredonda para baixo)', () => {
    const roll = seqRoller([{ total: 7, dieRoll: 7 }]);
    const target = snap({ id: 'b', affinities: { fogo: 'fraco' } });
    const r = applyEffects('A', target, [{ kind: 'damage', dice: '2d6', element: 'fogo' }], { roll });
    expect(r.damages[0].final).toBe(10); // floor(7*1.5)
  });

  it('imune zera o dano', () => {
    const roll = seqRoller([{ total: 12, dieRoll: 12 }]);
    const target = snap({ id: 'b', affinities: { raio: 'imune' } });
    const r = applyEffects('A', target, [{ kind: 'damage', dice: '3d6', element: 'raio' }], { roll });
    expect(r.damages[0].final).toBe(0);
    expect(r.targetDelta.hp).toBe(0);
  });

  it('raio em alvo Molhado: +5 flat e consome Molhado', () => {
    const roll = seqRoller([{ total: 6, dieRoll: 6 }]);
    const target = snap({ id: 'b', conditions: [{ name: 'Molhado', duration: 2 }] });
    const r = applyEffects('A', target, [{ kind: 'damage', dice: '2d6', element: 'raio' }], { roll });
    expect(r.damages[0].final).toBe(11);
    expect(r.targetConditions).toEqual([]);
  });

  it('água aplica Molhado e apaga Queimando', () => {
    const roll = seqRoller([{ total: 4, dieRoll: 4 }]);
    const target = snap({ id: 'b', conditions: [{ name: 'Queimando', duration: 3 }] });
    const r = applyEffects('A', target, [{ kind: 'damage', dice: '1d6', element: 'água' }], { roll });
    expect(r.targetConditions).toEqual([{ name: 'Molhado', duration: 2 }]);
  });

  it('Protegido reduz o dano final (valor do preset = 3, mínimo 0)', () => {
    const roll = seqRoller([{ total: 2, dieRoll: 2 }]);
    const target = snap({ id: 'b', conditions: [{ name: 'Protegido', duration: 2 }] });
    const r = applyEffects('A', target, [{ kind: 'damage', dice: '1d4', element: 'normal' }], { roll });
    expect(r.damages[0].final).toBe(0); // max(0, 2-3)
  });

  it('ordem: interação → afinidade (fogo ÷2 em Molhado, depois fraco ×1.5)', () => {
    const roll = seqRoller([{ total: 10, dieRoll: 10 }]);
    const target = snap({ id: 'b', conditions: [{ name: 'Molhado', duration: 2 }], affinities: { fogo: 'fraco' } });
    const r = applyEffects('A', target, [{ kind: 'damage', dice: '3d6', element: 'fogo' }], { roll });
    expect(r.damages[0].final).toBe(7); // floor(floor(10*0.5)*1.5)
  });

  it('cura rolada e cura flat', () => {
    const roll = seqRoller([{ total: 5, dieRoll: 5 }]);
    const r1 = applyEffects('A', snap({ id: 'b' }), [{ kind: 'heal', stat: 'hp', dice: '1d8' }], { roll });
    expect(r1.targetDelta).toEqual({ hp: 5 });
    const r2 = applyEffects('A', snap({ id: 'b' }), [{ kind: 'heal', stat: 'aura', dice: '4' }], { roll });
    expect(r2.targetDelta).toEqual({ aura: 4 });
  });

  it('condição nova é aplicada; repetida renova para a maior duração', () => {
    const target = snap({ id: 'b', conditions: [{ name: 'Queimando', duration: 1 }] });
    const r = applyEffects('A', target, [
      { kind: 'condition', name: 'Queimando', duration: 3 },
      { kind: 'condition', name: 'Envenenado', duration: 4 },
    ]);
    expect(r.targetConditions).toEqual([
      { name: 'Queimando', duration: 3 },
      { name: 'Envenenado', duration: 4 },
    ]);
  });

  it('buffs são coletados para o encounter registrar', () => {
    const r = applyEffects('A', snap({ id: 'b' }), [{ kind: 'buff', stat: 'defesa', value: 2, duration: 1 }]);
    expect(r.buffs).toEqual([{ stat: 'defesa', value: 2, duration: 1 }]);
  });

  it('múltiplos efeitos acumulam num só resultado', () => {
    const roll = seqRoller([{ total: 6, dieRoll: 6 }]);
    const r = applyEffects('A', snap({ id: 'b' }), [
      { kind: 'damage', dice: '2d6', element: 'fogo' },
      { kind: 'condition', name: 'Queimando', duration: 3 },
    ], { roll });
    expect(r.targetDelta).toEqual({ hp: -6 });
    expect(r.targetConditions).toEqual([{ name: 'Queimando', duration: 3 }]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/resolve.test.ts`
Expected: FAIL (`applyEffects` não exportado).

- [ ] **Step 3: Implementar a etapa 3 em `utils/resolve.ts`**

Acrescentar ao final do arquivo:

```ts
// ─────────────────────────────────────────────────────────────────
// Etapa 3 — efeitos (dano, cura, condições, buffs)
// ─────────────────────────────────────────────────────────────────
import type { Effect } from './grimoire';

/** '5' → flat 5; senão rola a notation. */
function rollAmount(dice: string, roll: Roller): { value: number; rolled?: RollResult } {
  if (/^\s*\d+\s*$/.test(dice)) return { value: parseInt(dice, 10) };
  const r = roll(dice);
  return { value: r.total, rolled: r };
}

/** Adiciona ou renova (maior duração vence) uma condição. */
function upsertCondition(list: Condition[], name: string, duration: number): Condition[] {
  const idx = list.findIndex(c => c.name === name);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { name, duration: Math.max(next[idx].duration, duration) };
    return next;
  }
  return [...list, { name, duration }];
}

export interface DamageBreakdown {
  dice: string;
  element: Element;
  rolled: RollResult;
  interaction: InteractionResult;
  affinity?: Affinity;
  final: number;
}

export interface EffectsResult {
  damages: DamageBreakdown[];
  targetDelta: StatDelta;
  /** Lista FINAL de condições do alvo (após interações e aplicações). */
  targetConditions: Condition[];
  /** Buffs para o chamador registrar no encounter (alvo = target). */
  buffs: { stat: BuffStat; value: number; duration: number }[];
  log: CenaLogEntry[];
}

export interface EffectOptions {
  crit?: boolean;
  /** Buffs de dano do atacante (soma no dano rolado). */
  damageBonus?: number;
  roll?: Roller;
}

const PROTECT_VALUE = PRESET_CONDITIONS.find(p => p.name === 'Protegido')?.defaultValue ?? 0;

/** Aplica a lista de efeitos de uma ação que conectou no alvo. */
export function applyEffects(
  actorName: string,
  target: CombatantSnapshot,
  effects: Effect[],
  opts: EffectOptions = {},
): EffectsResult {
  const roll = opts.roll ?? rollDice;
  let conditions = [...target.conditions];
  const delta: StatDelta = {};
  const damages: DamageBreakdown[] = [];
  const buffs: EffectsResult['buffs'] = [];
  const log: CenaLogEntry[] = [];

  for (const ef of effects) {
    if (ef.kind === 'damage') {
      const rolled = roll(ef.dice);
      let dmg = (opts.crit ? rolled.dieRoll * 2 + rolled.bonus : rolled.total) + (opts.damageBonus ?? 0);
      const interaction = elementInteraction(ef.element, conditions);
      dmg = Math.floor(dmg * interaction.multiplier) + interaction.flatBonus;
      const affinity = target.affinities?.[ef.element];
      dmg = Math.floor(dmg * affinityMultiplier(affinity));
      const isProtected = conditions.some(c => c.name === 'Protegido');
      if (isProtected && dmg > 0) dmg = Math.max(0, dmg - PROTECT_VALUE);

      for (const rem of interaction.removeConditions) conditions = conditions.filter(c => c.name !== rem);
      for (const ren of interaction.renewConditions) conditions = upsertCondition(conditions, ren.name, ren.duration);
      for (const add of interaction.addConditions) conditions = upsertCondition(conditions, add.name, add.duration);

      delta.hp = (delta.hp ?? 0) - dmg;
      damages.push({ dice: ef.dice, element: ef.element, rolled, interaction, affinity, final: dmg });

      const affNote = affinity === 'fraco' ? ' — FRAQUEZA!' : affinity === 'resistente' ? ' — resistiu' : affinity === 'imune' ? ' — IMUNE' : '';
      const protNote = isProtected && dmg >= 0 ? ` (Protegido −${PROTECT_VALUE})` : '';
      log.push(logEntry('damage',
        `${target.name} sofre ${dmg} de dano de ${ef.element} [${rolled.notation}: ${rolled.individualRolls.join('+')}]${affNote}${protNote}.`));
      for (const n of interaction.notes) log.push(logEntry('condition', `${n}.`));
    } else if (ef.kind === 'heal') {
      const { value } = rollAmount(ef.dice, roll);
      delta[ef.stat] = (delta[ef.stat] ?? 0) + value;
      const label = ef.stat === 'hp' ? 'HP' : ef.stat === 'aura' ? 'Aura' : 'Munição';
      log.push(logEntry('damage', `${target.name} recupera ${value} de ${label}.`));
    } else if (ef.kind === 'condition') {
      conditions = upsertCondition(conditions, ef.name, ef.duration);
      log.push(logEntry('condition', `${target.name} recebe ${ef.name} (${ef.duration} rodada(s)).`));
    } else if (ef.kind === 'buff') {
      buffs.push({ stat: ef.stat, value: ef.value, duration: ef.duration });
      log.push(logEntry('condition', `${target.name} ganha ${ef.value >= 0 ? '+' : ''}${ef.value} de ${ef.stat} por ${ef.duration} rodada(s).`));
    }
  }

  return { damages, targetDelta: delta, targetConditions: conditions, buffs, log };
}
```

Nota: mover o `import type { Effect } from './grimoire';` para o bloco de imports no topo do arquivo (junto de `BuffStat, CombatProfile`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/resolve.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/resolve.ts utils/resolve.test.ts
git commit -m "feat(combate-v2): motor etapa 3 — dano com interações/afinidades + efeitos"
```

---

### Task 7: `utils/resolve.ts` — `resolveV2` (conveniência que encadeia as 3 etapas)

**Files:**
- Modify: `utils/resolve.ts`
- Test: `utils/resolve.test.ts`

- [ ] **Step 1: Adicionar os testes (falhando)**

Acrescentar ao final de `utils/resolve.test.ts` (import adicional: `resolveV2`):

```ts
import { resolveV2 } from './resolve';

describe('resolveV2', () => {
  const fireball: ActionInput = {
    name: 'Bola de Fogo',
    profile: {
      actionType: 'principal', targeting: 'inimigo', attackDice: '1d20',
      costs: { aura: 2 },
      effects: [
        { kind: 'damage', dice: '2d6', element: 'fogo' },
        { kind: 'condition', name: 'Queimando', duration: 3 },
      ],
    },
  };

  it('bloqueio de custo interrompe tudo', () => {
    const r = resolveV2(snap({ id: 'a', currentAura: 1 }), snap({ id: 'b' }), fireball);
    expect(r.blocked).toBe('Aura insuficiente');
    expect(r.outcome).toBeUndefined();
    expect(r.effects).toBeUndefined();
  });

  it('erro no acerto: paga custos, sem efeitos', () => {
    const roll = seqRoller([{ total: 3, individualRolls: [3] }]);
    const r = resolveV2(snap({ id: 'a' }), snap({ id: 'b', defense: 15 }), fireball, { roll });
    expect(r.blocked).toBeUndefined();
    expect(r.actorDelta).toEqual({ aura: -2 });
    expect(r.outcome?.hit).toBe(false);
    expect(r.effects).toBeUndefined();
  });

  it('acerto completo: custos + dano + condição, log encadeado', () => {
    const roll = seqRoller([
      { total: 15, individualRolls: [15] }, // acerto
      { total: 7, dieRoll: 7 },             // dano
    ]);
    const r = resolveV2(snap({ id: 'a', name: 'Mago' }), snap({ id: 'b', name: 'Ogro', defense: 10 }), fireball, { roll });
    expect(r.actorDelta).toEqual({ aura: -2 });
    expect(r.effects?.targetDelta).toEqual({ hp: -7 });
    expect(r.effects?.targetConditions).toEqual([{ name: 'Queimando', duration: 3 }]);
    expect(r.log.length).toBeGreaterThanOrEqual(3); // acerto + dano + condição
  });

  it('crítico propaga para o dano', () => {
    const roll = seqRoller([
      { total: 20, individualRolls: [20], numSides: 20 },
      { total: 7, dieRoll: 7 },
    ]);
    const r = resolveV2(snap({ id: 'a' }), snap({ id: 'b', defense: 10 }), fireball, { roll });
    expect(r.outcome?.crit).toBe(true);
    expect(r.effects?.damages[0].final).toBe(14); // 7*2
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/resolve.test.ts`
Expected: FAIL (`resolveV2` não exportado).

- [ ] **Step 3: Implementar em `utils/resolve.ts`**

Acrescentar ao final:

```ts
// ─────────────────────────────────────────────────────────────────
// Conveniência — resolve as 3 etapas de uma vez ("resolver tudo")
// ─────────────────────────────────────────────────────────────────
export interface FullResolution {
  blocked?: string;
  actorDelta: StatDelta;
  outcome?: AttackOutcome;
  effects?: EffectsResult;
  log: CenaLogEntry[];
}

/**
 * Encadeia custos → acerto → efeitos. A UI passo a passo (Fase 3) chama as
 * etapas individualmente; este wrapper serve o botão "resolver tudo" e testes.
 * Requisitos (checkRequirements) são verificados ANTES, pelo chamador, pois
 * dependem do acervo (holdings) — fora do escopo do snapshot.
 */
export function resolveV2(
  actor: CombatantSnapshot,
  target: CombatantSnapshot,
  action: ActionInput,
  opts: AttackOptions & EffectOptions = {},
): FullResolution {
  const costs = payCosts(actor, action);
  if (costs.blocked) return { blocked: costs.blocked, actorDelta: {}, log: costs.log };

  const outcome = rollAttack(actor, target, action, opts);
  const log = [...costs.log, ...outcome.log];
  if (!outcome.hit) return { actorDelta: costs.actorDelta, outcome, log };

  const effects = applyEffects(actor.name, target, action.profile.effects, { ...opts, crit: outcome.crit });
  return { actorDelta: costs.actorDelta, outcome, effects, log: [...log, ...effects.log] };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/resolve.test.ts`
Expected: PASS (todos os describes do arquivo).

- [ ] **Step 5: Commit**

```bash
git add utils/resolve.ts utils/resolve.test.ts
git commit -m "feat(combate-v2): resolveV2 encadeia custos, acerto e efeitos"
```

---

### Task 8: `utils/cena.ts` — EncounterState v2 (slots, reações, buffs, formas, preparações)

**Files:**
- Modify: `utils/cena.ts`
- Test: `utils/cena.test.ts`

- [ ] **Step 1: Adicionar os testes (falhando)**

Acrescentar ao final de `utils/cena.test.ts`:

```ts
import { DEFAULT_ENCOUNTER } from './cena';

describe('EncounterState v2 defaults', () => {
  it('createDefaultCena traz os campos novos do encounter', () => {
    const c = createDefaultCena();
    expect(c.encounter.turn).toEqual({ majorUsed: false, minorUsed: false });
    expect(c.encounter.reactionsUsed).toEqual({});
    expect(c.encounter.activeBuffs).toEqual([]);
    expect(c.encounter.activeFormas).toEqual([]);
    expect(c.encounter.preparations).toEqual([]);
  });

  it('instâncias default são independentes (sem referência compartilhada)', () => {
    const a = createDefaultCena();
    a.encounter.activeBuffs.push({ targetId: 'x', stat: 'defesa', value: 1, roundsRemaining: 1, source: 't' });
    a.encounter.reactionsUsed['x'] = true;
    expect(DEFAULT_ENCOUNTER.activeBuffs).toEqual([]);
    expect(DEFAULT_ENCOUNTER.reactionsUsed).toEqual({});
    expect(createDefaultCena().encounter.activeBuffs).toEqual([]);
  });
});
```

> Se `utils/cena.test.ts` já importa `createDefaultCena`, reuse o import existente; caso contrário adicione-o.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/cena.test.ts`
Expected: FAIL (campos `turn`/`reactionsUsed`/... não existem).

- [ ] **Step 3: Implementar em `utils/cena.ts`**

No topo, adicionar o import:

```ts
import type { BuffStat } from './grimoire';
```

Substituir a interface `EncounterState` e o `DEFAULT_ENCOUNTER` por:

```ts
/** Slots de ação do turno atual. */
export interface EncounterTurnState { majorUsed: boolean; minorUsed: boolean }

/** Buff temporário registrado no encounter. */
export interface ActiveBuff {
  targetId: string;
  stat: BuffStat;
  value: number;
  roundsRemaining: number;
  source: string;
}

/** Forma (transformação) ativa. roundsRemaining 0 = permanente até o fim do combate. */
export interface ActiveFormaState { ownerId: string; entryId: string; roundsRemaining: number }

/** Combo em preparação (dispara quando roundsRemaining chega a 0). */
export interface PreparationState {
  ownerId: string;
  entryId: string;
  roundsRemaining: number;
  participantIds: string[];
}

/** Estado de combate v2. */
export interface EncounterState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  order: EncounterEntry[];
  turn: EncounterTurnState;
  /** id → já reagiu nesta rodada. */
  reactionsUsed: Record<string, boolean>;
  activeBuffs: ActiveBuff[];
  activeFormas: ActiveFormaState[];
  preparations: PreparationState[];
}
```

E:

```ts
export const DEFAULT_ENCOUNTER: EncounterState = {
  isActive: false,
  round: 1,
  turnIndex: 0,
  order: [],
  turn: { majorUsed: false, minorUsed: false },
  reactionsUsed: {},
  activeBuffs: [],
  activeFormas: [],
  preparations: [],
};

/** Cópia profunda e independente do encounter default. */
export function createDefaultEncounter(): EncounterState {
  return {
    ...DEFAULT_ENCOUNTER,
    order: [],
    turn: { majorUsed: false, minorUsed: false },
    reactionsUsed: {},
    activeBuffs: [],
    activeFormas: [],
    preparations: [],
  };
}
```

Atualizar `createDefaultCena` para usar o helper:

```ts
export function createDefaultCena(): CenaState {
  return {
    scene: { ...DEFAULT_SCENE },
    npcRoster: [],
    encounter: createDefaultEncounter(),
    log: [],
    tokens: {},
  };
}
```

- [ ] **Step 4: Corrigir os pontos que criam `EncounterState` literal**

`utils/encounter.ts` tem dois literais que agora não compilam:

Em `startEncounter`, trocar o objeto do encounter por:

```ts
  return appendLog({ ...cena, encounter: {
    isActive: true, round: 1, turnIndex: 0, order,
    turn: { majorUsed: false, minorUsed: false },
    reactionsUsed: {}, activeBuffs: [], activeFormas: [], preparations: [],
  } }, logs);
```

Em `endEncounter`, trocar por:

```ts
import { createDefaultEncounter } from './cena';
// ...
export function endEncounter(cena: CenaState): CenaState {
  return { ...cena, encounter: createDefaultEncounter() };
}
```

- [ ] **Step 5: Corrigir os testes existentes que constroem `EncounterState` literal**

Dois testes montam o encounter na mão e não compilam com os campos novos obrigatórios:

1. `utils/encounter.test.ts:37` — o helper `enc`. Trocar por (mantendo as entradas de `order` já existentes no arquivo):

```ts
  const enc = (turnIndex: number, round = 1): EncounterState => ({
    ...createDefaultEncounter(),
    isActive: true, round, turnIndex,
    order: [
      // ...entradas existentes, sem mudança...
    ],
  });
```

e adicionar `createDefaultEncounter` ao import de `./cena` na linha 3.

2. `tabs/CenaTab.test.tsx:41` — o literal `encounter: { isActive: true, round: 1, turnIndex: 0, order: [...] }`. Trocar por:

```ts
    const cena = { ...createDefaultCena(), encounter: { ...createDefaultEncounter(), isActive: true, round: 1, turnIndex: 0, order: [
      // ...entradas existentes, sem mudança...
```

e adicionar `createDefaultEncounter` ao import de `../utils/cena` do arquivo.

- [ ] **Step 6: Rodar e ver passar (inclui a suite inteira)**

Run: `npm test`
Expected: PASS — inclusive os testes existentes de `encounter.test.ts` e `CenaTab.test.tsx` (o `ensureCena` do database faz spread do default sobre o raw, então estados salvos antigos ganham os campos novos automaticamente).

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 7: Commit**

```bash
git add utils/cena.ts utils/encounter.ts utils/cena.test.ts utils/encounter.test.ts tabs/CenaTab.test.tsx
git commit -m "feat(combate-v2): EncounterState v2 — slots, reações, buffs, formas, preparações"
```

---

### Task 9: `utils/encounter.ts` — helpers de economia de ação, reação e buffs

**Files:**
- Modify: `utils/encounter.ts`
- Test: `utils/encounter.test.ts`

- [ ] **Step 1: Adicionar os testes (falhando)**

Acrescentar ao final de `utils/encounter.test.ts`:

```ts
import { createDefaultEncounter } from './cena';
import {
  addBuff, buffTotal, canReact, markReaction, markSlot, slotAvailable, tickBuffs,
} from './encounter';

function enc2(overrides: Partial<ReturnType<typeof createDefaultEncounter>> = {}) {
  return { ...createDefaultEncounter(), isActive: true, ...overrides };
}

describe('slots de ação', () => {
  it('principal e menor começam livres; reação não consome slot', () => {
    const e = enc2();
    expect(slotAvailable(e, 'principal')).toBe(true);
    expect(slotAvailable(e, 'menor')).toBe(true);
    expect(slotAvailable(e, 'reação')).toBe(true);
  });

  it('markSlot consome o slot correspondente', () => {
    let e = markSlot(enc2(), 'principal');
    expect(slotAvailable(e, 'principal')).toBe(false);
    expect(slotAvailable(e, 'menor')).toBe(true);
    e = markSlot(e, 'menor');
    expect(slotAvailable(e, 'menor')).toBe(false);
  });

  it('advanceTurn reseta os slots', () => {
    const base = enc2({
      order: [
        { refId: 'a', side: 'party', initiative: 15 },
        { refId: 'b', side: 'npc', initiative: 10 },
      ],
    });
    const used = markSlot(markSlot(base, 'principal'), 'menor');
    const next = advanceTurn(used, () => false);
    expect(next.turn).toEqual({ majorUsed: false, minorUsed: false });
  });
});

describe('reações', () => {
  it('canReact/markReaction controlam 1 reação por rodada', () => {
    let e = enc2();
    expect(canReact(e, 'a')).toBe(true);
    e = markReaction(e, 'a');
    expect(canReact(e, 'a')).toBe(false);
    expect(canReact(e, 'b')).toBe(true);
  });

  it('nova rodada (wrap do advanceTurn) limpa as reações', () => {
    const base = enc2({
      order: [
        { refId: 'a', side: 'party', initiative: 15 },
        { refId: 'b', side: 'npc', initiative: 10 },
      ],
      turnIndex: 1,
    });
    const used = markReaction(base, 'a');
    const next = advanceTurn(used, () => false); // volta ao índice 0 → round++
    expect(next.round).toBe(2);
    expect(next.reactionsUsed).toEqual({});
  });
});

describe('buffs', () => {
  it('addBuff registra e buffTotal soma por alvo e stat', () => {
    let e = addBuff(enc2(), { targetId: 'a', stat: 'defesa', value: 2, roundsRemaining: 1, source: 'Guarda' });
    e = addBuff(e, { targetId: 'a', stat: 'defesa', value: 1, roundsRemaining: 2, source: 'Selo' });
    e = addBuff(e, { targetId: 'a', stat: 'acerto', value: 3, roundsRemaining: 1, source: 'Benção' });
    expect(buffTotal(e, 'a', 'defesa')).toBe(3);
    expect(buffTotal(e, 'a', 'acerto')).toBe(3);
    expect(buffTotal(e, 'b', 'defesa')).toBe(0);
  });

  it('tickBuffs decrementa só os buffs do dono e expira em 0 com log', () => {
    let e = addBuff(enc2(), { targetId: 'a', stat: 'defesa', value: 2, roundsRemaining: 1, source: 'Guarda' });
    e = addBuff(e, { targetId: 'b', stat: 'dano', value: 1, roundsRemaining: 1, source: 'Fúria' });
    const r = tickBuffs(e, 'a', 'Alice');
    expect(buffTotal(r.enc, 'a', 'defesa')).toBe(0);
    expect(buffTotal(r.enc, 'b', 'dano')).toBe(1); // intocado
    expect(r.log[0].text).toContain('Guarda');
    expect(r.log[0].text).toContain('expirou');
  });

  it('buff com mais rodadas sobrevive ao tick', () => {
    const e = addBuff(enc2(), { targetId: 'a', stat: 'defesa', value: 1, roundsRemaining: 2, source: 'Selo' });
    const r = tickBuffs(e, 'a', 'Alice');
    expect(buffTotal(r.enc, 'a', 'defesa')).toBe(1);
    expect(r.log).toEqual([]);
  });
});
```

> O arquivo já importa `advanceTurn`; reuse. Ajuste imports duplicados se necessário.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/encounter.test.ts`
Expected: FAIL (helpers não exportados; reset de slots/reações ainda não existe).

- [ ] **Step 3: Implementar em `utils/encounter.ts`**

Ajustar os imports no topo — o arquivo JÁ importa tipos de `./cena`; adicione `ActiveBuff` ao import existente e crie o do grimoire:

```ts
import type { ActiveBuff, CenaState, CenaLogEntry, EncounterEntry, EncounterState } from './cena';
import type { ActionType, BuffStat } from './grimoire';
```

Atualizar `advanceTurn` e `prevTurn` para resetar slots (e reações no wrap). Em `advanceTurn`, trocar o retorno de sucesso por:

```ts
    if (!isDefeated(enc.order[idx])) {
      const wrapped = round > enc.round;
      return {
        ...enc, turnIndex: idx, round,
        turn: { majorUsed: false, minorUsed: false },
        reactionsUsed: wrapped ? {} : enc.reactionsUsed,
      };
    }
```

Em `prevTurn`, trocar o retorno de sucesso por:

```ts
    if (!isDefeated(enc.order[idx])) {
      return { ...enc, turnIndex: idx, round, turn: { majorUsed: false, minorUsed: false } };
    }
```

Acrescentar ao final do arquivo:

```ts
// ─────────────────────────────────────────────────────────────────
// Economia de ações, reações e buffs (combate v2)
// ─────────────────────────────────────────────────────────────────

/** O slot do tipo de ação ainda está livre neste turno? (reação não usa slot) */
export function slotAvailable(enc: EncounterState, actionType: ActionType): boolean {
  if (actionType === 'principal') return !enc.turn.majorUsed;
  if (actionType === 'menor') return !enc.turn.minorUsed;
  return true;
}

/** Consome o slot do tipo de ação (imutável). */
export function markSlot(enc: EncounterState, actionType: ActionType): EncounterState {
  if (actionType === 'principal') return { ...enc, turn: { ...enc.turn, majorUsed: true } };
  if (actionType === 'menor') return { ...enc, turn: { ...enc.turn, minorUsed: true } };
  return enc;
}

/** O participante ainda pode reagir nesta rodada? */
export function canReact(enc: EncounterState, id: string): boolean {
  return !enc.reactionsUsed[id];
}

/** Marca a reação da rodada como usada. */
export function markReaction(enc: EncounterState, id: string): EncounterState {
  return { ...enc, reactionsUsed: { ...enc.reactionsUsed, [id]: true } };
}

/** Registra um buff temporário. */
export function addBuff(enc: EncounterState, buff: ActiveBuff): EncounterState {
  return { ...enc, activeBuffs: [...enc.activeBuffs, buff] };
}

/** Soma dos buffs ativos de um stat para um alvo. */
export function buffTotal(enc: EncounterState, targetId: string, stat: BuffStat): number {
  return enc.activeBuffs
    .filter(b => b.targetId === targetId && b.stat === stat)
    .reduce((acc, b) => acc + b.value, 0);
}

/**
 * Início do turno do dono: decrementa os buffs dele; expira em 0 com log.
 * (Chamar junto do tickConditions.)
 */
export function tickBuffs(
  enc: EncounterState,
  ownerId: string,
  ownerName: string,
): { enc: EncounterState; log: CenaLogEntry[] } {
  const log: CenaLogEntry[] = [];
  const next: ActiveBuff[] = [];
  for (const b of enc.activeBuffs) {
    if (b.targetId !== ownerId) { next.push(b); continue; }
    const remaining = b.roundsRemaining - 1;
    if (remaining > 0) next.push({ ...b, roundsRemaining: remaining });
    else log.push(logEntry('condition', `${b.source} (${b.value >= 0 ? '+' : ''}${b.value} ${b.stat}) expirou em ${ownerName}.`));
  }
  return { enc: { ...enc, activeBuffs: next }, log };
}
```

- [ ] **Step 4: Rodar e ver passar (suite inteira)**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 5: Commit**

```bash
git add utils/encounter.ts utils/encounter.test.ts
git commit -m "feat(combate-v2): slots de ação, reações por rodada e buffs com tick"
```

---

### Task 10: `utils/database.ts` — store `grimoire` + snapshot v5

**Files:**
- Modify: `utils/database.ts`

(Sem teste automatizado: o módulo depende de IndexedDB real, sem cobertura no repo; a verificação é `tsc` + suite existente + smoke manual na Fase 2.)

- [ ] **Step 1: Adicionar o store e o tipo**

Em `utils/database.ts`:

1. Adicionar o import (junto dos imports existentes):

```ts
import type { GrimoireEntry } from './grimoire';
```

2. Bump da versão do IDB (linha ~98):

```ts
// bump para 7 → cria o store 'grimoire'
const IDB_VERSION = 7;
```

3. Incluir o store:

```ts
const ALL_STORES = ['characters', 'cards', 'seals', 'items', 'weapons', 'grimoire', 'meta'] as const;
```

4. `ListenerKey` e `_listeners` ganham `grimoire`:

```ts
type ListenerKey = 'characters' | 'cards' | 'items' | 'seals' | 'weapons' | 'grimoire' | 'combat' | 'journey' | 'cena' | 'extras';
const _listeners: Record<ListenerKey, Function[]> = {
  characters: [], cards: [], items: [], seals: [], weapons: [], grimoire: [], combat: [], journey: [], cena: [], extras: [],
};
```

- [ ] **Step 2: Snapshot v5**

1. `AppSnapshot` ganha o campo (após `weapons`):

```ts
  grimoire: GrimoireEntry[];
```

2. Bump:

```ts
export const SNAPSHOT_VERSION = 5;
```

3. `ensureChar` preserva o acervo novo:

```ts
function ensureChar(c: any): Character {
  return { ...c, items: c.items ?? [], ownedItems: c.ownedItems ?? [], conditions: c.conditions ?? [], cardIds: c.cardIds ?? [], weaponIds: c.weaponIds ?? [], sealIds: c.sealIds ?? [], grimoire: c.grimoire ?? [] };
}
```

4. `loadAll` carrega o store (adicionar ao `Promise.all` após weapons e ao objeto de retorno):

```ts
    _getAll<any>('grimoire'),
```

```ts
    grimoire: grimoire as GrimoireEntry[],
```

(renomear as variáveis da desestruturação: `const [chars, cards, items, seals, weapons, grimoire, combatRec, journeyRec, cenaRec, extrasRec] = ...` — a ordem do array deve bater com a do `Promise.all`.)

5. Tipo de retorno de `initialize` ganha `grimoire: GrimoireEntry[];` (após `weapons`).

- [ ] **Step 3: API pública**

Adicionar ao `DatabaseService` (após `syncWeapons` / `deleteWeapon` respectivamente):

```ts
  syncGrimoire: (cb: (d: GrimoireEntry[]) => void) => {
    _getAll<GrimoireEntry>('grimoire').then(d => cb(d)).catch(() => cb([]));
    return _subscribe<GrimoireEntry[]>('grimoire', cb);
  },
```

```ts
  saveGrimoireEntry: async (entry: GrimoireEntry) => {
    await _put('grimoire', entry);
    _notify('grimoire', await _getAll<GrimoireEntry>('grimoire'));
  },
  deleteGrimoireEntry: async (id: string) => {
    await _delete('grimoire', id);
    _notify('grimoire', await _getAll<GrimoireEntry>('grimoire'));
  },
```

Em `saveFullSnapshot`, adicionar ao `Promise.all` (após a linha de weapons):

```ts
      _replaceAll('grimoire', snapshot.grimoire ?? []),
```

e após `_notify('weapons', ...)`:

```ts
    _notify('grimoire', snapshot.grimoire ?? []);
```

Em `restoreSnapshot`, adicionar ao objeto snapshot (após `weapons`):

```ts
        grimoire: Array.isArray(raw.grimoire) ? raw.grimoire : [],
```

- [ ] **Step 4: Ligar o App.tsx ao store (evita que o autosave apague o catálogo)**

`App.tsx` monta `AppSnapshot` literal em DOIS lugares (autosave ~linha 2938 e save manual ~linha 3131); com o campo `grimoire` obrigatório eles não compilam mais — e passar `[]` fixo faria o autosave limpar o store na Fase 2. Ligar o estado de verdade:

1. Import no topo de `App.tsx` (junto dos imports de utils):

```ts
import type { GrimoireEntry } from './utils/grimoire';
```

2. State (junto de `const [cards, setCards] = useState<Card[]>([]);`, ~linha 2766):

```ts
const [grimoire, setGrimoire] = useState<GrimoireEntry[]>([]);
```

3. No boot (`DatabaseService.initialize().then(...)`, ~linha 2883): adicionar `grimoire: grim` à desestruturação e, junto dos outros setters:

```ts
setGrimoire(grim);
```

4. Nas subscriptions (~linha 2913, após `unsubWeapons`):

```ts
const unsubGrimoire = DatabaseService.syncGrimoire((data) => { if (!cancelled) setGrimoire(data); });
```

e chamar `unsubGrimoire();` no cleanup do mesmo `useEffect` (junto dos outros `unsub*()`).

5. Nos DOIS literais de `saveFullSnapshot` (autosave ~2938 e manual ~3131): trocar `version: 4` por `version: 5` e adicionar `grimoire,` após `weapons,`.

6. No array de deps do `useEffect` do autosave (~linha 2969): adicionar `grimoire` (ex.: após `seals`).

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add utils/database.ts App.tsx
git commit -m "feat(grimorio): store IndexedDB 'grimoire' + snapshot v5 + estado no App"
```

---

### Task 11: Verificação final da fase

- [ ] **Step 1: Suite completa + tipos**

Run: `npm test`
Expected: PASS (todos, incluindo os pré-existentes).

Run: `npx tsc --noEmit`
Expected: apenas os erros pré-existentes (nenhum novo).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 3: Commit final (se sobrou algo) e resumo**

```bash
git status
```

Expected: árvore limpa. Reportar: módulos criados (grimoire/elements/resolve), extensões (cena/encounter/database/types) e que nenhuma UI mudou — Fases 2 e 3 ganham planos próprios.
