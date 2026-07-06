import { rollDice } from './dice';
import {
  hasAllTags,
  type ArsenalCard,
  type ArsenalEffect,
  type ArsenalHolding,
  type AmountFormula,
  type ClassicEffectKind,
  type DiceBonus,
  type DiceBonusTarget,
  type EffectFilter,
  type EffectModifier,
  type TriggerEvent,
  type UsageCondition,
} from './arsenal';

export const ACTION_PIPELINE_STEPS = [
  'declarar_acao',
  'verificar_condicoes',
  'selecionar_alvo',
  'consumir_custos',
  'iniciar_preparacao',
  'rolar_dados',
  'janela_reacoes',
  'calcular_modificadores',
  'calcular_defesa',
  'calcular_dano_cura',
  'aplicar_efeitos',
  'disparar_gatilhos',
  'atualizar_cooldown',
  'atualizar_cargas',
  'verificar_mortes',
  'encerrar_acao',
] as const;

export type ActionPipelineStep = typeof ACTION_PIPELINE_STEPS[number];

export interface ActiveEffectState {
  effect: ArsenalEffect;
  stacks: number;
  remaining?: number;
  turnSkipsRemaining?: number;
  principalBlocksRemaining?: number;
}

export interface ArsenalActorState {
  id: string;
  teamId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  currentAura: number;
  maxAura: number;
  defense: number;
  speed: number;
  tags: string[];
  equippedWeaponIds: string[];
  activeFormIds: string[];
  effects: ActiveEffectState[];
  holdings: ArsenalHolding[];
  isCurrentTurn: boolean;
  inCombat: boolean;
}

export type ReactionOwnerKind = 'alvo' | 'aliado_alvo' | 'inimigo' | 'automatico';

export interface ReactionCandidate {
  id: string;
  ownerId: string;
  ownerKind: ReactionOwnerKind;
  speed?: number;
  attackModifier?: number;
  defenseModifier?: number;
  damageModifier?: number;
  cancelAction?: boolean;
}

export interface PipelineTraceEntry {
  step: ActionPipelineStep;
  detail?: string;
}

export interface PendingPreparation {
  cardId: string;
  actorId: string;
  targetIds: string[];
  timing: ArsenalCard['preparation']['timing'];
  cancellable: boolean;
  interruptedByDamage: boolean;
  persistsAfterDamage: boolean;
  visibility: ArsenalCard['preparation']['visibility'];
}

export interface TriggerEmission {
  event: TriggerEvent;
  sourceId: string;
  targetIds: string[];
  tags: string[];
}

export interface ActionResolutionRequest {
  card: ArsenalCard;
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  reactions?: ReactionCandidate[];
  /** Permite testes determinísticos e integração futura com animação de dados. */
  roller?: (notation: string) => number;
  isReaction?: boolean;
  resumePreparation?: boolean;
}

export interface ActionResolutionResult {
  status: 'bloqueada' | 'preparando' | 'cancelada' | 'concluida';
  reason?: string;
  card: ArsenalCard;
  actor: ArsenalActorState;
  targets: ArsenalActorState[];
  preparation?: PendingPreparation;
  reactions: ReactionCandidate[];
  rolls: { test?: number; extraDamage?: number; damage?: number; healing?: number };
  hitTargetIds: string[];
  triggers: TriggerEmission[];
  defeatedIds: string[];
  trace: PipelineTraceEntry[];
  /** Preenchido apenas quando `card.target.type === 'campo_de_batalha'`: efeitos
   *  para o chamador instalar como ActiveFieldEffect (não pertencem a um alvo). */
  fieldEffects: ArsenalEffect[];
}

const reactionPriority: Record<ReactionOwnerKind, number> = {
  alvo: 0,
  aliado_alvo: 1,
  inimigo: 2,
  automatico: 3,
};

export function sortReactions(reactions: readonly ReactionCandidate[]): ReactionCandidate[] {
  return [...reactions].sort((a, b) =>
    reactionPriority[a.ownerKind] - reactionPriority[b.ownerKind]
    || (b.speed ?? 0) - (a.speed ?? 0)
    || a.id.localeCompare(b.id));
}

function cloneActor(actor: ArsenalActorState): ArsenalActorState {
  return {
    ...actor,
    tags: [...actor.tags],
    equippedWeaponIds: [...actor.equippedWeaponIds],
    activeFormIds: [...actor.activeFormIds],
    effects: actor.effects.map(active => ({ ...active, effect: structuredClone(active.effect) })),
    holdings: actor.holdings.map(holding => ({ ...holding })),
  };
}

function rollAmount(value: AmountFormula | null, roller: (notation: string) => number): number {
  if (!value) return 0;
  return value.flat + (value.dice ? roller(value.dice) : 0);
}

