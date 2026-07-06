import type { Element } from '../types';
import type { ArsenalCard, ClassicEffectKind } from './arsenal';
import type { ActiveEffectState } from './arsenalPipeline';

export interface DamageConditionInteraction {
  id: string;
  incomingElement: Element;
  conditionKind: ClassicEffectKind;
  /** 'valor_da_condicao' reaproveita o classic.value da própria condição (ex.: Molhado x2). Um número fixo é usado como está. */
  damageMultiplier: number | 'valor_da_condicao';
  consumesCondition: boolean;
}

export const DAMAGE_CONDITION_INTERACTIONS: DamageConditionInteraction[] = [
  { id: 'molhado-raio', incomingElement: 'raio', conditionKind: 'molhado', damageMultiplier: 'valor_da_condicao', consumesCondition: true },
  { id: 'molhado-fogo', incomingElement: 'fogo', conditionKind: 'molhado', damageMultiplier: 0.5, consumesCondition: true },
  { id: 'agua-queimadura', incomingElement: 'água', conditionKind: 'queimadura', damageMultiplier: 1, consumesCondition: true },
];

export interface DamageConditionInteractionResult {
  damage: number;
  effects: ActiveEffectState[];
}

/** Aplica as interações cabíveis (pode haver mais de uma) e retorna o dano final e a lista de efeitos já sem as condições consumidas. */
export function applyDamageConditionInteractions(
  effects: readonly ActiveEffectState[],
  incomingElement: Element,
  damage: number,
): DamageConditionInteractionResult {
  let result = damage;
  const consumedKinds = new Set<ClassicEffectKind>();
  for (const interaction of DAMAGE_CONDITION_INTERACTIONS) {
    if (interaction.incomingElement !== incomingElement) continue;
    const active = effects.find(item => item.effect.classic?.kind === interaction.conditionKind);
    if (!active) continue;
    const multiplier = interaction.damageMultiplier === 'valor_da_condicao'
      ? Math.max(1, active.effect.classic!.value)
      : interaction.damageMultiplier;
    result = Math.floor(result * multiplier);
    if (interaction.consumesCondition) consumedKinds.add(interaction.conditionKind);
  }
  return {
    damage: result,
    effects: effects.filter(active => !active.effect.classic || !consumedKinds.has(active.effect.classic.kind)),
  };
}

export interface ElementalConditionConfig {
  damageType: Element;
  conditionKind: ClassicEffectKind;
  chance: number; // 0..1
}

export const ELEMENTAL_CONDITION_TABLE: ElementalConditionConfig[] = [
  { damageType: 'fogo', conditionKind: 'queimadura', chance: 0.20 },
  { damageType: 'água', conditionKind: 'molhado', chance: 0.20 },
  { damageType: 'raio', conditionKind: 'eletrocutado', chance: 0.15 },
  { damageType: 'vento', conditionKind: 'desequilibrado', chance: 0.15 },
  { damageType: 'terra', conditionKind: 'enraizado', chance: 0.15 },
  { damageType: 'fisico', conditionKind: 'fraturado', chance: 0.10 },
  { damageType: 'sangue', conditionKind: 'sangramento', chance: 0.20 },
  { damageType: 'luminoso', conditionKind: 'iluminado', chance: 0.15 },
  { damageType: 'escuridão', conditionKind: 'amaldicoado', chance: 0.15 },
];

/** Rola (1-100 via roller) se a carta deve aplicar a condição elemental padrão do seu dano. Retorna o kind ou null. */
export function rollElementalConditionChance(card: ArsenalCard, roller: (notation: string) => number): ClassicEffectKind | null {
  if (card.applyElementalCondition === false) return null;
  if (!card.element) return null;
  const entry = ELEMENTAL_CONDITION_TABLE.find(item => item.damageType === card.element);
  if (!entry) return null;
  const chance = card.elementalConditionChance ?? entry.chance;
  const roll = roller('1d100');
  return roll <= chance * 100 ? entry.conditionKind : null;
}
