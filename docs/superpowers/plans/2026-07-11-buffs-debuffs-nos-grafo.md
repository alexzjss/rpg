# Novos nós de buff/debuff no grafo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 4 nós novos ao editor visual de habilidades (`utils/nodes/coreNodes.ts`) — `bonus_dado`, `escudo`, `regeneracao`, `dispersar` — cobrindo bônus de dado (teste/dano/cura, geral ou por elemento), escudo temporário, regeneração constante de vida/aura, e remoção de efeitos ativos (dispel).

**Architecture:** Cada nó constrói um objeto `ArsenalEffect` (ou, no caso de `dispersar`, chama um helper novo de remoção) e aplica via `applyCondition`, exatamente como os nós `buff`/`aplicar_condicao` já existentes fazem. O motor de execução (`arsenalPipeline.ts`) já lê `diceBonuses`, `shield` (via `consumeShield` em `abilityPrimitives.ts`), `periodicHealing`/`auraRestored` — nenhuma mudança de motor é necessária para esses três. Só `dispersar` precisa de uma função nova (`removeActiveEffects`), que reaproveita a função já existente `removeActiveEffect` (singular, por id) de `arsenalPipeline.ts`.

**Tech Stack:** TypeScript, Vitest.

---

## Contexto para quem for implementar

- O registro de nós fica em `utils/nodes/coreNodes.ts`, função `registerCoreNodes()`. Cada nó é `registerNodeType<Props>({...})` — veja os nós `buff` (linha ~196) e `aplicar_condicao` (linha ~133) como referência direta de padrão.
- `ArsenalEffect` (tipo completo) está em `utils/arsenal.ts:202-271`. `AmountFormula = { flat: number; dice?: string }` (`arsenal.ts:10-13`). `DiceBonus` está em `arsenal.ts:152-166` (`target: 'teste'|'dano_extra'|'dano'|'cura'`, `bonusDice?`, `bonusFlat?`, `filter?: EffectFilter`). `EffectFilter.damageType?: Element[]` (`arsenal.ts:131-140`).
- `applyCondition(target, effect, roller)` (`utils/abilityPrimitives.ts`) empilha o efeito no alvo respeitando imunidade — é a função que todo nó de efeito ativo usa pra aplicar.
- `InterpretCtx` (`utils/abilityInterpreter.ts:16+`) tem `scope: ArsenalActorState[]` (alvos correntes, mutável), `roller`, `trace`, `commit?: () => void` (sincroniza mutações de volta).
- `removeActiveEffect(effects, effectId)` (`utils/arsenalPipeline.ts:447-449`) já existe — remove um efeito específico por id de um array de `ActiveEffectState[]`.
- Novos efeitos são sempre **anexados ao final** do array `effects` (`stackEffect`, `arsenalPipeline.ts:417-433`, `return [...states, {...}]` quando o id não existe ainda) — ou seja, **o último elemento do array é sempre o mais recente**.
- Os testes de nós ficam em `utils/nodes/coreNodes.test.ts`, usando o helper `alvo()`/`ctx()` já definidos no topo do arquivo.
- Os testes de `abilityPrimitives.ts` ficam em `utils/abilityPrimitives.test.ts`, usando o helper `actor()` já definido no topo do arquivo.
- Rode os testes com: `npx vitest run utils/nodes/coreNodes.test.ts utils/abilityPrimitives.test.ts`

---

### Task 1: `removeActiveEffects` (helper de dispel) em `abilityPrimitives.ts`

**Files:**
- Modify: `utils/abilityPrimitives.ts`
- Test: `utils/abilityPrimitives.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final de `utils/abilityPrimitives.test.ts` (depois do último `describe`):

```ts
import { removeActiveEffects } from './abilityPrimitives';

