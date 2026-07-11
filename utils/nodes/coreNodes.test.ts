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

  it('nó alvo troca o escopo para próprio usuário', () => {
    const c = ctx();
    getNodeType('alvo')!.interpret!({ scope: 'proprio' }, c);
    expect(c.scope[0].id).toBe(c.actor.id);
  });

  it('gatilho "quando alvejado" existe e não tem campos', () => {
    expect(getNodeType('ao_ser_alvejado')).toBeTruthy();
    expect(getNodeType('ao_ser_alvejado')!.fields).toEqual([]);
  });

  it('buff unificado aplica modificador de stat de combate', () => {
    const c = ctx();
    getNodeType('buff')!.interpret!({ stat: 'ataque', operation: 'somar', value: 3, rounds: 2 }, c);
    const active = c.scope[0].effects[0];
    expect(active.effect.modifiers).toEqual([{ stat: 'ataque', operation: 'somar', value: 3 }]);
  });

  it('buff unificado com stat vida_maxima grava o modificador correspondente', () => {
    const c = ctx();
    getNodeType('buff')!.interpret!({ stat: 'vida_maxima', operation: 'somar', value: 10, rounds: 5 }, c);
    const active = c.scope[0].effects[0];
    expect(active.effect.modifiers).toEqual([{ stat: 'vida_maxima', operation: 'somar', value: 10 }]);
  });

  it('gatilho "em combo" existe com campos de stackKey/maxStacks', () => {
    const def = getNodeType('em_combo')!;
    expect(def.family).toBe('gatilho');
    expect(def.fields.map(f => f.key)).toEqual(['stackKey', 'maxStacks']);
  });

  it('nó custo não altera estado, só registra no trace', () => {
    const c = ctx();
    getNodeType('custo')!.interpret!({ recurso: 'aura', amount: 3 }, c);
    expect(c.trace.some(t => t.detail?.includes('3 de aura'))).toBe(true);
    expect(c.scope[0].currentHp).toBe(30);
  });
});
