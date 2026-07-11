import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry, getNodeType } from '../nodeRegistry';
import { registerTestNodes } from './testNodes';
import type { InterpretCtx } from '../abilityInterpreter';
import type { ArsenalActorState } from '../arsenalPipeline';

function actor(over: Partial<ArsenalActorState> = {}): ArsenalActorState {
  return {
    id: 'a', teamId: 'A', name: 'Ator', currentHp: 30, maxHp: 30, currentAura: 10, maxAura: 10,
    currentAmmo: 0, maxAmmo: 0, defense: 12, speed: 8, tags: [], equippedWeaponIds: [],
    activeFormIds: [], effects: [], holdings: [], isCurrentTurn: true, inCombat: true, ...over,
  };
}

function ctxWith(over: Partial<InterpretCtx> = {}): InterpretCtx {
  const a = actor();
  const t = actor({ id: 't', defense: 10 });
  return {
    actor: a, scope: [t], primaryTargets: [t], allTargets: [a, t],
    roller: () => 15, element: null, trace: [], ...over,
  };
}

describe('nó teste', () => {
  beforeEach(() => { _resetRegistry(); registerTestNodes(); });

  it('comparador defesa_alvo: sucesso quando rolagem >= defesa do alvo em ctx.scope[0]', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 12 });
    const result = def.evaluate!({ dice: '1d20', comparador: 'defesa_alvo', modificador: 0 }, ctx);
    expect(result).toBe(true);
    expect(ctx.hitTest).toBe(true);
  });

  it('comparador defesa_alvo: falha quando rolagem < defesa do alvo', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 3 });
    const result = def.evaluate!({ dice: '1d20', comparador: 'defesa_alvo', modificador: 0 }, ctx);
    expect(result).toBe(false);
    expect(ctx.hitTest).toBe(false);
  });

  it('comparador valor_fixo: compara a rolagem+modificador contra valorFixo', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 8 });
    expect(def.evaluate!({ dice: '1d20', comparador: 'valor_fixo', valorFixo: 10, modificador: 3 }, ctx)).toBe(true); // 8+3=11 >= 10
    expect(def.evaluate!({ dice: '1d20', comparador: 'valor_fixo', valorFixo: 10, modificador: 0 }, ctx)).toBe(false); // 8 < 10
  });

  it('comparador aura_alvo: compara a rolagem contra a aura atual do ator', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 9 });
    expect(def.evaluate!({ dice: '1d20', comparador: 'aura_alvo', modificador: 0 }, { ...ctx, actor: actor({ currentAura: 5 }) })).toBe(true);
  });

  it('comparador porcentagem: rola 1d100 e compara contra valorFixo (não usa "dice")', () => {
    const def = getNodeType('teste')!;
    const ctx = ctxWith({ roller: () => 30 });
    expect(def.evaluate!({ dice: '', comparador: 'porcentagem', valorFixo: 50, modificador: 0 }, ctx)).toBe(true);
    expect(def.evaluate!({ dice: '', comparador: 'porcentagem', valorFixo: 20, modificador: 0 }, ctx)).toBe(false);
  });

  it('summarize descreve o dado e o comparador', () => {
    const def = getNodeType('teste')!;
    expect(def.summarize({ dice: '1d20', comparador: 'defesa_alvo', modificador: 0 })).toBe('Teste: 1d20 vs. defesa do alvo');
  });
});
