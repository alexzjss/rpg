import React from 'react';
import type { SceneState, SceneWeather } from '../../utils/cena';

export interface SceneTitleProps {
  scene: SceneState;
  onSceneChange: (partial: Partial<SceneState>) => void;
}

const WEATHERS: { id: SceneWeather; label: string }[] = [
  { id: 'sunny', label: '☀' }, { id: 'rain', label: '🌧' }, { id: 'storm', label: '⚡' },
  { id: 'fog', label: '🌫' }, { id: 'snow', label: '❄' }, { id: 'night', label: '🌙' },
];

const SceneTitle: React.FC<SceneTitleProps> = ({ scene, onSceneChange }) => (
  <div style={{ flex: 'none', background: 'linear-gradient(180deg,#101013,#0c0c0f)', border: '1px solid #1e1e24',
    borderRadius: 3, padding: '16px 22px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: '#E0102B' }} />
    <div style={{ textAlign: 'center' }}>
      <input value={scene.locationName} onChange={e => onSceneChange({ locationName: e.target.value })}
        style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none', width: '100%',
          fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 30, letterSpacing: '4px', color: '#f1f1f4', textTransform: 'uppercase' }} />
      <input value={scene.subtitle} onChange={e => onSceneChange({ subtitle: e.target.value })} placeholder="subtítulo…"
        style={{ background: 'transparent', border: 'none', textAlign: 'center', outline: 'none', width: '100%', marginTop: 3,
          fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '5px', color: '#E0102B', textTransform: 'uppercase' }} />
    </div>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
      {WEATHERS.map(w => (
        <button key={w.id} title={w.id} onClick={() => onSceneChange({ weather: w.id })}
          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16,
            background: scene.weather === w.id ? '#E0102B' : '#15151a',
            border: scene.weather === w.id ? 'none' : '1px solid #26262c', color: scene.weather === w.id ? '#fff' : '#7d7d85',
            clipPath: 'polygon(0 0,100% 0,100% 78%,78% 100%,0 100%)' }}>
          {w.label}
        </button>
      ))}
    </div>
  </div>
);

export default SceneTitle;