describe('removeActiveEffects', () => {
  const negativo = actor().effects; // placeholder, substituído abaixo por efeitos reais
  const mkEffect = (id: string, over: Partial<ArsenalEffect> = {}): ArsenalEffect => ({
    id, name: id, description: '', tags: [], duration: { type: 'rodadas', amount: 2 },
    stackBehavior: 'nao_acumula', maxStacks: 1, triggers: [], modifiers: [],
    periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
    attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null, ...over,
  });

  it('remove o efeito negativo mais recente quando categoria é negativo', () => {
    const alvo = actor({
      effects: [
        { effect: mkEffect('buff-1', { modifiers: [{ stat: 'ataque', operation: 'somar', value: 3 }] }), stacks: 1 },
        { effect: mkEffect('queimadura-1', { classic: { kind: 'queimadura', value: 2 } }), stacks: 1 },
      ],
    });
    const r = removeActiveEffects(alvo, 'negativo', 1);
    expect(r.target.effects.map(e => e.effect.id)).toEqual(['buff-1']);
    expect(r.removedNames).toEqual(['queimadura-1']);
  });

  it('remove efeitos positivos sem tocar nos negativos', () => {
    const alvo = actor({
      effects: [
        { effect: mkEffect('buff-1', { modifiers: [{ stat: 'ataque', operation: 'somar', value: 3 }] }), stacks: 1 },
        { effect: mkEffect('queimadura-1', { classic: { kind: 'queimadura', value: 2 } }), stacks: 1 },
      ],
    });
    const r = removeActiveEffects(alvo, 'positivo', 1);
    expect(r.target.effects.map(e => e.effect.id)).toEqual(['queimadura-1']);
  });

  it('categoria "qualquer" remove independente de polaridade, mais recentes primeiro', () => {
    const alvo = actor({
      effects: [
        { effect: mkEffect('buff-1'), stacks: 1 },
        { effect: mkEffect('queimadura-1', { classic: { kind: 'queimadura', value: 2 } }), stacks: 1 },
        { effect: mkEffect('buff-2'), stacks: 1 },
      ],
    });
    const r = removeActiveEffects(alvo, 'qualquer', 2);
    expect(r.target.effects.map(e => e.effect.id)).toEqual(['buff-1']);
  });

  it('quantidade 0 não remove nada', () => {
    const alvo = actor({ effects: [{ effect: mkEffect('buff-1'), stacks: 1 }] });
    const r = removeActiveEffects(alvo, 'qualquer', 0);
    expect(r.target.effects.map(e => e.effect.id)).toEqual(['buff-1']);
    expect(r.removedNames).toEqual([]);
  });

  it('quantidade maior que o disponível remove todos os elegíveis', () => {
    const alvo = actor({
      effects: [
        { effect: mkEffect('buff-1'), stacks: 1 },
        { effect: mkEffect('buff-2'), stacks: 1 },
      ],
    });
    const r = removeActiveEffects(alvo, 'positivo', 10);
    expect(r.target.effects).toEqual([]);
  });
});
```

Remova a linha placeholder `const negativo = actor().effects;` (era só um lembrete de escopo — não é usada). Adicione também `import type { ArsenalEffect } from './arsenal';` no topo do arquivo de teste, junto aos outros imports.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run utils/abilityPrimitives.test.ts`
Expected: FAIL com `removeActiveEffects is not a function` (ou erro de import, já que a função ainda não existe).

- [ ] **Step 3: Implementar `removeActiveEffects`**

Em `utils/abilityPrimitives.ts`, adicione depois da função `applyCondition` (final do arquivo):