function activeEffectIds(actor: ArsenalActorState): Set<string> {
  return new Set(actor.effects.map(active => active.effect.id));
}

function conditionFailure(
  condition: UsageCondition,
  card: ArsenalCard,
  actor: ArsenalActorState,
  targets: ArsenalActorState[],
  isReaction: boolean,
): string | null {
  const hpPercent = actor.maxHp > 0 ? actor.currentHp / actor.maxHp * 100 : 0;
  switch (condition.type) {
    case 'arma_equipada':
      if (condition.weaponIds?.length && !condition.weaponIds.some(id => actor.equippedWeaponIds.includes(id))) return 'Exige arma vinculada equipada';
      if (!condition.weaponIds?.length && actor.equippedWeaponIds.length === 0) return 'Exige arma equipada';
      return null;
    case 'forma_ativa':
      if (condition.formIds?.length && !condition.formIds.some(id => actor.activeFormIds.includes(id))) return 'Exige forma vinculada ativa';
      if (!condition.formIds?.length && actor.activeFormIds.length === 0) return 'Exige forma ativa';
      return null;
    case 'elemento': return card.element === condition.element ? null : `Exige elemento ${condition.element}`;
    case 'aura_minima': return actor.currentAura >= condition.amount ? null : 'Aura mínima não atingida';
    case 'vida_acima': return (condition.unit === 'percentual' ? hpPercent : actor.currentHp) > condition.value ? null : 'Vida insuficiente';
    case 'vida_abaixo': return (condition.unit === 'percentual' ? hpPercent : actor.currentHp) < condition.value ? null : 'Vida acima do limite';
    case 'efeito_ativo': return activeEffectIds(actor).has(condition.effectId) ? null : 'Efeito exigido não está ativo';
    case 'alvo_com_efeito': return targets.some(target => activeEffectIds(target).has(condition.effectId)) ? null : 'O alvo não possui o efeito exigido';
    case 'proprio_turno': return actor.isCurrentTurn ? null : 'Só pode ser usada no próprio turno';
    case 'reacao': return isReaction ? null : 'Só pode ser usada como reação';
    case 'fora_turno': return !actor.isCurrentTurn ? null : 'Só pode ser usada fora do turno';
    case 'em_combate': return actor.inCombat ? null : 'Exige combate ativo';
    case 'fora_combate': return !actor.inCombat ? null : 'Só pode ser usada fora de combate';
    case 'tag': {
      const source = condition.subject === 'usuario' ? actor.tags : condition.subject === 'carta' ? card.tags : targets.flatMap(target => target.tags);
      return hasAllTags(source, [condition.tag]) ? null : `Exige a tag ${condition.tag}`;
    }
  }
}

function validateTargets(card: ArsenalCard, actor: ArsenalActorState, targets: ArsenalActorState[]): string | null {
  switch (card.target.type) {
    case 'proprio_usuario': return targets.length === 1 && targets[0].id === actor.id ? null : 'O alvo deve ser o próprio usuário';
    case 'um_alvo': return targets.length === 1 ? null : 'Selecione exatamente um alvo';
    case 'multiplos_alvos': return targets.length > 0 && targets.length <= card.target.maxTargets ? null : `Selecione de 1 a ${card.target.maxTargets} alvos`;
    case 'todos_aliados': return targets.length > 0 && targets.every(target => target.teamId === actor.teamId) ? null : 'A seleção deve conter apenas aliados';
    case 'todos_inimigos': return targets.length > 0 && targets.every(target => target.teamId !== actor.teamId) ? null : 'A seleção deve conter apenas inimigos';
    case 'campo_de_batalha': return null;
    default: return targets.length > 0 ? null : 'Selecione ao menos um alvo ou ponto no mapa';
  }
}

/** Resolve um EffectFilter contra a carta/ator atuais (e, opcionalmente, quem aplicou o efeito ativo). */
function matchesEffectFilter(filter: EffectFilter | undefined, card: ArsenalCard, actor: ArsenalActorState, sourceId?: string): boolean {
  if (!filter) return true;
  if (filter.damageType?.length && (!card.element || !filter.damageType.includes(card.element))) return false;
  if (filter.cardIds?.length && !filter.cardIds.includes(card.id)) return false;
  if (filter.cardTags?.length && !filter.cardTags.some(tag => hasAllTags(card.tags, [tag]))) return false;
  if (filter.categories?.length && !filter.categories.includes(card.category)) return false;
  if (filter.abilityTypes?.length && (!card.abilityType || !filter.abilityTypes.includes(card.abilityType))) return false;
  if (filter.weaponIds?.length && !filter.weaponIds.some(id => actor.equippedWeaponIds.includes(id))) return false;
  if (filter.sourceEntityId && filter.sourceEntityId !== sourceId) return false;
  return true;
}

