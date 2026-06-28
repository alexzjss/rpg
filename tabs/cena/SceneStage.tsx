import React from 'react';
import type { Character } from '../../types';
import type { SceneState, SceneWeather } from '../../utils/cena';
import { ImagePickerButton } from '../../components/ui';

export interface SceneStageProps {
  scene: SceneState;
  /** Personagem (party ou NPC) atualmente ativo, ou null. */
  active: Character | null;
  onSceneChange: (partial: Partial<SceneState>) => void;
}

const WEATHERS: { id: SceneWeather; label: string }[] = [
  { id: 'sunny', label: '☀' }, { id: 'rain', label: '🌧' }, { id: 'storm', label: '⚡' },
  { id: 'fog', label: '🌫' }, { id: 'snow', label: '❄' }, { id: 'night', label: '🌙' },
];

function Bar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-base)', borderRadius: 4, overflow: 'hidden', minWidth: 90 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ color: 'var(--text-secondary)', minWidth: 44 }}>{current}/{max}</span>
    </div>
  );
}

const SceneStage: React.FC<SceneStageProps> = ({ scene, active, onSceneChange }) => {
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--border-mid)',
      background: scene.image
        ? `linear-gradient(180deg, rgba(10,8,6,0.45), rgba(10,8,6,0.85)), url(${scene.image}) center/cover`
        : 'radial-gradient(circle at 50% 120%, var(--bg-raised), var(--bg-base))' }}>

      <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 16px' }}>
        <input
          value={scene.locationName}
          onChange={e => onSceneChange({ locationName: e.target.value })}
          style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none',
            fontFamily: "'Cinzel', serif", fontSize: 26, letterSpacing: '0.1em', color: 'var(--text-primary)', width: '100%' }}
        />
        <input
          value={scene.subtitle}
          onChange={e => onSceneChange({ subtitle: e.target.value })}
          placeholder="subtítulo…"
          style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sec-accent)', width: '100%' }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {WEATHERS.map(w => (
            <button key={w.id} title={w.id} onClick={() => onSceneChange({ weather: w.id })}
              style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 13,
                background: scene.weather === w.id ? 'var(--sec-accent)' : 'var(--bg-surface)',
                border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ImagePickerButton value={scene.image} onUpdate={url => onSceneChange({ image: url })} label="Cena" compact placement="bottom-left" />
      </div>

      {active && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          background: 'rgba(10,8,6,0.7)', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '10px 18px', minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {active.icon
              ? <img src={active.icon} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-gold)' }} />
              : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-raised)', border: '1px solid var(--border-gold)' }} />}
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: 'var(--text-primary)' }}>{active.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <Bar label="HP" current={active.currentHp} max={active.maxHp} color="var(--ember)" />
            <Bar label="Aura" current={active.currentAura} max={active.maxAura} color="var(--sec-accent-2)" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneStage;