```ts
export type EffectPolarity = 'positivo' | 'negativo' | 'qualquer';

function isNegativeEffect(effect: ArsenalEffect): boolean {
  return !!effect.classic || effect.modifiers.some(m => m.value < 0);
}

export interface RemoveEffectsResult { target: ArsenalActorState; removedNames: string[] }

/** Remove os `quantidade` efeitos mais recentes do alvo que casem com `categoria` (heurística: negativo = tem
 *  condição clássica OU algum modifier com valor negativo; positivo = nem um nem outro). */
export function removeActiveEffects(target: ArsenalActorState, categoria: EffectPolarity, quantidade: number): RemoveEffectsResult {
  if (quantidade <= 0) return { target, removedNames: [] };
  const eligible = target.effects.filter(active =>
    categoria === 'qualquer' ? true : categoria === 'negativo' ? isNegativeEffect(active.effect) : !isNegativeEffect(active.effect));
  const toRemove = eligible.slice(-quantidade);
  const removeIds = new Set(toRemove.map(active => active.effect.id));
  return {
    target: { ...target, effects: target.effects.filter(active => !removeIds.has(active.effect.id)) },
    removedNames: [...toRemove].reverse().map(active => active.effect.name),
  };
}
```

Precisa importar `ArsenalEffect` no topo de `abilityPrimitives.ts` — confirme se já está importado (o arquivo já importa `ArsenalEffect` de `./arsenal` na linha 4); se não estiver, adicione.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run utils/abilityPrimitives.test.ts`
Expected: PASS (todos os testes, incluindo os 5 novos de `removeActiveEffects`).

- [ ] **Step 5: Commit**

```bash
git add utils/abilityPrimitives.ts utils/abilityPrimitives.test.ts
git commit -m "feat(grafo): adiciona removeActiveEffects para dispersar efeitos"
```

---

### Task 2: Nó `bonus_dado`

**Files:**
- Modify: `utils/nodes/coreNodes.ts`
- Test: `utils/nodes/coreNodes.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final do `describe('registerCoreNodes', ...)` em `utils/nodes/coreNodes.test.ts`:

