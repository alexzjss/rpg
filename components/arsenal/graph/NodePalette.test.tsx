import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { _resetRegistry } from '../../../utils/nodeRegistry';
import { ensureNodesRegistered } from '../../../utils/nodes';
import NodePalette from './NodePalette';

const baseProps = {
  onPick: vi.fn(),
  onLoadTemplate: vi.fn(),
  onPickTrigger: vi.fn(),
  onAddSecondaryTrigger: vi.fn(),
  onWizardBuild: vi.fn(),
};

describe('NodePalette', () => {
  beforeEach(() => { _resetRegistry(); ensureNodesRegistered(); vi.clearAllMocks(); });

  it('lista tipos de no agrupados por familia, exceto gatilho', () => {
    render(<NodePalette pendingConnection={null} {...baseProps} />);
    expect(screen.getByText('Dano')).toBeTruthy();
    expect(screen.queryByText('Ao ativar')).toBeFalsy();
  });

  it('itens ficam desabilitados sem pendingConnection', () => {
    render(<NodePalette pendingConnection={null} {...baseProps} />);
    expect((screen.getByRole('button', { name: /Dano/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('clicar num tipo com pendingConnection chama onPick', () => {
    const onPick = vi.fn();
    render(<NodePalette pendingConnection={{ parentId: 'x' }} {...baseProps} onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: /Dano/ }));
    expect(onPick).toHaveBeenCalledWith('dano');
  });

  it('abre o criador rapido e dispara onLoadTemplate ao confirmar', () => {
    const onLoadTemplate = vi.fn();
    render(<NodePalette pendingConnection={null} {...baseProps} onLoadTemplate={onLoadTemplate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ataque com custo de aura' }));
    fireEvent.change(screen.getByLabelText('Custo de aura'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar no grafo' }));
    expect(onLoadTemplate).toHaveBeenCalledWith('ataque_aura', expect.objectContaining({ auraCost: 4 }));
  });

  it('busca filtra os tipos listados', () => {
    render(<NodePalette pendingConnection={{ parentId: 'x' }} {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar no'), { target: { value: 'escudo' } });
    expect(screen.getByText('Escudo')).toBeTruthy();
    expect(screen.queryByText('Cura')).toBeFalsy();
  });

  it('lista os gatilhos e clicar chama onPickTrigger independente de pendingConnection', () => {
    const onPickTrigger = vi.fn();
    render(<NodePalette pendingConnection={null} {...baseProps} onPickTrigger={onPickTrigger} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quando usada' }));
    expect(onPickTrigger).toHaveBeenCalledWith('ao_ativar');
    fireEvent.click(screen.getByRole('button', { name: 'Quando alvejado' }));
    expect(onPickTrigger).toHaveBeenCalledWith('ao_ser_alvejado');
  });

  it('lista "Enquanto ativa" separadamente e clicar chama onAddSecondaryTrigger, nao onPickTrigger', () => {
    const onPickTrigger = vi.fn();
    const onAddSecondaryTrigger = vi.fn();
    render(<NodePalette pendingConnection={null} {...baseProps} onPickTrigger={onPickTrigger} onAddSecondaryTrigger={onAddSecondaryTrigger} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquanto ativa' }));
    expect(onAddSecondaryTrigger).toHaveBeenCalledWith('enquanto_ativa');
    expect(onPickTrigger).not.toHaveBeenCalled();
  });

  it('com pendingConnection ativa, permite conectar um trigger como filho via onPick', () => {
    const onPick = vi.fn();
    render(<NodePalette pendingConnection={{ parentId: 'algum-id' }} {...baseProps} onPick={onPick} />);
    const buttons = screen.getAllByRole('button', { name: 'Enquanto ativa' });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onPick).toHaveBeenCalledWith('enquanto_ativa');
  });

  it('agrupa os blocos de Efeitos em subcategorias esperadas', () => {
    render(<NodePalette pendingConnection={{ parentId: 'x' }} {...baseProps} />);
    expect(screen.getByText('Combate')).toBeTruthy();
    expect(screen.getByText('Defesa')).toBeTruthy();
    expect(screen.getByText('Controle')).toBeTruthy();
    expect(screen.getAllByText('Forma').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Escudo' })).toBeTruthy();
  });
});
