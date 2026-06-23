import React from 'react';
import { createPortal } from 'react-dom';
import type { TabId } from '../../utils/atmosphere';
import { NAV_DESTS, NAV_ORDER } from './navModel';
import { polar } from './ringGeometry';

const RADIUS = 130;

export function CommandWheel({ open, activeTab, onSelect, onClose }: {
  open: boolean; activeTab: TabId;
  onSelect: (id: TabId) => void; onClose: () => void;
}) {
  if (!open) return null;
  const step = 360 / NAV_ORDER.length;
  return createPortal(
    <div className="mp-cmdwheel" onClick={onClose} role="dialog" aria-label="Roda de comando">
      <div className="mp-cmdwheel__disc" onClick={(e) => e.stopPropagation()}>
        {NAV_ORDER.map((id, i) => {
          const d = NAV_DESTS[id];
          const Icon = d.icon;
          const p = polar(i * step, RADIUS);
          return (
            <button
              key={id}
              className="mp-cmdwheel__item"
              aria-current={activeTab === id}
              aria-label={d.label}
              title={d.label}
              style={{ transform: `translate(${p.x}px, ${p.y}px)`, animationDelay: `${i * 18}ms` }}
              onClick={() => { onSelect(id); onClose(); }}
            >
              <Icon className="w-6 h-6" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
