import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRegistry } from './nodeRegistry';
import { ensureNodesRegistered } from './nodes';
import { createAbilityGraph } from './abilityGraph';
import { addNode, removeNode, updateNodeProps, moveNode, setLevelOverride, setRootTrigger, addSecondaryTrigger } from './abilityGraphEdit';

describe('abilityGraphEdit', () => {
  beforeEach(() => { _resetRegistry(); ensureNodesRegistered(); });

  it('addNode cria um nó com defaults do registro e conecta ao pai', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph, nodeId } = addNode(base, rootId, 'dano');
    const node = graph.nodes.find(n => n.id === nodeId)!;
    expect(node.type).toBe('dano');
    expect(node.props).toEqual({ dice: '1d6', flat: 0, element: null, perfurante: false });
    expect(graph.edges).toContainEqual({ id: expect.any(String), from: rootId, to: nodeId });
  });

  it('addNode com branch conecta como SE/SENÃO de um ramo', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph: g1, nodeId: ramoId } = addNode(base, rootId, 'ramo');
    const { graph: g2, nodeId: danoId } = addNode(g1, ramoId, 'dano', 'entao');
    const edge = g2.edges.find(e => e.to === danoId)!;
    expect(edge.from).toBe(ramoId);
    expect(edge.branch).toBe('entao');
  });

  it('removeNode remove o nó e sua subárvore, mas não a raiz de fato do grafo (sem pais)', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph: g1, nodeId: n1 } = addNode(base, rootId, 'dano');
    const { graph: g2, nodeId: n2 } = addNode(g1, n1, 'cura');
    const g3 = removeNode(g2, n1);
    expect(g3.nodes.some(n => n.id === n1)).toBe(false);
    expect(g3.nodes.some(n => n.id === n2)).toBe(false);
    expect(g3.edges).toEqual([]);

    const g4 = removeNode(g3, rootId);
    expect(g4.nodes.some(n => n.id === rootId)).toBe(true); // raiz de fato preservada (no-op)
  });

  it('removeNode permite remover um trigger secundário conectado como filho de outro nó', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph, nodeId: enquantoId } = addNode(base, rootId, 'enquanto_ativa');
    const next = removeNode(graph, enquantoId);
    expect(next.nodes.some(n => n.id === enquantoId)).toBe(false);
  });

  it('removeNode permite remover uma raiz secundária solta (sem pais, mas não a única raiz)', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const withSecondary = addSecondaryTrigger(base, 'em_combo');
    const secondaryId = withSecondary.nodes.find(n => n.type === 'em_combo')!.id;
    const next = removeNode(withSecondary, secondaryId);
    expect(next.nodes.some(n => n.id === secondaryId)).toBe(false);
    expect(next.nodes.some(n => n.type === 'ao_ativar')).toBe(true); // a raiz principal continua lá
  });

  it('updateNodeProps mescla o patch nas props do nó', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph, nodeId } = addNode(base, rootId, 'dano');
    const updated = updateNodeProps(graph, nodeId, { flat: 5 });
    const node = updated.nodes.find(n => n.id === nodeId)!;
    expect(node.props).toEqual({ dice: '1d6', flat: 5, element: null, perfurante: false });
  });

  it('moveNode atualiza a posição do nó', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph, nodeId } = addNode(base, rootId, 'dano');
    const moved = moveNode(graph, nodeId, { x: 40, y: 120 });
    expect(moved.nodes.find(n => n.id === nodeId)!.position).toEqual({ x: 40, y: 120 });
  });

  it('setLevelOverride cria e depois atualiza a entrada do nível', () => {
    const base = createAbilityGraph({ id: 'a', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph, nodeId } = addNode(base, rootId, 'dano');
    const g1 = setLevelOverride(graph, 2, nodeId, 'flat', 3);
    expect(g1.levelProfiles).toEqual([{ level: 2, overrides: [{ nodeId, field: 'flat', value: 3 }] }]);
    const g2 = setLevelOverride(g1, 2, nodeId, 'flat', 7);
    expect(g2.levelProfiles).toEqual([{ level: 2, overrides: [{ nodeId, field: 'flat', value: 7 }] }]);
  });

  it('setRootTrigger troca o tipo do nó raiz existente sem duplicar', () => {
    const base = createAbilityGraph({ id: 'a1', name: 'X' });
    const rootId = base.nodes[0].id;
    const next = setRootTrigger(base, 'ao_ser_alvejado');
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0].id).toBe(rootId);
    expect(next.nodes[0].type).toBe('ao_ser_alvejado');
    expect(next.nodes[0].props).toEqual({});
  });

  it('setRootTrigger preserva os filhos conectados à raiz', () => {
    const base = createAbilityGraph({ id: 'a1', name: 'X' });
    const rootId = base.nodes[0].id;
    const { graph } = addNode(base, rootId, 'dano');
    const next = setRootTrigger(graph, 'ao_ser_alvejado');
    expect(next.edges).toHaveLength(1);
    expect(next.edges[0].from).toBe(rootId);
  });
});
