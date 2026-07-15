# Editor de Habilidades em Grafo — Fase 1 (Núcleo) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o núcleo testável do novo sistema de habilidades em grafo — modelo de dados, registro extensível de nós, primitivas de combate compartilhadas, interpretador com ramificação e simulador dry-run — sem UI e sem tocar na Cena ainda.

**Architecture:** Uma habilidade é `AbilityGraph` (cabeçalho + nós + arestas de fluxo + perfis de nível). Um registro (`nodeRegistry`) descreve cada tipo de nó (schema de campos + como interpretar/avaliar/resumir). O interpretador caminha o grafo a partir da raiz-gatilho, avalia ramos SE/SENÃO e executa efeitos delegando às primitivas atômicas extraídas do pipeline atual (mesma matemática de dano/condição). O simulador é o interpretador com roller determinístico + render do trace.

**Tech Stack:** TypeScript, Vitest (`npm test`). Sem dependência nova. Reaproveita tipos de `utils/arsenal.ts` e primitivas de `utils/arsenalPipeline.ts`.

**Convenção deste plano:** o skill pede TDD com passo de commit por tarefa. O usuário pediu para **não mexer em git**, então **omitimos os passos de commit** — cada tarefa termina com os testes verdes. Rodar testes: `npm test -- <arquivo>`.

**Spec:** `docs/superpowers/specs/2026-07-09-editor-habilidades-grafo-design.md`

---

## Estrutura de arquivos (Fase 1)

| Arquivo | Responsabilidade |
|---|---|
| `utils/abilityGraph.ts` | Tipos `AbilityGraph`/`GraphNode`/`GraphEdge`/`AbilityHeader`/`LevelProfile`; `createAbilityGraph`, `mergeLevel` |
| `utils/abilityGraph.test.ts` | Testes de criação e merge de níveis |
| `utils/nodeRegistry.ts` | Tipo `NodeTypeDef`, `FieldSchema`, `registerNodeType`, `getNodeType`, `listNodeTypes` |
| `utils/nodeRegistry.test.ts` | Registro/consulta de tipos de nó |
| `utils/abilityPrimitives.ts` | Operações atômicas de combate compartilhadas, extraídas de `arsenalPipeline` |
| `utils/abilityPrimitives.test.ts` | Paridade numérica com o comportamento atual do pipeline |
| `utils/nodes/index.ts` | Registra todos os tipos de nó do núcleo (efeito importante importar este módulo) |
| `utils/nodes/coreNodes.ts` | Defs: `gatilho`, `ramo`, `alvo`, `dano`, `cura`, `aplicar_condicao`, `buff` |
| `utils/nodes/coreNodes.test.ts` | Cada def interpreta/avalia como esperado |
| `utils/abilityInterpreter.ts` | `interpretAbility(graph, level, ctx)` — caminha o grafo, ramifica, executa |
| `utils/abilityInterpreter.test.ts` | Sequência, ramos SE/SENÃO, troca de alvo, perfis de nível |
| `utils/abilitySimulator.ts` | `simulateAbility` (dry-run) + `describeTrace` |
| `utils/abilitySimulator.test.ts` | Trace determinístico bate com o esperado |

**Nota de escopo:** o núcleo registra **7 tipos de nó representativos** (um por família + os efeitos mais usados) para provar a arquitetura ponta-a-ponta. Os ~25 tipos restantes (silenciar, invocar, corrente, eco, etc.) são adições mecânicas ao registro, planejadas na Fase 2.

---

## Task 1: Tipos do grafo e criação

**Files:**
- Create: `utils/abilityGraph.ts`
- Test: `utils/abilityGraph.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// utils/abilityGraph.test.ts
import { describe, it, expect } from 'vitest';
import { createAbilityGraph, mergeLevel, type AbilityGraph } from './abilityGraph';

describe('createAbilityGraph', () => {
  it('cria um grafo com cabeçalho padrão, uma raiz-gatilho e sem perfis', () => {
    const g = createAbilityGraph({ id: 'a1', name: 'Bola de Fogo' });
    expect(g.kind).toBe('graph');
    expect(g.schemaVersion).toBe(2);
    expect(g.header.name).toBe('Bola de Fogo');
    expect(g.header.activation).toBe('ativa');
    expect(g.nodes).toHaveLength(1);
    expect(g.nodes[0].family).toBe('gatilho');
    expect(g.edges).toEqual([]);
    expect(g.levelProfiles).toEqual([]);
  });
});

describe('mergeLevel', () => {
  it('aplica overrides de campo de nó do nível pedido', () => {
    const base: AbilityGraph = {
      ...createAbilityGraph({ id: 'a1', name: 'X' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'd', type: 'dano', family: 'efeito', props: { dice: '1d6', flat: 0, element: 'fogo' } },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'd' }],
      levelProfiles: [{ level: 2, overrides: [{ nodeId: 'd', field: 'dice', value: '2d6' }] }],
    };
    const merged = mergeLevel(base, 2);
    const dano = merged.nodes.find(n => n.id === 'd')!;
    expect(dano.props.dice).toBe('2d6');
    // nível 1 permanece o base
    expect(mergeLevel(base, 1).nodes.find(n => n.id === 'd')!.props.dice).toBe('1d6');
  });

  it('liga nós marcados em enabledNodeIds a partir do nível', () => {
    const base: AbilityGraph = {
      ...createAbilityGraph({ id: 'a1', name: 'X' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'extra', type: 'cura', family: 'efeito', props: { dice: '1d4', flat: 0 }, enabledFromLevel: 3 },
      ],
      edges: [{ id: 'e1', from: 'g', to: 'extra' }],
    };
    expect(mergeLevel(base, 2).nodes.some(n => n.id === 'extra')).toBe(false);
    expect(mergeLevel(base, 3).nodes.some(n => n.id === 'extra')).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilityGraph.test.ts`