function modifierTotal(actor: ArsenalActorState, stat: 'ataque' | 'defesa' | 'dano', card: ArsenalCard): number {
  let total = 0;
  for (const active of actor.effects) {
    const direct = stat === 'ataque' ? active.effect.attackModifier : stat === 'defesa' ? active.effect.defenseModifier : 0;
    total += direct * active.stacks;
    for (const modifier of active.effect.modifiers) {
      if (modifier.stat === stat && modifier.operation === 'somar' && matchesEffectFilter(modifier.filter, card, actor, undefined)) total += modifier.value * active.stacks;
    }
  }
  return total;
}

/** Multiplicador acumulado de modificadores 'multiplicar' (percentual) para o stat, aplicado sobre o total aditivo. */
function modifierMultiplier(actor: ArsenalActorState, stat: 'ataque' | 'defesa' | 'dano', card: ArsenalCard): number {
  let multiplier = 1;
  for (const active of actor.effects) {
    for (const modifier of active.effect.modifiers) {
      if (modifier.stat === stat && modifier.operation === 'multiplicar' && matchesEffectFilter(modifier.filter, card, actor, undefined)) {
        multiplier *= (1 + modifier.value / 100) ** active.stacks;
      }
    }
  }
  return multiplier;
}

/** Primeiro modificador 'definir' que casa o escopo — sobrepõe o total calculado do stat. */
function modifierOverride(actor: ArsenalActorState, stat: 'ataque' | 'defesa' | 'dano', card: ArsenalCard): number | undefined {
  for (const active of actor.effects) {
    for (const modifier of active.effect.modifiers) {
      if (modifier.stat === stat && modifier.operation === 'definir' && matchesEffectFilter(modifier.filter, card, actor, undefined)) return modifier.value;
    }
  }
  return undefined;
}

/** Aplica multiplicador e sobreposição de modificadores a um total aditivo já calculado. */
function resolveStatTotal(base: number, actor: ArsenalActorState, stat: 'ataque' | 'defesa' | 'dano', card: ArsenalCard): number {
  const multiplied = Math.round(base * modifierMultiplier(actor, stat, card));
  const override = modifierOverride(actor, stat, card);
  return override !== undefined ? override : multiplied;
}

/** Multiplicador de cura/recuperação de aura RECEBIDA pelo portador (ex.: Amaldiçoado). Diferente de modifierMultiplier: aqui 'value' é um percentual de redução/aumento direto (-50 = metade), não um bônus composto por stack. */
function receivedMultiplier(actor: ArsenalActorState, stat: 'cura_recebida' | 'aura_recebida'): number {
  let multiplier = 1;
  for (const active of actor.effects) {
    for (const modifier of active.effect.modifiers) {
      if (modifier.stat === stat && modifier.operation === 'multiplicar') {
        multiplier *= (1 + modifier.value / 100) ** active.stacks;
      }
    }
  }
  return Math.max(0, multiplier);
}

function activeDiceBonuses(actor: ArsenalActorState, target: DiceBonusTarget, card: ArsenalCard): DiceBonus[] {
  const bonuses: DiceBonus[] = [];
  for (const active of actor.effects) {
    for (const bonus of active.effect.diceBonuses ?? []) {
      if (bonus.target === target && matchesEffectFilter(bonus.filter, card, actor, undefined)) {
        for (let stack = 0; stack < Math.max(1, active.stacks); stack += 1) bonuses.push(bonus);
      }
    }
  }
  return bonuses;
}

/** Rola uma notação simples (teste/dano extra) já somando bônus de dado/flat e resolvendo vantagem. */
function rollNotationWithBonuses(
  notation: string | null,
  target: DiceBonusTarget,
  actor: ArsenalActorState,
  card: ArsenalCard,
  roller: (notation: string) => number,
): number {
  if (!notation) return 0;
  const bonuses = activeDiceBonuses(actor, target, card);
  let base = roller(notation);
  if (bonuses.some(bonus => bonus.rerollBelow != null && base < bonus.rerollBelow!)) base = roller(notation);
  const hasAdvantage = bonuses.some(bonus => bonus.advantage);
  const hasDisadvantage = bonuses.some(bonus => bonus.disadvantage);
  if (hasAdvantage !== hasDisadvantage) {
    const second = roller(notation);
    base = hasAdvantage ? Math.max(base, second) : Math.min(base, second);
  }
  const minimum = Math.max(0, ...bonuses.map(bonus => bonus.minimumResult ?? 0));
  base = Math.max(base, minimum);
  let extra = 0;
  for (const bonus of bonuses) {
    extra += bonus.bonusFlat ?? 0;
    if (bonus.bonusDice) extra += roller(bonus.bonusDice);
  }
  return base + extra;
}

