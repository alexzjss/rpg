import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { _resetRegistry } from '../../../utils/nodeRegistry';
import { ensureNodesRegistered } from '../../../utils/nodes';
import NodeInspector from './NodeInspector';
import type { GraphNode } from '../../../utils/abilityGraph';

describe('NodeInspector', () => {
  beforeEach(() => { _resetRegistry(); ensureNodesRegistered(); });

  it('renderiza um campo por FieldSchema do tipo do nó', () => {
    const node: GraphNode = { id: 'd1', type: 'dano', family: 'efeito', props: { dice: '1d6', flat: 2, element: 'fogo' } };
    render(<NodeInspector node={node} edges={[]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText('Dado')).toBeTruthy();
    expect((screen.getByLabelText('Fixo') as HTMLInputElement).value).toBe('2');
  });

  it('editar um campo numérico chama onChange com o valor convertido', () => {
    const onChange = vi.fn();
    const node: GraphNode = { id: 'd1', type: 'dano', family: 'efeito', props: { dice: '1d6', flat: 2, element: 'fogo' } };
    render(<NodeInspector node={node} edges={[]} onChange={onChange} onRemove={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Fixo'), { target: { value: '9' } });
    expect(onChange).toHaveBeenCalledWith('d1', { flat: 9 });
  });

  it('botão remover chama onRemove para nó não-gatilho', () => {
    const onRemove = vi.fn();
    const node: GraphNode = { id: 'd1', type: 'dano', family: 'efeito', props: { dice: '1d6', flat: 2, element: 'fogo' } };
    render(<NodeInspector node={node} edges={[]} onChange={vi.fn()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remover nó' }));
    expect(onRemove).toHaveBeenCalledWith('d1');
  });

  it('nó de família gatilho sem pais (raiz estrutural) não mostra o botão remover', () => {
    const node: GraphNode = { id: 'g1', type: 'ao_ativar', family: 'gatilho', props: {} };
    render(<NodeInspector node={node} edges={[]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Remover nó' })).toBeFalsy();
  });

  it('nó de família gatilho conectado como filho (tem pai) mostra o botão remover', () => {
    const node: GraphNode = { id: 'g2', type: 'enquanto_ativa', family: 'gatilho', props: {} };
    render(<NodeInspector node={node} edges={[{ from: 'g1', to: 'g2' }]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remover nó' })).toBeTruthy();
  });

  it('sem nó selecionado mostra uma dica', () => {
    render(<NodeInspector node={null} edges={[]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText(/Selecione um nó/)).toBeTruthy();
  });

  it('nó "aplicar_condicao" mostra a descrição da condição selecionada e permite editar duração/valor/chance', () => {
    const onChange = vi.fn();
    const node: GraphNode = { id: 'c1', type: 'aplicar_condicao', family: 'efeito', props: { classicKind: 'queimadura', rounds: 2, value: 2, chance: 100 } };
    render(<NodeInspector node={node} edges={[]} onChange={onChange} onRemove={vi.fn()} />);
    expect(screen.getByText(/dano de fogo no início de cada turno/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Duração (rodadas)'), { target: { value: '4' } });
    expect(onChange).toHaveBeenCalledWith('c1', { rounds: 4 });
    fireEvent.change(screen.getByLabelText('Chance de aplicar (%)'), { target: { value: '50' } });
    expect(onChange).toHaveBeenCalledWith('c1', { chance: 50 });
  });

  it('rótulo do campo "valor" é específico da condição selecionada (queimadura = dano de fogo)', () => {
    const node: GraphNode = { id: 'c1', type: 'aplicar_condicao', family: 'efeito', props: { classicKind: 'queimadura', rounds: 2, value: 2, chance: 100 } };
    render(<NodeInspector node={node} edges={[]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText('Dano de fogo por rodada')).toBeTruthy();
    expect(screen.queryByLabelText('Valor do efeito')).toBeFalsy();
  });

  it('condição sem magnitude própria (congelamento) oculta o campo de valor, mantendo duração/chance', () => {
    const node: GraphNode = { id: 'c1', type: 'aplicar_condicao', family: 'efeito', props: { classicKind: 'congelamento', rounds: 1, value: 1, chance: 100 } };
    render(<NodeInspector node={node} edges={[]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByLabelText('Valor do efeito')).toBeFalsy();
    expect(screen.getByLabelText('Duração (rodadas)')).toBeTruthy();
    expect(screen.getByLabelText('Chance de aplicar (%)')).toBeTruthy();
  });

  it('rótulo do campo "valor" para molhado descreve o multiplicador de dano elétrico', () => {
    const node: GraphNode = { id: 'c1', type: 'aplicar_condicao', family: 'efeito', props: { classicKind: 'molhado', rounds: 2, value: 2, chance: 100 } };
    render(<NodeInspector node={node} edges={[]} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByLabelText('Vezes que o próximo dano elétrico é multiplicado')).toBeTruthy();
  });
});