Expected: FAIL (`createAbilityGraph is not defined`).

- [ ] **Step 3: Implementar**

```ts
// utils/abilityGraph.ts
import type {
  Element, // de types via arsenal reexport se necessário
} from '../types';
import type {
  TargetConfig, AreaConfig, CooldownConfig, ChargeConfig, PreparationConfig,
  ArsenalVisibility, ArsenalTag,
} from './arsenal';
import { INSTANT_PREPARATION } from './arsenal';

export type NodeFamily = 'gatilho' | 'ramo' | 'alvo' | 'efeito';
export type AbilityActivation = 'ativa' | 'ao_equipar' | 'ao_consumir' | 'enquanto_forma_ativa';
export type ActionEconomy = 'principal' | 'menor' | 'reacao' | 'livre';

export interface GraphNode {
  id: string;
  type: string;                 // chave no nodeRegistry
  family: NodeFamily;
  props: Record<string, unknown>;
  position?: { x: number; y: number };
  /** Nó só entra no grafo mesclado a partir deste nível (progressão). Ausente = nível 1. */
  enabledFromLevel?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  /** Só em arestas que saem de um nó 'ramo'. Ausente = fluxo simples. */
  branch?: 'entao' | 'senao';
}

export interface AbilityHeader {
  name: string;
  description: string;
  icon: string;
  iconPosition?: string;
  artLayout?: 'horizontal' | 'full';
  element: Element | null;
  tags: ArsenalTag[];
  visibility: ArsenalVisibility;
  activation: AbilityActivation;
  auraCost: number;
  ammoCost: number;
  actionEconomy: ActionEconomy;
  target: TargetConfig;
  area: AreaConfig | null;
  cooldown: CooldownConfig;
  charges: ChargeConfig | null;
  preparation: PreparationConfig;
}

export interface NodeFieldOverride { nodeId: string; field: string; value: unknown }
export interface LevelProfile { level: number; overrides: NodeFieldOverride[]; }

export interface AbilityGraph {
  kind: 'graph';
  schemaVersion: 2;
  id: string;
  header: AbilityHeader;
  nodes: GraphNode[];
  edges: GraphEdge[];
  levelProfiles: LevelProfile[];
  metadata?: Record<string, unknown>;
}

export function createAbilityGraph(
  input: { id: string; name: string } & Partial<AbilityHeader>,
): AbilityGraph {
  const { id, name, ...header } = input;
  return {
    kind: 'graph',
    schemaVersion: 2,
    id,
    header: {
      name,
      description: '',
      icon: '',
      element: null,
      tags: [],
      visibility: 'publica',
      activation: 'ativa',
      auraCost: 0,
      ammoCost: 0,
      actionEconomy: 'principal',
      target: { type: 'um_alvo' },
      area: null,
      cooldown: { type: 'sem_cooldown' },
      charges: null,
      preparation: INSTANT_PREPARATION,
      ...header,
    },
    nodes: [{ id: `gatilho-${id}`, type: 'ao_ativar', family: 'gatilho', props: {} }],
    edges: [],
    levelProfiles: [],
  };
}

/** Grafo efetivo no nível pedido: filtra nós por enabledFromLevel e aplica overrides acumulados até o nível. */
export function mergeLevel(graph: AbilityGraph, level: number): AbilityGraph {
  const nodes = graph.nodes
    .filter(node => (node.enabledFromLevel ?? 1) <= level)
    .map(node => ({ ...node, props: { ...node.props } }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  for (const profile of [...graph.levelProfiles].sort((a, b) => a.level - b.level)) {
    if (profile.level > level) break;
    for (const override of profile.overrides) {
      const node = byId.get(override.nodeId);
      if (node) node.props[override.field] = override.value;
    }
  }
  return { ...graph, nodes };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilityGraph.test.ts`
Expected: PASS.

---

## Task 2: Registro extensível de tipos de nó