/** Rola uma AmountFormula (dano/cura) já somando bônus de dado/flat e resolvendo vantagem no dado da fórmula. */
function rollAmountWithBonuses(
  value: AmountFormula | null,
  target: DiceBonusTarget,
  actor: ArsenalActorState,
  card: ArsenalCard,
  roller: (notation: string) => number,
): number {
  if (!value) return 0;
  const bonuses = activeDiceBonuses(actor, target, card);
  let diceResult = value.dice ? roller(value.dice) : 0;
  if (value.dice && bonuses.some(bonus => bonus.rerollBelow != null && diceResult < bonus.rerollBelow!)) diceResult = roller(value.dice);
  const hasAdvantage = bonuses.some(bonus => bonus.advantage);
  const hasDisadvantage = bonuses.some(bonus => bonus.disadvantage);
  if (value.dice && hasAdvantage !== hasDisadvantage) {
    const second = roller(value.dice);
    diceResult = hasAdvantage ? Math.max(diceResult, second) : Math.min(diceResult, second);
  }
  const minimum = Math.max(0, ...bonuses.map(bonus => bonus.minimumResult ?? 0));
  diceResult = Math.max(diceResult, minimum);
  let extra = 0;
  for (const bonus of bonuses) {
    extra += bonus.bonusFlat ?? 0;
    if (bonus.bonusDice) extra += roller(bonus.bonusDice);
  }
  return value.flat + diceResult + extra;
}

/** Primeira afinidade elemental ativa do ator para o elemento informado. */
function activeAffinity(actor: ArsenalActorState, element: ArsenalCard['element']) {
  if (!element) return undefined;
  for (const active of actor.effects) {
    const match = (active.effect.elementalAffinities ?? []).find(affinity => affinity.element === element);
    if (match) return match;
  }
  return undefined;
}

function isImmuneTo(actor: ArsenalActorState, kind: ClassicEffectKind | undefined): boolean {
  if (!kind) return false;
  return actor.effects.some(active => (active.effect.immunities ?? []).includes(kind));
}

function totalLifeSteal(actor: ArsenalActorState): number {
  return actor.effects.reduce((sum, active) => sum + (active.effect.lifeSteal ?? 0) * active.stacks, 0);
}

function thornsDamage(target: ArsenalActorState, roller: (notation: string) => number): number {
  return target.effects.reduce((sum, active) => {
    if (!active.effect.thorns) return sum;
    return sum + rollAmount(active.effect.thorns, roller) * active.stacks;
  }, 0);
}

function stackEffect(states: ActiveEffectState[], effect: ArsenalEffect): ActiveEffectState[] {
  const index = states.findIndex(active => active.effect.id === effect.id);
  const duration = effect.duration.amount;
  const skipTurns=effect.classic?.kind==='congelamento'?Math.max(0,Math.floor(effect.classic.value)):undefined;
  const principalBlocks=effect.classic?.kind==='desnorteado'?Math.max(1,Math.floor(effect.classic.value)):undefined;
  if (index < 0) return [...states, { effect: structuredClone(effect), stacks: 1, remaining: duration, turnSkipsRemaining:skipTurns, principalBlocksRemaining:principalBlocks }];
  const next = states.map(active => ({ ...active }));
  const current = next[index];
  current.effect=structuredClone(effect);
  if (effect.stackBehavior === 'nao_acumula') return next;
  if (effect.stackBehavior === 'renova_duracao') current.remaining = duration;
  if (effect.stackBehavior === 'acumula_intensidade' || effect.stackBehavior === 'acumula_ambos') current.stacks = Math.min(effect.maxStacks, current.stacks + 1);
  if (effect.stackBehavior === 'acumula_duracao' || effect.stackBehavior === 'acumula_ambos') current.remaining = (current.remaining ?? 0) + (duration ?? 0);
  if(skipTurns!==undefined) current.turnSkipsRemaining=effect.stackBehavior==='acumula_intensidade'||effect.stackBehavior==='acumula_ambos'?(current.turnSkipsRemaining??0)+skipTurns:Math.max(current.turnSkipsRemaining??0,skipTurns);
  if(principalBlocks!==undefined) current.principalBlocksRemaining=effect.stackBehavior==='acumula_intensidade'||effect.stackBehavior==='acumula_ambos'?(current.principalBlocksRemaining??0)+principalBlocks:Math.max(current.principalBlocksRemaining??0,principalBlocks);
  return next;
}

export function applyActiveEffect(states: readonly ActiveEffectState[], effect: ArsenalEffect): ActiveEffectState[] {
  return stackEffect([...states], effect);
}

