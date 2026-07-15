# Simplificação da paleta do grafo (rumo a JRPG) — Implementation Plan

> **For agentic workers:** Execução inline nesta sessão (sem subagentes, sem commits — pedido explícito do usuário, já registrado em memória). Formato enxuto: arquivos, contratos e código exatos definidos aqui; cada tarefa termina com testes verdes (`npm test -- <arquivo>`) antes de seguir para a próxima. Suíte completa a cada 2-3 tarefas.

**Goal:** Reduzir a paleta de ~30 para 10 efeitos essenciais, transformar gatilhos e "Forma" em blocos escolhíveis no canvas, adicionar 4 condições de "SE" pré-montadas, e remover os campos vestigiais do cabeçalho (Ativação/Economia), deixando os rótulos de custo claros.

**Spec:** `docs/superpowers/specs/2026-07-10-grafo-simplificacao-jrpg-design.md`

---

## Task 1: Buff unificado + novo gatilho "Quando alvejado" (coreNodes.ts)

**Files:**
- Modify: `utils/nodes/coreNodes.ts`
- Modify: `utils/nodes/coreNodes.test.ts`

Substitui o nó `buff` atual (só ataque/defesa/velocidade) por uma versão unificada que também aceita `vida_maxima`/`aura_maxima` com `operation` (somar/multiplicar/definir) — essa é a peça que a Forma vai usar. Remove o nó `ramo` genérico (vai para `conditionNodes.ts` na Task 3). Adiciona o gatilho `ao_ser_alvejado`.

- [ ] **Step 1: Atualizar `coreNodes.test.ts`** — trocar o teste de `ramo` por um de `ao_ser_alvejado`, e reescrever o teste de `buff` para a nova assinatura:

```ts
// utils/nodes/coreNodes.test.ts — substituir os testes de 'buff' e 'ramo' por:
describe('registerCoreNodes', () => {
  beforeEach(() => { _resetRegistry(); registerCoreNodes(); });

  it('nó dano desconta do alvo no escopo', () => {
    const c = ctx();
    getNodeType('dano')!.interpret!({ dice: '1d6', flat: 2, element: 'fogo' }, c);
    expect(c.scope[0].currentHp).toBe(24);
    expect(c.trace.some(t => t.detail?.includes('dano'))).toBe(true);
  });

  it('nó alvo troca o escopo para próprio usuário', () => {
    const c = ctx();
    getNodeType('alvo')!.interpret!({ scope: 'proprio' }, c);
    expect(c.scope[0].id).toBe(c.actor.id);
  });

  it('gatilho "quando alvejado" existe e não tem campos', () => {
    expect(getNodeType('ao_ser_alvejado')).toBeTruthy();
    expect(getNodeType('ao_ser_alvejado')!.fields).toEqual([]);
  });

  it('buff unificado aplica modificador de stat de combate', () => {
    const c = ctx();
    getNodeType('buff')!.interpret!({ stat: 'ataque', operation: 'somar', value: 3, rounds: 2 }, c);
    const active = c.scope[0].effects[0];
    expect(active.effect.modifiers).toEqual([{ stat: 'ataque', operation: 'somar', value: 3 }]);
  });

  it('buff unificado com stat vida_maxima grava o modificador correspondente', () => {
    const c = ctx();
    getNodeType('buff')!.interpret!({ stat: 'vida_maxima', operation: 'somar', value: 10, rounds: 5 }, c);
    const active = c.scope[0].effects[0];
    expect(active.effect.modifiers).toEqual([{ stat: 'vida_maxima', operation: 'somar', value: 10 }]);
  });
});
```

Mantenha o restante do arquivo (`alvo`/`ctx` helpers, teste de `dano`) como está — só remova o teste antigo de `ramo` (era `'nó ramo avalia predicado vida_abaixo'`) e o teste antigo de `buff` que testava só `ataque/defesa/velocidade`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/nodes/coreNodes.test.ts`
Expected: FAIL (`ao_ser_alvejado` não registrado; `buff` não aceita `vida_maxima`).

- [ ] **Step 3: Reescrever `coreNodes.ts`**

```ts
// utils/nodes/coreNodes.ts
import { registerNodeType } from '../nodeRegistry';
import { applyDamage, applyHeal, applyCondition } from '../abilityPrimitives';
import { getPredefinedEffect } from '../arsenalEffects';
import type { InterpretCtx } from '../abilityInterpreter';
import type { Element } from '../../types';

type ScopeKind = 'proprio' | 'alvo_da_habilidade' | 'todos_inimigos' | 'todos_aliados';
type BuffStat = 'ataque' | 'defesa' | 'velocidade' | 'vida_maxima' | 'aura_maxima';
type BuffOperation = 'somar' | 'multiplicar' | 'definir';

function roll(ctx: InterpretCtx, dice: string | undefined, flat: number): number {
  return (dice ? ctx.roller(dice) : 0) + flat;
}