**Files:**
- Create: `utils/nodeRegistry.ts`
- Test: `utils/nodeRegistry.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// utils/nodeRegistry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerNodeType, getNodeType, listNodeTypes, _resetRegistry } from './nodeRegistry';

describe('nodeRegistry', () => {
  beforeEach(() => _resetRegistry());

  it('registra e recupera um tipo de nó', () => {
    registerNodeType({
      type: 'dano', family: 'efeito', label: 'Dano',
      fields: [{ key: 'dice', kind: 'dado', label: 'Dado' }],
      defaults: () => ({ dice: '1d6' }),
      summarize: p => `Dano ${(p as { dice: string }).dice}`,
    });
    expect(getNodeType('dano')?.label).toBe('Dano');
    expect(getNodeType('dano')?.defaults()).toEqual({ dice: '1d6' });
    expect(getNodeType('dano')?.summarize({ dice: '2d6' })).toBe('Dano 2d6');
  });

  it('lista por família', () => {
    registerNodeType({ type: 'a', family: 'efeito', label: 'A', fields: [], defaults: () => ({}), summarize: () => 'A' });
    registerNodeType({ type: 'b', family: 'ramo', label: 'B', fields: [], defaults: () => ({}), summarize: () => 'B' });
    expect(listNodeTypes('efeito').map(d => d.type)).toEqual(['a']);
  });

  it('sobrescrever o mesmo type substitui a definição', () => {
    registerNodeType({ type: 'x', family: 'efeito', label: 'V1', fields: [], defaults: () => ({}), summarize: () => 'x' });
    registerNodeType({ type: 'x', family: 'efeito', label: 'V2', fields: [], defaults: () => ({}), summarize: () => 'x' });
    expect(getNodeType('x')?.label).toBe('V2');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/nodeRegistry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// utils/nodeRegistry.ts
import type { NodeFamily } from './abilityGraph';
import type { InterpretCtx } from './abilityInterpreter';

/** Descreve um campo do painel de propriedades — o inspector (Fase 3) se gera a partir daqui. */
export interface FieldSchema {
  key: string;
  kind: 'dado' | 'numero' | 'texto' | 'elemento' | 'select' | 'toggle' | 'condicao' | 'duracao';
  label: string;
  options?: { value: string; label: string }[];
  hint?: string;
}

export interface NodeTypeDef<P = Record<string, unknown>> {
  type: string;
  family: NodeFamily;
  label: string;
  fields: FieldSchema[];
  defaults: () => P;
  /** efeito/alvo: muta o ctx (aplica dano, troca alvo, etc.). */
  interpret?: (props: P, ctx: InterpretCtx) => void;
  /** ramo: decide 'entao' vs 'senao'. */
  evaluate?: (props: P, ctx: InterpretCtx) => boolean;
  /** texto curto para preview/summary. */
  summarize: (props: P) => string;
}

const registry = new Map<string, NodeTypeDef>();

export function registerNodeType<P>(def: NodeTypeDef<P>): void {
  registry.set(def.type, def as NodeTypeDef);
}
export function getNodeType(type: string): NodeTypeDef | undefined {
  return registry.get(type);
}
export function listNodeTypes(family?: NodeFamily): NodeTypeDef[] {
  const all = [...registry.values()];
  return family ? all.filter(def => def.family === family) : all;
}
/** Apenas para testes: limpa o registro global. */
export function _resetRegistry(): void {
  registry.clear();
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/nodeRegistry.test.ts`
Expected: PASS. (Ainda não existe `abilityInterpreter`; o import de tipo `InterpretCtx` só resolve em type-check — se o TS reclamar antes da Task 5, crie um stub `export interface InterpretCtx {}` temporário em `abilityInterpreter.ts` e complete na Task 5.)

---

## Task 3: Primitivas de combate compartilhadas

**Objetivo:** extrair de `resolveArsenalAction` (`utils/arsenalPipeline.ts:655-701`) as operações atômicas de dano, condição e cura para funções puras reutilizáveis, garantindo paridade numérica. O pipeline antigo pode ser refatorado para chamá-las depois (Fase 4); nesta tarefa só criamos e testamos as primitivas.

**Files:**
- Create: `utils/abilityPrimitives.ts`
- Test: `utils/abilityPrimitives.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// utils/abilityPrimitives.test.ts
import { describe, it, expect } from 'vitest';
import { applyDamage, applyCondition } from './abilityPrimitives';
import type { ArsenalActorState } from './arsenalPipeline';
import { getPredefinedEffect } from './arsenalEffects';

const actor = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 0, maxAura: 0,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true, ...over,
});

describe('applyDamage', () => {
  it('desconta dano cru sem elemento', () => {
    const r = applyDamage(actor(), 8, null, () => 0);
    expect(r.target.currentHp).toBe(22);
    expect(r.appliedDamage).toBe(8);
  });

  it('aplica afinidade de resistência (50%) do alvo', () => {
    const resist = getPredefinedEffect('molhado'); // exemplo qualquer; substituir por efeito com elementalAffinities no teste real
    // monta um alvo com resistência a fogo 50%
    const target = actor({ effects: [{ effect: { ...resist!, elementalAffinities: [{ element: 'fogo', kind: 'resistencia', percent: 50 }] }, stacks: 1 }] });
    const r = applyDamage(target, 10, 'fogo', () => 0);
    expect(r.appliedDamage).toBe(5);
  });
});

describe('applyCondition', () => {
  it('empilha o efeito no alvo', () => {
    const burn = getPredefinedEffect('queimadura')!;
    const r = applyCondition(actor(), burn, () => 20);
    expect(r.effects.some(e => e.effect.id === burn.id)).toBe(true);
  });

  it('respeita imunidade', () => {
    const burn = getPredefinedEffect('queimadura')!;
    const immune = actor({ effects: [{ effect: { ...burn, id: 'immune-src', immunities: ['queimadura'] }, stacks: 1 }] });
    const r = applyCondition(immune, burn, () => 20);
    expect(r.effects.filter(e => e.effect.id === burn.id)).toHaveLength(0);
  });
});
```

