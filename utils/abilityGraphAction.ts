import { rollDice } from './dice';
import { mergeLevel, type AbilityGraph } from './abilityGraph';
import type { ArsenalHolding, CooldownConfig, PreparationConfig } from './arsenal';
import { INSTANT_PREPARATION } from './arsenal';
import { interpretAbility, type TraceStep } from './abilityInterpreter';
import type { ArsenalActorState } from './arsenalPipeline';

export interface AbilityGraphActionRequest {
  graph: AbilityGraph;
  level: number;
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  roller?: (notation: string, label?: string) => number;
  /** Retoma uma habilidade cuja preparação já terminou — não cobra custo nem cooldown de novo. */
  resumePreparation?: boolean;
  /** Habilidades-companhia de um combo: rodam em sequência sobre o mesmo estado, após o grafo base. */
  combos?: { graph: AbilityGraph; level: number }[];
  /** Bônus de defesa somado a todos os alvos no teste de acerto (proteção/reação). */
  defenseBonus?: number;
  /** Alvos extras disponíveis para seletores 'todos_*' (ex.: o atacante original, numa reação de 'ao_ser_alvejado'),
   * mas que não entram no escopo padrão dos efeitos (só via um nó 'alvo' explícito). */
  additionalTargets?: ArsenalActorState[];
}

export interface AbilityGraphActionResult {
  status: 'bloqueada' | 'preparando' | 'concluida';
  reason?: string;
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  preparation?: PreparationConfig;
  rolls: Record<string, never>;
  hitTargetIds: string[];
  defeatedIds: string[];
  trace: TraceStep[];
  fieldEffects: never[];
  ongoingEffectIntents: { targetId: string; casterId: string; rounds: number }[];
  /** Estado atualizado dos additionalTargets (ex.: o atacante, se um nó 'alvo' o incluiu no escopo e o afetou). */
  additionalTargets: ArsenalActorState[];
}

function block(actor: ArsenalActorState, targets: ArsenalActorState[], reason: string): AbilityGraphActionResult {
  return { status: 'bloqueada', reason, actor, targets, rolls: {}, hitTargetIds: [], defeatedIds: [], trace: [], fieldEffects: [], ongoingEffectIntents: [], additionalTargets: [] };
}

export interface GraphCosts { aura: number; municao: number; vida: number }

/** Soma os nós 'custo' alcançáveis no grafo mesclado, agrupados por recurso. */
export function graphCosts(graph: AbilityGraph, level: number): GraphCosts {
  const merged = mergeLevel(graph, level);
  const sum = (recurso: string) => merged.nodes
    .filter(n => n.type === 'custo' && (n.props as { recurso?: string }).recurso === recurso)
    .reduce((total, n) => total + Number((n.props as { amount?: number }).amount ?? 0), 0);
  return { aura: sum('aura'), municao: sum('municao'), vida: sum('vida') };
}

export interface GraphComboConfig { stackKey: string; maxStacks: number }

/** Configuração de combo do grafo: presente se houver uma raiz secundária 'em_combo'. */
export function graphComboConfig(graph: AbilityGraph, level: number): GraphComboConfig | null {
  const node = mergeLevel(graph, level).nodes.find(n => n.type === 'em_combo');
  if (!node) return null;
  const props = node.props as { stackKey?: string; maxStacks?: number };
  return { stackKey: props.stackKey ?? '', maxStacks: props.maxStacks ?? 2 };
}

/** Cooldown do grafo mesclado, lido do nó 'cooldown'. Ausente = sem cooldown. */
export function graphCooldown(graph: AbilityGraph, level: number): CooldownConfig {
  const node = mergeLevel(graph, level).nodes.find(n => n.type === 'cooldown');
  if (!node) return { type: 'sem_cooldown' };
  const props = node.props as { tipo?: CooldownConfig['type']; amount?: number };
  const tipo = props.tipo ?? 'sem_cooldown';
  return tipo === 'sem_cooldown' ? { type: 'sem_cooldown' } : { type: tipo, amount: props.amount ?? 1 } as CooldownConfig;
}