export function activeOrderAdjustment(effects: readonly ActiveEffectState[]): { speed: number; positions: number } {
  let speed=0;let positions=0;
  for(const active of effects){
    speed+=(active.effect.speedModifier??0)*active.stacks;
    if(active.effect.classic?.kind==='lentidao')positions+=Math.max(0,Math.floor(active.effect.classic.value))*active.stacks;
    if(active.effect.classic?.kind==='acelerado')positions-=Math.max(0,Math.floor(active.effect.classic.value))*active.stacks;
  }
  return {speed,positions};
}

export function consumeTurnSkip(effects: readonly ActiveEffectState[]): { effects: ActiveEffectState[]; skipped: boolean; source?: string } {
  const index=effects.findIndex(active=>active.effect.classic?.kind==='congelamento'&&(active.turnSkipsRemaining??active.effect.classic.value)>0);
  if(index<0)return{effects:[...effects],skipped:false};
  const next=effects.map(active=>({...active}));const active=next[index];
  active.turnSkipsRemaining=Math.max(0,(active.turnSkipsRemaining??active.effect.classic!.value)-1);
  if(active.remaining!==undefined)active.remaining=Math.max(0,active.remaining-1);
  return{effects:next.filter(item=>item.remaining===undefined||item.remaining>0),skipped:true,source:active.effect.name};
}

export function consumePrincipalBlock(effects: readonly ActiveEffectState[]): { effects: ActiveEffectState[]; blocked: boolean; source?: string } {
  const index=effects.findIndex(active=>active.effect.classic?.kind==='desnorteado'&&(active.principalBlocksRemaining??active.effect.classic.value)>0);
  if(index<0)return{effects:[...effects],blocked:false};
  const next=effects.map(active=>({...active}));const active=next[index];
  active.principalBlocksRemaining=Math.max(0,(active.principalBlocksRemaining??active.effect.classic!.value)-1);
  return{effects:next,blocked:true,source:active.effect.name};
}

export function advanceTurnEndEffects(effects: readonly ActiveEffectState[]): {effects:ActiveEffectState[];expiredNames:string[]} {
  const next:ActiveEffectState[]=[];const expiredNames:string[]=[];
  for(const active of effects){
    const classic=active.effect.classic;
    const periodic=!!active.effect.periodicDamage||!!active.effect.periodicHealing||!!active.effect.auraConsumed||!!active.effect.auraRestored||classic?.kind==='queimadura'||classic?.kind==='eletrocutado'||classic?.kind==='sangramento';
    const temporal=active.effect.duration.type==='rodadas'||active.effect.duration.type==='turnos';
    if(!periodic&&temporal&&active.remaining!==undefined){const remaining=active.remaining-1;if(remaining<=0)expiredNames.push(active.effect.name);else next.push({...active,remaining});}
    else next.push({...active});
  }
  return{effects:next,expiredNames};
}

export interface ActiveEffectTickResult {
  effects: ActiveEffectState[];
  currentHp: number;
  currentAura: number;
  hpDelta: number;
  auraDelta: number;
  events: Array<{ kind: 'damage' | 'heal' | 'aura-drain' | 'aura-heal'; effectName: string; amount: number }>;
  expiredNames: string[];
}

