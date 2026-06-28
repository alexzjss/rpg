import React from 'react';
import type { Card, Seal, Weapon } from '../../types';
import type { ResolvedItem } from '../../utils/items';

const shell: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
  background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 14, overflow: 'hidden',
};
const header: React.CSSProperties = {
  padding: '6px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'var(--text-muted)', borderBottom: '1px solid var(--border-faint)',
};
const body: React.CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' };
const empty: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: 6 };

interface ChipProps { name: string; image?: string; badge?: string }

const Chip: React.FC<ChipProps> = ({ name, image, badge }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 9,
      background: 'var(--bg-raised)', border: '1px solid var(--border-faint)', fontSize: 12, color: 'var(--text-primary)' }}>
      {image
        ? <img src={image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
        : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sec-accent)' }} />}
      <span>{name}</span>
      {badge && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{badge}</span>}
    </div>
  );
};

export const SealsPanel: React.FC<{ seals: Seal[] }> = ({ seals }) => (
  <div style={shell}>
    <div style={header}>Selos</div>
    <div style={body}>
      {seals.length === 0
        ? <p style={empty}>Nenhum selo.</p>
        : seals.map(s => <Chip key={s.id} name={s.name} image={s.image} />)}
    </div>
  </div>
);

export const ActionsPanel: React.FC<{ cards: Card[]; items: ResolvedItem[]; weapons: Weapon[] }> = ({ cards, items, weapons }) => {
  const isEmpty = cards.length === 0 && items.length === 0 && weapons.length === 0;
  return (
    <div style={shell}>
      <div style={header}>Ações · Cartas · Itens</div>
      <div style={body}>
        {isEmpty
          ? <p style={empty}>Sem ações disponíveis.</p>
          : (
            <>
              {cards.map(c => <Chip key={`c-${c.id}`} name={c.name} image={c.image} badge={c.auraCost ? `${c.auraCost}✦` : undefined} />)}
              {weapons.map(w => <Chip key={`w-${w.id}`} name={w.name} image={w.image} />)}
              {items.map(i => <Chip key={`i-${i.id}`} name={i.name} image={i.image} badge={`×${i.quantity}`} />)}
            </>
          )}
      </div>
    </div>
  );
};