/** Preparação do grafo mesclado, lida do nó 'preparacao'. Ausente = instantânea. */
export function graphPreparation(graph: AbilityGraph, level: number): PreparationConfig {
  const node = mergeLevel(graph, level).nodes.find(n => n.type === 'preparacao');
  if (!node) return INSTANT_PREPARATION;
  const props = node.props as { tipo?: 'instantaneo' | 'turnos' | 'rodadas'; amount?: number };
  const tipo = props.tipo ?? 'instantaneo';
  const timing = tipo === 'instantaneo' ? { type: 'instantaneo' as const } : { type: tipo, amount: props.amount ?? 1 };
  return { timing, cancellable: true, interruptedByDamage: false, persistsAfterDamage: true, visibility: 'visivel' };
}

export type AbilityGraphCooldownEvent = 'inicio_turno' | 'inicio_rodada' | 'uso_manual';

/** Avança o cooldown das habilidades-grafo do elenco: um contador simples por turnos/rodadas/usos —
 *  sem os gatilhos/eventos de combate do sistema de arsenal, que não se aplicam a grafos.
 *  `catalog` deve ser o elenco já mesclado no nível de cada holding (ver `leveledAbilityGraphs`). */
export function advanceAbilityGraphCooldowns(
  holdings: readonly ArsenalHolding[],
  catalog: readonly AbilityGraph[],
  event: AbilityGraphCooldownEvent,
): ArsenalHolding[] {
  return holdings.map(holding => {
    if (!holding.cooldownRemaining) return { ...holding };
    // `catalog` já está mesclado no nível correto de cada holding — lê o nó direto, sem remesclar (evita reaplicar mergeLevel com o nível errado).
    const node = catalog.find(entry => entry.id === holding.cardId)?.nodes.find(n => n.type === 'cooldown');
    const tipo = (node?.props as { tipo?: 'sem_cooldown' | 'turnos' | 'rodadas' | 'usos' } | undefined)?.tipo ?? 'sem_cooldown';
    const decrement = (event === 'inicio_turno' && tipo === 'turnos')
      || (event === 'inicio_rodada' && tipo === 'rodadas')
      || (event === 'uso_manual' && tipo === 'usos');
    return decrement ? { ...holding, cooldownRemaining: Math.max(0, holding.cooldownRemaining - 1) } : { ...holding };
  });
}

