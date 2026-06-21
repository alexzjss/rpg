import React, {
  useRef, useState, useCallback, useEffect,
} from 'react';
import {
  CombatState, Combatant, ActiveForma, CombatantUnion,
  StatPopup, GridInteractionMode, ToolbarMode, AoETemplate, FogState,
} from '../../../types';
import CombatToken from './CombatToken';
import GridSVGLayer, { svgPoint } from './GridSVGLayer';
import FogRevealOverlay from './FogRevealOverlay';
import ArenaToolbar from './ArenaToolbar';
import { correctedDist } from './aoeHelpers';

// ── Helper ───────────────────────────────────────────────────
function clampPos(p: { x: number; y: number }): { x: number; y: number } {
  return { x: Math.max(0, Math.min(100, p.x)), y: Math.max(0, Math.min(100, p.y)) };
}

function makeFog(density: number): FogState {
  return {
    density,
    revealed: Array.from({ length: density }, () => Array(density).fill(false) as boolean[]),
  };
}

// ── Props ────────────────────────────────────────────────────
interface CombatArenaProps {
  combat: CombatState;
  activeForms: ActiveForma[];
  mode: 'master' | 'readOnly';

  // Selection / targeting state (from App.tsx)
  selectedCombatantId?: string | null;
  interactionMode?: GridInteractionMode;
  areaSelectedTargets?: string[];
  statPopups?: StatPopup[];
  impactTargetId?: string | null;
  unionMode?: boolean;
  unionSelecting?: string[];

  // Callbacks (master only)
  onUpdateCombat?: (combat: CombatState) => void;
  onSelectCombatant?: (id: string | null) => void;
  onTargetCombatant?: (combatId: string) => void;
  onToggleAreaTarget?: (combatId: string) => void;
  onItemTargetCombatant?: (combatId: string) => void;
  onToggleUnionSelect?: (combatId: string) => void;
}

