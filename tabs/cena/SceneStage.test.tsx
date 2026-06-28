import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SceneStage from './SceneStage';
import { createDefaultCena } from '../../utils/cena';
import type { Character } from '../../types';

afterEach(() => cleanup());

function fakeChar(over: Partial<Character> = {}): Character {
  return { id: 'a', name: 'Doravar', icon: '', maxHp: 20, currentHp: 14, maxAura: 8, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], ...over };
}

describe('SceneStage', () => {
  it('mostra o nome e subtítulo do local', () => {
    const scene = { ...createDefaultCena().scene, locationName: 'A Propriedade do Barão', subtitle: 'Sordane' };
    render(<SceneStage scene={scene} active={null} onSceneChange={() => {}} />);
    expect(screen.getByDisplayValue('A Propriedade do Barão')).toBeTruthy();
    expect(screen.getByDisplayValue('Sordane')).toBeTruthy();
  });

  it('mostra o personagem ativo em destaque com HP', () => {
    const scene = createDefaultCena().scene;
    render(<SceneStage scene={scene} active={fakeChar()} onSceneChange={() => {}} />);
    expect(screen.getByText('Doravar')).toBeTruthy();
    expect(screen.getByText('14/20')).toBeTruthy();
  });

  it('edita o nome do local pelo campo editável', () => {
    const onSceneChange = vi.fn();
    const scene = createDefaultCena().scene;
    render(<SceneStage scene={scene} active={null} onSceneChange={onSceneChange} />);
    const input = screen.getByDisplayValue(scene.locationName);
    fireEvent.change(input, { target: { value: 'Mina Profunda' } });
    expect(onSceneChange).toHaveBeenCalledWith({ locationName: 'Mina Profunda' });
  });
});