export function resolveAbilityGraphAction(request: AbilityGraphActionRequest): AbilityGraphActionResult {
  const roller = request.roller ?? (notation => rollDice(notation).total);
  const header = mergeLevel(request.graph, request.level).header;
  const combos = request.combos ?? [];
  const actor: ArsenalActorState = { ...request.actor, holdings: request.actor.holdings.map(h => ({ ...h })) };
  const targets = request.targets.map(t => ({ ...t }));
  const additionalTargets = (request.additionalTargets ?? []).map(t => ({ ...t }));
  const holding = actor.holdings.find(h => h.cardId === request.graph.id);

  if (!request.resumePreparation) {
    if (holding?.cooldownRemaining && holding.cooldownRemaining > 0) return block(actor, targets, 'Habilidade em cooldown');
    if (header.charges && (holding?.currentCharges ?? header.charges.current) <= 0) return block(actor, targets, 'Habilidade sem cargas');
  }
  const costs = [graphCosts(request.graph, request.level), ...combos.map(c => graphCosts(c.graph, c.level))]
    .reduce((total, c) => ({ aura: total.aura + c.aura, municao: total.municao + c.municao, vida: total.vida + c.vida }), { aura: 0, municao: 0, vida: 0 });
  if (!request.resumePreparation) {
    if (costs.aura > actor.currentAura) return block(actor, targets, 'Aura insuficiente');
    if (costs.municao > actor.currentAmmo) return block(actor, targets, 'Munição insuficiente');
    if (costs.vida >= actor.currentHp) return block(actor, targets, 'Vida insuficiente');
    actor.currentAura -= costs.aura;
    actor.currentAmmo -= costs.municao;
    actor.currentHp -= costs.vida;
  }

  const preparation = graphPreparation(request.graph, request.level);
  if (!request.resumePreparation && preparation.timing.type !== 'instantaneo') {
    return {
      status: 'preparando', actor, targets, preparation,
      rolls: {}, hitTargetIds: [], defeatedIds: [], trace: [], fieldEffects: [], ongoingEffectIntents: [], additionalTargets,
    };
  }

  const defenseBonus = request.defenseBonus ?? 0;
  const passesFor = () => [{ graph: request.graph, level: request.level }, ...combos];

  let passActor = actor;
  const trace: TraceStep[] = [];
  const ongoingEffectIntents: { targetId: string; casterId: string; rounds: number }[] = [];
  const isCombo = combos.length > 0;
  const hitTargetIds: string[] = [];
  const resultTargetById = new Map<string, ArsenalActorState>();
  let currentAdditionalTargets = additionalTargets;

  for (const originalTarget of targets) {
    let currentTarget = originalTarget;
    let hit = true;
    for (const pass of passesFor()) {
      const passResult = interpretAbility(pass.graph, pass.level, {
        actor: passActor, primaryTargets: [currentTarget], allTargets: [passActor, ...targets, ...currentAdditionalTargets], roller, defenseBonus,
      });
      hit = hit && (passResult.hitTest ?? true);
      passActor = passResult.actor;
      currentTarget = passResult.targets.find(rt => rt.id === currentTarget.id) ?? currentTarget;
      currentAdditionalTargets = currentAdditionalTargets.map(t => passResult.targets.find(rt => rt.id === t.id) ?? t);
      trace.push(...passResult.trace);
      ongoingEffectIntents.push(...passResult.ongoingEffectIntents);

      if (isCombo) {
        const comboResult = interpretAbility(pass.graph, pass.level, {
          actor: passActor, primaryTargets: [currentTarget], allTargets: [passActor, ...targets, ...currentAdditionalTargets], roller, defenseBonus,
        }, { rootType: 'em_combo' });
        passActor = comboResult.actor;
        currentTarget = comboResult.targets.find(rt => rt.id === currentTarget.id) ?? currentTarget;
        currentAdditionalTargets = currentAdditionalTargets.map(t => comboResult.targets.find(rt => rt.id === t.id) ?? t);
        trace.push(...comboResult.trace);
        ongoingEffectIntents.push(...comboResult.ongoingEffectIntents);
      }
    }
    if (hit) hitTargetIds.push(originalTarget.id);
    resultTargetById.set(originalTarget.id, currentTarget);
  }
  additionalTargets.splice(0, additionalTargets.length, ...currentAdditionalTargets);

  if (holding) {
    const cooldown = graphCooldown(request.graph, request.level);
    if (cooldown.type !== 'sem_cooldown') {
      holding.cooldownRemaining = cooldown.type === 'turnos' || cooldown.type === 'rodadas' || cooldown.type === 'usos'
        ? cooldown.amount : 1;
    }
    if (header.charges) holding.currentCharges = Math.max(0, (holding.currentCharges ?? header.charges.current) - 1);
  }

  const resultTargets = targets.map(t => resultTargetById.get(t.id)!);

  return {
    status: 'concluida',
    actor: { ...passActor, holdings: actor.holdings },
    targets: resultTargets,
    rolls: {},
    hitTargetIds,
    defeatedIds: resultTargets.filter(t => t.currentHp <= 0).map(t => t.id),
    trace,
    fieldEffects: [],
    ongoingEffectIntents,
    additionalTargets,
  };
}

/** Roda a árvore 'enquanto_ativa' de um grafo sobre o dono do efeito contínuo (sem custo/cooldown/teste de acerto). */
export function runOngoingEffect(
  graph: AbilityGraph, level: number, owner: ArsenalActorState, roller: (notation: string) => number,
) {
  return interpretAbility(graph, level, { actor: owner, primaryTargets: [owner], allTargets: [owner], roller }, { rootType: 'enquanto_ativa' });
}

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
