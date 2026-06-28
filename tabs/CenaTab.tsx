import React from 'react';
import type { Card, Character, Item, Seal, Weapon } from '../types';
import type { CenaState } from '../utils/cena';

export interface CenaTabProps {
  cena: CenaState;
  // Dados referenciados das abas existentes (fonte única)
  characters: Character[];
  cards: Card[];
  seals: Seal[];
  items: Item[];
  weapons: Weapon[];
  // Mutadores
  updateCena: (next: CenaState) => void;
  updateCharacterStats: (charId: string, updates: Partial<Character>) => void;
}

/**
 * Aba Cena — unifica exploração de jornada e combate (sem grid).
 * Fase 1: scaffold/placeholder. UI rica e combate chegam nas Fases 2 e 3.
 */
const CenaTab: React.FC<CenaTabProps> = ({ cena }) => {
  return (
    <section
      aria-label="Cena"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 8,
        color: 'var(--text-primary)',
      }}
    >
      <h2
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 28,
          letterSpacing: '0.1em',
          color: 'var(--text-primary)',
        }}
      >
        {cena.scene.locationName}
      </h2>
      {cena.scene.subtitle && (
        <p style={{ letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sec-accent)' }}>
          {cena.scene.subtitle}
        </p>
      )}
      <p style={{ color: 'var(--text-muted)' }}>Aba Cena — em construção (Fase 1).</p>
    </section>
  );
};

export default CenaTab;
