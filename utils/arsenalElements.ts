import type { Element } from '../types';
import type { ClassicEffectKind } from './arsenal';
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
