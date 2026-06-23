import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TabId } from '../../utils/atmosphere';
import { NAV_DESTS, SATELLITES } from './navModel';
import { polar, satelliteAngles } from './ringGeometry';

const RADIUS = 104;
const ARC = 150;
const CLOSE_DELAY = 240;

export function MasterRing({ activeTab, mode, onSelect, onToggleMode }: {
  activeTab: TabId; mode: TabId;
  onSelect: (id: TabId) => void; onToggleMode: () => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);
  const openNow = useCallback(() => { clearClose(); setOpen(true); }, [clearClose]);
  const scheduleClose = useCallback(() => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }, [clearClose]);
  useEffect(() => () => clearClose(), [clearClose]);

  const angles = satelliteAngles(SATELLITES.length, ARC);
  const HubIcon = NAV_DESTS[mode].icon;

  const node = (
    <div
      className="mp-ring"
      role="tablist"
      aria-label="Navegação do Mestre"
      data-open={open}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      {SATELLITES.map((id, i) => {
        const d = NAV_DESTS[id];
        const Icon = d.icon;
        const p = polar(angles[i], RADIUS);
        const style: React.CSSProperties = open
          ? {
              transform: `translate(${p.x}px, ${p.y}px) scale(1)`,
              opacity: 1,
              pointerEvents: 'auto',
              transitionDelay: `${i * 22}ms`,
            }
          : {
              transform: 'translate(0px, 22px) scale(0.25)',
              opacity: 0,
              pointerEvents: 'none',
              transitionDelay: '0ms',
            };
        return (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-label={d.label}
            title={d.label}
            tabIndex={open ? 0 : -1}
            className="mp-ring__sat"
            style={style}
            onMouseEnter={openNow}
            onFocus={openNow}
            onClick={() => { onSelect(id); setOpen(false); }}
          >
            <Icon style={{ width: 18, height: 18 }} aria-hidden />
          </button>
        );
      })}
      <button
        role="tab"
        aria-selected={activeTab === mode}
        aria-expanded={open}
        aria-label={NAV_DESTS[mode].label}
        title={`${NAV_DESTS[mode].label} — clique para alternar Combate/Jornada · passe o mouse para ver as abas`}
        className="mp-ring__hub"
        data-mode={mode}
        onMouseEnter={openNow}
        onFocus={openNow}
        onClick={() => { onToggleMode(); openNow(); }}
      >
        <span key={mode} className="mp-ring__hub-face">
          <HubIcon style={{ width: 22, height: 22 }} aria-hidden />
        </span>
      </button>
    </div>
  );

  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}
