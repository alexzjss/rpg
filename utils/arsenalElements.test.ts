import { describe, expect, it } from 'vitest';
import { applyDamageConditionInteractions, DAMAGE_CONDITION_INTERACTIONS } from './arsenalElements';
import { getPredefinedEffect } from './arsenalEffects';
import { applyActiveEffect } from './arsenalPipeline';

describe('tabela de interação dano×condição', () => {
  it('tem as 3 interações conhecidas', () => {
    expect(DAMAGE_CONDITION_INTERACTIONS.map(i => i.id)).toEqual(['molhado-raio', 'molhado-fogo', 'agua-queimadura']);
  });

  it('raio contra Molhado multiplica pelo valor da condição e consome', () => {
    const wet = { ...getPredefinedEffect('Molhado')!, classic: { kind: 'molhado' as const, value: 2 } };
    const effects = applyActiveEffect([], wet);
    const result = applyDamageConditionInteractions(effects, 'raio', 10);
    expect(result.damage).toBe(20);
    expect(result.effects.some(active => active.effect.classic?.kind === 'molhado')).toBe(false);
  });

  it('fogo contra Molhado reduz o dano pela metade e consome', () => {
    const wet = { ...getPredefinedEffect('Molhado')!, classic: { kind: 'molhado' as const, value: 2 } };
    const effects = applyActiveEffect([], wet);
    const result = applyDamageConditionInteractions(effects, 'fogo', 10);
    expect(result.damage).toBe(5);
    expect(result.effects.some(active => active.effect.classic?.kind === 'molhado')).toBe(false);
  });

  it('água contra Queimadura extingue sem alterar o dano da água', () => {
    const burn = getPredefinedEffect('Queimadura')!;
    const effects = applyActiveEffect([], burn);
    const result = applyDamageConditionInteractions(effects, 'água', 8);
    expect(result.damage).toBe(8);
    expect(result.effects.some(active => active.effect.classic?.kind === 'queimadura')).toBe(false);
  });

  it('sem interação aplicável, retorna dano e efeitos inalterados', () => {
    const result = applyDamageConditionInteractions([], 'fogo', 8);
    expect(result.damage).toBe(8);
    expect(result.effects).toEqual([]);
  });
});
