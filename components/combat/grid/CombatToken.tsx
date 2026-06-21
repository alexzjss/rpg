import React from 'react';
import { Skull } from 'lucide-react';
import {
  Combatant, ActiveForma, CombatantUnion,
  StatPopup, GridInteractionMode,
} from '../../../types';
import TokenBase from './TokenBase';
import TokenRing from './TokenRing';
import ConditionBadges from './ConditionBadges';
import StatPopups from './StatPopups';

interface CombatTokenProps {
  combatant: Combatant;
  isCurrent: boolean;
  isSelected: boolean;
  isDragSource: boolean;
  isImpacted: boolean;
  activeForma?: ActiveForma;
  union?: CombatantUnion;
  isUnionSelected: boolean;
  isAreaSelected: boolean;
  statPopups: StatPopup[];
  mode: 'master' | 'readOnly';
  interactionMode: GridInteractionMode;
  unionMode: boolean;
  displayPos: { x: number; y: number };
  onPointerDown?: (e: React.PointerEvent, combatId: string) => void;
  onClick?: (combatId: string) => void;
}

const CombatToken: React.FC<CombatTokenProps> = ({
  combatant: c,
  isCurrent, isSelected, isDragSource, isImpacted,
  activeForma, union, isUnionSelected, isAreaSelected,
  statPopups, mode, interactionMode, unionMode,
  displayPos, onPointerDown, onClick,
}) => {
  const isDefeated = c.currentHp <= 0;
  const teamColor = c.role === 'npc' ? '#dc2626' : '#c9983a';
  const formaColor = activeForma?.color ?? null;
  const hpPct = c.maxHp > 0 ? (c.currentHp / c.maxHp) * 100 : 0;

  const borderColor = isCurrent
    ? teamColor
    : formaColor
    ? formaColor
    : isAreaSelected
    ? '#fb923c'
    : isSelected
    ? 'rgba(52,211,153,0.8)'
    : 'rgba(255,255,255,0.12)';

  const boxShadow = isCurrent
    ? `0 0 24px ${teamColor}cc, 0 0 8px ${teamColor}66`
    : formaColor
    ? `0 0 20px ${formaColor}88`
    : isAreaSelected
    ? '0 0 20px rgba(234,88,12,0.7)'
    : isSelected
    ? '0 0 16px rgba(52,211,153,0.5)'
    : '0 4px 16px rgba(0,0,0,0.9)';

  const cursor = mode === 'readOnly'
    ? 'default'
    : interactionMode.type !== 'select'
    ? 'crosshair'
    : 'grab';

  const scale = isCurrent ? 1.22 : isSelected ? 1.1 : 1;
  const displayIcon = activeForma?.iconOverride || c.icon;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${displayPos.x}%`,
        top: `${displayPos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrent ? 22 : isSelected ? 21 : 20,
        opacity: isDragSource ? 0.2 : 1,
        cursor,
        userSelect: 'none',
        touchAction: 'none',
        transition: isDragSource
          ? 'none'
          : 'left 0.38s cubic-bezier(0.22,1,0.36,1), top 0.38s cubic-bezier(0.22,1,0.36,1)',
      }}
      className={isImpacted ? 'animate-impact' : ''}
      data-combat-token={c.combatId}
      onPointerDown={
        mode === 'master' && interactionMode.type === 'select'
          ? (e) => onPointerDown?.(e, c.combatId)
          : undefined
      }
      onClick={() => onClick?.(c.combatId)}
    >
      <div style={{
        position: 'relative',
        transform: `scale(${scale})`,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <TokenBase teamColor={teamColor} />
        <TokenRing
          isCurrent={isCurrent}
          isSelected={isSelected}
          teamColor={teamColor}
          formaColor={formaColor}
          unionColor={union?.color ?? null}
          isUnionSelected={isUnionSelected}
          isAreaSelected={isAreaSelected}
          unionMode={unionMode}
        />

        {/* Retrato */}
        <div style={{
          width: 'min(8vw,52px)', height: 'min(8vw,52px)',
          borderRadius: '50%', overflow: 'hidden',
          border: `${isCurrent ? 3 : 2}px solid ${borderColor}`,
          boxShadow,
          background: 'var(--bg-base)',
          filter: isDefeated
            ? 'grayscale(1) brightness(0.35)'
            : isDragSource
            ? 'brightness(0.4)'
            : 'none',
          transition: 'border 0.3s, box-shadow 0.3s, filter 0.2s',
          position: 'relative',
        }}>
          <img
            src={displayIcon || undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
          {isDefeated && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
            }}>
              <Skull style={{ width: '32%', height: '32%', color: 'rgba(248,113,113,0.85)' }} />
            </div>
          )}
        </div>

        {/* Barra HP */}
        <div style={{
          position: 'absolute', bottom: -5, left: '8%', right: '8%',
          height: 3, background: 'rgba(0,0,0,0.8)',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${Math.max(0, hpPct)}%`,
            background: hpPct <= 30 ? '#ef4444' : hpPct <= 60 ? '#eab308' : '#22c55e',
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Nome */}
        <div style={{
          position: 'absolute', bottom: -18, left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', fontSize: 8, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: isDefeated
            ? '#f87171'
            : isCurrent
            ? '#e8c878'
            : isSelected
            ? '#34d399'
            : 'rgba(255,255,255,0.4)',
          textShadow: '0 1px 5px rgba(0,0,0,1)',
          pointerEvents: 'none',
          animation: isDefeated ? 'defeated-pulse 1.4s ease-in-out infinite' : 'none',
        }}>
          {isDefeated ? 'DERROTADO' : c.name.split(' ')[0]}
        </div>

        <ConditionBadges conditions={c.conditions} />
        <StatPopups popups={statPopups} />

        {isImpacted && <div className="impact-shockwave" />}
      </div>
    </div>
  );
};

export default CombatToken;
