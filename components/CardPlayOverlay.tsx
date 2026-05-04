import React, { useEffect, useState, useCallback } from 'react';
import { Zap, Target, Layers, X, Swords, Star } from 'lucide-react';
import { Card } from '../types';

interface CardPlayOverlayProps {
  card: Card | null;
  onUseOnTarget: () => void;   // selecionar alvo único
  onUseOnArea: () => void;     // usar em área total
  onUseSelf: () => void;       // auto-alvo
  onCancel: () => void;
}

const typeConfig: Record<string, { border: string; glow: string; bg: string; waveBg: string; label: string; labelColor: string }> = {
  ataque:  { border: '#ef4444', glow: 'rgba(239,68,68,0.8)',  bg: 'linear-gradient(165deg,rgba(45,8,8,0.99),rgba(55,12,12,0.97))',  waveBg: 'rgba(239,68,68,', label: 'ATK', labelColor: '#ef4444' },
  ação:    { border: '#eab308', glow: 'rgba(234,179,8,0.8)',  bg: 'linear-gradient(165deg,rgba(40,28,4,0.99),rgba(60,42,4,0.97))', waveBg: 'rgba(234,179,8,', label: 'AÇÃ', labelColor: '#eab308' },
  reação:  { border: '#3b82f6', glow: 'rgba(59,130,246,0.8)', bg: 'linear-gradient(165deg,rgba(5,12,40,0.99),rgba(8,18,55,0.97))', waveBg: 'rgba(59,130,246,', label: 'REA', labelColor: '#3b82f6' },
  reforço: { border: '#22c55e', glow: 'rgba(34,197,94,0.8)',  bg: 'linear-gradient(165deg,rgba(4,28,10,0.99),rgba(6,40,14,0.97))', waveBg: 'rgba(34,197,94,', label: 'REF', labelColor: '#22c55e' },
  vínculo: { border: '#e2e8f0', glow: 'rgba(226,232,240,0.8)', bg: 'linear-gradient(165deg,rgba(18,22,32,0.99),rgba(26,30,44,0.97))', waveBg: 'rgba(226,232,240,', label: 'VÍN', labelColor: '#e2e8f0' },
};

