import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry } from './nodeRegistry';
import { ensureNodesRegistered } from './nodes';
import { listAbilityTemplates } from './abilityTemplates';
import { interpretAbility } from './abilityInterpreter';
import type { ArsenalActorState } from './arsenalPipeline';

const alvo = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => ({
  id: 't', teamId: 'B', name: 'Alvo', currentHp: 30, maxHp: 30, currentAura: 0, maxAura: 0,
  currentAmmo: 0, maxAmmo: 0, defense: 10, speed: 5, tags: [], equippedWeaponIds: [],
  activeFormIds: [], effects: [], holdings: [], isCurrentTurn: false, inCombat: true, ...over,
});
const actor = (over: Partial<ArsenalActorState> = {}): ArsenalActorState => alvo({ id: 'a', teamId: 'A', isCurrentTurn: true, ...over });

describe('listAbilityTemplates', () => {
  beforeEach(() => { _resetRegistry(); ensureNodesRegistered(); });

  it('expoe os criadores rapidos, cada um com estrutura de grafo valida', () => {
    const templates = listAbilityTemplates();
    expect(templates.map(t => t.id)).toEqual([
      'ataque',
      'ataque_aura',
      'ataque_aura_condicao',
      'reacao',
      'reacao_aura',
      'reacao_aura_dano',
      'cura',
      'cura_aura',
      'buff',
      'debuff',
      'forma_ofensiva',
      'forma_defensiva',
      'forma_tecnica',
      'forma_especial',
      'estado_alvo',
    ]);
    for (const template of templates) {
      const graph = template.build();
      const root = graph.nodes.find(n => n.family === 'gatilho');
      expect(root, `template ${template.id} precisa de um no-gatilho`).toBeTruthy();
      const nonRootIds = graph.nodes.filter(n => n.family !== 'gatilho').map(n => n.id);
      const targetIds = new Set(graph.edges.map(e => e.to));
      for (const id of nonRootIds) expect(targetIds.has(id), `no ${id} do template ${template.id} esta desconectado`).toBe(true);
    }
  });

  it('ataque simples ja nasce com um no de teste (rolagem inicial) e causa dano', () => {
    const graph = listAbilityTemplates().find(t => t.id === 'ataque')!.build({ testDice: '2d20', damageDice: '1d8', damageFlat: 2 });
    const testeNode = graph.nodes.find(n => n.type === 'teste');
    expect(testeNode?.props).toMatchObject({ dice: '2d20' });
    const res = interpretAbility(graph, 1, { actor: actor(), primaryTargets: [alvo({ defense: 0 })], allTargets: [actor(), alvo()], roller: () => 4 });
    expect(res.targets[0].currentHp).toBeLessThan(30);
  });

  it('ataque com aura e condicao inclui custo, dano e aplicacao de condicao configuravel', () => {
    const graph = listAbilityTemplates().find(t => t.id === 'ataque_aura_condicao')!.build({ auraCost: 3, conditionKind: 'sangramento', conditionRounds: 4, conditionValue: 5 });
    expect(graph.nodes.some(n => n.type === 'custo' && n.props.amount === 3)).toBe(true);
    expect(graph.nodes.some(n => n.type === 'dano')).toBe(true);
    expect(graph.nodes.some(n => n.type === 'aplicar_condicao' && n.props.classicKind === 'sangramento' && n.props.rounds === 4)).toBe(true);
  });

  it('reacao usa gatilho de alvejado e pode retaliar com dano', () => {
    const graph = listAbilityTemplates().find(t => t.id === 'reacao_aura_dano')!.build({ auraCost: 2, damageDice: '2d6', damageFlat: 1 });
    expect(graph.nodes.find(n => n.family === 'gatilho')!.type).toBe('ao_ser_alvejado');
    expect(graph.nodes.some(n => n.type === 'custo' && n.props.amount === 2)).toBe(true);
    expect(graph.nodes.some(n => n.type === 'alvo' && n.props.scope === 'atacante_original')).toBe(true);
    expect(graph.nodes.some(n => n.type === 'dano' && n.props.dice === '2d6')).toBe(true);
  });

  it('forma especial inclui custo de aura, duracao, buff e cor de token', () => {
    const graph = listAbilityTemplates().find(t => t.id === 'forma_especial')!.build({ auraCost: 5, formRounds: 6, formBuffStat: 'aura_maxima', formBuffValue: 8, formColor: '#22d3ee' });
    expect(graph.header.testDice).toBeNull();
    expect(graph.nodes.some(n => n.type === 'custo' && n.props.amount === 5)).toBe(true);
    expect(graph.nodes.some(n => n.type === 'aplicar_como_efeito' && n.props.rounds === 6)).toBe(true);
    expect(graph.nodes.some(n => n.type === 'buff' && n.props.stat === 'aura_maxima' && n.props.value === 8)).toBe(true);
    expect(graph.nodes.some(n => n.type === 'cor_token' && n.props.color === '#22d3ee')).toBe(true);
  });
});
