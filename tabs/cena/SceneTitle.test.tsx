import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SceneTitle from './SceneTitle';
import { createDefaultCena } from '../../utils/cena';

afterEach(() => cleanup());

describe('SceneTitle', () => {
  it('mostra nome e subtítulo editáveis', () => {
    const scene = { ...createDefaultCena().scene, locationName: 'A FORTALEZA', subtitle: 'Soterrada' };
    render(<SceneTitle scene={scene} onSceneChange={() => {}} />);
    expect(screen.getByDisplayValue('A FORTALEZA')).toBeTruthy();
    expect(screen.getByDisplayValue('Soterrada')).toBeTruthy();
  });
  it('edita o clima', () => {
    const onSceneChange = vi.fn();
    render(<SceneTitle scene={createDefaultCena().scene} onSceneChange={onSceneChange} />);
    fireEvent.click(screen.getByTitle('storm'));
    expect(onSceneChange).toHaveBeenCalledWith({ weather: 'storm' });
  });
});
