import React from 'react';
import type { TabId } from '../../utils/atmosphere';
import { NAV_DESTS, SATELLITES } from './navModel';
import { polar, satelliteAngles } from './ringGeometry';

const RADIUS = 132;
const ARC = 160;

export function MasterRing({ activeTab, mode, onSelect, onToggleMode }: {
  activeTab: TabId; mode: TabId;
  onSelect: (id: TabId) => void; onToggleMode: () => void;
}) {
  const angles = satelliteAngles(SATELLITES.length, ARC);
  const HubIcon = NAV_DESTS[mode].icon;
  return (
    <div className="mp-ring" role="tablist" aria-label="Navegação do Mestre">
      {SATELLITES.map((id, i) => {
        const d = NAV_DESTS[id];
        const Icon = d.icon;
        const p = polar(angles[i], RADIUS);
        return (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-label={d.label}
            title={d.label}
            className="mp-ring__sat"
            style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
            onClick={() => onSelect(id)}
          >
            <Icon className="w-5 h-5" aria-hidden />
          </button>
        );
      })}
      <button
        role="tab"
        aria-selected={activeTab === mode}
        aria-label={NAV_DESTS[mode].label}
        title={`${NAV_DESTS[mode].label} — clique para alternar`}
        className="mp-ring__hub"
        data-mode={mode}
        onClick={onToggleMode}
      >
        <HubIcon className="w-7 h-7" aria-hidden />
      </button>
    </div>
  );
}
