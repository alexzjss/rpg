import type { Element } from '../types';
import type {
  TargetConfig, AreaConfig, ChargeConfig,
  ArsenalVisibility, ArsenalTag,
} from './arsenal';

export type NodeFamily = 'gatilho' | 'ramo' | 'alvo' | 'efeito';

export interface GraphNode {
  id: string;
  type: string;                 // chave no nodeRegistry
  family: NodeFamily;
  props: Record<string, unknown>;
  position?: { x: number; y: number };
  /** Nó só entra no grafo mesclado a partir deste nível (progressão). Ausente = nível 1. */
  enabledFromLevel?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  /** Só em arestas que saem de um nó 'ramo'. Ausente = fluxo simples. */
  branch?: 'entao' | 'senao';
}

export interface AbilityHeader {
  name: string;
  description: string;
  icon: string;
  iconPosition?: string;
  artLayout?: 'horizontal' | 'full';
  element: Element | null;
  tags: ArsenalTag[];
  visibility: ArsenalVisibility;
  target: TargetConfig;
  area: AreaConfig | null;
  charges: ChargeConfig | null;
}

export interface NodeFieldOverride { nodeId: string; field: string; value: unknown }
export interface LevelProfile { level: number; overrides: NodeFieldOverride[]; }

export interface AbilityGraph {
  kind: 'graph';
  schemaVersion: 2;
  id: string;
  header: AbilityHeader;
  nodes: GraphNode[];
  edges: GraphEdge[];
  levelProfiles: LevelProfile[];
  metadata?: Record<string, unknown>;
}

export function createAbilityGraph(
  input: { id: string; name: string } & Partial<AbilityHeader>,
): AbilityGraph {
  const { id, name, ...header } = input;
  return {
    kind: 'graph',
    schemaVersion: 2,
    id,
    header: {
      name,
      description: '',
      icon: '',
      element: null,
      tags: [],
      visibility: 'publica',
      target: { type: 'um_alvo' },
      area: null,
      charges: null,
      ...header,
    },
    nodes: [{ id: `gatilho-${id}`, type: 'ao_ativar', family: 'gatilho', props: {} }],
    edges: [],
    levelProfiles: [],
  };
}

/** Grafo efetivo no nível pedido: filtra nós por enabledFromLevel e aplica overrides acumulados até o nível. */
export function mergeLevel(graph: AbilityGraph, level: number): AbilityGraph {
  const nodes = graph.nodes
    .filter(node => (node.enabledFromLevel ?? 1) <= level)
    .map(node => ({ ...node, props: { ...node.props } }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  for (const profile of [...graph.levelProfiles].sort((a, b) => a.level - b.level)) {
    if (profile.level > level) break;
    for (const override of profile.overrides) {
      const node = byId.get(override.nodeId);
      if (node) node.props[override.field] = override.value;
    }
  }
  return { ...graph, nodes };
}