/** Executa efeitos periódicos no início do turno do portador e avança durações temporais. */
export function tickActiveEffects(
  effects: readonly ActiveEffectState[],
  resources: { currentHp: number; maxHp: number; currentAura: number; maxAura: number },
  roller: (notation: string) => number = notation => rollDice(notation).total,
): ActiveEffectTickResult {
  let currentHp = resources.currentHp;
  let currentAura = resources.currentAura;
  const events: ActiveEffectTickResult['events'] = [];
  const expiredNames: string[] = [];
  const next: ActiveEffectState[] = [];
  const wetMultiplier=effects.filter(active=>active.effect.classic?.kind==='molhado').reduce((multiplier,active)=>multiplier*Math.max(1,active.effect.classic!.value),1);
  let wetConsumed=false;
  const amount = (formula: AmountFormula | null, stacks: number) => formula ? Math.max(0, (formula.flat + (formula.dice ? roller(formula.dice) : 0)) * stacks) : 0;

  for (const active of effects) {
    const classic=active.effect.classic;
    let classicDamage=classic?.kind==='queimadura'||classic?.kind==='eletrocutado'?Math.max(0,classic.value*active.stacks):classic?.kind==='sangramento'?Math.max(0,(classic.mode==='percentual_vida_maxima'?Math.floor(resources.maxHp*classic.value/100):classic.value)*active.stacks):0;
    if(classic?.kind==='eletrocutado'&&classicDamage>0&&wetMultiplier>1){classicDamage=Math.floor(classicDamage*wetMultiplier);wetConsumed=true;}
    const damage = amount(active.effect.periodicDamage, active.stacks)+classicDamage;
    const healing = amount(active.effect.periodicHealing, active.stacks);
    const auraDrain = amount(active.effect.auraConsumed, active.stacks);
    const auraHealing = amount(active.effect.auraRestored, active.stacks);
    if (damage > 0) {
      const applied = Math.min(currentHp, damage);
      currentHp -= applied;
      if (applied > 0) events.push({ kind: 'damage', effectName: active.effect.name, amount: applied });
    }
    if (healing > 0) {
      const applied = Math.min(resources.maxHp - currentHp, healing);
      currentHp += applied;
      if (applied > 0) events.push({ kind: 'heal', effectName: active.effect.name, amount: applied });
    }
    if (auraDrain > 0) {
      const applied = Math.min(currentAura, auraDrain);
      currentAura -= applied;
      if (applied > 0) events.push({ kind: 'aura-drain', effectName: active.effect.name, amount: applied });
    }
    if (auraHealing > 0) {
      const applied = Math.min(resources.maxAura - currentAura, auraHealing);
      currentAura += applied;
      if (applied > 0) events.push({ kind: 'aura-heal', effectName: active.effect.name, amount: applied });
    }

    const isPeriodic=damage>0||healing>0||auraDrain>0||auraHealing>0;
    const advancesWithTurn = isPeriodic&&(active.effect.duration.type === 'rodadas' || active.effect.duration.type === 'turnos');
    if (advancesWithTurn && active.remaining !== undefined) {
      const remaining = active.remaining - 1;
      if (remaining <= 0) expiredNames.push(active.effect.name);
      else next.push({ ...active, remaining });
    } else next.push({ ...active });
  }

  return {
    effects: wetConsumed?next.filter(active=>active.effect.classic?.kind!=='molhado'):next,
    currentHp,
    currentAura,
    hpDelta: currentHp - resources.currentHp,
    auraDelta: currentAura - resources.currentAura,
    events,
    expiredNames,
  };
}

function block(base: ActionResolutionResult, reason: string): ActionResolutionResult {
  return { ...base, status: 'bloqueada', reason };
}