// ── Component ────────────────────────────────────────────────
const CombatArena: React.FC<CombatArenaProps> = ({
  combat, activeForms, mode,
  selectedCombatantId, interactionMode = { type: 'select' },
  areaSelectedTargets = [], statPopups = [], impactTargetId,
  unionMode = false, unionSelecting = [],
  onUpdateCombat, onSelectCombatant,
  onTargetCombatant, onToggleAreaTarget,
  onItemTargetCombatant, onToggleUnionSelect,
}) => {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaDims, setArenaDims] = useState({ w: 1000, h: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Drag state ───────────────────────────────────────────────
  const [dragState, setDragState] = useState<{
    combatId: string;
    startPos: { x: number; y: number };
    currentDelta: { x: number; y: number };
    deslocamento: number;
  } | null>(null);

  // ── Toolbar & tools ──────────────────────────────────────────
  const [toolbarMode, setToolbarMode] = useState<ToolbarMode>('none');
  const [fogEnabled, setFogEnabled] = useState(false);

  // ── Rulers ───────────────────────────────────────────────────
  const [rulers, setRulers] = useState<{ id: string; start: { x: number; y: number }; end: { x: number; y: number } }[]>([]);
  const [rulerDraft, setRulerDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

  // ── AoE preview ──────────────────────────────────────────────
  const [aoeAnchor, setAoeAnchor] = useState<{ x: number; y: number } | null>(null);
  const [aoeCursor, setAoeCursor] = useState<{ x: number; y: number } | null>(null);

  // ── ResizeObserver to track arena dimensions ─────────────────
  useEffect(() => {
    if (!arenaRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setArenaDims({ w: width, h: height });
    });
    ro.observe(arenaRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Fullscreen escape ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Fog helpers ──────────────────────────────────────────────
  const fog = combat.fog;
  const ensureFog = useCallback((): FogState =>
    fog ?? makeFog(20), [fog]);

  const revealAll = useCallback(() => {
    const f = ensureFog();
    onUpdateCombat?.({ ...combat, fog: { ...f, revealed: f.revealed.map(r => r.map(() => true)) } });
  }, [combat, ensureFog, onUpdateCombat]);

  const hideAll = useCallback(() => {
    const f = ensureFog();
    onUpdateCombat?.({ ...combat, fog: { ...f, revealed: f.revealed.map(r => r.map(() => false)) } });
  }, [combat, ensureFog, onUpdateCombat]);

  const toggleFog = useCallback(() => {
    if (!fogEnabled) {
      // Enable fog: ensure fog state exists
      if (!combat.fog) {
        onUpdateCombat?.({ ...combat, fog: makeFog(20) });
      }
    }
    setFogEnabled(v => !v);
    if (toolbarMode === 'fog-reveal' || toolbarMode === 'fog-hide') setToolbarMode('none');
  }, [fogEnabled, combat, onUpdateCombat, toolbarMode]);

  // ── Token click handler ──────────────────────────────────────
  const handleTokenClick = useCallback((combatId: string) => {
    if (mode === 'readOnly') return;
    if (interactionMode.type === 'target-single') {
      onTargetCombatant?.(combatId);
    } else if (interactionMode.type === 'target-area') {
      onToggleAreaTarget?.(combatId);
    } else if (interactionMode.type === 'item-target') {
      onItemTargetCombatant?.(combatId);
    } else if (interactionMode.type === 'union') {
      onToggleUnionSelect?.(combatId);
    } else {
      onSelectCombatant?.(selectedCombatantId === combatId ? null : combatId);
    }
  }, [mode, interactionMode, selectedCombatantId,
    onTargetCombatant, onToggleAreaTarget, onItemTargetCombatant,
    onToggleUnionSelect, onSelectCombatant]);

  // ── Drag handlers ────────────────────────────────────────────
  const handleTokenPointerDown = useCallback((e: React.PointerEvent, combatId: string) => {
    if (mode === 'readOnly' || interactionMode.type !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const combatant = combat.combatants.find(c => c.combatId === combatId);
    if (!combatant) return;
    setDragState({
      combatId,
      startPos: { ...combatant.pos },
      currentDelta: { x: 0, y: 0 },
      deslocamento: combatant.deslocamento ?? 6,
    });
  }, [mode, interactionMode, combat.combatants]);

  const handleArenaPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const dx = (e.movementX / rect.width) * 100;
    const dy = (e.movementY / rect.height) * 100;

    if (dragState) {
      setDragState(prev => prev ? {
        ...prev,
        currentDelta: { x: prev.currentDelta.x + dx, y: prev.currentDelta.y + dy },
      } : null);
    }
  }, [dragState]);

  const handleArenaPointerUp = useCallback(() => {
    if (!dragState) return;
    const newPos = clampPos({
      x: dragState.startPos.x + dragState.currentDelta.x,
      y: dragState.startPos.y + dragState.currentDelta.y,
    });

    const unions = combat.unions || [];
    const memberUnion = unions.find(u => u.combatantIds[0] === dragState.combatId);

    const newCombatants = combat.combatants.map(c => {
      if (c.combatId === dragState.combatId) return { ...c, pos: newPos };
      if (memberUnion?.combatantIds.includes(c.combatId)) {
        return { ...c, pos: clampPos({
          x: c.pos.x + dragState.currentDelta.x,
          y: c.pos.y + dragState.currentDelta.y,
        }) };
      }
      return c;
    });

    onUpdateCombat?.({ ...combat, combatants: newCombatants });
    setDragState(null);
  }, [dragState, combat, onUpdateCombat]);

  // ── SVG tool pointer handlers ────────────────────────────────
  const handleSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pt = svgPoint(e, e.currentTarget);

    if (toolbarMode === 'ruler') {
      setRulerDraft({ start: pt, end: pt });
    } else if (toolbarMode === 'aoe-circle' || toolbarMode === 'aoe-cone' || toolbarMode === 'aoe-line') {
      setAoeAnchor(pt);
      setAoeCursor(pt);
    }
  }, [toolbarMode]);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pt = svgPoint(e, e.currentTarget);

    if (toolbarMode === 'ruler' && rulerDraft) {
      setRulerDraft(prev => prev ? { ...prev, end: pt } : null);
    } else if (aoeAnchor) {
      setAoeCursor(pt);
    }
  }, [toolbarMode, rulerDraft, aoeAnchor]);

  const handleSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pt = svgPoint(e, e.currentTarget);

    if (toolbarMode === 'ruler' && rulerDraft) {
      setRulers(prev => [...prev, { id: Math.random().toString(36).slice(2), ...rulerDraft, end: pt }]);
      setRulerDraft(null);
    } else if (toolbarMode === 'aoe-circle' && aoeAnchor) {
      const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
      const r = correctedDist(aoeAnchor, pt, ar);
      const newT: AoETemplate = {
        id: Math.random().toString(36).slice(2),
        shape: 'circle', color: '#ef444466',
        x: aoeAnchor.x, y: aoeAnchor.y,
        radius: r, visibleToPlayers: true,
      };
      onUpdateCombat?.({ ...combat, aoeTemplates: [...(combat.aoeTemplates || []), newT] });
      setAoeAnchor(null); setAoeCursor(null);
    } else if (toolbarMode === 'aoe-cone' && aoeAnchor) {
      const dx = pt.x - aoeAnchor.x;
      const dy = pt.y - aoeAnchor.y;
      const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
      const len = correctedDist(aoeAnchor, pt, ar);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const newT: AoETemplate = {
        id: Math.random().toString(36).slice(2),
        shape: 'cone', color: '#f9730066',
        x: aoeAnchor.x, y: aoeAnchor.y,
        angle, arc: 60, length: len, visibleToPlayers: true,
      };
      onUpdateCombat?.({ ...combat, aoeTemplates: [...(combat.aoeTemplates || []), newT] });
      setAoeAnchor(null); setAoeCursor(null);
    } else if (toolbarMode === 'aoe-line' && aoeAnchor) {
      const dx = pt.x - aoeAnchor.x;
      const dy = pt.y - aoeAnchor.y;
      const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
      const len = correctedDist(aoeAnchor, pt, ar);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const newT: AoETemplate = {
        id: Math.random().toString(36).slice(2),
        shape: 'line', color: '#a855f766',
        x: aoeAnchor.x, y: aoeAnchor.y,
        angle, length: len, width: 5, visibleToPlayers: true,
      };
      onUpdateCombat?.({ ...combat, aoeTemplates: [...(combat.aoeTemplates || []), newT] });
      setAoeAnchor(null); setAoeCursor(null);
    }
  }, [toolbarMode, rulerDraft, aoeAnchor, aoeCursor, arenaDims, combat, onUpdateCombat]);

  // ── AoE preview object ───────────────────────────────────────
  const aoePreview = (() => {
    if (!aoeAnchor || !aoeCursor) return null;
    const ar = arenaDims.h > 0 ? arenaDims.w / arenaDims.h : 1;
    const dx = aoeCursor.x - aoeAnchor.x;
    const dy = aoeCursor.y - aoeAnchor.y;
    const len = correctedDist(aoeAnchor, aoeCursor, ar);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (toolbarMode === 'aoe-circle')
      return { shape: 'circle' as const, color: '#ef444440', x: aoeAnchor.x, y: aoeAnchor.y, radius: len };
    if (toolbarMode === 'aoe-cone')
      return { shape: 'cone' as const, color: '#f9730040', x: aoeAnchor.x, y: aoeAnchor.y, angle, arc: 60, length: len };
    if (toolbarMode === 'aoe-line')
      return { shape: 'line' as const, color: '#a855f740', x: aoeAnchor.x, y: aoeAnchor.y, angle, length: len, width: 5 };
    return null;
  })();

  // ── Derived display positions during drag ────────────────────
  const getDisplayPos = (c: Combatant): { x: number; y: number } => {
    const pos = c.pos ?? { x: 50, y: 50 };
    if (!dragState) return pos;
    if (dragState.combatId === c.combatId) {
      return clampPos({ x: c.pos.x + dragState.currentDelta.x, y: c.pos.y + dragState.currentDelta.y });
    }
    // Union members follow leader
    const unions = combat.unions || [];
    const memberUnion = unions.find(u => u.combatantIds[0] === dragState.combatId);
    if (memberUnion?.combatantIds.includes(c.combatId)) {
      return clampPos({ x: c.pos.x + dragState.currentDelta.x, y: c.pos.y + dragState.currentDelta.y });
    }
    return c.pos;
  };

  const svgToolActive = ['ruler', 'aoe-circle', 'aoe-cone', 'aoe-line'].includes(toolbarMode);

  return (
    <div
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined,
        flex: isFullscreen ? undefined : 1,
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        background: 'radial-gradient(ellipse at 42% 22%, rgba(38,26,8,0.95) 0%, rgba(4,6,14,0.98) 55%, rgba(2,4,10,1) 100%)',
        overflow: 'hidden',
      }}
      onPointerMove={handleArenaPointerMove}
      onPointerUp={handleArenaPointerUp}
    >
      {/* Atmospheric overlays */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.045, backgroundImage: 'radial-gradient(rgba(201,152,58,1) 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, rgba(201,152,58,0.09) 0%, transparent 50%)', zIndex: 1 }} />
      <div className="mp-battle-ghost mp-battle-ghost--arena" style={{ zIndex: 1 }}>COMBATE</div>
      <div className="mp-battle-stripes" />
      <div className="mp-battle-vignette" />
      <div className="mp-battle-top-slash" />
      <div className="mp-battle-bottom-fade" />

      {/* Toolbar (master only) */}
      {mode === 'master' && (
        <ArenaToolbar
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(v => !v)}
          gridVisible={combat.gridVisible ?? true}
          onToggleGrid={() => onUpdateCombat?.({ ...combat, gridVisible: !combat.gridVisible })}
          toolbarMode={toolbarMode}
          onSetMode={setToolbarMode}
          backgroundImage={combat.backgroundImage || ''}
          onSetBackground={url => onUpdateCombat?.({ ...combat, backgroundImage: url })}
          fogEnabled={fogEnabled}
          onToggleFog={toggleFog}
          onRevealAll={revealAll}
          onHideAll={hideAll}
          onOpenPlayerWindow={() => window.open('?view=player', 'vat-player', 'popup,width=1280,height=800')}
        />
      )}

      {/* Inner arena */}
      <div
        className="w-full h-full flex items-center justify-center overflow-auto no-scrollbar"
        style={{ padding: 16 }}
      >
        <div
          ref={arenaRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundImage: combat.backgroundImage
              ? `url(${combat.backgroundImage})`
              : 'none',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            borderRadius: 16,
            boxShadow: '0 0 0 2px rgba(212,168,83,0.18), 0 0 60px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.03)',
            overflow: 'hidden',
          }}
        >
          {/* Default bg when no image */}
          {!combat.backgroundImage && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #1e180e 0%, #100e08 100%)', borderRadius: 16 }} />
          )}

          {/* SVG layer (grid, AoE, range, rulers, fog) */}
          <GridSVGLayer
            combat={combat}
            arenaDims={arenaDims}
            dragState={dragState}
            rulers={rulers}
            rulerDraft={rulerDraft}
            aoePreview={aoePreview}
            showFog={fogEnabled && !!fog}
            fogMaskOpaque={mode === 'readOnly'}
            onSvgPointerDown={mode === 'master' && svgToolActive ? handleSvgPointerDown : undefined}
            onSvgPointerMove={mode === 'master' && svgToolActive ? handleSvgPointerMove : undefined}
            onSvgPointerUp={mode === 'master' && svgToolActive ? handleSvgPointerUp : undefined}
          />

          {/* Fog reveal overlay (master pincel) */}
          {mode === 'master' && fogEnabled && fog && (
            <FogRevealOverlay
              fog={fog}
              toolbarMode={toolbarMode}
              onFogChange={newFog => onUpdateCombat?.({ ...combat, fog: newFog })}
            />
          )}

          {/* Tokens */}
          {combat.combatants.map((c, i) => {
            const isCurrent = i === combat.turnIndex && combat.isActive;
            const isSelected = selectedCombatantId === c.combatId;
            const isImpacted = impactTargetId === c.combatId;
            const isDragSource = dragState?.combatId === c.combatId;
            const activeForma = activeForms.find(f => f.combatantId === c.combatId);
            const unions = combat.unions || [];
            const union = unions.find(u => u.combatantIds.includes(c.combatId));
            const isUnionSelected = unionSelecting.includes(c.combatId);
            const isAreaSelected = areaSelectedTargets.includes(c.combatId);
            const myPopups = statPopups.filter(p => p.combatId === c.combatId);

            return (
              <CombatToken
                key={c.combatId}
                combatant={c}
                isCurrent={isCurrent}
                isSelected={isSelected}
                isDragSource={!!isDragSource}
                isImpacted={!!isImpacted}
                activeForma={activeForma}
                union={union}
                isUnionSelected={isUnionSelected}
                isAreaSelected={isAreaSelected}
                statPopups={myPopups}
                mode={mode}
                interactionMode={interactionMode}
                unionMode={unionMode}
                displayPos={getDisplayPos(c)}
                onPointerDown={handleTokenPointerDown}
                onClick={handleTokenClick}
              />
            );
          })}

          {/* Grid size badge */}
          <div style={{
            position: 'absolute', bottom: 6, right: 8, zIndex: 35,
            background: 'rgba(8,10,16,0.7)',
            border: '1px solid rgba(212,168,83,0.12)',
            borderRadius: 6, padding: '2px 7px',
            fontSize: 8, fontWeight: 600,
            color: 'rgba(212,168,83,0.4)',
            fontFamily: "'JetBrains Mono',monospace",
            pointerEvents: 'none',
          }}>
            {(combat.gridDensity ?? 10)}×{(combat.gridDensity ?? 10)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombatArena;