*(Ajustar os efeitos de exemplo conforme os ids reais retornados por `getPredefinedEffect` ao escrever o teste.)*

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilityPrimitives.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar** — mover a lógica atômica de `arsenalPipeline`, reexportando os helpers necessários.

```ts
// utils/abilityPrimitives.ts
import type { Element } from '../types';
import type { ArsenalActorState, ActiveEffectState } from './arsenalPipeline';
import type { ArsenalEffect } from './arsenal';
import { applyDamageConditionInteractions } from './arsenalElements';

type Roller = (notation: string) => number;

function activeAffinity(target: ArsenalActorState, element: Element | null) {
  if (!element) return undefined;
  for (const active of target.effects) {
    const match = (active.effect.elementalAffinities ?? []).find(a => a.element === element);
    if (match) return match;
  }
  return undefined;
}

export interface DamageResult { target: ArsenalActorState; appliedDamage: number; }

/** Aplica dano a um alvo com interações elementais e afinidade — paridade com arsenalPipeline. */
export function applyDamage(target: ArsenalActorState, rawAmount: number, element: Element | null, roller: Roller): DamageResult {
  const next: ArsenalActorState = { ...target, effects: target.effects.map(a => ({ ...a })) };
  let amount = Math.max(0, rawAmount);
  if (element && amount > 0) {
    const interaction = applyDamageConditionInteractions(next.effects, element, amount);
    amount = interaction.damage;
    next.effects = interaction.effects;
  }
  const affinity = activeAffinity(next, element);
  if (affinity && amount > 0) {
    if (affinity.kind === 'imunidade') amount = 0;
    else if (affinity.kind === 'resistencia') amount = Math.max(0, Math.floor(amount * (1 - affinity.percent / 100)));
    else if (affinity.kind === 'vulnerabilidade') amount = Math.ceil(amount * (1 + affinity.percent / 100));
    else if (affinity.kind === 'absorcao') amount = 0; // absorção vira cura no chamador; núcleo trata como 0 dano
  }
  const applied = Math.min(next.currentHp, amount);
  next.currentHp = Math.max(0, next.currentHp - applied);
  return { target: next, appliedDamage: applied };
}

export function applyHeal(target: ArsenalActorState, amount: number): DamageResult {
  const next = { ...target };
  const applied = Math.min(next.maxHp - next.currentHp, Math.max(0, amount));
  next.currentHp += applied;
  return { target: next, appliedDamage: -applied };
}

function isImmuneTo(target: ArsenalActorState, kind: ArsenalEffect['classic'] extends infer C ? (C extends { kind: infer K } ? K : never) : never): boolean {
  if (!kind) return false;
  return target.effects.some(a => (a.effect.immunities ?? []).includes(kind as never));
}

/** Empilha um efeito/condição no alvo respeitando imunidade e rolagem de aplicação. */
export function applyCondition(target: ArsenalActorState, effect: ArsenalEffect, roller: Roller): ArsenalActorState {
  const kind = effect.classic?.kind;
  if (kind && isImmuneTo(target, kind)) return target;
  if (effect.classicApplyRoll && roller(effect.classicApplyRoll.dice) < effect.classicApplyRoll.minimum) return target;
  return { ...target, effects: stackEffect(target.effects, effect) };
}

// Reexporta stackEffect do pipeline para manter uma única fonte de verdade.
export { applyActiveEffect as stackEffectPublic } from './arsenalPipeline';
import { applyActiveEffect as stackEffect } from './arsenalPipeline';
```

*Nota de refino:* se a assinatura de `isImmuneTo` acima ficar difícil no TS, defina `type ClassicKind = NonNullable<ArsenalEffect['classic']>['kind']` e use-a — o `ClassicEffectKind` já é exportado de `utils/arsenal.ts`, então prefira importar `ClassicEffectKind` diretamente.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilityPrimitives.test.ts`
Expected: PASS.

---

## Task 4: Tipos de nó do núcleo

**Files:**
- Create: `utils/nodes/coreNodes.ts`, `utils/nodes/index.ts`
- Test: `utils/nodes/coreNodes.test.ts`

Registra 7 tipos: `ao_ativar` (gatilho), `ramo` (ramo), `alvo` (alvo), `dano`, `cura`, `aplicar_condicao`, `buff` (efeitos).

- [ ] **Step 1: Escrever o teste que falha**

```ts
// utils/nodes/coreNodes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry, getNodeType } from '../nodeRegistry';
import { registerCoreNodes } from './coreNodes';
import type { InterpretCtx } from '../abilityInterpreter';
import type { ArsenalActorState } from '../arsenalPipeline';

