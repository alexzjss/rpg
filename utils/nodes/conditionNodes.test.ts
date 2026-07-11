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
});