```ts
it('nó bonus_dado aplica DiceBonus filtrado por elemento no alvo', () => {
  const c = ctx();
  getNodeType('bonus_dado')!.interpret!({ target: 'teste', bonusDice: '1d4', bonusFlat: 2, elemento: 'fogo', rounds: 3 }, c);
  const active = c.scope[0].effects[0];
  expect(active.effect.diceBonuses).toEqual([
    { target: 'teste', bonusDice: '1d4', bonusFlat: 2, filter: { damageType: ['fogo'] } },
  ]);
  expect(active.remaining).toBe(3);
});

it('nó bonus_dado sem elemento não tem filtro (vale pra qualquer dano/teste)', () => {
  const c = ctx();
  getNodeType('bonus_dado')!.interpret!({ target: 'dano', bonusDice: undefined, bonusFlat: 3, elemento: null, rounds: 2 }, c);
  const active = c.scope[0].effects[0];
  expect(active.effect.diceBonuses).toEqual([
    { target: 'dano', bonusDice: null, bonusFlat: 3, filter: undefined },
  ]);
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: FAIL com `getNodeType('bonus_dado')` retornando `undefined` (`Cannot read properties of undefined (reading 'interpret')`).

- [ ] **Step 3: Implementar o nó**

Em `utils/nodes/coreNodes.ts`, adicione dentro de `registerCoreNodes()`, depois do nó `buff` (antes do fechamento `}` da função):

```ts
  registerNodeType<{ target: 'teste' | 'dano' | 'dano_extra' | 'cura'; bonusDice?: string; bonusFlat: number; elemento: Element | null; rounds: number }>({
    type: 'bonus_dado', family: 'efeito', label: 'Bônus de dado', category: 'Combate',
    fields: [
      { key: 'target', kind: 'select', label: 'Aplica em', options: [
        { value: 'teste', label: 'Teste (acerto)' }, { value: 'dano', label: 'Dano' },
        { value: 'dano_extra', label: 'Dano extra' }, { value: 'cura', label: 'Cura' } ] },
      { key: 'bonusDice', kind: 'dado', label: 'Dado extra' },
      { key: 'bonusFlat', kind: 'numero', label: 'Bônus fixo' },
      { key: 'elemento', kind: 'elemento', label: 'Elemento (vazio = qualquer)' },
      { key: 'rounds', kind: 'numero', label: 'Rodadas' },
    ],
    defaults: () => ({ target: 'teste', bonusDice: undefined, bonusFlat: 2, elemento: null, rounds: 3 }),
    summarize: p => `+${p.bonusFlat}${p.bonusDice ? `+${p.bonusDice}` : ''} em ${p.target}${p.elemento ? ` (${p.elemento})` : ''} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = {
        id: `bonus_dado-${p.target}-${crypto.randomUUID()}`, name: `Bônus de ${p.target}`,
        description: '', tags: [], duration: { type: 'rodadas' as const, amount: p.rounds },
        stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [],
        modifiers: [], periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
        attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null,
        diceBonuses: [{ target: p.target, bonusDice: p.bonusDice ?? null, bonusFlat: p.bonusFlat, filter: p.elemento ? { damageType: [p.elemento] } : undefined }],
      };
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'bonus_dado', detail: `${effect.name} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: PASS (todos os testes, incluindo os 2 novos de `bonus_dado`).

- [ ] **Step 5: Commit**

```bash
git add utils/nodes/coreNodes.ts utils/nodes/coreNodes.test.ts
git commit -m "feat(grafo): adiciona nó bonus_dado (teste/dano/cura, geral ou por elemento)"
```

---

### Task 3: Nó `escudo`

**Files:**
- Modify: `utils/nodes/coreNodes.ts`
- Test: `utils/nodes/coreNodes.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final do `describe('registerCoreNodes', ...)`:

```ts
it('nó escudo aplica shield com valor rolado + fixo', () => {
  const c = ctx(); // ctx() usa roller: () => 4
  getNodeType('escudo')!.interpret!({ dice: '1d6', flat: 3, rounds: 2 }, c);
  const active = c.scope[0].effects[0];
  expect(active.effect.shield).toEqual({ flat: 7 }); // 4 (roller) + 3 (flat)
  expect(active.remaining).toBe(2);
});

it('nó escudo sem dado usa só o valor fixo', () => {
  const c = ctx();
  getNodeType('escudo')!.interpret!({ dice: undefined, flat: 5, rounds: 1 }, c);
  expect(c.scope[0].effects[0].effect.shield).toEqual({ flat: 5 });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: FAIL com `getNodeType('escudo')` retornando `undefined`.

- [ ] **Step 3: Implementar o nó**

Em `utils/nodes/coreNodes.ts`, adicione depois do nó `bonus_dado`:

```ts
  registerNodeType<{ dice?: string; flat: number; rounds: number }>({
    type: 'escudo', family: 'efeito', label: 'Escudo', category: 'Combate',
    fields: [
      { key: 'dice', kind: 'dado', label: 'Dado' },
      { key: 'flat', kind: 'numero', label: 'Fixo' },
      { key: 'rounds', kind: 'numero', label: 'Rodadas' },
    ],
    defaults: () => ({ dice: undefined, flat: 10, rounds: 3 }),
    summarize: p => `Escudo ${p.dice ? `${p.dice}+` : ''}${p.flat} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const base = roll(ctx, p.dice, p.flat, 'Escudo');
      ctx.scope = ctx.scope.map(target => {
        const multiplier = ctx.scopeMultiplier?.get(target.id) ?? 1;
        const amount = Math.round(base * multiplier);
        const effect = {
          id: `escudo-${crypto.randomUUID()}`, name: `Escudo ${amount}`,
          description: '', tags: [], duration: { type: 'rodadas' as const, amount: p.rounds },
          stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [],
          modifiers: [], periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
          attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null,
          shield: { flat: amount },
        };
        return applyCondition(target, effect, ctx.roller);
      });
      ctx.trace.push({ node: 'escudo', detail: `Escudo de ${base} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/nodes/coreNodes.ts utils/nodes/coreNodes.test.ts
git commit -m "feat(grafo): adiciona nó escudo (barreira temporária)"
```

---

### Task 4: Nó `regeneracao`

**Files:**
- Modify: `utils/nodes/coreNodes.ts`
- Test: `utils/nodes/coreNodes.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final do `describe('registerCoreNodes', ...)`:

```ts
it('nó regeneracao de vida aplica periodicHealing', () => {
  const c = ctx();
  getNodeType('regeneracao')!.interpret!({ recurso: 'vida', dice: '1d4', flat: 1, rounds: 3 }, c);
  const active = c.scope[0].effects[0];
  expect(active.effect.periodicHealing).toEqual({ flat: 1, dice: '1d4' });
  expect(active.effect.auraRestored).toBeNull();
});

it('nó regeneracao de aura aplica auraRestored', () => {
  const c = ctx();
  getNodeType('regeneracao')!.interpret!({ recurso: 'aura', dice: undefined, flat: 2, rounds: 2 }, c);
  const active = c.scope[0].effects[0];
  expect(active.effect.auraRestored).toEqual({ flat: 2, dice: undefined });
  expect(active.effect.periodicHealing).toBeNull();
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: FAIL com `getNodeType('regeneracao')` retornando `undefined`.

- [ ] **Step 3: Implementar o nó**

Em `utils/nodes/coreNodes.ts`, adicione depois do nó `escudo`:

```ts
  registerNodeType<{ recurso: 'vida' | 'aura'; dice?: string; flat: number; rounds: number }>({
    type: 'regeneracao', family: 'efeito', label: 'Regeneração', category: 'Combate',
    fields: [
      { key: 'recurso', kind: 'select', label: 'Recurso', options: [
        { value: 'vida', label: 'Vida' }, { value: 'aura', label: 'Aura' } ] },
      { key: 'dice', kind: 'dado', label: 'Dado' },
      { key: 'flat', kind: 'numero', label: 'Fixo' },
      { key: 'rounds', kind: 'numero', label: 'Rodadas' },
    ],
    defaults: () => ({ recurso: 'vida', dice: undefined, flat: 3, rounds: 3 }),
    summarize: p => `Regenera ${p.dice ? `${p.dice}+` : ''}${p.flat} de ${p.recurso} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const formula = { flat: p.flat, dice: p.dice };
      const effect = {
        id: `regeneracao-${p.recurso}-${crypto.randomUUID()}`, name: `Regeneração de ${p.recurso}`,
        description: '', tags: [], duration: { type: 'rodadas' as const, amount: p.rounds },
        stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [],
        modifiers: [],
        periodicDamage: null, periodicHealing: p.recurso === 'vida' ? formula : null,
        auraConsumed: null, auraRestored: p.recurso === 'aura' ? formula : null,
        attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null,
      };
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'regeneracao', detail: `${effect.name} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/nodes/coreNodes.ts utils/nodes/coreNodes.test.ts
git commit -m "feat(grafo): adiciona nó regeneracao (cura constante de vida/aura)"
```

---

### Task 5: Nó `dispersar`

**Files:**
- Modify: `utils/nodes/coreNodes.ts`
- Test: `utils/nodes/coreNodes.test.ts`

- [ ] **Step 1: Atualizar o helper `alvo()` para aceitar overrides**

O helper `alvo()` no topo de `utils/nodes/coreNodes.test.ts` hoje não recebe parâmetros:

```ts
const alvo = (): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 0, maxAura: 0,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true,
});
```

O teste do nó `dispersar` (próximo passo) precisa de um alvo com efeitos pré-existentes. Troque essa definição por (aceita override opcional, todas as chamadas existentes sem argumento continuam funcionando):

```ts
const alvo = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 0, maxAura: 0,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true, ...over,
});
```

- [ ] **Step 2: Escrever o teste que falha**

Adicione ao final do `describe('registerCoreNodes', ...)`, usando o `alvo({ effects: [...] })` que agora aceita override:

```ts
it('nó dispersar remove o efeito negativo mais recente do alvo', () => {
  const buffEfeito = {
    id: 'buff-1', name: 'Buff', description: '', tags: [], duration: { type: 'rodadas' as const, amount: 2 },
    stackBehavior: 'nao_acumula' as const, maxStacks: 1, triggers: [],
    modifiers: [{ stat: 'ataque' as const, operation: 'somar' as const, value: 3 }],
    periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
    attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null,
  };
  const queimaduraEfeito = {
    ...buffEfeito, id: 'queimadura-1', name: 'Queimadura', modifiers: [],
    classic: { kind: 'queimadura' as const, value: 2 },
  };
  const c = ctx({ scope: [alvo({ effects: [{ effect: buffEfeito, stacks: 1 }, { effect: queimaduraEfeito, stacks: 1 }] })] });
  getNodeType('dispersar')!.interpret!({ categoria: 'negativo', quantidade: 1 }, c);
  expect(c.scope[0].effects.map(e => e.effect.id)).toEqual(['buff-1']);
  expect(c.trace.some(t => t.detail?.includes('Queimadura'))).toBe(true);
});

it('nó dispersar sem efeitos elegíveis não remove nada e registra no trace', () => {
  const c = ctx({ scope: [alvo({ effects: [] })] });
  getNodeType('dispersar')!.interpret!({ categoria: 'negativo', quantidade: 1 }, c);
  expect(c.scope[0].effects).toEqual([]);
  expect(c.trace.some(t => t.detail?.includes('Nada para remover'))).toBe(true);
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: FAIL com `getNodeType('dispersar')` retornando `undefined`.

- [ ] **Step 4: Implementar o nó**

Em `utils/nodes/coreNodes.ts`:

1. Adicione `removeActiveEffects` ao import existente de `./abilityPrimitives` no topo do arquivo (linha 2):

```ts
import { applyDamage, applyHeal, applyCondition, removeActiveEffects } from '../abilityPrimitives';
```

2. Adicione o nó, depois do nó `regeneracao`:

```ts
  registerNodeType<{ categoria: 'positivo' | 'negativo' | 'qualquer'; quantidade: number }>({
    type: 'dispersar', family: 'efeito', label: 'Dispersar efeitos', category: 'Combate',
    fields: [
      { key: 'categoria', kind: 'select', label: 'Categoria', options: [
        { value: 'positivo', label: 'Positivo (buffs)' }, { value: 'negativo', label: 'Negativo (debuffs)' },
        { value: 'qualquer', label: 'Qualquer' } ] },
      { key: 'quantidade', kind: 'numero', label: 'Quantidade' },
    ],
    defaults: () => ({ categoria: 'negativo', quantidade: 1 }),
    summarize: p => `Remove ${p.quantidade} efeito(s) ${p.categoria}`,
    interpret: (p, ctx) => {
      ctx.scope = ctx.scope.map(target => {
        const { target: next, removedNames } = removeActiveEffects(target, p.categoria, p.quantidade);
        ctx.trace.push({
          node: 'dispersar',
          detail: removedNames.length ? `Removeu ${removedNames.join(', ')} de ${target.name}` : `Nada para remover em ${target.name}`,
        });
        return next;
      });
      ctx.commit?.();
    },
  });
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run utils/nodes/coreNodes.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add utils/nodes/coreNodes.ts utils/nodes/coreNodes.test.ts
git commit -m "feat(grafo): adiciona nó dispersar (remove efeitos ativos por categoria)"
```

---

### Task 6: Verificação final

**Files:** nenhum (só verificação)

- [ ] **Step 1: Rodar a suíte completa dos arquivos tocados**

Run: `npx vitest run utils/nodes/coreNodes.test.ts utils/abilityPrimitives.test.ts`
Expected: PASS, todos os testes (antigos + novos).

- [ ] **Step 2: Rodar o typecheck do projeto**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `coreNodes.ts` ou `abilityPrimitives.ts`.

- [ ] **Step 3: Rodar a suíte completa do projeto**

Run: `npx vitest run`
Expected: PASS — confirma que nada em `arsenalPipeline.ts`, `abilityGraphAction.ts` ou outros consumidores de `ArsenalEffect`/`ArsenalActorState` quebrou.