const alvo = (): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 0, maxAura: 0,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true,
});

function ctx(over: Partial<InterpretCtx> = {}): InterpretCtx {
  return {
    actor: alvo(),
    scope: [alvo()],
    roller: () => 4,
    element: 'fogo',
    trace: [],
    ...over,
  } as InterpretCtx;
}

describe('registerCoreNodes', () => {
  beforeEach(() => { _resetRegistry(); registerCoreNodes(); });

  it('nó dano desconta do alvo no escopo', () => {
    const c = ctx();
    getNodeType('dano')!.interpret!({ dice: '1d6', flat: 2, element: 'fogo' }, c);
    expect(c.scope[0].currentHp).toBe(24); // 30 - (4 + 2)
    expect(c.trace.some(t => t.detail?.includes('dano'))).toBe(true);
  });

  it('nó ramo avalia predicado vida_abaixo', () => {
    const c = ctx({ scope: [{ ...alvo(), currentHp: 5 }] });
    const passa = getNodeType('ramo')!.evaluate!({ predicate: { type: 'vida_abaixo_percent', value: 50 } }, c);
    expect(passa).toBe(true);
  });

  it('nó alvo troca o escopo para próprio usuário', () => {
    const c = ctx();
    getNodeType('alvo')!.interpret!({ scope: 'proprio' }, c);
    expect(c.scope[0].id).toBe(c.actor.id);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/nodes/coreNodes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// utils/nodes/coreNodes.ts
import { registerNodeType } from '../nodeRegistry';
import { applyDamage, applyHeal, applyCondition } from '../abilityPrimitives';
import { getPredefinedEffect } from '../arsenalEffects';
import type { InterpretCtx } from '../abilityInterpreter';
import type { Element } from '../../types';

type ScopeKind = 'proprio' | 'alvo_da_habilidade' | 'todos_inimigos' | 'todos_aliados';

function roll(ctx: InterpretCtx, dice: string | undefined, flat: number): number {
  return (dice ? ctx.roller(dice) : 0) + flat;
}

export function registerCoreNodes(): void {
  registerNodeType({
    type: 'ao_ativar', family: 'gatilho', label: 'Ao ativar', fields: [],
    defaults: () => ({}), summarize: () => 'Quando a habilidade é usada',
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
      const amount = roll(ctx, p.dice, p.flat);
      ctx.scope = ctx.scope.map(target => {
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
      const amount = roll(ctx, p.dice, p.flat);
      ctx.scope = ctx.scope.map(target => {
        const r = applyHeal(target, amount);
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
      const effect = getPredefinedEffect(p.classicKind as never);
      if (!effect) { ctx.trace.push({ node: 'aplicar_condicao', detail: `condição desconhecida: ${p.classicKind}` }); return; }
      ctx.scope = ctx.scope.map(target => {
        const next = applyCondition(target, effect, ctx.roller);
        const applied = next.effects.length > target.effects.length || next !== target;
        ctx.trace.push({ node: 'aplicar_condicao', detail: `${applied ? 'aplicou' : 'imune a'} ${p.classicKind} em ${target.name}` });
        return next;
      });
      ctx.commit?.();
    },
  });

  registerNodeType<{ stat: 'ataque' | 'defesa' | 'velocidade'; value: number; rounds: number }>({
    type: 'buff', family: 'efeito', label: 'Buff/Debuff',
    fields: [
      { key: 'stat', kind: 'select', label: 'Atributo', options: [
        { value: 'ataque', label: 'Ataque' }, { value: 'defesa', label: 'Defesa' }, { value: 'velocidade', label: 'Velocidade' } ] },
      { key: 'value', kind: 'numero', label: 'Valor (±)' },
      { key: 'rounds', kind: 'numero', label: 'Rodadas' },
    ],
    defaults: () => ({ stat: 'ataque', value: 2, rounds: 3 }),
    summarize: p => `${p.value >= 0 ? '+' : ''}${p.value} ${p.stat} por ${p.rounds} rod.`,
    interpret: (p, ctx) => {
      const effect = {
        id: `buff-${p.stat}-${crypto.randomUUID()}`, name: `${p.stat} ${p.value >= 0 ? '+' : ''}${p.value}`,
        description: '', tags: [], duration: { type: 'rodadas' as const, amount: p.rounds },
        stackBehavior: 'renova_duracao' as const, maxStacks: 1, triggers: [], modifiers: [],
        periodicDamage: null, periodicHealing: null, auraConsumed: null, auraRestored: null,
        attackModifier: p.stat === 'ataque' ? p.value : 0, defenseModifier: p.stat === 'defesa' ? p.value : 0,
        speedModifier: p.stat === 'velocidade' ? p.value : 0, customEffect: null,
      };
      ctx.scope = ctx.scope.map(target => applyCondition(target, effect, ctx.roller));
      ctx.trace.push({ node: 'buff', detail: `${effect.name} por ${p.rounds} rodadas` });
      ctx.commit?.();
    },
  });

  registerNodeType<{ predicate: { type: string; value?: number } }>({
    type: 'ramo', family: 'ramo', label: 'SE / SENÃO',
    fields: [{ key: 'predicate', kind: 'condicao', label: 'Condição' }],
    defaults: () => ({ predicate: { type: 'sempre' } }),
    summarize: p => `Se ${p.predicate.type}`,
    evaluate: (p, ctx) => {
      const t = ctx.scope[0];
      switch (p.predicate.type) {
        case 'sempre': return true;
        case 'vida_abaixo_percent': return t ? (t.currentHp / t.maxHp) * 100 < (p.predicate.value ?? 50) : false;
        case 'vida_acima_percent': return t ? (t.currentHp / t.maxHp) * 100 > (p.predicate.value ?? 50) : false;
        case 'alvo_molhado': return t ? t.effects.some(e => e.effect.classic?.kind === 'molhado') : false;
        default: return false;
      }
    },
  });
}
```

```ts
// utils/nodes/index.ts
import { registerCoreNodes } from './coreNodes';

let done = false;
/** Idempotente: registra todos os nós do núcleo uma vez. */
export function ensureNodesRegistered(): void {
  if (done) return;
  registerCoreNodes();
  done = true;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/nodes/coreNodes.test.ts`
Expected: PASS.

---

## Task 5: Interpretador do grafo

**Files:**
- Create: `utils/abilityInterpreter.ts`
- Test: `utils/abilityInterpreter.test.ts`

Substitui o stub de `InterpretCtx` (se criado na Task 2) pela definição real.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// utils/abilityInterpreter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { interpretAbility } from './abilityInterpreter';
import { _resetRegistry } from './nodeRegistry';
import { registerCoreNodes } from './nodes/coreNodes';
import { createAbilityGraph, type AbilityGraph } from './abilityGraph';
import type { ArsenalActorState } from './arsenalPipeline';

const actor = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => ({
  id: 'a', teamId: 'A', name: 'Herói', currentHp: 40, maxHp: 40, currentAura: 10, maxAura: 10,
  currentAmmo: 0, maxAmmo: 0, defense: 12, speed: 8, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: true, inCombat: true, ...over,
});
const enemy = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => actor({ id: 'e', teamId: 'B', name: 'Inimigo', currentHp: 30, maxHp: 30, isCurrentTurn: false, ...over });

function graphSequencial(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'g1', name: 'Golpe' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'd', type: 'dano', family: 'efeito', props: { dice: '1d6', flat: 0, element: 'fisico' } },
    ],
    edges: [{ id: 'e1', from: 'g', to: 'd' }],
  };
}

describe('interpretAbility', () => {
  beforeEach(() => { _resetRegistry(); registerCoreNodes(); });

  it('executa efeitos em sequência a partir da raiz-gatilho', () => {
    const res = interpretAbility(graphSequencial(), 1, {
      actor: actor(), primaryTargets: [enemy()], allTargets: [actor(), enemy()], roller: () => 5,
    });
    const alvo = res.targets.find(t => t.id === 'e')!;
    expect(alvo.currentHp).toBe(25);
    expect(res.trace.length).toBeGreaterThan(0);
  });

  it('ramifica: SE vida do alvo < 50% cura o próprio; SENÃO causa dano', () => {
    const g: AbilityGraph = {
      ...createAbilityGraph({ id: 'g2', name: 'Adaptável' }),
      nodes: [
        { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
        { id: 'r', type: 'ramo', family: 'ramo', props: { predicate: { type: 'vida_abaixo_percent', value: 50 } } },
        { id: 'self', type: 'alvo', family: 'alvo', props: { scope: 'proprio' } },
        { id: 'cura', type: 'cura', family: 'efeito', props: { dice: undefined, flat: 10 } },
        { id: 'dano', type: 'dano', family: 'efeito', props: { dice: undefined, flat: 8, element: 'fisico' } },
      ],
      edges: [
        { id: 'e1', from: 'g', to: 'r' },
        { id: 'e2', from: 'r', to: 'self', branch: 'entao' },
        { id: 'e3', from: 'self', to: 'cura' },
        { id: 'e4', from: 'r', to: 'dano', branch: 'senao' },
      ],
    };
    // alvo com vida cheia → SENÃO (dano)
    const alto = interpretAbility(g, 1, { actor: actor({ currentHp: 20 }), primaryTargets: [enemy({ currentHp: 30 })], allTargets: [], roller: () => 0 });
    expect(alto.targets.find(t => t.id === 'e')!.currentHp).toBe(22);
    // alvo ferido → ENTÃO (cura no próprio)
    const baixo = interpretAbility(g, 1, { actor: actor({ currentHp: 20 }), primaryTargets: [enemy({ currentHp: 5 })], allTargets: [], roller: () => 0 });
    expect(baixo.actor.currentHp).toBe(30);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilityInterpreter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// utils/abilityInterpreter.ts
import { rollDice } from './dice';
import { mergeLevel, type AbilityGraph, type GraphNode } from './abilityGraph';
import { getNodeType } from './nodeRegistry';
import type { Element } from '../types';
import type { ArsenalActorState } from './arsenalPipeline';

export interface TraceStep { node: string; detail?: string }

export interface InterpretCtx {
  actor: ArsenalActorState;
  /** Escopo corrente dos efeitos (mutável ao longo do fluxo). */
  scope: ArsenalActorState[];
  /** Alvos escolhidos para a habilidade (base). */
  primaryTargets: ArsenalActorState[];
  /** Todos os combatentes (para seletores 'todos_*'). */
  allTargets: ArsenalActorState[];
  roller: (notation: string) => number;
  element: Element | null;
  trace: TraceStep[];
  /** Sincroniza mutações do escopo de volta aos alvos/ator acumulados. */
  commit?: () => void;
}

export interface AbilityResult {
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  trace: TraceStep[];
}

export interface InterpretInput {
  actor: ArsenalActorState;
  primaryTargets: ArsenalActorState[];
  allTargets: ArsenalActorState[];
  roller?: (notation: string) => number;
}

export function interpretAbility(graph: AbilityGraph, level: number, input: InterpretInput): AbilityResult {
  const merged = mergeLevel(graph, level);
  const roller = input.roller ?? (notation => rollDice(notation).total);

  // acumuladores de estado por id
  const byId = new Map<string, ArsenalActorState>();
  byId.set(input.actor.id, { ...input.actor });
  for (const t of input.primaryTargets) byId.set(t.id, { ...t });
  for (const t of input.allTargets) if (!byId.has(t.id)) byId.set(t.id, { ...t });

  const ctx: InterpretCtx = {
    actor: byId.get(input.actor.id)!,
    scope: input.primaryTargets.map(t => byId.get(t.id)!),
    primaryTargets: input.primaryTargets.map(t => byId.get(t.id)!),
    allTargets: [...byId.values()],
    roller,
    element: graph.header.element,
    trace: [],
    commit: () => { for (const s of ctx.scope) byId.set(s.id, s); byId.set(ctx.actor.id, ctx.actor); },
  };

  const nodeById = new Map(merged.nodes.map(n => [n.id, n]));
  const outgoing = (id: string, branch?: 'entao' | 'senao') =>
    merged.edges.filter(e => e.from === id && (branch === undefined ? e.branch === undefined : e.branch === branch));

  const root = merged.nodes.find(n => n.family === 'gatilho');
  if (!root) return { actor: ctx.actor, targets: [...byId.values()].filter(a => a.id !== ctx.actor.id), trace: ctx.trace };

  const visited = new Set<string>();
  const walk = (node: GraphNode | undefined) => {
    if (!node || visited.has(node.id)) return;   // guarda anti-ciclo acidental
    visited.add(node.id);
    const def = getNodeType(node.type);
    if (!def) { ctx.trace.push({ node: node.type, detail: 'nó desconhecido — ignorado' }); }
    else if (node.family === 'ramo' && def.evaluate) {
      const branch = def.evaluate(node.props, ctx) ? 'entao' : 'senao';
      ctx.trace.push({ node: node.type, detail: `→ ${branch}` });
      for (const e of outgoing(node.id, branch)) walk(nodeById.get(e.to));
      return;
    } else if (def.interpret) {
      def.interpret(node.props, ctx);
    }
    for (const e of outgoing(node.id)) walk(nodeById.get(e.to));
  };
  walk(root);
  ctx.commit?.();

  return {
    actor: byId.get(input.actor.id)!,
    targets: [...byId.values()].filter(a => a.id !== input.actor.id),
    trace: ctx.trace,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilityInterpreter.test.ts`
Expected: PASS. Rodar também `npm test -- utils/nodes/coreNodes.test.ts utils/nodeRegistry.test.ts` para garantir que a `InterpretCtx` real não quebrou nada.

---

## Task 6: Simulador dry-run

**Files:**
- Create: `utils/abilitySimulator.ts`
- Test: `utils/abilitySimulator.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// utils/abilitySimulator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { simulateAbility, describeTrace } from './abilitySimulator';
import { _resetRegistry } from './nodeRegistry';
import { registerCoreNodes } from './nodes/coreNodes';
import { createAbilityGraph, type AbilityGraph } from './abilityGraph';

function graphDano(): AbilityGraph {
  return {
    ...createAbilityGraph({ id: 'g', name: 'Bola de Fogo', element: 'fogo' }),
    nodes: [
      { id: 'g', type: 'ao_ativar', family: 'gatilho', props: {} },
      { id: 'd', type: 'dano', family: 'efeito', props: { dice: '2d6', flat: 0, element: 'fogo' } },
      { id: 'c', type: 'aplicar_condicao', family: 'efeito', props: { classicKind: 'queimadura' } },
    ],
    edges: [{ id: 'e1', from: 'g', to: 'd' }, { id: 'e2', from: 'd', to: 'c' }],
  };
}

describe('simulateAbility', () => {
  beforeEach(() => { _resetRegistry(); registerCoreNodes(); });

  it('roda contra um alvo fictício com roller fixo e produz trace legível', () => {
    const res = simulateAbility(graphDano(), 1, { roller: () => 7 });
    const texto = describeTrace(res.trace);
    expect(texto).toContain('dano');
    expect(texto).toContain('queimadura');
    expect(res.targets[0].currentHp).toBeLessThan(res.targets[0].maxHp);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- utils/abilitySimulator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// utils/abilitySimulator.ts
import { interpretAbility, type AbilityResult, type TraceStep } from './abilityInterpreter';
import type { AbilityGraph } from './abilityGraph';
import type { ArsenalActorState } from './arsenalPipeline';

function dummyActor(id: string, teamId: string, name: string): ArsenalActorState {
  return {
    id, teamId, name, currentHp: 50, maxHp: 50, currentAura: 20, maxAura: 20, currentAmmo: 10, maxAmmo: 10,
    defense: 10, speed: 6, tags: [], equippedWeaponIds: [], activeFormIds: [], effects: [], holdings: [],
    isCurrentTurn: teamId === 'A', inCombat: true,
  };
}

export interface SimulateOptions {
  roller?: (notation: string) => number;
  actor?: ArsenalActorState;
  targets?: ArsenalActorState[];
}

/** Executa o grafo contra atores fictícios (ou fornecidos) — mesmo motor da Cena. */
export function simulateAbility(graph: AbilityGraph, level: number, options: SimulateOptions = {}): AbilityResult {
  const actor = options.actor ?? dummyActor('sim-actor', 'A', 'Usuário (simulação)');
  const targets = options.targets ?? [dummyActor('sim-target', 'B', 'Alvo (simulação)')];
  return interpretAbility(graph, level, { actor, primaryTargets: targets, allTargets: [actor, ...targets], roller: options.roller });
}

/** Converte o trace em texto passo-a-passo para exibição. */
export function describeTrace(trace: TraceStep[]): string {
  return trace.map((s, i) => `${i + 1}. ${s.detail ?? s.node}`).join('\n');
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- utils/abilitySimulator.test.ts`
Expected: PASS. Rodar a suíte inteira do núcleo: `npm test -- utils/abilityGraph.test.ts utils/nodeRegistry.test.ts utils/abilityPrimitives.test.ts utils/nodes/coreNodes.test.ts utils/abilityInterpreter.test.ts utils/abilitySimulator.test.ts`.

---

## Roadmap (fases seguintes — planos próprios)

**Fase 2 — Paleta completa + templates (headless):** registrar os ~25 tipos de nó restantes
(escudo, silenciar, provocar, incapacitar, invisibilidade, dispel, mover, invocar, transformar, reviver,
gerar recurso, reduzir custo, corrente, eco, tabela aleatória, marcar vulnerável, conversão de dano,
roubo de vida, espinhos, afinidade, ação extra, dano/cura periódicos, gatilhos reativos, predicados extras)
e `utils/abilityTemplates.ts`. Cada nó = mesma estrutura da Task 4, com teste de interpretação.

**Fase 3 — Editor em tela cheia:** `components/arsenal/graph/{GraphEditor,GraphCanvas,NodePalette,NodeInspector,SimulatorPanel}.tsx`.
Canvas SVG/DOM próprio (pan/zoom/drag), inspector gerado a partir do `FieldSchema`, galeria de templates,
seletor de nível, botão Simular ligado ao `abilitySimulator`. Testes com `@testing-library/react`.

**Fase 4 — Integração na Cena + remoção do antigo:** adaptador de despacho em `CenaTab`
(`kind:'graph'` → `interpretAbility`; legado → `resolveArsenalAction`), refatorar `resolveArsenalAction`
para chamar as primitivas de `abilityPrimitives` (fonte única), persistência `AbilityGraph` no store do
arsenal, ligar a lista do arsenal ao novo editor, **deletar `components/arsenal/ArsenalCardEditor.tsx`**
e marcar arma/selo/item como "migrar para grafo".

---

## Self-review (feito)

- **Cobertura do spec (Fase 1):** modelo (Task 1), registro extensível (Task 2), primitivas compartilhadas
  (Task 3), paleta representativa (Task 4), interpretador com ramificação + perfis de nível (Tasks 1/5),
  simulador dry-run (Task 6). Editor/Cena/paleta completa → Fases 2-4 (roadmap). ✔
- **Consistência de tipos:** `InterpretCtx` definido na Task 5 e consumido nas Tasks 2/4 (nota de stub na Task 2);
  `applyDamage/applyHeal/applyCondition` (Task 3) usados na Task 4; `mergeLevel` (Task 1) usado na Task 5;
  `TraceStep` (Task 5) usado na Task 6. ✔
- **Placeholders:** nenhum "TBD/depois"; todo passo de código tem corpo real. Os pontos marcados como "nota de
  refino" trazem a alternativa concreta (ex.: usar `ClassicEffectKind` importado). ✔
