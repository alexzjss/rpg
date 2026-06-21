import React from 'react';
import { Combatant, ActiveForma, Card, Item, PRESET_CONDITIONS } from '../../types';
import { PALETTE } from '../../utils/theme';
import ActionIconRail, { ActionCategory } from './ActionIconRail';

interface TurnOrderRowProps {
  combatant: Combatant;
  isActive: boolean;
  activeForms: ActiveForma[];
  cards: Card[];
  position: number;
  items: Item[];
  selectedCategory: ActionCategory | null;
  onSelectAction: (category: ActionCategory) => void;
}

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

const getBannerVisual = (combatant: Combatant, displayIcon?: string) => {
  const maybeVisual = combatant as any;
  return (
    maybeVisual.bannerUrl ||
    maybeVisual.bannerImage ||
    maybeVisual.banner ||
    maybeVisual.backgroundImage ||
    displayIcon ||
    ''
  );
};

const StatSlice: React.FC<{
  label: string;
  value: number;
  max: number;
  pct: number;
  color: string;
}> = ({ label, value, max, pct, color }) => (
  <div className="mp-turn-stat">
    <div className="mp-turn-stat__meta">
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
      <em>/{max}</em>
    </div>
    <div className="mp-turn-stat__track">
      <div
        className="mp-turn-stat__fill"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}88` }}
      />
    </div>
  </div>
);

const TurnOrderRow: React.FC<TurnOrderRowProps> = ({
  combatant,
  isActive,
  activeForms,
  cards,
  position,
  items,
  selectedCategory,
  onSelectAction,
}) => {
  const isDefeated = combatant.currentHp <= 0;
  const hpPct = combatant.maxHp > 0 ? clampPct((combatant.currentHp / combatant.maxHp) * 100) : 0;
  const apPct = combatant.maxAura > 0 ? clampPct((combatant.currentAura / combatant.maxAura) * 100) : 0;
  const hpColor = hpPct > 60 ? PALETTE.hpHigh : hpPct > 30 ? PALETTE.hpMid : PALETTE.hpLow;
  const teamColor = combatant.role === 'npc' ? PALETTE.teamNpc : PALETTE.teamCast;

  const activeForma = activeForms.find(f => f.combatantId === combatant.combatId);
  const hasFormaCard = !activeForma && !isDefeated &&
    combatant.cardIds.some(id => cards.find(c => c.id === id)?.type === 'forma');
  const displayIcon = activeForma?.iconOverride || combatant.icon;
  const formaColor = activeForma?.color ?? null;
  const bannerVisual = getBannerVisual(combatant, displayIcon);

  const conditions = combatant.conditions ?? [];
  const visibleConditions = conditions.slice(0, isActive ? 5 : 3);
  const extraCount = conditions.length - visibleConditions.length;

  return (
    <div
      className={`mp-turn-banner ${isActive ? 'mp-turn-banner--active' : ''} ${isDefeated ? 'mp-turn-banner--down' : ''}`}
      style={{
        ['--team-color' as any]: formaColor ?? teamColor,
        ['--hp-color' as any]: hpColor,
        ['--ap-color-local' as any]: PALETTE.apColor,
      }}
    >
      {bannerVisual ? (
        <img className="mp-turn-banner__image" src={bannerVisual} alt="" />
      ) : (
        <div
          className="mp-turn-banner__image"
          style={{
            background: `linear-gradient(120deg, ${teamColor}55, rgba(8,10,16,0.95) 58%, ${teamColor}22)`,
          }}
        />
      )}

      <div className="mp-turn-banner__veil" />
      {isActive && <div className="mp-turn-banner__active-stroke" />}
      {isDefeated && <div className="mp-turn-banner__slash" />}

      <div className="mp-turn-banner__position">
        <span>{position}</span>
      </div>

      <div className="mp-turn-banner__portrait">
        {displayIcon ? (
          <img src={displayIcon} alt="" />
        ) : (
          <div className="mp-turn-banner__portrait-empty">
            {combatant.role === 'npc' ? 'N' : 'P'}
          </div>
        )}
        {hasFormaCard && <div className="mp-turn-banner__forma-dot" />}
      </div>

      <div className="mp-turn-banner__content">
        <div className="mp-turn-banner__topline">
          <div className="mp-turn-banner__name-block">
            <span className="mp-turn-banner__role">
              {combatant.role === 'npc' ? 'NPC' : 'CAST'}
            </span>
            <strong className="mp-turn-banner__name">{combatant.name}</strong>
          </div>

          {conditions.length > 0 && (
            <div className="mp-turn-banner__conditions">
              {visibleConditions.map(cond => {
                const preset = PRESET_CONDITIONS.find(p => p.name === cond.name);
                return (
                  <span
                    key={cond.name}
                    title={`${cond.name} (${cond.duration})`}
                    style={{ borderColor: preset?.color ? `${preset.color}66` : undefined, color: preset?.color }}
                  >
                    {preset?.emoji ?? '!'}
                  </span>
                );
              })}
              {extraCount > 0 && <span>+{extraCount}</span>}
            </div>
          )}
        </div>

        <div className="mp-turn-banner__stats">
          <StatSlice label="HP" value={combatant.currentHp} max={combatant.maxHp} pct={hpPct} color={hpColor} />
          <StatSlice label="AP" value={combatant.currentAura} max={combatant.maxAura} pct={apPct} color={PALETTE.apColor} />
        </div>

        {isDefeated && (
          <div className="mp-turn-banner__down-label">Derrotado</div>
        )}

        {isActive && (
          <div className="mp-turn-banner__actions">
            <ActionIconRail
              combatant={combatant}
              activeForms={activeForms}
              cards={cards}
              items={items}
              selectedCategory={selectedCategory}
              onSelectAction={onSelectAction}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnOrderRow;
