import React from 'react';
import { Trash2 } from 'lucide-react';
import { getNodeType, type FieldSchema } from '../../../utils/nodeRegistry';
import { getPredefinedEffect } from '../../../utils/arsenalEffects';
import type { GraphNode } from '../../../utils/abilityGraph';
import DiceFormulaInput from './DiceFormulaInput';

interface Props {
  node: GraphNode | null;
  edges: { from: string; to: string }[];
  onChange: (nodeId: string, patch: Record<string, unknown>) => void;
  onRemove: (nodeId: string) => void;
}

const ELEMENTS = ['fisico', 'fogo', 'raio', 'água', 'terra', 'vento', 'escuridão', 'luminoso', 'sangue', 'aura'];

/** Rótulo específico do campo "value" de aplicar_condicao por classicKind — o mesmo número
 * significa coisas diferentes por condição (dano, multiplicador, redução, valor mínimo de teste...).
 * `null` = a condição não usa magnitude própria (só duração/chance importam), então o campo é ocultado. */
const CLASSIC_VALUE_LABEL: Record<string, string | null> = {
  queimadura: 'Dano de fogo por rodada',
  congelamento: null,
  lentidao: 'Posições de atraso',
  molhado: 'Vezes que o próximo dano elétrico é multiplicado',
  eletrocutado: 'Dano de raio por rodada',
  sangramento: 'Dano por rodada (% da vida máxima)',
  fraqueza: 'Redução no teste de ataque',
  acelerado: 'Posições de adiantamento',
  desnorteado: null,
  paralisado: 'Valor mínimo no teste (1d20) para agir',
  confuso: 'Chance de perder a ação (0 a 1)',
  enraizado: 'Redução de velocidade (%)',
  desequilibrado: 'Redução no teste de ataque',
  fraturado: 'Redução de defesa',
  iluminado: 'Vulnerabilidade a trevas (%)',
  amaldicoado: 'Redução de cura/aura recebida (%)',
};

const field: React.CSSProperties = { width: '100%', padding: '8px 10px', background: 'rgba(7,9,14,.78)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f1f1f4', outline: 'none', fontSize: 12 };
const label: React.CSSProperties = { display: 'block', marginBottom: 4, color: '#92929c', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' };

function parseFieldValue(schema: FieldSchema, raw: string): unknown {
  if (schema.kind === 'numero') return Number(raw);
  if (schema.kind === 'condicao' || schema.kind === 'duracao') {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

const FieldInput: React.FC<{ schema: FieldSchema; value: unknown; onChange: (value: unknown) => void }> = ({ schema, value, onChange }) => {
  if (schema.kind === 'dado') {
    return <DiceFormulaInput label={schema.label} value={value == null ? null : String(value)} onChange={onChange} allowEmpty />;
  }
  if (schema.kind === 'toggle') {
    return <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c7c7ce', fontSize: 12 }}>
      <input id={schema.key} type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} /> {schema.label}
    </label>;
  }
  if (schema.kind === 'select') {
    return <label><span style={label}>{schema.label}</span>
      <select id={schema.key} aria-label={schema.label} style={field} value={String(value ?? '')} onChange={e => onChange(e.target.value)}>
        {(schema.options ?? []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </label>;
  }
  if (schema.kind === 'elemento') {
    return <label><span style={label}>{schema.label}</span>
      <select aria-label={schema.label} style={field} value={String(value ?? '')} onChange={e => onChange(e.target.value || null)}>
        <option value="">—</option>
        {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
      </select>
    </label>;
  }
  if (schema.kind === 'condicao' || schema.kind === 'duracao') {
    return <label><span style={label}>{schema.label}</span>
      <textarea aria-label={schema.label} style={{ ...field, minHeight: 70, fontFamily: 'monospace' }}
        value={JSON.stringify(value ?? null)} onChange={e => onChange(parseFieldValue(schema, e.target.value))} />
    </label>;
  }
  return <label><span style={label}>{schema.label}</span>
    <input aria-label={schema.label} style={field} type={schema.kind === 'numero' ? 'number' : 'text'}
      value={value === undefined || value === null ? '' : String(value)}
      onChange={e => onChange(parseFieldValue(schema, e.target.value))} />
  </label>;
};

const NodeInspector: React.FC<Props> = ({ node, edges, onChange, onRemove }) => {
  if (!node) return <div style={{ padding: 16, color: '#7a7a86', fontSize: 12 }}>Selecione um nó no canvas para editar suas propriedades.</div>;
  const def = getNodeType(node.type);
  if (!def) return <div style={{ padding: 16, color: '#fda4af', fontSize: 12 }}>Tipo de nó desconhecido: {node.type}</div>;

  const isCondicao = node.type === 'aplicar_condicao';
  const classicKind = String(node.props.classicKind ?? '');
  const conditionDescription = isCondicao ? getPredefinedEffect(classicKind)?.description : undefined;

  // Para aplicar_condicao, o campo genérico "value" ganha um rótulo específico da condição selecionada
  // (o mesmo número representa dano, multiplicador, redução etc. dependendo da condição) — ou é ocultado
  // quando a condição não tem magnitude própria (só duração/chance importam).
  const fields = isCondicao
    ? def.fields
        .map(schema => schema.key === 'value' && classicKind in CLASSIC_VALUE_LABEL
          ? { ...schema, label: CLASSIC_VALUE_LABEL[classicKind] ?? schema.label }
          : schema)
        .filter(schema => !(schema.key === 'value' && CLASSIC_VALUE_LABEL[classicKind] === null))
    : def.fields;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <strong style={{ color: '#eef2f7', fontSize: 13 }}>{def.label}</strong>
      {conditionDescription && (
        <p style={{ margin: 0, padding: '8px 10px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#9199a4', fontSize: 11, lineHeight: 1.5 }}>
          {conditionDescription}
        </p>
      )}
      {fields.map(schema => (
        <FieldInput key={schema.key} schema={schema} value={node.props[schema.key]}
          onChange={value => onChange(node.id, { [schema.key]: value })} />
      ))}
      {!(node.family === 'gatilho' && !edges.some(e => e.to === node.id)) && (
        <button type="button" onClick={() => onRemove(node.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(251,113,133,.4)', background: 'rgba(120,20,30,.15)', color: '#fda4af', fontSize: 12, cursor: 'pointer' }}>
          <Trash2 size={13} /> Remover nó
        </button>
      )}
    </div>
  );
};

export default NodeInspector;
