import { describe, expect, it } from 'vitest';
import { applyDamageConditionInteractions, DAMAGE_CONDITION_INTERACTIONS, ELEMENTAL_CONDITION_TABLE, rollElementalConditionChance } from './arsenalElements';
import { createArsenalCard } from './arsenal';
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

describe('chance elemental configurável', () => {
  it('tem uma entrada por elemento com condição padrão', () => {
    expect(ELEMENTAL_CONDITION_TABLE.map(entry => entry.damageType)).toEqual([
      'fogo', 'água', 'raio', 'vento', 'terra', 'fisico', 'sangue', 'luminoso', 'escuridão',
    ]);
  });

  it('aplica a condição quando o roll cai dentro da chance', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo' });
    expect(rollElementalConditionChance(card, () => 10)).toBe('queimadura');
    expect(rollElementalConditionChance(card, () => 25)).toBeNull();
  });

  it('carta pode sobrescrever a chance', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', elementalConditionChance: 0.9 });
    expect(rollElementalConditionChance(card, () => 80)).toBe('queimadura');
  });

  it('carta pode desativar o proc elemental', () => {
    const card = createArsenalCard({ id: 'fire', name: 'Fogo', category: 'habilidade', element: 'fogo', applyElementalCondition: false });
    expect(rollElementalConditionChance(card, () => 1)).toBeNull();
  });

  it('sem elemento, não aplica nada', () => {
    const card = createArsenalCard({ id: 'x', name: 'X', category: 'habilidade' });
    expect(rollElementalConditionChance(card, () => 1)).toBeNull();
  });
});