/** Motor puro da Carta de Arsenal. Integrações de UI podem pausar em `preparando`. */
export function resolveArsenalAction(request: ActionResolutionRequest): ActionResolutionResult {
  const roller = request.roller ?? (notation => rollDice(notation).total);
  const actor = cloneActor(request.actor);
  const targets = request.targets.map(cloneActor);
  const trace: PipelineTraceEntry[] = [{ step: 'declarar_acao', detail: request.card.name }];
  const base: ActionResolutionResult = {
    status: 'concluida', card: request.card, actor, targets, reactions: [], rolls: {}, hitTargetIds: [], triggers: [], defeatedIds: [], trace, fieldEffects: [],
  };

  const holding = actor.holdings.find(item => item.cardId === request.card.id);
  if (holding?.cooldownRemaining && holding.cooldownRemaining > 0) return block(base, 'Carta em cooldown');
  if (request.card.charges && (holding?.currentCharges ?? request.card.charges.current) <= 0) return block(base, 'Carta sem cargas');
  for (const condition of request.card.conditions) {
    const failure = conditionFailure(condition, request.card, actor, targets, !!request.isReaction);
    if (failure) return block({ ...base, trace: [...trace, { step: 'verificar_condicoes', detail: failure }] }, failure);
  }
  const paralysis = actor.effects.find(active => active.effect.classic?.kind === 'paralisado');
  if (paralysis) {
    const dc = paralysis.effect.classic!.value;
    const rollResult = roller('1d20');
    if (rollResult < dc) {
      const reason = `Paralisado: falhou no teste (${rollResult} < ${dc})`;
      return block({ ...base, trace: [...trace, { step: 'verificar_condicoes', detail: reason }] }, reason);
    }
  }
  const confusion = actor.effects.find(active => active.effect.classic?.kind === 'confuso');
  if (confusion) {
    const chance = confusion.effect.classic!.value;
    const roll = roller('1d100') / 100;
    if (roll < chance) {
      return { ...base, status: 'cancelada', trace: [...trace, { step: 'verificar_condicoes', detail: 'Confuso: ação perdida' }], reason: 'Confuso: ação perdida' };
    }
  }
  if (!request.resumePreparation && request.card.category === 'selo' && request.card.seal?.kind === 'ritual') {
    for (const requirement of request.card.seal.requiredItems) {
      const item = actor.holdings.find(holding => holding.cardId === requirement.itemId);
      if ((item?.quantity ?? 0) < requirement.quantity) {
        return block({ ...base, trace: [...trace, { step: 'verificar_condicoes', detail: 'Itens insuficientes para o ritual' }] }, 'Itens insuficientes para o ritual');
      }
    }
  }
  trace.push({ step: 'verificar_condicoes' });

  const targetFailure = validateTargets(request.card, actor, targets);
  if (targetFailure) return block({ ...base, trace: [...trace, { step: 'selecionar_alvo', detail: targetFailure }] }, targetFailure);
  trace.push({ step: 'selecionar_alvo', detail: targets.map(target => target.id).join(',') });

  const auraCost = rollAmount(request.card.auraConsumed, roller);
  if (!request.resumePreparation && auraCost > actor.currentAura) return block({ ...base, trace }, 'Aura insuficiente');
  if (!request.resumePreparation && request.card.category === 'item' && request.card.item?.consumable) {
    if (!holding || holding.quantity < Math.max(1, request.card.item.usesPerActivation ?? 1)) return block({ ...base, trace }, 'Item indisponível');
  }
  if (!request.resumePreparation) actor.currentAura -= auraCost;
  if (!request.resumePreparation && request.card.category === 'selo' && request.card.seal?.kind === 'ritual') {
    for (const requirement of request.card.seal.requiredItems) {
      const item = actor.holdings.find(holding => holding.cardId === requirement.itemId);
      if (item) item.quantity = Math.max(0, item.quantity - requirement.quantity);
    }
  }
  if (!request.resumePreparation && request.card.category === 'item' && request.card.item?.consumable && holding) {
    holding.quantity = Math.max(0, holding.quantity - Math.max(1, request.card.item.usesPerActivation ?? 1));
    if (request.card.item.disappearsOnUse && holding.quantity === 0) holding.active = false;
  }
  trace.push({ step: 'consumir_custos', detail: request.resumePreparation ? 'já pagos na preparação' : auraCost ? `${auraCost} aura` : undefined });

  if (!request.resumePreparation && request.card.preparation.timing.type !== 'instantaneo') {
    const preparation: PendingPreparation = {
      cardId: request.card.id,
      actorId: actor.id,
      targetIds: targets.map(target => target.id),
      timing: request.card.preparation.timing,
      cancellable: request.card.preparation.cancellable,
      interruptedByDamage: request.card.preparation.interruptedByDamage,
      persistsAfterDamage: request.card.preparation.persistsAfterDamage,
      visibility: request.card.preparation.visibility,
    };
    trace.push({ step: 'iniciar_preparacao' });
    return { ...base, status: 'preparando', actor, targets, preparation, trace };
  }
  trace.push({ step: 'iniciar_preparacao', detail: request.resumePreparation ? 'retomada' : 'instantânea' });

  const test = request.card.testDice ? rollNotationWithBonuses(request.card.testDice, 'teste', actor, request.card, roller) : undefined;
  const extraDamage = request.card.extraDamageDice ? rollNotationWithBonuses(request.card.extraDamageDice, 'dano_extra', actor, request.card, roller) : 0;
  const rolledDamage = rollAmountWithBonuses(request.card.damage, 'dano', actor, request.card, roller);
  const rolledHealing = rollAmountWithBonuses(request.card.healing, 'cura', actor, request.card, roller);
  base.rolls = { test, extraDamage, damage: rolledDamage, healing: rolledHealing };
  trace.push({ step: 'rolar_dados' });

  const reactions = sortReactions(request.reactions ?? []);
  base.reactions = reactions;
  trace.push({ step: 'janela_reacoes', detail: reactions.map(reaction => reaction.id).join(',') || 'sem reações' });
  if (reactions.some(reaction => reaction.cancelAction)) {
    trace.push({ step: 'encerrar_acao', detail: 'cancelada por reação' });
    return { ...base, status: 'cancelada', actor, targets, trace };
  }

  const reactionAttack = reactions.reduce((sum, reaction) => sum + (reaction.attackModifier ?? 0), 0);
  const reactionDamage = reactions.reduce((sum, reaction) => sum + (reaction.damageModifier ?? 0), 0);
  let weakenedTest=test??0;
  if(request.card.damage&&test!==undefined){for(const active of actor.effects){const classic=active.effect.classic;if(classic?.kind!=='fraqueza')continue;if(classic.mode==='subtrair')weakenedTest-=classic.value*active.stacks;else weakenedTest=Math.floor(weakenedTest/Math.max(1,classic.value*active.stacks));}}
  const attackTotal = resolveStatTotal(weakenedTest + modifierTotal(actor, 'ataque', request.card) + reactionAttack, actor, 'ataque', request.card);
  const damageTotal = Math.max(0, resolveStatTotal(rolledDamage + extraDamage + modifierTotal(actor, 'dano', request.card) + reactionDamage, actor, 'dano', request.card));
  trace.push({ step: 'calcular_modificadores' });

  const hitIds: string[] = [];
  for (const target of targets) {
    const reactionDefense = reactions.filter(reaction => reaction.ownerId === target.id).reduce((sum, reaction) => sum + (reaction.defenseModifier ?? 0), 0);
    const defense = resolveStatTotal(target.defense + modifierTotal(target, 'defesa', request.card) + reactionDefense, target, 'defesa', request.card);
    if (test == null || attackTotal >= defense) hitIds.push(target.id);
  }
  base.hitTargetIds = hitIds;
  trace.push({ step: 'calcular_defesa' });

  const auraRestored = rollAmount(request.card.auraRestored, roller);
  let totalAppliedDamage = 0;
  for (const target of targets) {
    if (!hitIds.includes(target.id)) continue;
    let targetDamage=damageTotal;
    if(request.card.element==='raio'&&targetDamage>0){
      const wet=target.effects.filter(active=>active.effect.classic?.kind==='molhado');
      if(wet.length){targetDamage=Math.floor(targetDamage*wet.reduce((multiplier,active)=>multiplier*Math.max(1,active.effect.classic!.value),1));target.effects=target.effects.filter(active=>active.effect.classic?.kind!=='molhado');}
    }
    let absorbedHealing = 0;
    const affinity = activeAffinity(target, request.card.element);
    if (affinity && targetDamage > 0) {
      if (affinity.kind === 'imunidade') targetDamage = 0;
      else if (affinity.kind === 'resistencia') targetDamage = Math.max(0, Math.floor(targetDamage * (1 - affinity.percent / 100)));
      else if (affinity.kind === 'vulnerabilidade') targetDamage = Math.ceil(targetDamage * (1 + affinity.percent / 100));
      else if (affinity.kind === 'absorcao') { absorbedHealing = Math.floor(targetDamage * affinity.percent / 100); targetDamage = 0; }
    }
    const appliedDamage = Math.min(target.currentHp, Math.max(0, targetDamage));
    totalAppliedDamage += appliedDamage;
    if (appliedDamage > 0) actor.currentHp = Math.max(0, actor.currentHp - thornsDamage(target, roller));
    const receivedHealing = Math.floor((rolledHealing + absorbedHealing) * receivedMultiplier(target, 'cura_recebida'));
    const receivedAura = Math.floor(auraRestored * receivedMultiplier(target, 'aura_recebida'));
    target.currentHp = Math.max(0, Math.min(target.maxHp, target.currentHp - targetDamage + receivedHealing));
    target.currentAura = Math.max(0, Math.min(target.maxAura, target.currentAura + receivedAura));
  }
  const lifeStealPercent = totalLifeSteal(actor);
  if (lifeStealPercent > 0 && totalAppliedDamage > 0) {
    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + Math.floor(totalAppliedDamage * lifeStealPercent / 100));
  }
  trace.push({ step: 'calcular_dano_cura' });

  for (const target of targets) {
    if (!hitIds.includes(target.id)) continue;
    for (const effect of request.card.effects) {
      if (isImmuneTo(target, effect.classic?.kind)) continue;
      target.effects = stackEffect(target.effects, effect);
    }
  }
  if (request.card.target.type === 'campo_de_batalha' && request.card.effects.length) {
    base.fieldEffects = structuredClone(request.card.effects);
  }
  trace.push({ step: 'aplicar_efeitos' });

  const emittedEvents: TriggerEvent[] = ['uso_manual'];
  if (damageTotal > 0 && hitIds.length) emittedEvents.push('ao_causar_dano');
  if (rolledHealing > 0 && hitIds.length) emittedEvents.push('ao_curar');
  if (auraCost > 0 && !request.resumePreparation) emittedEvents.push('consumir_aura');
  base.triggers = emittedEvents.map(event => ({ event, sourceId: actor.id, targetIds: hitIds, tags: request.card.tags }));
  trace.push({ step: 'disparar_gatilhos', detail: emittedEvents.join(',') });

  if (holding && request.card.cooldown.type !== 'sem_cooldown') {
    if (request.card.cooldown.type === 'turnos' || request.card.cooldown.type === 'rodadas' || request.card.cooldown.type === 'usos') holding.cooldownRemaining = request.card.cooldown.amount;
    else holding.cooldownRemaining = 1;
  }
  trace.push({ step: 'atualizar_cooldown' });

  if (holding && request.card.charges) holding.currentCharges = Math.max(0, (holding.currentCharges ?? request.card.charges.current) - 1);
  trace.push({ step: 'atualizar_cargas' });

  base.defeatedIds = targets.filter(target => target.currentHp <= 0).map(target => target.id);
  if (base.defeatedIds.length) base.triggers.push({ event: 'derrotar_alvo', sourceId: actor.id, targetIds: base.defeatedIds, tags: request.card.tags });
  trace.push({ step: 'verificar_mortes', detail: base.defeatedIds.join(',') });
  trace.push({ step: 'encerrar_acao' });
  return { ...base, actor, targets, trace };
}
