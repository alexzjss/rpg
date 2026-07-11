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
  /** Alvos contextuais fora do escopo principal, como o atacante original em uma reação. */
  additionalTargets?: ArsenalActorState[];
  roller: (notation: string, label?: string) => number;
  element: Element | null;
  trace: TraceStep[];
  /** Resultado do último nó 'teste' avaliado no walk — usado por resolveAbilityGraphAction para decidir acerto/erro por alvo. */
  hitTest?: boolean;
  /** Sincroniza mutações do escopo de volta aos alvos/ator acumulados. */
  commit?: () => void;
  /** Intenções de movimento — materializadas no grid pela Cena (Fase 4); o núcleo headless só registra. */
  movementIntents?: { targetId: string; kind: string; distance: number }[];
  /** Multiplicador de dano/cura por id de alvo, usado pelo nó 'corrente' para modelar atenuação por salto. */
  scopeMultiplier?: Map<string, number>;
  /** Intenção de invocação — materializada na Cena (Fase 4), que cria o ator real no combate. */
  summonIntents?: { entityName: string; teamId: string; rounds: number }[];
  /** Intenção de transformação — a resolução do FormModule é responsabilidade do catálogo do arsenal (Fase 4). */
  transformIntents?: { targetId: string; intoFormId: string }[];
  /** Última condição clássica aplicada a cada alvo (por id), usada pelo nó 'eco'. */
  lastEffectKind?: Map<string, string>;
  /** Intenções de aplicar a própria habilidade como efeito contínuo — materializadas pela Cena como activeOngoingEffects. */
  ongoingEffectIntents?: { targetId: string; casterId: string; rounds: number }[];
}

export interface AbilityResult {
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  trace: TraceStep[];
  ongoingEffectIntents: { targetId: string; casterId: string; rounds: number }[];
  hitTest?: boolean;
}

export interface InterpretInput {
  actor: ArsenalActorState;
  primaryTargets: ArsenalActorState[];
  allTargets: ArsenalActorState[];
  roller?: (notation: string, label?: string) => number;
}

export function interpretAbility(graph: AbilityGraph, level: number, input: InterpretInput, opts?: { rootType?: string }): AbilityResult {
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
    additionalTargets: input.allTargets.filter(t => !input.primaryTargets.some(primary => primary.id === t.id) && t.id !== input.actor.id).map(t => byId.get(t.id)!),
    roller,
    element: graph.header.element,
    trace: [],
    commit: undefined,
    movementIntents: [],
    summonIntents: [],
    transformIntents: [],
    lastEffectKind: new Map(),
    ongoingEffectIntents: [],
  };
  ctx.commit = () => {
    for (const s of ctx.scope) {
      byId.set(s.id, s);
      if (s.id === ctx.actor.id) ctx.actor = s; // mantém ctx.actor em sincronia quando o próprio ator está no escopo
    }
    byId.set(ctx.actor.id, ctx.actor);
  };

  const nodeById = new Map(merged.nodes.map(n => [n.id, n]));
  const outgoing = (id: string, branch?: 'entao' | 'senao') =>
    merged.edges.filter(e => e.from === id && (branch === undefined ? e.branch === undefined : e.branch === branch));

  const root = merged.nodes.find(n => n.family === 'gatilho' && (opts?.rootType ? n.type === opts.rootType : n.type !== 'enquanto_ativa'));
  if (!root) return { actor: ctx.actor, targets: [...byId.values()].filter(a => a.id !== ctx.actor.id), trace: ctx.trace, ongoingEffectIntents: [] };

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
    ongoingEffectIntents: ctx.ongoingEffectIntents ?? [],
    hitTest: ctx.hitTest,
  };
}
