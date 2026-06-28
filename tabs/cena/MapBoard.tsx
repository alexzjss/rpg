import React from 'react';
import type { Character } from '../../types';

export interface MapBoardProps {
  image: string;
  participants: Character[];
  tokens: Record<string, { x: number; y: number }>;
  activeId: string | null;
  onMoveToken: (id: string, pos: { x: number; y: number }) => void;
  onSelect: (id: string) => void;
  combat?: boolean;
  enemyIds?: string[];
}

const DEFAULT_POS = { x: 50, y: 50 };

const MapBoard: React.FC<MapBoardProps> = ({ image, participants, tokens, activeId, onMoveToken, onSelect, combat = false, enemyIds = [] }) => {
  const boardRef = React.useRef<HTMLDivElement>(null);
  const dragId = React.useRef<string | null>(null);

  const posOf = (id: string, idx: number) => tokens[id] ?? { x: 20 + (idx * 12) % 60, y: DEFAULT_POS.y };

  const clientToPct = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragId.current) return;
      const pct = clientToPct(e.clientX, e.clientY);
      if (pct) onMoveToken(dragId.current, pct);
    };
    const onUp = () => { dragId.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onMoveToken]);

  return (
    <div ref={boardRef} style={{ flex: 1, minHeight: 0, position: 'relative', border: '1px solid #1e1e24', borderRadius: 3, overflow: 'hidden', background: '#08080a' }}>
      {image
        ? <div style={{ position: 'absolute', inset: 0, background: `url(${image}) center/cover` }} />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#55555c', fontFamily: "'Barlow Semi Condensed',sans-serif", letterSpacing: '2px', fontSize: 13 }}>SOLTE O MAPA DA CENA AQUI</div>}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(0,0,0,.7) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.12,
        background: 'linear-gradient(#fff 1px, transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '54px 54px' }} />
      {participants.map((p, idx) => {
        const pos = posOf(p.id, idx);
        const isActive = p.id === activeId;
        return (
          <div key={p.id} data-token-id={p.id}
            onMouseDown={() => { dragId.current = p.id; onSelect(p.id); }}
            title={p.name}
            style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
              width: 54, height: 54, borderRadius: '50%', cursor: 'grab', overflow: 'hidden',
              border: isActive ? '2px solid #E0102B' : '2px solid #34343c',
              boxShadow: isActive ? '0 0 18px rgba(224,16,43,.6)' : '0 2px 8px rgba(0,0,0,.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p.icon ? `url(${p.icon}) center/cover` : '#15151a' }}>
            {!p.icon && <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: isActive ? '#E0102B' : '#9a9aa1' }}>{p.name.charAt(0).toUpperCase()}</span>}
          </div>
        );
      })}
      {combat && (
        <>
          <div style={{ position: 'absolute', left: -40, bottom: -20, width: 560, height: 120,
            background: 'linear-gradient(100deg,#E0102B,#8a0a1c)', transform: 'rotate(-7deg)', opacity: 0.96,
            boxShadow: '0 8px 40px rgba(224,16,43,.5)', display: 'flex', alignItems: 'center', paddingLeft: 60, pointerEvents: 'none' }}>
            <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 46, letterSpacing: '3px', color: '#fff', textShadow: '3px 3px 0 #6a0816' }}>SHOWTIME</span>
          </div>
          {(() => {
            const enemyId = enemyIds.find(id => tokens[id]);
            const pos = enemyId ? tokens[enemyId] : null;
            if (!pos) return null;
            return (
              <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', width: 78, height: 78, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid #E0102B', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: -9, border: '2px dashed rgba(224,16,43,.5)', borderRadius: '50%' }} />
              </div>
            );
          })()}
        </>
      )}
      <div style={{ position: 'absolute', left: 12, bottom: 12, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: '2px', color: '#8a8a90', background: 'rgba(8,8,10,.6)', padding: '5px 9px', borderRadius: 2 }}>{combat ? 'CAMADA · COMBATE' : 'CAMADA · MESTRE'}</div>
    </div>
  );
};

export default MapBoard;