export function registerCoreNodes(): void {
  registerNodeType({
    type: 'ao_ativar', family: 'gatilho', label: 'Quando usada', fields: [],
    defaults: () => ({}), summarize: () => 'Quando a habilidade é usada',
  });

  registerNodeType({
    type: 'ao_ser_alvejado', family: 'gatilho', label: 'Quando alvejado', fields: [],
    defaults: () => ({}), summarize: () => 'Quando o personagem é alvejado por uma carta',
  });

  registerNodeType<{ scope: ScopeKind }>({
    type: 'alvo', family: 'alvo', label: 'Mudar alvo',
    fields: [{ key: 'scope', kind: 'select', label: 'Escopo', options: [
      { value: 'proprio', label: 'Próprio usuário' },
      { value: 'alvo_da_habilidade', label: 'Alvo da habilidade' },
      { value: 'todos_inimigos', label: 'Todos os inimigos' },
      { value: 'todos_aliados', label: 'Todos os aliados' },
    ] }],
    defaults: () => ({ scope: 'alvo_da_habilidade' }),
    summarize: p => `Alvo → ${p.scope}`,
    interpret: (p, ctx) => {
      if (p.scope === 'proprio') ctx.scope = [ctx.actor];
      else if (p.scope === 'todos_inimigos') ctx.scope = ctx.allTargets?.filter(t => t.teamId !== ctx.actor.teamId) ?? ctx.scope;
      else if (p.scope === 'todos_aliados') ctx.scope = ctx.allTargets?.filter(t => t.teamId === ctx.actor.teamId) ?? ctx.scope;
      else ctx.scope = ctx.primaryTargets ?? ctx.scope;
    },
  });

  registerNodeType<{ dice?: string; flat: number; element: Element | null }>({
    type: 'dano', family: 'efeito', label: 'Dano',
    fields: [
      { key: 'dice', kind: 'dado', label: 'Dado' },
      { key: 'flat', kind: 'numero', label: 'Fixo' },
      { key: 'element', kind: 'elemento', label: 'Elemento' },
    ],
    defaults: () => ({ dice: '1d6', flat: 0, element: null }),
    summarize: p => `Dano ${p.dice ?? ''}+${p.flat} ${p.element ?? ''}`.trim(),
    interpret: (p, ctx) => {
      const base = roll(ctx, p.dice, p.flat);
      ctx.scope = ctx.scope.map(target => {
        const multiplier = ctx.scopeMultiplier?.get(target.id) ?? 1;
        const amount = Math.round(base * multiplier);
        const r = applyDamage(target, amount, p.element ?? ctx.element, ctx.roller);
        ctx.trace.push({ node: 'dano', detail: `${r.appliedDamage} de dano em ${target.name}` });
        return r.target;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ dice?: string; flat: number }>({
    type: 'cura', family: 'efeito', label: 'Cura',
    fields: [{ key: 'dice', kind: 'dado', label: 'Dado' }, { key: 'flat', kind: 'numero', label: 'Fixo' }],
    defaults: () => ({ dice: '1d4', flat: 0 }),
    summarize: p => `Cura ${p.dice ?? ''}+${p.flat}`.trim(),
    interpret: (p, ctx) => {
      const base = roll(ctx, p.dice, p.flat);
      ctx.scope = ctx.scope.map(target => {
        const multiplier = ctx.scopeMultiplier?.get(target.id) ?? 1;
        const r = applyHeal(target, Math.round(base * multiplier));
        ctx.trace.push({ node: 'cura', detail: `${-r.appliedDamage} de cura em ${target.name}` });
        return r.target;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ classicKind: string }>({
    type: 'aplicar_condicao', family: 'efeito', label: 'Aplicar condição',
    fields: [{ key: 'classicKind', kind: 'select', label: 'Condição', options: [
      'queimadura','congelamento','lentidao','molhado','eletrocutado','sangramento','fraqueza',
      'acelerado','desnorteado','enraizado','desequilibrado','fraturado','iluminado','amaldicoado',
      'paralisado','confuso',
    ].map(k => ({ value: k, label: k })) }],
    defaults: () => ({ classicKind: 'queimadura' }),
    summarize: p => `Aplica ${p.classicKind}`,
    interpret: (p, ctx) => {
      const effect = getPredefinedEffect(p.classicKind);
      if (!effect) { ctx.trace.push({ node: 'aplicar_condicao', detail: `condição desconhecida: ${p.classicKind}` }); return; }
      ctx.scope = ctx.scope.map(target => {
        const next = applyCondition(target, effect, ctx.roller);
        const applied = next !== target;
        if (applied) ctx.lastEffectKind?.set(target.id, p.classicKind);
        ctx.trace.push({ node: 'aplicar_condicao', detail: `${applied ? 'aplicou' : 'imune a'} ${p.classicKind} em ${target.name}` });
        return next;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ stat: BuffStat; operation: BuffOperation; value: number; rounds: number }>({
    type: 'buff', family: 'efeito', label: 'Buff/Debuff',
    fields: [
      { key: 'stat', kind: 'select', label: 'Atributo', options: [
        { value: 'ataque', label: 'Ataque' }, { value: 'defesa', label: 'Defesa' }, { value: 'velocidade', label: 'Velocidade' },
        { value: 'vida_maxima', label: 'Vida máxima' }, { value: 'aura_maxima', label: 'Aura máxima' } ] },
      { key: 'operation', kind: 'select', label: 'Operação', options: [
        { value: 'somar', label: 'Somar' }, { value: 'multiplicar', label: 'Multiplicar (%)' }, { value: 'definir', label: 'Definir' } ] },
      { key: 'value', kind: 'numero', label: 'Valor (±)' },
      { key: 'rounds', kind: 'numero', label: 'Rodadas' },
    ],
    defaults: () => ({ stat: 'ataque', operation: 'somar', value: 2, rounds: 3 }),
    summarize: p => `${p.stat} ${p.operation} ${p.value >= 0 ? '+' : ''}${p.value} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = {
        id: `buff-${p.stat}-${crypto.randomUUID()}`, name: `${p.stat} ${p.operation} ${p.value}`,
        description: '', tags: [], duration: { type: 'rodadas' as const, amount: p.rounds },
        stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [],
        modifiers: [{ stat: p.stat, operation: p.operation, value: p.value }],
        periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
        attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null,
      };
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'buff', detail: `${effect.name} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
}
```

Nota: `modifiers` no `ArsenalEffect` já é uma lista de `EffectModifier` genérica (`stat: string`); como `stat` agora pode ser `'vida_maxima'|'aura_maxima'` (valores que o tipo `EffectModifier.stat` do legado não conhecia), o TypeScript vai reclamar da atribuição literal. Resolva alargando o tipo em `utils/arsenal.ts`:

```ts
// utils/arsenal.ts — no EffectModifier, ampliar a união de stat:
export interface EffectModifier {
  stat: 'ataque' | 'defesa' | 'velocidade' | 'dano' | 'cura' | 'aura' | 'cura_recebida' | 'aura_recebida' | 'vida_maxima' | 'aura_maxima';
  operation: 'somar' | 'multiplicar' | 'definir';
  value: number;
  filter?: EffectFilter;
}
```
Isso é aditivo — o pipeline legado (`arsenalPipeline.ts`) só lê `ataque/defesa/dano` explicitamente e ignora os demais valores, então não quebra nada existente.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/nodes/coreNodes.test.ts`
Expected: PASS.

---

## Task 2: Deletar arquivos de nós removidos + podar defenseNodes/controlNodes

**Files:**
- Delete: `utils/nodes/statModifierNodes.ts`, `utils/nodes/statModifierNodes.test.ts`
- Delete: `utils/nodes/resourceNodes.ts`, `utils/nodes/resourceNodes.test.ts`
- Delete: `utils/nodes/fieldNodes.ts`, `utils/nodes/fieldNodes.test.ts`
- Delete: `utils/nodes/specialNodes.ts`, `utils/nodes/specialNodes.test.ts`
- Modify: `utils/nodes/defenseNodes.ts`, `utils/nodes/defenseNodes.test.ts`
- Modify: `utils/nodes/controlNodes.ts`, `utils/nodes/controlNodes.test.ts`
- Modify: `utils/nodes/index.ts`

- [ ] **Step 1: Deletar os 4 arquivos de nó + seus testes** (statModifierNodes, resourceNodes, fieldNodes, specialNodes — código e teste de cada).

- [ ] **Step 2: Reescrever `defenseNodes.ts`** removendo `afinidade_elemental` e `imunidade`, mantendo `escudo`/`roubo_vida`/`espinhos` como estão:

```ts
// utils/nodes/defenseNodes.ts
import { registerNodeType } from '../nodeRegistry';
import { applyCondition } from '../abilityPrimitives';
import { createStatusEffect } from './statusEffect';

export function registerDefenseNodes(): void {
  registerNodeType<{ dice?: string; flat: number; rounds: number }>({
    type: 'escudo', family: 'efeito', label: 'Escudo',
    fields: [{ key: 'dice', kind: 'dado', label: 'Dado' }, { key: 'flat', kind: 'numero', label: 'Fixo' }, { key: 'rounds', kind: 'numero', label: 'Rodadas' }],
    defaults: () => ({ dice: '1d6', flat: 0, rounds: 2 }),
    summarize: p => `Escudo ${p.dice ?? ''}+${p.flat}`.trim(),
    interpret: (p, ctx) => {
      const amount = (p.dice ? ctx.roller(p.dice) : 0) + p.flat;
      const effect = createStatusEffect({ name: 'escudo', rounds: p.rounds, shield: { flat: amount } });
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'escudo', detail: `Escudo de ${amount} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });

  registerNodeType<{ percent: number; rounds: number }>({
    type: 'roubo_vida', family: 'efeito', label: 'Roubo de vida',
    fields: [{ key: 'percent', kind: 'numero', label: 'Percentual' }, { key: 'rounds', kind: 'numero', label: 'Rodadas' }],
    defaults: () => ({ percent: 20, rounds: 3 }),
    summarize: p => `Roubo de vida ${p.percent}% por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = createStatusEffect({ name: 'roubo-vida', rounds: p.rounds, lifeSteal: p.percent });
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'roubo_vida', detail: `${p.percent}% por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });

  registerNodeType<{ dice?: string; flat: number; rounds: number }>({
    type: 'espinhos', family: 'efeito', label: 'Espinhos',
    fields: [{ key: 'dice', kind: 'dado', label: 'Dado' }, { key: 'flat', kind: 'numero', label: 'Fixo' }, { key: 'rounds', kind: 'numero', label: 'Rodadas' }],
    defaults: () => ({ dice: '1d4', flat: 0, rounds: 3 }),
    summarize: p => `Espinhos ${p.dice ?? ''}+${p.flat}`.trim(),
    interpret: (p, ctx) => {
      const amount = (p.dice ? ctx.roller(p.dice) : 0) + p.flat;
      const effect = createStatusEffect({ name: 'espinhos', rounds: p.rounds, thorns: { flat: amount } });
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'espinhos', detail: `Espinhos de ${amount} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
}
```

- [ ] **Step 3: Editar `defenseNodes.test.ts`** — remover os dois testes de `afinidade_elemental` e `imunidade` (mantendo os três de escudo/roubo_vida/espinhos como estão).

- [ ] **Step 4: Reescrever `controlNodes.ts`** removendo `provocar` e `invisibilidade`, mantendo `mover`/`silenciar`/`incapacitar`:

```ts
// utils/nodes/controlNodes.ts
import { registerNodeType } from '../nodeRegistry';
import { applyCondition } from '../abilityPrimitives';
import { createStatusEffect } from './statusEffect';

type MoveKind = 'empurrar' | 'puxar' | 'teleportar' | 'trocar_lugar';

export function registerControlNodes(): void {
  registerNodeType<{ kind: MoveKind; distance: number }>({
    type: 'mover', family: 'efeito', label: 'Mover',
    fields: [
      { key: 'kind', kind: 'select', label: 'Tipo', options: [
        { value: 'empurrar', label: 'Empurrar' }, { value: 'puxar', label: 'Puxar' },
        { value: 'teleportar', label: 'Teleportar' }, { value: 'trocar_lugar', label: 'Trocar de lugar' } ] },
      { key: 'distance', kind: 'numero', label: 'Distância' },
    ],
    defaults: () => ({ kind: 'empurrar', distance: 1 }),
    summarize: p => `${p.kind} ${p.distance}`,
    interpret: (p, ctx) => {
      for (const target of ctx.scope) {
        ctx.movementIntents = [...(ctx.movementIntents ?? []), { targetId: target.id, kind: p.kind, distance: p.distance }];
        ctx.trace.push({ node: 'mover', detail: `${p.kind} ${target.name} em ${p.distance}` });
      }
    },
  });

  registerNodeType<{ blocksBasicAttack: boolean; rounds: number }>({
    type: 'silenciar', family: 'efeito', label: 'Silenciar',
    fields: [{ key: 'blocksBasicAttack', kind: 'toggle', label: 'Bloqueia ataque básico' }, { key: 'rounds', kind: 'numero', label: 'Rodadas' }],
    defaults: () => ({ blocksBasicAttack: false, rounds: 2 }),
    summarize: p => `Silenciado por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = createStatusEffect({ name: 'silenciar', rounds: p.rounds, silence: { blocksBasicAttack: p.blocksBasicAttack } });
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'silenciar', detail: `por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });

  registerNodeType<{ rounds: number }>({
    type: 'incapacitar', family: 'efeito', label: 'Incapacitar',
    fields: [{ key: 'rounds', kind: 'numero', label: 'Rodadas' }],
    defaults: () => ({ rounds: 1 }),
    summarize: p => `Incapacitado por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = createStatusEffect({ name: 'incapacitar', rounds: p.rounds, incapacitate: true });
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'incapacitar', detail: `por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });
}
```

- [ ] **Step 5: Editar `controlNodes.test.ts`** — remover os testes de `provocar` e `invisibilidade`, manter os de `mover`/`silenciar`/`incapacitar`.

- [ ] **Step 6: Atualizar `nodes/index.ts`**

```ts
// utils/nodes/index.ts
import { registerCoreNodes } from './coreNodes';
import { registerDefenseNodes } from './defenseNodes';
import { registerControlNodes } from './controlNodes';
import { registerConditionNodes } from './conditionNodes';
import { registerFormaNodes } from './formaNodes';

/** Registra todos os nós da paleta. Cada registerXNodes() é idempotente (sobrescreve por type),
 * então é seguro chamar de novo após um _resetRegistry() em testes. */
export function ensureNodesRegistered(): void {
  registerCoreNodes();
  registerDefenseNodes();
  registerControlNodes();
  registerConditionNodes();
  registerFormaNodes();
}
```

(`conditionNodes`/`formaNodes` ainda não existem — criados nas Tasks 3 e 4. Este arquivo só compila depois delas; ok deixar assim, é o próximo passo imediato.)

- [ ] **Step 7: Rodar os testes dos arquivos que sobraram (sem rodar a suíte inteira ainda, index.ts está incompleto)**

Run: `npm test -- utils/nodes/defenseNodes.test.ts utils/nodes/controlNodes.test.ts`
Expected: PASS.

---

## Task 3: Blocos de "SE" pré-montados (conditionNodes.ts)

**Files:**
- Create: `utils/nodes/conditionNodes.ts`
- Create: `utils/nodes/conditionNodes.test.ts`

- [ ] **Step 1: Escrever o teste**

```ts
// utils/nodes/conditionNodes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry, getNodeType } from '../nodeRegistry';
import { registerConditionNodes } from './conditionNodes';
import type { InterpretCtx } from '../abilityInterpreter';
import type { ArsenalActorState } from '../arsenalPipeline';

const alvo = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 4, maxAura: 10,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true, ...over,
});

function ctx(over: Partial<InterpretCtx> = {}): InterpretCtx {
  return { actor: alvo(), scope: [alvo()], roller: () => 4, element: null, trace: [], ...over } as InterpretCtx;
}

describe('registerConditionNodes', () => {
  beforeEach(() => { _resetRegistry(); registerConditionNodes(); });

  it('se_vida_alvo: abaixo de X% é verdadeiro quando a vida do alvo está abaixo do limite', () => {
    const c = ctx({ scope: [alvo({ currentHp: 5, maxHp: 30 })] }); // ~16%
    expect(getNodeType('se_vida_alvo')!.evaluate!({ comparacao: 'abaixo', percent: 30 }, c)).toBe(true);
    expect(getNodeType('se_vida_alvo')!.evaluate!({ comparacao: 'acima', percent: 30 }, c)).toBe(false);
  });

  it('se_condicao_ativa: verdadeiro quando o alvo tem a condição clássica', () => {
    const queimado = { effect: { id: 'q', name: 'Queimadura', description: '', tags: [], duration: { type: 'rodadas' as const, amount: 2 }, stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [], modifiers: [], periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null, attackModifier: 0, defenseModifier: 0, speedModifier: 0, customEffect: null, classic: { kind: 'queimadura' as const, value: 2 } }, stacks: 1 };
    const c = ctx({ scope: [alvo({ effects: [queimado] })] });
    expect(getNodeType('se_condicao_ativa')!.evaluate!({ classicKind: 'queimadura' }, c)).toBe(true);
    expect(getNodeType('se_condicao_ativa')!.evaluate!({ classicKind: 'molhado' }, c)).toBe(false);
  });

  it('se_aura_minima: verdadeiro quando a aura do usuário atinge o mínimo', () => {
    const c = ctx({ actor: alvo({ currentAura: 4 }) });
    expect(getNodeType('se_aura_minima')!.evaluate!({ amount: 3 }, c)).toBe(true);
    expect(getNodeType('se_aura_minima')!.evaluate!({ amount: 5 }, c)).toBe(false);
  });

  it('se_chance: usa o roller para decidir dentro do percentual', () => {
    const baixo = ctx({ roller: () => 20 }); // 1d100 fixo=20 -> 20% <= 30% => true
    expect(getNodeType('se_chance')!.evaluate!({ percent: 30 }, baixo)).toBe(true);
    const alto = ctx({ roller: () => 80 });
    expect(getNodeType('se_chance')!.evaluate!({ percent: 30 }, alto)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/nodes/conditionNodes.test.ts`
Expected: FAIL (`registerConditionNodes` não existe).

- [ ] **Step 3: Implementar**

```ts
// utils/nodes/conditionNodes.ts
import { registerNodeType } from '../nodeRegistry';

export function registerConditionNodes(): void {
  registerNodeType<{ comparacao: 'abaixo' | 'acima'; percent: number }>({
    type: 'se_vida_alvo', family: 'ramo', label: 'SE vida do alvo',
    fields: [
      { key: 'comparacao', kind: 'select', label: 'Comparação', options: [{ value: 'abaixo', label: 'Abaixo de' }, { value: 'acima', label: 'Acima de' }] },
      { key: 'percent', kind: 'numero', label: 'Percentual' },
    ],
    defaults: () => ({ comparacao: 'abaixo', percent: 30 }),
    summarize: p => `Se vida ${p.comparacao === 'abaixo' ? '<' : '>'} ${p.percent}%`,
    evaluate: (p, ctx) => {
      const t = ctx.scope[0];
      if (!t || t.maxHp <= 0) return false;
      const pct = (t.currentHp / t.maxHp) * 100;
      return p.comparacao === 'abaixo' ? pct < p.percent : pct > p.percent;
    },
  });

  registerNodeType<{ classicKind: string }>({
    type: 'se_condicao_ativa', family: 'ramo', label: 'SE condição ativa no alvo',
    fields: [{ key: 'classicKind', kind: 'select', label: 'Condição', options: [
      'queimadura','congelamento','lentidao','molhado','eletrocutado','sangramento','fraqueza',
      'acelerado','desnorteado','enraizado','desequilibrado','fraturado','iluminado','amaldicoado',
      'paralisado','confuso',
    ].map(k => ({ value: k, label: k })) }],
    defaults: () => ({ classicKind: 'molhado' }),
    summarize: p => `Se alvo tem ${p.classicKind}`,
    evaluate: (p, ctx) => {
      const t = ctx.scope[0];
      return t ? t.effects.some(e => e.effect.classic?.kind === p.classicKind) : false;
    },
  });

  registerNodeType<{ amount: number }>({
    type: 'se_aura_minima', family: 'ramo', label: 'SE aura mínima do usuário',
    fields: [{ key: 'amount', kind: 'numero', label: 'Aura mínima' }],
    defaults: () => ({ amount: 3 }),
    summarize: p => `Se aura ≥ ${p.amount}`,
    evaluate: (p, ctx) => ctx.actor.currentAura >= p.amount,
  });

  registerNodeType<{ percent: number }>({
    type: 'se_chance', family: 'ramo', label: 'SE chance aleatória',
    fields: [{ key: 'percent', kind: 'numero', label: 'Percentual (0-100)' }],
    defaults: () => ({ percent: 30 }),
    summarize: p => `${p.percent}% de chance`,
    evaluate: (p, ctx) => ctx.roller('1d100') <= p.percent,
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/nodes/conditionNodes.test.ts`
Expected: PASS.

---

## Task 4: Blocos de Forma (formaNodes.ts) — Cor do token / Ícone do token

**Files:**
- Create: `utils/nodes/formaNodes.ts`
- Create: `utils/nodes/formaNodes.test.ts`

Esses dois nós **não alteram o combate** — só registram uma "intenção visual" no `trace`/`ctx`, do mesmo jeito que `mover` registra `ctx.movementIntents`. A Cena vai ler os *valores dos nós* diretamente do grafo salvo (não do resultado da interpretação) para montar o anel — ver Task 7. Aqui só precisam existir, ter campos, e (por completude/consistência com os demais efeitos) registrar no trace quando interpretados.

- [ ] **Step 1: Escrever o teste**

```ts
// utils/nodes/formaNodes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry, getNodeType } from '../nodeRegistry';
import { registerFormaNodes } from './formaNodes';
import type { InterpretCtx } from '../abilityInterpreter';
import type { ArsenalActorState } from '../arsenalPipeline';

const alvo = (): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 0, maxAura: 0,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true,
});
function ctx(): InterpretCtx {
  return { actor: alvo(), scope: [alvo()], roller: () => 4, element: null, trace: [] } as InterpretCtx;
}

describe('registerFormaNodes', () => {
  beforeEach(() => { _resetRegistry(); registerFormaNodes(); });

  it('cor_token tem campo de cor e registra no trace', () => {
    const def = getNodeType('cor_token')!;
    expect(def.fields.map(f => f.key)).toEqual(['color']);
    const c = ctx();
    def.interpret!({ color: '#ff0000' }, c);
    expect(c.trace.some(t => t.detail?.includes('#ff0000'))).toBe(true);
  });

  it('icone_token tem campo de ícone e registra no trace', () => {
    const def = getNodeType('icone_token')!;
    expect(def.fields.map(f => f.key)).toEqual(['icon']);
    const c = ctx();
    def.interpret!({ icon: 'https://x/lua.png' }, c);
    expect(c.trace.some(t => t.detail?.includes('lua.png'))).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/nodes/formaNodes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// utils/nodes/formaNodes.ts
import { registerNodeType } from '../nodeRegistry';

export function registerFormaNodes(): void {
  registerNodeType<{ color: string }>({
    type: 'cor_token', family: 'efeito', label: 'Cor do token',
    fields: [{ key: 'color', kind: 'texto', label: 'Cor (hex)' }],
    defaults: () => ({ color: '#f59e0b' }),
    summarize: p => `Cor do token: ${p.color}`,
    interpret: (p, ctx) => { ctx.trace.push({ node: 'cor_token', detail: `Cor do token definida para ${p.color}` }); },
  });

  registerNodeType<{ icon: string }>({
    type: 'icone_token', family: 'efeito', label: 'Ícone do token',
    fields: [{ key: 'icon', kind: 'texto', label: 'URL do ícone' }],
    defaults: () => ({ icon: '' }),
    summarize: p => `Ícone do token: ${p.icon || '(nenhum)'}`,
    interpret: (p, ctx) => { ctx.trace.push({ node: 'icone_token', detail: `Ícone do token: ${p.icon}` }); },
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/nodes/formaNodes.test.ts`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte de `utils/nodes/` inteira agora que `index.ts` está completo**

Run: `npm test -- utils/nodes/`
Expected: PASS (todos os arquivos de `utils/nodes/`).

---

## Task 5: `setRootTrigger` (abilityGraphEdit.ts)

**Files:**
- Modify: `utils/abilityGraphEdit.ts`
- Modify: `utils/abilityGraphEdit.test.ts`

- [ ] **Step 1: Adicionar o teste**

```ts
// utils/abilityGraphEdit.test.ts — adicionar ao describe existente:
it('setRootTrigger troca o tipo do nó raiz existente sem duplicar', () => {
  const base = createAbilityGraph({ id: 'a1', name: 'X' });
  const rootId = base.nodes[0].id;
  const next = setRootTrigger(base, 'ao_ser_alvejado');
  expect(next.nodes).toHaveLength(1);
  expect(next.nodes[0].id).toBe(rootId);
  expect(next.nodes[0].type).toBe('ao_ser_alvejado');
  expect(next.nodes[0].props).toEqual({});
});

it('setRootTrigger preserva os filhos conectados à raiz', () => {
  const base = createAbilityGraph({ id: 'a1', name: 'X' });
  const rootId = base.nodes[0].id;
  const { graph } = addNode(base, rootId, 'dano');
  const next = setRootTrigger(graph, 'ao_ser_alvejado');
  expect(next.edges).toHaveLength(1);
  expect(next.edges[0].from).toBe(rootId);
});
```

E adicionar `setRootTrigger` ao import no topo do arquivo de teste:
```ts
import { addNode, removeNode, updateNodeProps, moveNode, setLevelOverride, setRootTrigger } from './abilityGraphEdit';
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilityGraphEdit.test.ts`
Expected: FAIL (`setRootTrigger` não existe).

- [ ] **Step 3: Implementar**

```ts
// utils/abilityGraphEdit.ts — adicionar ao final do arquivo:

/** Troca o tipo do nó-raiz (gatilho) existente, preservando id/props/arestas. Usa os defaults do novo tipo. */
export function setRootTrigger(graph: AbilityGraph, type: string): AbilityGraph {
  const root = graph.nodes.find(n => n.family === 'gatilho');
  if (!root) return graph;
  const def = getNodeType(type);
  return {
    ...graph,
    nodes: graph.nodes.map(n => n.id === root.id ? { ...n, type, props: def?.defaults() ?? {} } : n),
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilityGraphEdit.test.ts`
Expected: PASS.

---

## Task 6: Remover Ativação/Economia/Forma/ReactionTag do tipo `AbilityHeader`

**Files:**
- Modify: `utils/abilityGraph.ts`
- Modify: `utils/abilityGraph.test.ts`

- [ ] **Step 1: Conferir que nenhum teste de `abilityGraph.test.ts` referencia os campos removidos** (não referenciam hoje — só testam `header.name`/`activation`/nós/`mergeLevel`). Trocar a asserção que checa `activation`:

```ts
// utils/abilityGraph.test.ts — no teste 'cria um grafo com cabeçalho padrão...', trocar:
//   expect(g.header.activation).toBe('ativa');
// por nada (remover essa linha — o campo não existe mais).
```

- [ ] **Step 2: Editar `abilityGraph.ts`**

```ts
// utils/abilityGraph.ts — remover as linhas de AbilityActivation/ActionEconomy e os campos do header:

// Remover estas duas linhas do topo:
//   export type AbilityActivation = 'ativa' | 'ao_equipar' | 'ao_consumir' | 'enquanto_forma_ativa';
//   export type ActionEconomy = 'principal' | 'menor' | 'reacao' | 'livre';

// No AbilityHeader, remover `activation`, `actionEconomy`, `forma`, `reactionTag`. Resultado:
export interface AbilityHeader {
  name: string;
  description: string;
  icon: string;
  iconPosition?: string;
  artLayout?: 'horizontal' | 'full';
  element: Element | null;
  tags: ArsenalTag[];
  visibility: ArsenalVisibility;
  /** Notação de teste de acerto (ex.: '1d20+3'); ausente = auto-acerto (útil para cura/buff). */
  testDice: string | null;
  /** Custo pago por quem usa a habilidade ao ativá-la. */
  auraCost: number;
  ammoCost: number;
  target: TargetConfig;
  area: AreaConfig | null;
  cooldown: CooldownConfig;
  charges: ChargeConfig | null;
  preparation: PreparationConfig;
  /** Marca esta habilidade como empilhável num combo com outras do mesmo stackKey. Ausente = não combinável. */
  combo?: { stackKey: string; maxStacks: number } | null;
}

// Em createAbilityGraph, remover as linhas `activation: 'ativa',` e `actionEconomy: 'principal',` do objeto default.
```

- [ ] **Step 3: Rodar e ver falhar até ajustar os consumidores**

Run: `npm test -- utils/abilityGraph.test.ts`
Expected: neste ponto o build inteiro do projeto vai quebrar (vários arquivos ainda referenciam `header.activation`/`header.forma`/`header.reactionTag`). Isso é esperado — as próximas tasks corrigem cada consumidor. Confirme que **este arquivo específico** passa:

Run: `npm test -- utils/abilityGraph.test.ts`
Expected: PASS (o arquivo em si não referencia os campos removidos).

Não rode a suíte completa ainda — vai ficar vermelha até a Task 8 terminar. Isso é esperado neste ponto do plano.

---

## Task 7: `activatableGraphForms` por introspecção de nós (abilityGraphAction.ts)

**Files:**
- Modify: `utils/abilityGraphAction.ts`
- Modify: `utils/abilityGraphAction.test.ts`

Substitui a leitura de `graph.header.forma` por uma varredura dos nós do grafo mesclado: é forma se contém `cor_token` OU `icone_token` alcançável a partir da raiz; o bônus de vida/aura vem de nós `buff` com `stat==='vida_maxima'|'aura_maxima'`.

- [ ] **Step 1: Atualizar os testes de `activatableGraphForms`**

```ts
// utils/abilityGraphAction.test.ts — substituir o describe 'activatableGraphForms' inteiro por:
describe('activatableGraphForms', () => {
  function formaGraph(id: string, over: Partial<AbilityGraph['header']> = {}): AbilityGraph {
    return {
      ...createAbilityGraph({ id, name: id, ...over }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'buff', type: 'buff', family: 'efeito', props: { stat: 'vida_maxima', operation: 'somar', value: 10, rounds: 999 } },
        { id: 'cor', type: 'cor_token', family: 'efeito', props: { color: '#f00' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'buff' }, { id: 'e2', from: 'buff', to: 'cor' }],
    };
  }

  it('detecta forma pela presença de cor_token/icone_token no grafo', () => {
    const forma = formaGraph('forma-1');
    const naoForma = createAbilityGraph({ id: 'x', name: 'X' });
    const result = activatableGraphForms(
      actor({ holdings: [{ cardId: 'forma-1', quantity: 1, equipped: false, active: false }] }),
      [forma, naoForma],
      { holdings: [{ cardId: 'forma-1', quantity: 1, equipped: false, active: false }], equippedWeaponIds: [], activeFormIds: [] },
    );
    expect(result).toHaveLength(1);
    expect(result[0].graph.id).toBe('forma-1');
  });

  it('marca como ativa quando já está no activeFormIds do loadout', () => {
    const forma = formaGraph('forma-1');
    const loadout = { holdings: [{ cardId: 'forma-1', quantity: 1, equipped: false, active: true }], equippedWeaponIds: [], activeFormIds: ['forma-1'] };
    const result = activatableGraphForms(actor({ holdings: loadout.holdings }), [forma], loadout);
    expect(result[0]).toMatchObject({ isActive: true, ok: false });
  });

  it('bloqueia por aura insuficiente e expõe o motivo', () => {
    const forma = formaGraph('forma-1', { auraCost: 50 });
    const loadout = { holdings: [{ cardId: 'forma-1', quantity: 1, equipped: false, active: false }], equippedWeaponIds: [], activeFormIds: [] };
    const result = activatableGraphForms(actor({ currentAura: 1, holdings: loadout.holdings }), [forma], loadout);
    expect(result[0]).toMatchObject({ ok: false });
    expect(result[0].reason).toMatch(/aura/i);
  });
});

describe('graphFormaVisual', () => {
  it('extrai cor/ícone/bônus de PV/Aura dos nós do grafo mesclado', () => {
    const forma = {
      ...createAbilityGraph({ id: 'f', name: 'Forma X' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho' as const, props: {} },
        { id: 'b1', type: 'buff', family: 'efeito' as const, props: { stat: 'vida_maxima', operation: 'somar', value: 8, rounds: 999 } },
        { id: 'b2', type: 'buff', family: 'efeito' as const, props: { stat: 'aura_maxima', operation: 'somar', value: 3, rounds: 999 } },
        { id: 'cor', type: 'cor_token', family: 'efeito' as const, props: { color: '#38bdf8' } },
        { id: 'icone', type: 'icone_token', family: 'efeito' as const, props: { icon: 'https://x/lua.png' } },
      ],
      edges: [
        { id: 'e1', from: 'g', to: 'b1' }, { id: 'e2', from: 'b1', to: 'b2' },
        { id: 'e3', from: 'b2', to: 'cor' }, { id: 'e4', from: 'cor', to: 'icone' },
      ],
    };
    const visual = graphFormaVisual(forma, 1);
    expect(visual).toEqual({ isForma: true, color: '#38bdf8', iconOverride: 'https://x/lua.png', hpBonus: 8, auraBonus: 3 });
  });

  it('grafo sem cor_token/icone_token não é forma', () => {
    const naoForma = createAbilityGraph({ id: 'x', name: 'X' });
    expect(graphFormaVisual(naoForma, 1).isForma).toBe(false);
  });
});
```

Adicionar `graphFormaVisual` ao import do topo do arquivo de teste (junto de `resolveAbilityGraphAction, activatableGraphForms`).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilityGraphAction.test.ts`
Expected: FAIL (`activatableGraphForms` ainda lê `header.forma`; `graphFormaVisual` não existe).

- [ ] **Step 3: Implementar**

```ts
// utils/abilityGraphAction.ts — substituir a função activatableGraphForms existente e adicionar graphFormaVisual:

export interface GraphFormaVisual {
  isForma: boolean;
  color?: string;
  iconOverride?: string;
  hpBonus: number;
  auraBonus: number;
}

/** Introspecciona o grafo mesclado no nível: é forma se tem cor_token/icone_token; bônus vem de nós buff com stat vida_maxima/aura_maxima. */
export function graphFormaVisual(graph: AbilityGraph, level: number): GraphFormaVisual {
  const merged = mergeLevel(graph, level);
  const colorNode = merged.nodes.find(n => n.type === 'cor_token');
  const iconNode = merged.nodes.find(n => n.type === 'icone_token');
  const isForma = !!colorNode || !!iconNode;
  const hpBonus = merged.nodes
    .filter(n => n.type === 'buff' && (n.props as { stat?: string }).stat === 'vida_maxima')
    .reduce((sum, n) => sum + Number((n.props as { value?: number }).value ?? 0), 0);
  const auraBonus = merged.nodes
    .filter(n => n.type === 'buff' && (n.props as { stat?: string }).stat === 'aura_maxima')
    .reduce((sum, n) => sum + Number((n.props as { value?: number }).value ?? 0), 0);
  return {
    isForma,
    color: (colorNode?.props as { color?: string })?.color,
    iconOverride: (iconNode?.props as { icon?: string })?.icon,
    hpBonus, auraBonus,
  };
}

export interface GraphFormAvailability {
  graph: AbilityGraph;
  ok: boolean;
  reason: string | null;
  isActive: boolean;
}

/** Formas-grafo (detectadas por cor_token/icone_token) possuídas pelo ator, com um dry-run de custo/cooldown. */
export function activatableGraphForms(
  actor: ArsenalActorState,
  catalog: readonly AbilityGraph[],
  loadout: { holdings: readonly { cardId: string; quantity: number }[]; activeFormIds: readonly string[] },
): GraphFormAvailability[] {
  const owned = new Set(loadout.holdings.filter(h => h.quantity > 0).map(h => h.cardId));
  const formas = catalog.filter(graph => owned.has(graph.id) && graphFormaVisual(graph, 1).isForma);
  return formas.map(graph => {
    const isActive = loadout.activeFormIds.includes(graph.id);
    if (isActive) return { graph, ok: false, reason: null, isActive };
    const dryRun = resolveAbilityGraphAction({ graph, level: 1, actor, targets: [actor] });
    const ok = dryRun.status !== 'bloqueada';
    return { graph, ok, reason: ok ? null : dryRun.reason ?? 'Indisponível', isActive };
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilityGraphAction.test.ts`
Expected: PASS.

---

## Task 8: `CenaTab.tsx` — forma e proteção por introspecção de nós

**Files:**
- Modify: `tabs/CenaTab.tsx`
- Modify: `tabs/CenaTab.test.tsx`

Substitui toda leitura de `graph.header.forma`/`graph.header.reactionTag` por `graphFormaVisual`/verificação do tipo da raiz.

- [ ] **Step 1: Import** — trocar a linha de import de `abilityGraphAction`:

```ts
// tabs/CenaTab.tsx — linha 9, trocar:
import { resolveAbilityGraphAction, activatableGraphForms, graphFormaVisual } from '../utils/abilityGraphAction';
```

- [ ] **Step 2: `formaStates`** (linhas ~246-258) — trocar os dois pontos que leem `header.forma`:

```ts
// tabs/CenaTab.tsx — dentro do for (const p of participants), substituir:
    if (activeForma) {
      const card = leveledArsenal.find(c => c.id === activeForma.entryId);
      const graph = card ? undefined : leveledAbilityGraphs.find(g => g.id === activeForma.entryId);
      const graphVisual = graph ? graphFormaVisual(graph, arsenalLevels[graph.id] ?? 1) : undefined;
      formaStates[p.id] = { ring: 'active', color: card?.form?.color ?? graphVisual?.color, iconOverride: card?.form?.iconOverride ?? graphVisual?.iconOverride };
    } else {
      const readyCard = p.id === turnActor?.id ? turnFormAvailability.find(f => f.ok) : undefined;
      const readyGraph = !readyCard && p.id === turnActor?.id ? turnGraphFormAvailability.find(f => f.ok) : undefined;
      if (readyCard) formaStates[p.id] = { ring: 'available', color: readyCard.card.form?.color };
      else if (readyGraph) formaStates[p.id] = { ring: 'available', color: graphFormaVisual(readyGraph.graph, arsenalLevels[readyGraph.graph.id] ?? 1).color };
    }
```

- [ ] **Step 3: `activateAbilityGraphFormaFor`** (linhas ~356-390) — trocar a leitura de bônus/cor/ícone:

```ts
// tabs/CenaTab.tsx — substituir o corpo de activateAbilityGraphFormaFor:
  const activateAbilityGraphFormaFor = (character: Character, formId: string) => {
    let cur = cena;
    const already = loadoutOf(character).activeFormIds[0];
    if (already && already !== formId) cur = revertForma(cur, character);
    else if (already === formId) { updateCena(revertForma(cur, character)); return; }
    const fresh = byIdIn(cur, character.id) ?? character;
    const graph = leveledAbilityGraphs.find(g => g.id === formId);
    if (!graph) return;
    const result = resolveAbilityGraphAction({ graph, level: 1, actor: actorStateIn(cur, fresh), targets: [actorStateIn(cur, fresh)], roller: notation => rollDice(notation).total });
    if (result.status === 'bloqueada') { updateCena(appendLog(cur, [logEntry('system', `${fresh.name}: ${result.reason}.`)])); return; }
    const loadout = activateForm(loadoutOf(fresh), formId);
    const visual = graphFormaVisual(graph, arsenalLevels[graph.id] ?? 1);
    const newMaxHp = fresh.maxHp + visual.hpBonus;
    const newMaxAura = fresh.maxAura + visual.auraBonus;
    let next = persistCharacter(cur, fresh.id, {
      arsenal: loadout.holdings,
      maxHp: newMaxHp,
      currentHp: Math.min(newMaxHp, result.actor.currentHp + visual.hpBonus),
      maxAura: newMaxAura,
      currentAura: Math.min(newMaxAura, result.actor.currentAura + visual.auraBonus),
      activeEffects: result.actor.effects,
    });
    next = { ...next, encounter: { ...next.encounter, activeFormas: [
      ...next.encounter.activeFormas.filter(f => f.ownerId !== fresh.id),
      { ownerId: fresh.id, entryId: formId, roundsRemaining: 0, hpBonusApplied: visual.hpBonus, auraBonusApplied: visual.auraBonus },
    ] } };
    next = appendLog(next, [logEntry('system', `${fresh.name} assume a forma ${graph.header.name}.`)]);
    setFormaActivation({
      key: Date.now(), characterName: fresh.name, formName: graph.header.name,
      color: visual.color, image: visual.iconOverride || fresh.bannerImage || fresh.icon,
    });
    updateCena(next);
  };
```

Nota: `roundsRemaining` fixo em `0` (permanente até reverter manualmente) — o campo `durationRounds` do antigo `header.forma` não tem mais equivalente estrutural nesta fase (não pedido no spec); permanece assim até um pedido futuro de "duração da forma" virar bloco também.

- [ ] **Step 4: `protectionAbilityGraphsFor`** (linhas ~400-409) — trocar a checagem de `header.reactionTag` pela checagem do tipo da raiz:

```ts
// tabs/CenaTab.tsx — substituir:
  /** Habilidades-grafo cuja raiz é "Quando alvejado" (ao_ser_alvejado), que o alvo possui e pode usar agora. */
  const protectionAbilityGraphsFor = (target:Character):AbilityGraph[] =>
    leveledAbilityGraphs.filter(graph=>{
      const root = graph.nodes.find(n=>n.family==='gatilho');
      if(root?.type!=='ao_ser_alvejado')return false;
      const holding=(target.arsenal??[]).find(item=>item.cardId===graph.id);
      if(!holding||holding.quantity<=0)return false;
      if(holding.cooldownRemaining)return false;
      if(graph.header.charges&&(holding.currentCharges??graph.header.charges.current)<=0)return false;
      return true;
    });
```

- [ ] **Step 5: gate de ativação de forma em `onSelectAction`** (linha ~755) — trocar a condição:

```ts
// tabs/CenaTab.tsx — trocar:
//   if(action.abilityGraph&&mergeLevel(action.abilityGraph,action.abilityGraphLevel??1).header.forma&&turnActor){
// por:
    if(action.abilityGraph&&graphFormaVisual(action.abilityGraph,action.abilityGraphLevel??1).isForma&&turnActor){
      activateAbilityGraphFormaFor(turnActor, action.id);
      return;
    }
```

- [ ] **Step 6: Atualizar `CenaTab.test.tsx`** — os testes de forma-grafo já escritos (Fase 5) usavam `header.forma` para montar o fixture. Trocar os 3 grafos de teste (`acende o anel de forma disponível...`, `não acende o anel quando falta aura...`, `mostra o anel ativo com a cor da forma-grafo...`) para usar nós em vez de `header.forma`:

```ts
// tabs/CenaTab.test.tsx — no describe 'CenaTab — habilidades do novo sistema de grafo',
// substituir os 3 testes de forma-grafo por:

  it('acende o anel de forma disponível para habilidade-grafo com bloco de cor', async () => {
    const { ensureNodesRegistered } = await import('../utils/nodes');
    const { createAbilityGraph } = await import('../utils/abilityGraph');
    ensureNodesRegistered();
    const formaGraph = {
      ...createAbilityGraph({ id: 'graph-forma', name: 'Forma Estelar', auraCost: 4 }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho' as const, props: {} },
        { id: 'cor', type: 'cor_token', family: 'efeito' as const, props: { color: '#38bdf8' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'cor' }],
    };
    const p1 = cast('p1', 'Shinkai', { arsenal: [{ cardId: 'graph-forma', quantity: 1, equipped: false, active: false }] });
    const p2 = cast('p2', 'Mikhail');
    const { container } = render(<CenaTab {...props(combatCena(), [p1, p2], { abilityGraphs: [formaGraph] })} />);
    expect(container.querySelectorAll('.cena-combatant__forma-ring.is-available')).toHaveLength(1);
  });

  it('não acende o anel quando falta aura para a forma-grafo', async () => {
    const { ensureNodesRegistered } = await import('../utils/nodes');
    const { createAbilityGraph } = await import('../utils/abilityGraph');
    ensureNodesRegistered();
    const formaGraph = {
      ...createAbilityGraph({ id: 'graph-forma-cara', name: 'Forma Cara', auraCost: 99 }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho' as const, props: {} },
        { id: 'cor', type: 'cor_token', family: 'efeito' as const, props: { color: '#38bdf8' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'cor' }],
    };
    const p1 = cast('p1', 'Shinkai', { arsenal: [{ cardId: 'graph-forma-cara', quantity: 1, equipped: false, active: false }] });
    const p2 = cast('p2', 'Mikhail');
    const { container } = render(<CenaTab {...props(combatCena(), [p1, p2], { abilityGraphs: [formaGraph] })} />);
    expect(container.querySelectorAll('.cena-combatant__forma-ring.is-available')).toHaveLength(0);
  });

  it('mostra o anel ativo com a cor da forma-grafo quando já ativa', async () => {
    const { ensureNodesRegistered } = await import('../utils/nodes');
    const { createAbilityGraph } = await import('../utils/abilityGraph');
    ensureNodesRegistered();
    const formaGraph = {
      ...createAbilityGraph({ id: 'graph-forma-ativa', name: 'Forma Ativa' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho' as const, props: {} },
        { id: 'cor', type: 'cor_token', family: 'efeito' as const, props: { color: '#22c55e' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'cor' }],
    };
    const cena = { ...combatCena(), encounter: { ...combatCena().encounter, activeFormas: [
      { ownerId: 'p1', entryId: 'graph-forma-ativa', roundsRemaining: 2, hpBonusApplied: 0, auraBonusApplied: 0 },
    ] } };
    const p1 = cast('p1', 'Shinkai', { arsenal: [{ cardId: 'graph-forma-ativa', quantity: 1, equipped: false, active: true }] });
    const p2 = cast('p2', 'Mikhail');
    const { container } = render(<CenaTab {...props(cena, [p1, p2], { abilityGraphs: [formaGraph] })} />);
    const activeRing = container.querySelector('.cena-combatant__forma-ring.is-active') as HTMLElement;
    expect(activeRing).toBeTruthy();
    expect(activeRing.style.getPropertyValue('--forma-color')).toBe('#22c55e');
  });
```

- [ ] **Step 7: Rodar `CenaTab.test.tsx` e a suíte completa**

Run: `npm test -- tabs/CenaTab.test.tsx`
Expected: as mesmas 13 falhas pré-existentes (WIP alheio, ver memória `feedback_subagent_wip_branch_commits`/histórico desta sessão), nenhuma nova.

Run: `npm test`
Expected: sem falhas novas além das 13 pré-existentes. **Este é o primeiro ponto do plano em que a suíte inteira deve voltar a compilar** — se houver erro de TypeScript sobre `header.activation`/`header.forma`/`header.reactionTag`/`AbilityActivation`/`ActionEconomy` em algum arquivo não coberto por este plano, localize com `grep -rn "header.activation\|header.forma\|header.reactionTag\|AbilityActivation\|ActionEconomy" --include=*.ts --include=*.tsx .` e ajuste antes de prosseguir.

---

## Task 9: `NodePalette.tsx` — gatilhos escolhíveis

**Files:**
- Modify: `components/arsenal/graph/NodePalette.tsx`
- Modify: `components/arsenal/graph/NodePalette.test.tsx`

- [ ] **Step 1: Adicionar aos testes**

```tsx
// components/arsenal/graph/NodePalette.test.tsx — adicionar ao describe existente:
it('lista os gatilhos e clicar chama onPickTrigger independente de pendingConnection', () => {
  const onPickTrigger = vi.fn();
  render(<NodePalette pendingConnection={null} onPick={vi.fn()} onLoadTemplate={vi.fn()} onPickTrigger={onPickTrigger} />);
  fireEvent.click(screen.getByRole('button', { name: 'Quando usada' }));
  expect(onPickTrigger).toHaveBeenCalledWith('ao_ativar');
  fireEvent.click(screen.getByRole('button', { name: 'Quando alvejado' }));
  expect(onPickTrigger).toHaveBeenCalledWith('ao_ser_alvejado');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- components/arsenal/graph/NodePalette.test.tsx`
Expected: FAIL (`onPickTrigger` não existe como prop; botões "Quando usada"/"Quando alvejado" não renderizam).

- [ ] **Step 3: Implementar**

```tsx
// components/arsenal/graph/NodePalette.tsx — reescrever o arquivo inteiro:
import React from 'react';
import { Plus, Search, Zap } from 'lucide-react';
import { listNodeTypes } from '../../../utils/nodeRegistry';
import { listAbilityTemplates } from '../../../utils/abilityTemplates';
import type { NodeFamily } from '../../../utils/abilityGraph';

export interface PendingConnection { parentId: string; branch?: 'entao' | 'senao' }

interface Props {
  pendingConnection: PendingConnection | null;
  onPick: (type: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onPickTrigger: (type: string) => void;
}

const FAMILY_LABEL: Record<Exclude<NodeFamily, 'gatilho'>, string> = { ramo: 'Ramos (SE)', alvo: 'Alvo', efeito: 'Efeitos' };
const FAMILIES: Exclude<NodeFamily, 'gatilho'>[] = ['ramo', 'alvo', 'efeito'];

const field: React.CSSProperties = { width: '100%', padding: '8px 10px', background: 'rgba(7,9,14,.78)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f1f1f4', outline: 'none', fontSize: 12 };
const sectionTitle: React.CSSProperties = { color: '#92929c', fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', margin: '10px 0 6px' };
const nodeButton: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#e4e4ea', fontSize: 12, cursor: 'pointer' };
const triggerButton: React.CSSProperties = { ...nodeButton, borderColor: 'rgba(212,168,83,.35)', background: 'rgba(212,168,83,.08)' };

const NodePalette: React.FC<Props> = ({ pendingConnection, onPick, onLoadTemplate, onPickTrigger }) => {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLocaleLowerCase('pt-BR');
  const templates = listAbilityTemplates();
  const triggers = listNodeTypes('gatilho').filter(def => !q || def.label.toLocaleLowerCase('pt-BR').includes(q));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, overflowY: 'auto' }}>
      <label style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#697383' }} />
        <input style={{ ...field, paddingLeft: 30 }} placeholder="Buscar nó…" value={query} onChange={e => setQuery(e.target.value)} />
      </label>

      {!!triggers.length && <>
        <div style={sectionTitle}>Gatilho (raiz da habilidade)</div>
        {triggers.map(def => (
          <button key={def.type} type="button" style={triggerButton} onClick={() => onPickTrigger(def.type)} title={def.summarize({})}>
            <Zap size={12} /> {def.label}
          </button>
        ))}
      </>}

      {!pendingConnection && (
        <p style={{ color: '#7a7a86', fontSize: 11, marginTop: 8 }}>
          Selecione um &quot;+&quot; no canvas para conectar um novo nó.
        </p>
      )}

      <div style={sectionTitle}>Templates</div>
      {templates.filter(template => !q || template.label.toLocaleLowerCase('pt-BR').includes(q)).map(template => (
        <button key={template.id} type="button" style={nodeButton} onClick={() => onLoadTemplate(template.id)} title={template.description}>
          <Plus size={12} /> {template.label}
        </button>
      ))}

      {FAMILIES.map(family => {
        const items = listNodeTypes(family).filter(def => !q || def.label.toLocaleLowerCase('pt-BR').includes(q));
        if (!items.length) return null;
        return (
          <React.Fragment key={family}>
            <div style={sectionTitle}>{FAMILY_LABEL[family]}</div>
            {items.map(def => (
              <button
                key={def.type} type="button" style={{ ...nodeButton, opacity: pendingConnection ? 1 : 0.45 }}
                disabled={!pendingConnection} onClick={() => onPick(def.type)}
              >
                {def.label}
              </button>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default NodePalette;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- components/arsenal/graph/NodePalette.test.tsx`
Expected: PASS (inclusive os testes já existentes — a busca/templates/famílias não mudaram de comportamento).

---

## Task 10: `GraphEditor.tsx` — remover campos vestigiais, ligar gatilho, renomear custo

**Files:**
- Modify: `components/arsenal/graph/GraphEditor.tsx`
- Modify: `components/arsenal/graph/GraphEditor.test.tsx`

- [ ] **Step 1: Atualizar os testes** — os 4 testes de "propriedades avançadas do cabeçalho" da Fase 5 testavam Ativação(não existia)/Forma/Proteção via toggles no cabeçalho. Substituir por:

```tsx
// components/arsenal/graph/GraphEditor.test.tsx — substituir o describe 'propriedades avançadas do cabeçalho' por:
describe('propriedades avançadas do cabeçalho', () => {
  it('preparação: mudar o tipo para rodadas expõe e salva a duração', () => {
    const onSave = vi.fn();
    render(<GraphEditor initial={graphAtaque()} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tipo de preparação'), { target: { value: 'rodadas' } });
    fireEvent.change(screen.getByLabelText('Duração da preparação'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave.mock.calls[0][0].header.preparation.timing).toEqual({ type: 'rodadas', amount: 2 });
  });

  it('combo: ativar e preencher stackKey/maxStacks salva no header', () => {
    const onSave = vi.fn();
    render(<GraphEditor initial={graphAtaque()} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Combinável em combo'));
    fireEvent.change(screen.getByLabelText('Grupo do combo'), { target: { value: 'fogo' } });
    fireEvent.change(screen.getByLabelText('Máximo de stacks'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave.mock.calls[0][0].header.combo).toEqual({ stackKey: 'fogo', maxStacks: 3 });
  });

  it('não mostra mais os campos removidos (Ativação/Economia/Forma/Proteção)', () => {
    render(<GraphEditor initial={graphAtaque()} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('Ativação')).toBeFalsy();
    expect(screen.queryByLabelText('Economia de ação')).toBeFalsy();
    expect(screen.queryByLabelText('É uma Forma')).toBeFalsy();
    expect(screen.queryByLabelText('Oferece como proteção reativa')).toBeFalsy();
  });

  it('rótulos de custo deixam claro que é o gasto de quem usa', () => {
    render(<GraphEditor initial={graphAtaque()} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('CUSTO DE AURA (DE QUEM USA)')).toBeTruthy();
    expect(screen.getByText('CUSTO DE MUNIÇÃO (DE QUEM USA)')).toBeTruthy();
  });

  it('clicar em um gatilho da paleta troca a raiz do grafo', () => {
    const onSave = vi.fn();
    render(<GraphEditor initial={graphAtaque()} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quando alvejado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    const saved = onSave.mock.calls[0][0] as AbilityGraph;
    expect(saved.nodes.find(n => n.family === 'gatilho')!.type).toBe('ao_ser_alvejado');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- components/arsenal/graph/GraphEditor.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Reescrever `GraphEditor.tsx`**

```tsx
// components/arsenal/graph/GraphEditor.tsx
import React from 'react';
import { X } from 'lucide-react';
import { ImagePickerButton } from '../../ui';
import type { AbilityGraph } from '../../../utils/abilityGraph';
import type { PreparationTiming } from '../../../utils/arsenal';
import { mergeLevel } from '../../../utils/abilityGraph';
import { addNode, removeNode, updateNodeProps, moveNode, setLevelOverride, setRootTrigger } from '../../../utils/abilityGraphEdit';
import { listAbilityTemplates } from '../../../utils/abilityTemplates';
import NodePalette, { type PendingConnection } from './NodePalette';
import GraphCanvas from './GraphCanvas';
import NodeInspector from './NodeInspector';
import SimulatorPanel from './SimulatorPanel';

interface Props {
  initial: AbilityGraph;
  onSave: (graph: AbilityGraph) => void;
  onClose: () => void;
}

const field: React.CSSProperties = { width: '100%', padding: '8px 10px', background: 'rgba(7,9,14,.78)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f1f1f4', outline: 'none', fontSize: 12 };
const label: React.CSSProperties = { display: 'block', marginBottom: 4, color: '#92929c', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' };
const button: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', color: '#e4e4ea', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const saveButton: React.CSSProperties = { ...button, border: '1px solid rgba(134,239,172,.4)', background: 'rgba(20,60,30,.3)', color: '#bbf7d0' };
const tabButton = (active: boolean): React.CSSProperties => ({ ...button, background: active ? 'rgba(125,230,255,.15)' : button.background, borderColor: active ? 'rgba(125,230,255,.4)' : (button.border as string).split(' ').slice(-1)[0] });

function maxLevel(graph: AbilityGraph): number {
  return Math.max(1, ...graph.levelProfiles.map(p => p.level)) + 1;
}

const GraphEditor: React.FC<Props> = ({ initial, onSave, onClose }) => {
  const [graph, setGraph] = React.useState(initial);
  const [level, setLevel] = React.useState(1);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = React.useState<PendingConnection | null>(null);
  const [rightTab, setRightTab] = React.useState<'propriedades' | 'simulador'>('propriedades');

  const displayed = React.useMemo(() => mergeLevel(graph, level), [graph, level]);
  const selectedNode = displayed.nodes.find(n => n.id === selectedNodeId) ?? null;

  const patchHeader = (patch: Partial<AbilityGraph['header']>) => setGraph(g => ({ ...g, header: { ...g.header, ...patch } }));

  const handlePick = (type: string) => {
    if (!pendingConnection) return;
    const { graph: next, nodeId } = addNode(graph, pendingConnection.parentId, type, pendingConnection.branch);
    const withLevel = level > 1
      ? { ...next, nodes: next.nodes.map(n => n.id === nodeId ? { ...n, enabledFromLevel: level } : n) }
      : next;
    setGraph(withLevel);
    setPendingConnection(null);
    setSelectedNodeId(nodeId);
  };

  const handlePickTrigger = (type: string) => setGraph(g => setRootTrigger(g, type));

  const handleLoadTemplate = (templateId: string) => {
    const template = listAbilityTemplates().find(t => t.id === templateId);
    if (!template) return;
    const built = template.build();
    setGraph({ ...built, header: { ...built.header, name: graph.header.name } });
    setSelectedNodeId(null);
  };

  const handleInspectorChange = (nodeId: string, patch: Record<string, unknown>) => {
    if (level === 1) { setGraph(g => updateNodeProps(g, nodeId, patch)); return; }
    setGraph(g => {
      let next = g;
      for (const [key, value] of Object.entries(patch)) next = setLevelOverride(next, level, nodeId, key, value);
      return next;
    });
  };

  return (
    <div role="dialog" aria-label="Editor de Habilidade" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#0a0b0f', color: '#e4e4ea' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', padding: 16, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <ImagePickerButton value={graph.header.icon} onUpdate={icon => patchHeader({ icon })} label="Ícone" buttonLabel="Escolher ícone" previewHeight={48} compact />
        <label style={{ minWidth: 160 }}><span style={label}>Nome</span><input aria-label="Nome" style={field} value={graph.header.name} onChange={e => patchHeader({ name: e.target.value })} /></label>
        <label style={{ minWidth: 220, flex: 1 }}><span style={label}>Descrição</span><input aria-label="Descrição" style={field} value={graph.header.description} onChange={e => patchHeader({ description: e.target.value })} /></label>
        <label style={{ width: 110 }}><span style={label}>Custo de Aura (de quem usa)</span><input aria-label="Custo de aura" style={field} type="number" value={graph.header.auraCost} onChange={e => patchHeader({ auraCost: Number(e.target.value) })} /></label>
        <label style={{ width: 130 }}><span style={label}>Custo de Munição (de quem usa)</span><input aria-label="Custo de munição" style={field} type="number" value={graph.header.ammoCost} onChange={e => patchHeader({ ammoCost: Number(e.target.value) })} /></label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={label}>Nível</span>
          <button type="button" aria-label="Diminuir nível" style={button} onClick={() => setLevel(l => Math.max(1, l - 1))}>−</button>
          <strong>{level}</strong>
          <button type="button" aria-label="Aumentar nível" style={button} onClick={() => setLevel(l => Math.min(maxLevel(graph), l + 1))}>+</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button type="button" style={saveButton} onClick={() => onSave(graph)}>Salvar</button>
          <button type="button" aria-label="Fechar" style={button} onClick={onClose}><X size={13} /></button>
        </div>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', alignItems: 'flex-end' }}>
        <label><span style={label}>Tipo de preparação</span>
          <select aria-label="Tipo de preparação" style={field} value={graph.header.preparation.timing.type}
            onChange={e => {
              const type = e.target.value as PreparationTiming['type'];
              const timing = (type === 'turnos' || type === 'rodadas' ? { type, amount: 1 } : { type }) as PreparationTiming;
              patchHeader({ preparation: { ...graph.header.preparation, timing } });
            }}>
            <option value="instantaneo">Instantânea</option>
            <option value="turnos">Turnos</option>
            <option value="rodadas">Rodadas</option>
          </select>
        </label>
        {(graph.header.preparation.timing.type === 'turnos' || graph.header.preparation.timing.type === 'rodadas') && (
          <label style={{ width: 90 }}><span style={label}>Duração da preparação</span>
            <input aria-label="Duração da preparação" style={field} type="number" min={1}
              value={(graph.header.preparation.timing as { amount: number }).amount}
              onChange={e => patchHeader({ preparation: { ...graph.header.preparation, timing: { ...graph.header.preparation.timing, amount: Number(e.target.value) } as PreparationTiming } })} />
          </label>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input aria-label="Combinável em combo" type="checkbox" checked={!!graph.header.combo}
            onChange={e => patchHeader({ combo: e.target.checked ? { stackKey: graph.header.combo?.stackKey ?? '', maxStacks: graph.header.combo?.maxStacks ?? 2 } : null })} />
          <span style={label}>Combinável em combo</span>
        </label>
        {graph.header.combo && <>
          <label style={{ width: 120 }}><span style={label}>Grupo do combo</span>
            <input aria-label="Grupo do combo" style={field} value={graph.header.combo.stackKey} onChange={e => patchHeader({ combo: { ...graph.header.combo!, stackKey: e.target.value } })} />
          </label>
          <label style={{ width: 80 }}><span style={label}>Máximo de stacks</span>
            <input aria-label="Máximo de stacks" style={field} type="number" min={1} value={graph.header.combo.maxStacks} onChange={e => patchHeader({ combo: { ...graph.header.combo!, maxStacks: Number(e.target.value) } })} />
          </label>
        </>}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: 240, borderRight: '1px solid rgba(255,255,255,.08)', overflowY: 'auto' }}>
          <NodePalette pendingConnection={pendingConnection} onPick={handlePick} onLoadTemplate={handleLoadTemplate} onPickTrigger={handlePickTrigger} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <GraphCanvas
            graph={displayed} selectedNodeId={selectedNodeId}
            onSelect={setSelectedNodeId}
            onMove={(nodeId, position) => setGraph(g => moveNode(g, nodeId, position))}
            onRequestConnect={(parentId, branch) => setPendingConnection({ parentId, branch })}
          />
        </div>

        <div style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, padding: 12 }}>
            <button type="button" style={tabButton(rightTab === 'propriedades')} onClick={() => setRightTab('propriedades')}>Propriedades</button>
            <button type="button" style={tabButton(rightTab === 'simulador')} onClick={() => setRightTab('simulador')}>Simulador</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rightTab === 'propriedades'
              ? <NodeInspector node={selectedNode} onChange={handleInspectorChange} onRemove={nodeId => setGraph(g => removeNode(g, nodeId))} />
              : <SimulatorPanel graph={graph} level={level} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphEditor;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- components/arsenal/graph/GraphEditor.test.tsx`
Expected: PASS.

---

## Task 11: Atualizar `abilityTemplates.ts`

**Files:**
- Modify: `utils/abilityTemplates.ts`
- Modify: `utils/abilityTemplates.test.ts`

O template `buff` usava `modificador_estat` (removido); `combo_condicional` usava o `ramo` genérico com `predicate.type==='alvo_molhado'` (removido). Ajustar para os nós finais, e adicionar um template "Forma".

- [ ] **Step 1: Atualizar o teste** — o teste `'template "Combo condicional" ramifica conforme o alvo estar molhado'` constrói manualmente um efeito com `classic.kind:'molhado'`; como o predicado mudou de `alvo_molhado` para `se_condicao_ativa` (classicKind), o teste em si não precisa mudar de asserção — só o template por baixo muda. Adicionar um teste novo para o template de Forma:

```ts
// utils/abilityTemplates.test.ts — adicionar ao describe existente:
it('template "Forma" produz um grafo com buff de vida_maxima e cor_token', () => {
  const template = listAbilityTemplates().find(t => t.id === 'forma')!;
  const graph = template.build();
  expect(graph.nodes.some(n => n.type === 'buff' && (n.props as { stat?: string }).stat === 'vida_maxima')).toBe(true);
  expect(graph.nodes.some(n => n.type === 'cor_token')).toBe(true);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilityTemplates.test.ts`
Expected: FAIL no teste novo (`forma` não existe); o teste de combo condicional provavelmente já falha por o `ramo` genérico ter sido removido do registro (a função `abilityGraphCausesDamage`/`interpretAbility` não quebra, mas o node `type:'ramo'` não existe mais no registro — `interpretAbility` trata como "nó desconhecido" e ignora, o que muda o resultado do teste de combo condicional). Isso é esperado — corrigido no próximo Step.

- [ ] **Step 3: Reescrever `abilityTemplates.ts`**

```ts
// utils/abilityTemplates.ts
import { createAbilityGraph, type AbilityGraph } from './abilityGraph';

export interface AbilityTemplate {
  id: string;
  label: string;
  description: string;
  build: () => AbilityGraph;
}

function ataqueBasico(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'template-ataque-basico', name: 'Ataque básico' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'd', type: 'dano', family: 'efeito', props: { dice: '1d6', flat: 0, element: 'fisico' } },
    ],
    edges: [{ id: 'e1', from: 'g', to: 'd' }],
  };
}

function cura(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'template-cura', name: 'Cura' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'alvo', type: 'alvo', family: 'alvo', props: { scope: 'proprio' } },
      { id: 'c', type: 'cura', family: 'efeito', props: { dice: '1d8', flat: 0 } },
    ],
    edges: [{ id: 'e1', from: 'g', to: 'alvo' }, { id: 'e2', from: 'alvo', to: 'c' }],
  };
}

function buff(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'template-buff', name: 'Buff' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'alvo', type: 'alvo', family: 'alvo', props: { scope: 'proprio' } },
      { id: 'm', type: 'buff', family: 'efeito', props: { stat: 'ataque', operation: 'somar', value: 2, rounds: 3 } },
    ],
    edges: [{ id: 'e1', from: 'g', to: 'alvo' }, { id: 'e2', from: 'alvo', to: 'm' }],
  };
}

function debuff(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'template-debuff', name: 'Debuff' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'c', type: 'aplicar_condicao', family: 'efeito', props: { classicKind: 'fraqueza' } },
    ],
    edges: [{ id: 'e1', from: 'g', to: 'c' }],
  };
}

function comboCondicional(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'template-combo-condicional', name: 'Combo condicional', element: 'raio' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'r', type: 'se_condicao_ativa', family: 'ramo', props: { classicKind: 'molhado' } },
      { id: 'dano_molhado', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 12, element: 'raio' } },
      { id: 'dano_normal', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 6, element: 'raio' } },
    ],
    edges: [
      { id: 'e1', from: 'g', to: 'r' },
      { id: 'e2', from: 'r', to: 'dano_molhado', branch: 'entao' },
      { id: 'e3', from: 'r', to: 'dano_normal', branch: 'senao' },
    ],
  };
}

function forma(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'template-forma', name: 'Forma' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'alvo', type: 'alvo', family: 'alvo', props: { scope: 'proprio' } },
      { id: 'buff', type: 'buff', family: 'efeito', props: { stat: 'vida_maxima', operation: 'somar', value: 10, rounds: 999 } },
      { id: 'cor', type: 'cor_token', family: 'efeito', props: { color: '#f59e0b' } },
    ],
    edges: [
      { id: 'e1', from: 'g', to: 'alvo' }, { id: 'e2', from: 'alvo', to: 'buff' }, { id: 'e3', from: 'buff', to: 'cor' },
    ],
  };
}

const TEMPLATES: AbilityTemplate[] = [
  { id: 'ataque_basico', label: 'Ataque básico', description: 'Dano físico simples em um alvo.', build: ataqueBasico },
  { id: 'cura', label: 'Cura', description: 'Restaura vida no próprio usuário.', build: cura },
  { id: 'buff', label: 'Buff', description: 'Concede +2 de ataque por 3 rodadas ao próprio usuário.', build: buff },
  { id: 'debuff', label: 'Debuff', description: 'Aplica Fraqueza no alvo.', build: debuff },
  { id: 'combo_condicional', label: 'Combo condicional', description: 'Dano de raio ampliado se o alvo estiver Molhado.', build: comboCondicional },
  { id: 'forma', label: 'Forma', description: 'Transformação: +10 de vida máxima e cor de token enquanto ativa.', build: forma },
];

export function listAbilityTemplates(): AbilityTemplate[] {
  return TEMPLATES;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilityTemplates.test.ts`
Expected: PASS.

---

## Task 12: Suíte completa + verificação no navegador real

**Files:** nenhum (só verificação)

- [ ] **Step 1: Rodar a suíte inteira**

Run: `npm test`
Expected: mesmas 13 falhas pré-existentes (WIP alheio em `CenaTab.test.tsx`, não relacionado a este trabalho), nenhuma falha nova.

- [ ] **Step 2: Verificar no app real (preview tools)**

Abrir o app, ir em Arsenal → Habilidades → "Nova carta". Confirmar visualmente:
- Paleta lateral mostra a seção "Gatilho (raiz da habilidade)" com "Quando usada" e "Quando alvejado".
- Clicar em "Quando alvejado" troca o nó raiz no canvas (o texto do nó raiz muda).
- Seção "Ramos (SE)" mostra os 4 blocos novos (SE vida do alvo, SE condição ativa, SE aura mínima, SE chance aleatória) — sem textarea de JSON.
- Seção "Efeitos" mostra só os 10 blocos finais (Dano, Cura, Aplicar condição, Buff/Debuff, Escudo, Espinhos, Roubo de vida, Silenciar, Incapacitar, Mover, mais Cor do token/Ícone do token).
- Cabeçalho não mostra mais "Ativação"/"Economia"/"É uma Forma"/"Oferece como proteção reativa".
- Rótulos de custo aparecem como "CUSTO DE AURA (DE QUEM USA)"/"CUSTO DE MUNIÇÃO (DE QUEM USA)".
- Template "Forma" na lista de templates carrega um grafo com Buff (vida_maxima) + Cor do token.
- Console do navegador sem erros.

---

## Self-review

- **Cobertura do spec:** seção 1 (paleta enxuta) → Tasks 1-2; seção 2 (gatilhos escolhíveis) → Tasks 1, 5, 9, 10; seção 3 (SE pré-montado) → Task 3; seção 4 (Forma como composição) → Tasks 1, 4, 7, 8, 11; seção 5 (cabeçalho) → Tasks 6, 10. Todas cobertas.
- **Consistência de tipos:** `BuffStat`/`BuffOperation` (Task 1) usados em `abilityTemplates.ts` (Task 11) e nos testes de `abilityGraphAction.ts` (Task 7) com os mesmos valores literais (`'vida_maxima'`/`'aura_maxima'`/`'somar'`). `graphFormaVisual` (Task 7) consumido em `CenaTab.tsx` (Task 8) com a mesma assinatura `(graph, level) => GraphFormaVisual`. `setRootTrigger` (Task 5) consumido em `GraphEditor.tsx` (Task 10) com a mesma assinatura `(graph, type) => AbilityGraph`.
- **Ordem de dependência:** Task 6 (remover campos do tipo) deliberadamente quebra a suíte completa até a Task 8 terminar — isso é sinalizado explicitamente no Step 3 da Task 6 e no Step 7 da Task 8, para não ser confundido com uma regressão real.
- **Placeholders:** nenhum "TBD"/"depois" — a única simplificação assumida (duração da forma fixa em `roundsRemaining: 0`, permanente) está documentada com o motivo (o spec não pediu bloco de duração para Forma).
