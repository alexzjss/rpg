import React, { useState } from 'react';
import { Condition } from '../../../types';
import { getConditionIcon } from './conditionIconMap';

interface ConditionBadgesProps {
  conditions: Condition[];
}

const ConditionBadges: React.FC<ConditionBadgesProps> = ({ conditions }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (!conditions.length) return null;
  const visible = conditions.slice(0, 4);
  const overflow = conditions.length - 4;

  return (
    <div style={{
      position: 'absolute',
      bottom: -24,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      pointerEvents: 'auto',
      zIndex: 5,
    }}>
      {visible.map((cond, i) => {
        const Icon = getConditionIcon(cond.name);
        return (
          <div
            key={i}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: 'rgba(12,16,32,0.94)',
              border: '1px solid rgba(212,168,83,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'default',
            }}>
              <Icon size={8} color="rgba(212,168,83,0.85)" />
            </div>
            {hoveredIdx === i && (
              <div style={{
                position: 'absolute', bottom: 18, left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(8,10,24,0.97)',
                border: '1px solid rgba(212,168,83,0.3)',
                borderRadius: 4,
                padding: '3px 7px',
                whiteSpace: 'nowrap',
                fontSize: 9, fontWeight: 700,
                color: '#e8c878',
                zIndex: 300,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                pointerEvents: 'none',
              }}>
                {cond.name}{cond.duration > 0 ? ` (${cond.duration})` : ''}
              </div>
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(212,168,83,0.6)' }}>
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default ConditionBadges;