const CardPlayOverlay: React.FC<CardPlayOverlayProps> = ({ card, onUseOnTarget, onUseOnArea, onUseSelf, onCancel }) => {
  const [phase, setPhase] = useState<'enter' | 'display' | 'exiting'>('enter');

  useEffect(() => {
    if (!card) return;
    setPhase('enter');
    const t = setTimeout(() => setPhase('display'), 50);
    return () => clearTimeout(t);
  }, [card]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPhase('exiting');
    setTimeout(onCancel, 280);
  }, [onCancel]);

  const handleUseOnTarget = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPhase('exiting');
    setTimeout(onUseOnTarget, 200);
  }, [onUseOnTarget]);

  const handleUseSelf = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPhase('exiting');
    setTimeout(onUseSelf, 200);
  }, [onUseSelf]);

  const handleUseOnArea = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPhase('exiting');
    setTimeout(onUseOnArea, 200);
  }, [onUseOnArea]);

  if (!card) return null;
  const cfg = typeConfig[card.type] || typeConfig['ação'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9050,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: phase === 'exiting' ? 'rgba(2,4,14,0)' : 'rgba(2,4,14,0.88)',
        backdropFilter: 'blur(20px)',
        transition: 'background 0.28s ease',
        pointerEvents: 'auto',
      }}
      onClick={handleCancel}
    >
      <style>{`
        @keyframes cpo-wave1 {
          0%   { transform: scale(0.3); opacity: 0.7; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes cpo-wave2 {
          0%   { transform: scale(0.3); opacity: 0.5; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes cpo-wave3 {
          0%   { transform: scale(0.3); opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes cpo-card-pull {
          0%   { opacity:0; transform: translateY(180px) scale(0.55) rotate(-12deg); filter: blur(16px); }
          40%  { opacity:1; transform: translateY(-12px) scale(1.07) rotate(2deg); filter: blur(0); }
          60%  { transform: translateY(4px) scale(0.97) rotate(-1deg); }
          78%  { transform: translateY(-6px) scale(1.03) rotate(0.5deg); }
          100% { transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes cpo-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%     { transform: translateY(-8px) rotate(0.8deg); }
          66%     { transform: translateY(-4px) rotate(-0.5deg); }
        }
        @keyframes cpo-card-exit {
          0%   { transform: scale(1) translateY(0); opacity:1; filter:blur(0); }
          100% { transform: scale(0.7) translateY(60px); opacity:0; filter:blur(12px); }
        }
        @keyframes cpo-btn-in {
          0%   { opacity:0; transform: scale(0.5) translateY(20px); }
          70%  { transform: scale(1.08) translateY(-2px); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes cpo-btn-pulse {
          0%,100% { box-shadow: 0 0 16px var(--btn-glow); }
          50%     { box-shadow: 0 0 40px var(--btn-glow), 0 0 80px var(--btn-glow-2); }
        }
        @keyframes cpo-cancel-in {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cpo-label-in {
          from { opacity:0; transform:translateY(-6px) scaleX(0.7); }
          to   { opacity:0.75; transform:translateY(0) scaleX(1); }
        }
        @keyframes cpo-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Waves pulsing around card */}
      {phase === 'display' && (
        <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: 320, height: 320, borderRadius: '50%',
              border: `2px solid ${cfg.waveBg}${i === 1 ? '0.45)' : i === 2 ? '0.28)' : '0.15)'}`,
              animation: `cpo-wave${i} 2.4s ${(i - 1) * 0.5}s ease-out infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Card container */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          animation: phase === 'enter' ? 'cpo-card-pull 0.7s cubic-bezier(0.22,1,0.36,1) both'
            : phase === 'display' ? 'cpo-float 4s ease-in-out infinite'
            : 'cpo-card-exit 0.28s ease-in both',
        }}
      >
        {/* Aura glow */}
        <div style={{
          position: 'absolute', inset: -30, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${cfg.glow} 0%, transparent 68%)`,
          filter: 'blur(24px)', pointerEvents: 'none',
          opacity: 0.7,
        }} />

        {/* Card itself */}
        <div style={{
          width: 256, height: 368, borderRadius: 20,
          background: cfg.bg,
          border: `2.5px solid ${cfg.border}`,
          boxShadow: `0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glow}55, 0 40px 80px rgba(0,0,0,0.95)`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
        }}>
          {/* Top shimmer bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4, zIndex: 2,
            background: `linear-gradient(90deg,transparent,${cfg.border},rgba(255,255,255,0.9),${cfg.border},transparent)`,
            backgroundSize: '200%',
            animation: 'cpo-shimmer 2s linear infinite',
          }} />

          {/* Header */}
          <div style={{
            padding: '10px 14px 8px',
            background: `${cfg.border}18`,
            borderBottom: `1px solid ${cfg.border}44`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: cfg.border, padding: '2px 8px', borderRadius: 5,
                background: `${cfg.border}18`, border: `1px solid ${cfg.border}55`,
              }}>{cfg.label}</span>
              {card.isAreaEffect && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#fb923c',
                  background: 'rgba(234,88,12,0.2)', border: '1px solid rgba(234,88,12,0.4)',
                  borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>💥 Área</span>
              )}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 900,
              color: '#67e8f9', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 7px',
              border: '1px solid rgba(103,232,249,0.22)',
            }}>
              <Zap style={{ width: 9, height: 9 }} />
              {card.auraCost}
            </div>
          </div>

          {/* Image */}
          <div style={{ height: 148, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            {card.image
              ? <img src={card.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: `radial-gradient(ellipse at 50% 40%,${cfg.border}22,rgba(0,0,0,0.8))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star style={{ width: 40, height: 40, color: cfg.border, opacity: 0.4 }} />
              </div>
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.7),transparent 50%)' }} />
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
            <p style={{
              fontSize: 14, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic',
              color: '#fff', letterSpacing: '0.04em', textShadow: `0 0 18px ${cfg.border}`,
              textAlign: 'center',
            }}>{card.name}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace", textAlign: 'center' }}>{card.diceRoll}</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(card.damage ?? 0) > 0 && (
                <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, padding: '2px 8px' }}>⚔ {card.damage}</span>
              )}
              {(card.dc ?? 0) > 0 && (
                <span style={{ fontSize: 10, color: '#e8c878', fontWeight: 700, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 5, padding: '2px 8px' }}>CD {card.dc}</span>
              )}
              {card.conditionEffect && (
                <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 5, padding: '2px 8px' }}>✦ {card.conditionEffect}</span>
              )}
            </div>
            {card.description && (
              <p style={{
                fontSize: 9.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.55, fontStyle: 'italic',
                textAlign: 'center', overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              } as React.CSSProperties}>{card.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {phase === 'display' && (
        <div style={{
          display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center',
          position: 'relative', zIndex: 9960, pointerEvents: 'auto',
        }} onClick={e => e.stopPropagation()}>

          {/* Usar em alvo */}
          <button
            onClick={handleUseOnTarget}
            style={{
              padding: '12px 22px',
              borderRadius: 16,
              background: `linear-gradient(135deg, ${cfg.border}33, ${cfg.border}18)`,
              border: `1.5px solid ${cfg.border}`,
              color: cfg.labelColor,
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              animation: 'cpo-btn-in 0.45s 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
              '--btn-glow': cfg.glow,
              '--btn-glow-2': cfg.glow,
              boxShadow: `0 0 20px ${cfg.glow}55`,
              position: 'relative', zIndex: 1,
            } as React.CSSProperties}
          >
            <Target style={{ width: 14, height: 14 }} />
            {card.isAreaEffect ? 'Alvos Específicos' : 'Usar no Alvo'}
          </button>

          {/* Usar em área - apenas se for carta de área */}
          {card.isAreaEffect && (
            <button
              onClick={handleUseOnArea}
              style={{
                padding: '12px 22px',
                borderRadius: 16,
                background: 'linear-gradient(135deg,rgba(234,88,12,0.28),rgba(180,60,8,0.18))',
                border: '1.5px solid rgba(234,88,12,0.7)',
                color: '#fb923c',
                fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                animation: 'cpo-btn-in 0.45s 0.52s cubic-bezier(0.34,1.56,0.64,1) both',
                boxShadow: '0 0 20px rgba(234,88,12,0.4)',
                '--btn-glow': 'rgba(234,88,12,0.5)',
                '--btn-glow-2': 'rgba(234,88,12,0.3)',
              } as React.CSSProperties}
            >
              <Layers style={{ width: 14, height: 14 }} />
              Área Total
            </button>
          )}

          {/* Usar em si mesmo */}
          <button
            onClick={handleUseSelf}
            style={{
              padding: '12px 22px',
              borderRadius: 16,
              background: 'linear-gradient(135deg,rgba(212,168,83,0.22),rgba(160,120,40,0.14))',
              border: '1.5px solid rgba(212,168,83,0.55)',
              color: '#d4a853',
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              animation: 'cpo-btn-in 0.45s 0.62s cubic-bezier(0.34,1.56,0.64,1) both',
              boxShadow: '0 0 16px rgba(212,168,83,0.2)',
            } as React.CSSProperties}
          >
            <Swords style={{ width: 14, height: 14 }} />
            Auto-Alvo
          </button>
        </div>
      )}

      {/* Cancel button — sempre visível e no canto */}
      <button
        onClick={handleCancel}
        style={{
          position: 'fixed',
          top: 20, right: 20,
          zIndex: 9999,
          padding: '10px 18px',
          borderRadius: 14,
          background: 'rgba(20,8,8,0.9)',
          border: '1.5px solid rgba(220,38,38,0.6)',
          color: '#f87171',
          fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 20px rgba(220,38,38,0.25)',
          animation: 'cpo-cancel-in 0.35s 0.2s both',
        }}
      >
        <X style={{ width: 13, height: 13 }} />
        Cancelar
      </button>

      {/* Bottom label */}
      {phase === 'display' && (
        <div style={{
          marginTop: 18,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.45em',
          color: cfg.labelColor, textTransform: 'uppercase',
          animation: 'cpo-label-in 0.4s 0.6s both',
        }}>
          ◆ escolha uma ação ◆
        </div>
      )}
    </div>
  );
};

export default CardPlayOverlay;
