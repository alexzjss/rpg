import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RosterPanel from './RosterPanel';
import { createDefaultCena, addNpcFromCharacter } from '../../utils/cena';
import type { Character } from '../../types';

afterEach(() => cleanup());

function fakeChar(id: string, over: Partial<Character> = {}): Character {
  return { id, name: `N-${id}`, icon: '', maxHp: 10, currentHp: 10, maxAura: 5, currentAura: 5,
    maxAmmo: 0, currentAmmo: 0, baseInitiative: 0, cardIds: [], conditions: [], items: [], role: 'npc', ...over };
}

describe('RosterPanel', () => {
  it('lista a party e seleciona um ativo ao clicar', () => {
    const onSelectActive = vi.fn();
    const party = [fakeChar('p1', { role: 'cast', name: 'Doravar' })];
    render(
      <RosterPanel party={party} npcRoster={[]} importable={[]} active={null}
        onSelectActive={onSelectActive} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByText('Doravar'));
    expect(onSelectActive).toHaveBeenCalledWith({ id: 'p1', side: 'party' });
  });

  it('na aba NPCs lista o roster e separa os ocultos', () => {
    let cena = addNpcFromCharacter(createDefaultCena(), fakeChar('a', { name: 'Guarda' }));
    cena = addNpcFromCharacter(cena, fakeChar('b', { name: 'Barão' }));
    cena.npcRoster[1].hidden = true;
    render(
      <RosterPanel party={[]} npcRoster={cena.npcRoster} importable={[]} active={null}
        onSelectActive={() => {}} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /npcs/i }));
    expect(screen.getByText('Guarda')).toBeTruthy();
    expect(screen.getByText('Barão')).toBeTruthy();
    expect(screen.getByText(/ocultos/i)).toBeTruthy();
  });

  it('o botão + importa um personagem importável', () => {
    const onImportNpc = vi.fn();
    render(
      <RosterPanel party={[]} npcRoster={[]} importable={[fakeChar('x', { name: 'Drone' })]} active={null}
        onSelectActive={() => {}} onImportNpc={onImportNpc} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /npcs/i }));
    fireEvent.click(screen.getByRole('button', { name: /adicionar npc/i }));
    fireEvent.click(screen.getByText('Drone'));
    expect(onImportNpc).toHaveBeenCalledWith('x');
  });

  it('integra iniciativa e edição rápida na lista de combatentes', () => {
    const onEditCharacter = vi.fn();
    const party = [fakeChar('p1', { role: 'cast', name: 'Doravar' }), fakeChar('p2', { role: 'cast', name: 'Elira' })];
    render(
      <RosterPanel party={party} npcRoster={[]} importable={[]} active={null} round={2}
        orderIds={['p1', 'p2']} currentTurnId="p1" onEditCharacter={onEditCharacter}
        onSelectActive={() => {}} onImportNpc={() => {}} onToggleHidden={() => {}}
        onTogglePresent={() => {}} onRemoveNpc={() => {}} />,
    );
    expect(screen.getByText('RODADA')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('AGORA')).toBeTruthy();
    const ring = document.querySelector('.cena-round-clock__ring') as HTMLElement;
    expect(ring.style.background).toContain('#d9b56f');
    // 2 combatentes na ordem, turno atual é o primeiro (índice 0) → 1 gomo aceso, 1 apagado
    expect((ring.style.background.match(/#d9b56f/g) ?? []).length).toBe(1);
    expect((ring.style.background.match(/#3a3f47/g) ?? []).length).toBe(1);
    fireEvent.doubleClick(screen.getByTitle(/doravar.*duplo clique/i));
    expect(onEditCharacter).toHaveBeenCalledWith('p1');
  });
});
