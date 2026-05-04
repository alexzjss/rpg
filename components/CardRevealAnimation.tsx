import React, { useEffect, useState, useCallback } from 'react';
import { Zap, Shield, Swords, Star, X } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */
export type CardElement = 'fogo' | 'água' | 'terra' | 'vento' | 'raio';

export interface CardAnimPayload {
  attackCard: {
    name: string;
    image?: string;
    type: string;
    auraCost: number;
    diceRoll: string;
    damage?: number;
    conditionEffect?: string;
    element?: CardElement;
  };
  attacker: { name: string; icon?: string };
  target?: { name: string; icon?: string };
  areaTargets?: { name: string; icon?: string }[];
  attackRoll: { total: number; notation: string; individualRolls: number[]; numSides: number; bonus: number };
  reactionCard?: {
    name: string;
    image?: string;
    type: string;
    auraCost: number;
    diceRoll: string;
  };
  reactionRoll?: { total: number; notation: string; individualRolls: number[]; numSides: number };
  isSuccess: boolean;
  isCrit?: boolean;
  isFumble?: boolean;
}

interface Props {
  payload: CardAnimPayload | null;
  onComplete: () => void;
}

/* ─── Element configs ───────────────────────────────────────────── */
const elementConfig: Record<CardElement, {
  primary: string; secondary: string; glow: string; emoji: string; label: string;
}> = {
  fogo:  { primary: '#ef4444', secondary: '#f97316', glow: 'rgba(239,68,68,0.8)',   emoji: '🔥', label: 'FOGO'  },
  água:  { primary: '#3b82f6', secondary: '#06b6d4', glow: 'rgba(59,130,246,0.8)',  emoji: '💧', label: 'ÁGUA'  },
  terra: { primary: '#92400e', secondary: '#a16207', glow: 'rgba(146,64,14,0.8)',   emoji: '🪨', label: 'TERRA' },
  vento: { primary: '#86efac', secondary: '#6ee7b7', glow: 'rgba(134,239,172,0.7)', emoji: '🍃', label: 'VENTO' },
  raio:  { primary: '#facc15', secondary: '#fbbf24', glow: 'rgba(250,204,21,0.9)',  emoji: '⚡', label: 'RAIO'  },
};

/* ─── Type configs ───────────────────────────────────────────────── */
const typeColor: Record<string, {
  border: string; glow: string; label: string; headerBg: string;
  auraColor: string; auraGlow: string; auraLabel: string;
  impactBg: string; impactRingColor: string;
  wavePrimary: string; flyColor: string;
}> = {
  ataque: {
    border: '#ef4444', glow: 'rgba(239,68,68,0.75)', label: 'ATK',
    headerBg: 'rgba(239,68,68,0.18)',
    auraColor: 'rgba(239,68,68,0.22)', auraGlow: '#ef4444', auraLabel: 'IMPACTO',
    impactBg: 'radial-gradient(ellipse at center, rgba(239,68,68,0.38) 0%, rgba(180,20,20,0.12) 40%, transparent 70%)',
    impactRingColor: '#ef4444', wavePrimary: 'rgba(239,68,68,0.6)', flyColor: '#ef4444',
  },
  ação: {
    border: '#eab308', glow: 'rgba(234,179,8,0.75)', label: 'AÇÃ',
    headerBg: 'rgba(234,179,8,0.18)',
    auraColor: 'rgba(234,179,8,0.18)', auraGlow: '#eab308', auraLabel: 'EXECUTADO',
    impactBg: 'radial-gradient(ellipse at center, rgba(234,179,8,0.32) 0%, rgba(160,120,0,0.1) 40%, transparent 70%)',
    impactRingColor: '#eab308', wavePrimary: 'rgba(234,179,8,0.6)', flyColor: '#eab308',
  },
  reação: {
    border: '#3b82f6', glow: 'rgba(59,130,246,0.75)', label: 'REA',
    headerBg: 'rgba(59,130,246,0.18)',
    auraColor: 'rgba(59,130,246,0.18)', auraGlow: '#3b82f6', auraLabel: 'ANULADO',
    impactBg: 'radial-gradient(ellipse at center, rgba(59,130,246,0.38) 0%, rgba(20,60,180,0.12) 40%, transparent 70%)',
    impactRingColor: '#3b82f6', wavePrimary: 'rgba(59,130,246,0.6)', flyColor: '#3b82f6',
  },
  reforço: {
    border: '#22c55e', glow: 'rgba(34,197,94,0.75)', label: 'REF',
    headerBg: 'rgba(34,197,94,0.18)',
    auraColor: 'rgba(34,197,94,0.18)', auraGlow: '#22c55e', auraLabel: 'REFORÇADO',
    impactBg: 'radial-gradient(ellipse at center, rgba(34,197,94,0.35) 0%, rgba(10,120,50,0.1) 40%, transparent 70%)',
    impactRingColor: '#22c55e', wavePrimary: 'rgba(34,197,94,0.6)', flyColor: '#22c55e',
  },
  vínculo: {
    border: '#e2e8f0', glow: 'rgba(226,232,240,0.75)', label: 'VÍN',
    headerBg: 'rgba(226,232,240,0.18)',
    auraColor: 'rgba(226,232,240,0.18)', auraGlow: '#e2e8f0', auraLabel: 'VINCULADO',
    impactBg: 'radial-gradient(ellipse at center, rgba(226,232,240,0.32) 0%, rgba(100,110,130,0.1) 40%, transparent 70%)',
    impactRingColor: '#e2e8f0', wavePrimary: 'rgba(226,232,240,0.5)', flyColor: '#e2e8f0',
  },
  combinação: {
    border: '#c084fc', glow: 'rgba(192,132,252,0.85)', label: 'CMB',
    headerBg: 'rgba(192,132,252,0.18)',
    auraColor: 'rgba(192,132,252,0.18)', auraGlow: '#c084fc', auraLabel: 'COMBINAÇÃO',
    impactBg: 'radial-gradient(ellipse at center, rgba(192,132,252,0.45) 0%, rgba(120,40,200,0.15) 40%, transparent 70%)',
    impactRingColor: '#c084fc', wavePrimary: 'rgba(192,132,252,0.7)', flyColor: '#c084fc',
  },
  forma: {
    border: '#f59e0b', glow: 'rgba(245,158,11,0.85)', label: 'FRM',
    headerBg: 'rgba(245,158,11,0.18)',
    auraColor: 'rgba(245,158,11,0.18)', auraGlow: '#f59e0b', auraLabel: 'FORMA ATIVA',
    impactBg: 'radial-gradient(ellipse at center, rgba(245,158,11,0.45) 0%, rgba(180,100,0,0.15) 40%, transparent 70%)',
    impactRingColor: '#f59e0b', wavePrimary: 'rgba(245,158,11,0.7)', flyColor: '#f59e0b',
  },
};

function getDieGlow(sides: number) {
  if (sides <= 6)  return { border: '#3b82f6', glow: 'rgba(59,130,246,0.8)',  bg: '#1e3a5f' };
  if (sides <= 8)  return { border: '#22c55e', glow: 'rgba(34,197,94,0.8)',   bg: '#1a2e1a' };
  if (sides <= 10) return { border: '#ef4444', glow: 'rgba(239,68,68,0.8)',   bg: '#2e1a1a' };
  if (sides <= 12) return { border: '#a855f7', glow: 'rgba(168,85,247,0.8)',  bg: '#1e1a2e' };
  return               { border: '#f59e0b', glow: 'rgba(245,158,11,0.8)',  bg: '#1a1510' };
}

/* ─── Element effect: CSS glow + floating emojis (reliable, no CSS var issues) ─── */
const ELEMENT_EMOJI_SETS: Record<CardElement, string[]> = {
  fogo:  ['🔥','🔥','💥','✨','🔥'],
  água:  ['💧','💧','🌊','❄️','💧'],
  terra: ['🪨','🌿','💫','🪨','🌱'],
  vento: ['🍃','🍃','💨','🌀','🍃'],
  raio:  ['⚡','⚡','✨','💛','⚡'],
};

const ElementEffect: React.FC<{ element: CardElement; size?: number }> = ({ element, size = 200 }) => {
  const el = elementConfig[element];
  const emojis = ELEMENT_EMOJI_SETS[element];
  const glowClass = `el-glow-${element === 'água' ? 'agua' : element}`;

  return (
    <div style={{ position:'absolute', inset: -size/2, pointerEvents:'none', zIndex:0 }}>
      {/* Central radial glow */}
      <div
        className={glowClass}
        style={{
          position:'absolute', inset:0,
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${el.glow} 0%, transparent 70%)`,
          borderRadius:'50%',
          filter:'blur(12px)',
        }}
      />
      {/* Floating emojis around center */}
      {emojis.map((em, i) => {
        const angle = (i / emojis.length) * 360;
        const r = size * 0.32;
        const ex = Math.cos((angle * Math.PI) / 180) * r;
        const ey = Math.sin((angle * Math.PI) / 180) * r;
        const dur = 1.6 + i * 0.35;
        const delay = i * 0.18;
        return (
          <div
            key={i}
            className="el-emoji-float"
            style={{
              position:'absolute',
              left: `calc(50% + ${ex}px)`,
              top: `calc(50% + ${ey}px)`,
              transform:'translate(-50%,-50%)',
              fontSize: 18 + (i % 3) * 4,
              opacity: 0.85,
              animationDuration:`${dur}s`,
              animationDelay:`${delay}s`,
              filter:`drop-shadow(0 0 8px ${el.primary})`,
            }}
          >
            {em}
          </div>
        );
      })}
      {/* Secondary smaller emojis */}
      {emojis.slice(0,3).map((em, i) => {
        const angle = (i / 3) * 360 + 60;
        const r = size * 0.20;
        const ex = Math.cos((angle * Math.PI) / 180) * r;
        const ey = Math.sin((angle * Math.PI) / 180) * r;
        return (
          <div
            key={`s-${i}`}
            className="el-emoji-float"
            style={{
              position:'absolute',
              left: `calc(50% + ${ex}px)`,
              top: `calc(50% + ${ey}px)`,
              transform:'translate(-50%,-50%)',
              fontSize: 12,
              opacity: 0.55,
              animationDuration:`${2.2 + i * 0.4}s`,
              animationDelay:`${0.4 + i * 0.25}s`,
              filter:`drop-shadow(0 0 4px ${el.primary})`,
            }}
          >
            {em}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Mini card ──────────────────────────────────────────────────── */
const CardFace: React.FC<{
  card: CardAnimPayload['attackCard'];
  scale?: number;
  glowOverride?: string;
  style?: React.CSSProperties;
  shake?: boolean;
  grayscale?: boolean;
}> = ({ card, scale = 1, glowOverride, style, shake, grayscale }) => {
  const cfg = typeColor[card.type] || typeColor['ação'];
  const elCfg = card.element ? elementConfig[card.element] : null;
  const W = Math.round(160 * scale);
  const H = Math.round(230 * scale);
  const border = glowOverride ?? (elCfg ? elCfg.primary : cfg.border);
  const glowColor = glowOverride ?? (elCfg ? elCfg.glow : cfg.glow);
  return (
    <div style={{
      width: W, height: H, borderRadius: 16 * scale,
      background: 'linear-gradient(165deg,rgba(14,11,6,0.98),rgba(20,16,10,0.97))',
      border: `${2 * scale}px solid ${border}`,
      boxShadow: `0 0 ${40 * scale}px ${glowColor}, 0 ${24 * scale}px ${60 * scale}px rgba(0,0,0,0.9)`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, position: 'relative',
      animation: shake ? 'ca-card-slam 0.45s cubic-bezier(0.22,1,0.36,1) both' : undefined,
      filter: grayscale ? 'grayscale(1) brightness(0.45)' : undefined,
      ...style,
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height: 3 * scale,
        background: `linear-gradient(90deg,transparent,${border},rgba(255,255,255,0.8),${border},transparent)`,
        animation: 'ca-shimmer 2s linear infinite',
        backgroundSize: '200% 100%',
      }} />
      <div style={{ padding: `${8*scale}px ${10*scale}px ${6*scale}px`, background: cfg.headerBg,
        borderBottom: `1px solid ${border}44`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 4*scale }}>
          <span style={{ fontSize: 9*scale, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em',
            color: border, padding:`${2*scale}px ${6*scale}px`, borderRadius:4*scale,
            background:`${border}18`, border:`1px solid ${border}55` }}>{cfg.label}</span>
          {elCfg && (
            <span style={{ fontSize: 8*scale, fontWeight:900, color: elCfg.primary,
              padding:`${1*scale}px ${5*scale}px`, borderRadius:4*scale,
              background:`${elCfg.primary}18`, border:`1px solid ${elCfg.primary}44` }}>
              {elCfg.emoji}
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:10*scale, fontWeight:900,
          fontFamily:"'JetBrains Mono',monospace", color:'#67e8f9',
          background:'rgba(0,0,0,0.6)', borderRadius:5*scale, padding:`${1*scale}px ${5*scale}px`,
          border:'1px solid rgba(103,232,249,0.2)' }}>
          <Zap style={{ width:7*scale, height:7*scale }} />{card.auraCost}
        </div>
      </div>
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {card.image
          ? <img src={card.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse at 50% 40%,${cfg.headerBg},rgba(0,0,0,0.8))` }} />
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(0,0,0,0.7),transparent 50%)' }} />
      </div>
      <div style={{ padding:`${7*scale}px ${8*scale}px ${8*scale}px`, flexShrink:0 }}>
        <p style={{ fontSize:11*scale, fontWeight:900, textTransform:'uppercase', fontStyle:'italic',
          color:'#fff', lineHeight:1.2, letterSpacing:'0.03em', textAlign:'center',
          textShadow:`0 0 16px ${border}` }}>{card.name}</p>
        <p style={{ fontSize:8*scale, color:'rgba(255,255,255,0.3)', fontFamily:"'JetBrains Mono',monospace",
          textAlign:'center', marginTop: 3*scale }}>{card.diceRoll}</p>
      </div>
    </div>
  );
};

/* ─── Die face ───────────────────────────────────────────────────── */
const DieFace: React.FC<{ sides: number; value: number; size: number; rolling?: boolean; isCrit?: boolean; isFumble?: boolean }> = ({
  sides, value, size, rolling, isCrit, isFumble
}) => {
  const dc = getDieGlow(sides);
  const border = isCrit ? '#facc15' : isFumble ? '#ef4444' : dc.border;
  const glow = isCrit ? 'rgba(250,204,21,0.9)' : isFumble ? 'rgba(239,68,68,0.8)' : dc.glow;
  const textColor = isCrit ? '#facc15' : isFumble ? '#fca5a5' : '#fff';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.2,
      background: dc.bg, border: `3px solid ${border}`,
      boxShadow: `0 0 ${rolling ? 12 : 32}px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
      display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
      animation: rolling ? 'card-anim-die-roll 0.18s infinite linear' : 'card-anim-die-land 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily:"'JetBrains Mono',monospace", fontWeight:900, lineHeight:1,
        fontSize: value >= 100 ? size*0.22 : value >= 10 ? size*0.34 : size*0.46,
        color: textColor, textShadow: `0 0 16px ${glow}`,
      }}>{value}</span>
      {isCrit && <span style={{ position:'absolute', top:1, right:3, fontSize:13, color:'#facc15', animation:'die-pulse 0.9s ease-in-out infinite' }}>✦</span>}
    </div>
  );
};

/* ─── Particles ──────────────────────────────────────────────────── */
const Particles: React.FC<{ color: string; count?: number; spread?: number }> = ({ color, count = 20, spread = 140 }) => (
  <div style={{ position:'absolute', inset:0, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
    {Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360;
      const dist = spread * 0.5 + Math.random() * spread;
      const sz = 3 + Math.random() * 5;
      const dur = 0.5 + Math.random() * 0.5;
      const del = Math.random() * 0.12;
      const rad = angle * (Math.PI / 180);
      return (
        <div key={i} style={{
          position:'absolute', width:sz, height:sz,
          borderRadius: Math.random() > 0.5 ? '50%' : 2,
          background: color, boxShadow: `0 0 5px ${color}`,
          animation: `ca-particle ${dur}s ${del}s cubic-bezier(0.22,1,0.36,1) both`,
          '--tx': `${Math.cos(rad) * dist}px`, '--ty': `${Math.sin(rad) * dist}px`,
        } as React.CSSProperties} />
      );
    })}
  </div>
);

/* ─── Combatant avatar ───────────────────────────────────────────── */
const CombatantAvatar: React.FC<{ name: string; icon?: string; auraGlow: string; delay?: number; size?: number; flashAnim?: string }> = ({
  name, icon, auraGlow, delay = 0, size = 52, flashAnim
}) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6,
    animation: `ca-avatar-in 0.45s ${delay}s cubic-bezier(0.34,1.56,0.64,1) both` }}>
    <div style={{ position:'relative' }}>
      <div style={{ position:'absolute', inset: -8, borderRadius:'50%',
        background: `radial-gradient(ellipse, ${auraGlow}44 0%, transparent 70%)`,
        animation: flashAnim ?? 'ca-aura-ring 1.8s ease-in-out infinite', filter: 'blur(5px)' }} />
      <div style={{ width: size, height: size, borderRadius:'50%', overflow:'hidden', position:'relative',
        border: `2.5px solid ${auraGlow}`,
        boxShadow: `0 0 20px ${auraGlow}88, 0 0 6px ${auraGlow}55`,
        animation: flashAnim }}>
        {icon
          ? <img src={icon} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse,${auraGlow}44,rgba(0,0,0,0.8))`,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Star style={{ width:size*0.35, height:size*0.35, color:auraGlow }} />
            </div>
        }
      </div>
    </div>
    <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.15em',
      color: auraGlow, maxWidth:64, textAlign:'center', lineHeight:1.2,
      textShadow:`0 0 8px ${auraGlow}88` }}>
      {name.split(' ')[0]}
    </span>
  </div>
);

/* ─── Phase timing ───────────────────────────────────────────────── */
type Phase = 0|1|2|3|4|5|6|7|8;
const PHASE_DUR: Record<number, number> = {
  0: 750, 1: 1100, 2: 700, 3: 700, 4: 1100, 5: 700, 6: 1300, 7: 1800, 8: 3400,
};

/* ─── Clash animation ─────────────────────────────────────────────── */
const ClashAnim: React.FC<{
  attackCard: CardAnimPayload['attackCard'];
  reactionCard: NonNullable<CardAnimPayload['reactionCard']>;
  isSuccess: boolean;
}> = ({ attackCard, reactionCard, isSuccess }) => {
  const atkCfg = typeColor[attackCard.type] || typeColor['ação'];
  const elCfg = attackCard.element ? elementConfig[attackCard.element] : null;
  const reaCfg = typeColor['reação'];
  const atkColor = elCfg ? elCfg.primary : atkCfg.flyColor;

  if (isSuccess) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:40, position:'relative', justifyContent:'center' }}>
        <div style={{ animation:'ca-clash-atk-win 0.65s cubic-bezier(0.22,1,0.36,1) both', position:'relative', zIndex:2 }}>
          {elCfg && <ElementEffect element={attackCard.element!} size={150} />}
          <div style={{ position:'absolute', inset:-20, borderRadius:'50%',
            background:`radial-gradient(ellipse, ${elCfg?.glow ?? atkCfg.glow} 0%, transparent 65%)`,
            filter:'blur(16px)', animation:'ca-impact-pulse 0.4s 0.25s ease-out both' }} />
          <CardFace card={attackCard} scale={1.0} />
        </div>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
          fontSize:55, lineHeight:1,
          animation:'ca-clash-star 0.45s 0.22s cubic-bezier(0.22,1,0.36,1) both',
          zIndex:10, pointerEvents:'none',
          filter:`drop-shadow(0 0 22px ${atkColor}) drop-shadow(0 0 44px ${atkColor})` }}>💥</div>
        <div style={{ animation:'ca-clash-rea-fling 0.65s 0.3s cubic-bezier(0.55,0,1,0.45) both', position:'relative', zIndex:1 }}>
          <CardFace card={{ ...reactionCard, damage:0 }} scale={1.0} glowOverride={reaCfg.border} />
        </div>
      </div>
    );
  } else {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:40, position:'relative', justifyContent:'center' }}>
        <div style={{ position:'relative', animation:'ca-denied-fade 0.55s 0.1s ease both' }}>
          <CardFace card={attackCard} scale={1.0} grayscale />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            animation:'ca-x-slam 0.38s cubic-bezier(0.22,1,0.36,1) both' }}>
            <X style={{ width:88, height:88, color:'#ef4444', strokeWidth:4,
              filter:'drop-shadow(0 0 22px rgba(239,68,68,0.9)) drop-shadow(0 0 44px rgba(239,68,68,0.6))' }} />
          </div>
        </div>
        <div style={{ fontSize:28, fontWeight:900, color:'rgba(255,255,255,0.18)', animation:'ca-vs 0.35s both' }}>VS</div>
        <div style={{ animation:'ca-rea-triumph 0.7s 0.2s cubic-bezier(0.34,1.56,0.64,1) both', position:'relative' }}>
          <div style={{ position:'absolute', inset:-22, borderRadius:'50%',
            background:`radial-gradient(ellipse, ${reaCfg.glow} 0%, transparent 65%)`,
            filter:'blur(16px)', animation:'ca-aura-ring 1.6s ease-in-out infinite' }} />
          <CardFace card={{ ...reactionCard, damage:0 }} scale={1.05} glowOverride={reaCfg.border} />
        </div>
      </div>
    );
  }
};

/* ─── Card result animation (type + element specific) ─────────────── */
const CardResultAnim: React.FC<{
  attackCard: CardAnimPayload['attackCard'];
  target?: { name: string; icon?: string };
  areaTargets?: { name: string; icon?: string }[];
  isSuccess: boolean;
}> = ({ attackCard, target, areaTargets, isSuccess }) => {
  const cfg = typeColor[attackCard.type] || typeColor['ação'];
  const elCfg = attackCard.element ? elementConfig[attackCard.element] : null;
  const isArea = areaTargets && areaTargets.length > 0;
  const cardType = attackCard.type;

  // Use element color for effects if present
  const effectColor = elCfg ? elCfg.primary : cfg.flyColor;
  const effectGlow = elCfg ? elCfg.glow : cfg.glow;

  const cardFlyAnim: Record<string, string> = {
    ataque:  'ca-card-fly-attack 0.6s 0.6s cubic-bezier(0.55,0,1,0.45) forwards',
    reforço: 'ca-card-fly-support 0.6s 0.6s cubic-bezier(0.55,0,1,0.45) forwards',
    ação:    'ca-card-spin-out 0.75s 0.6s cubic-bezier(0.55,0,1,0.45) forwards',
    vínculo: 'ca-card-fade-out 0.75s 0.6s ease-in forwards',
    reação:  'ca-card-fly-attack 0.6s 0.6s cubic-bezier(0.55,0,1,0.45) forwards',
  };

  const targetFlashAnim: Record<string, string> = {
    ataque:  'ca-flash-red 0.7s 1.1s ease both',
    reforço: 'ca-flash-green 0.7s 1.1s ease both',
    vínculo: 'ca-flash-white 0.9s 1.1s ease both',
    reação:  'ca-flash-blue 0.7s 1.1s ease both',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, position:'relative' }}>
      {/* Type waves */}
      <div style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:0 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            position:'absolute',
            width: 240 + i*30, height: 240 + i*30, borderRadius:'50%',
            border: `2px solid ${elCfg ? elCfg.primary + (i===1?'99':i===2?'66':'44') : cfg.wavePrimary}`,
            animation: `ca-rwave${i} 0.9s ${(i-1)*0.15}s ease-out both`,
          }} />
        ))}
      </div>

      {/* Element aura */}
      {elCfg && (
        <div style={{ position:'absolute', zIndex:0, pointerEvents:'none' }}>
          <ElementEffect element={attackCard.element!} size={220} />
        </div>
      )}

      {/* TYPE-SPECIFIC OVERLAY EFFECTS */}
      {/* ATAQUE: Cracks + destruction overlay */}
      {cardType === 'ataque' && isSuccess && (
        <>
          <div style={{
            position:'absolute', inset:-40, pointerEvents:'none', zIndex:3,
            background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, transparent 70%)',
            animation:'ca-atk-shockwave 0.5s 0.5s ease-out both',
          }} />
          {/* Cracks */}
          {[...Array(8)].map((_,i)=>{
            const angle = (i/8)*360 + Math.random()*20;
            const len = 40+Math.random()*60;
            return (
              <svg key={i} style={{
                position:'absolute', left:'50%', top:'50%',
                width:200, height:200, overflow:'visible',
                transform:'translate(-50%,-50%)',
                pointerEvents:'none', zIndex:3,
                animation:`ca-crack ${0.3}s ${0.5+i*0.04}s ease-out both`,
              }}>
                <path
                  d={`M 0,0 L ${Math.cos(angle*Math.PI/180)*len*0.3+Math.random()*10-5},${Math.sin(angle*Math.PI/180)*len*0.3+Math.random()*8-4} L ${Math.cos(angle*Math.PI/180)*len},${Math.sin(angle*Math.PI/180)*len}`}
                  stroke="#ef4444" strokeWidth="1.5" fill="none"
                  filter="drop-shadow(0 0 3px #ef4444)"
                  opacity="0.8"
                />
              </svg>
            );
          })}
        </>
      )}

      {/* REAÇÃO: Screen shake aura */}
      {cardType === 'reação' && isSuccess && (
        <div style={{
          position:'absolute', inset:-60, borderRadius:24,
          background:'radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 65%)',
          animation:'ca-reaction-shake-glow 0.7s 0.4s ease both',
          pointerEvents:'none', zIndex:3,
        }} />
      )}

      {/* REFORÇO: Armor plates floating in */}
      {cardType === 'reforço' && isSuccess && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:3 }}>
          {[...Array(6)].map((_,i)=>{
            const angle = (i/6)*360;
            const r = 110;
            return (
              <div key={i} style={{
                position:'absolute', left:'50%', top:'50%',
                width: 14+Math.random()*10, height: 20+Math.random()*12,
                borderRadius:3,
                background: `linear-gradient(135deg, rgba(34,197,94,0.7), rgba(20,120,50,0.9))`,
                border: '1px solid rgba(34,197,94,0.8)',
                boxShadow: '0 0 10px rgba(34,197,94,0.6)',
                animation: `ca-armor-plate 1.0s ${i*0.12}s cubic-bezier(0.34,1.56,0.64,1) both`,
                '--ax': `${Math.cos(angle*Math.PI/180)*r}px`,
                '--ay': `${Math.sin(angle*Math.PI/180)*r}px`,
                '--endx': `${Math.cos(angle*Math.PI/180)*50}px`,
                '--endy': `${Math.sin(angle*Math.PI/180)*50}px`,
              } as React.CSSProperties} />
            );
          })}
        </div>
      )}

      {/* Card with float zoom then fly */}
      <div style={{
        position:'relative', zIndex:2,
        animation: `ca-card-float-zoom 0.6s cubic-bezier(0.34,1.56,0.64,1) both, ${cardFlyAnim[cardType] ?? cardFlyAnim['ataque']}`,
      }}>
        <div style={{
          position:'absolute', inset:-28, borderRadius:'50%',
          background: `radial-gradient(ellipse, ${effectGlow} 0%, transparent 65%)`,
          filter:'blur(20px)', pointerEvents:'none',
          animation: 'ca-aura-ring 2s ease-in-out infinite',
        }} />

        <CardFace card={attackCard} scale={1.1} />

        {/* AÇÃO: energy burst overlay + sparks */}
        {cardType === 'ação' && (
          <>
            <div style={{
              position:'absolute', inset:-60, borderRadius:'50%',
              background: `radial-gradient(ellipse, ${effectGlow} 0%, transparent 55%)`,
              animation:'ca-energy-burst 1.0s 0.55s ease-out both',
              pointerEvents:'none',
            }} />
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              {[...Array(14)].map((_,i) => (
                <div key={i} style={{
                  position:'absolute', left:'50%', top:'50%',
                  width: 4+Math.random()*5, height: 4+Math.random()*5,
                  borderRadius:'50%',
                  background: effectColor, boxShadow:`0 0 12px ${effectColor}`,
                  animation:`ca-spark 0.8s ${0.55+i*0.04}s ease-out both`,
                  '--sx': `${Math.cos(i/14*Math.PI*2)*160}px`,
                  '--sy': `${Math.sin(i/14*Math.PI*2)*160}px`,
                } as React.CSSProperties} />
              ))}
            </div>
          </>
        )}

        {/* VÍNCULO: circle ring effect */}
        {cardType === 'vínculo' && (
          <>
            <div style={{
              position:'absolute', inset:-50, borderRadius:'50%',
              border: `3px solid ${effectColor}`,
              boxShadow: `0 0 20px ${effectColor}, inset 0 0 20px ${effectColor}33`,
              animation:'ca-vinculo-ring 1.0s 0.4s ease-out both',
              pointerEvents:'none',
            }} />
            <div style={{
              position:'absolute', inset:-80, borderRadius:'50%',
              border: `1.5px solid ${effectColor}66`,
              animation:'ca-vinculo-ring 1.0s 0.55s ease-out both',
              pointerEvents:'none',
            }} />
            <div style={{
              position:'absolute', inset:-110, borderRadius:'50%',
              border: `1px solid ${effectColor}33`,
              animation:'ca-vinculo-ring 1.0s 0.7s ease-out both',
              pointerEvents:'none',
            }} />
          </>
        )}
      </div>

      {/* Target/targets with flash */}
      {isSuccess && (cardType === 'ataque' || cardType === 'reforço' || cardType === 'vínculo' || cardType === 'reação') && (
        <div style={{ animation:'ca-target-pop 0.4s 0.15s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          {!isArea && target ? (
            <CombatantAvatar
              name={target.name} icon={target.icon}
              auraGlow={elCfg ? elCfg.primary : cfg.auraGlow} size={64}
              flashAnim={targetFlashAnim[cardType]}
            />
          ) : isArea && areaTargets ? (
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', maxWidth:360 }}>
              {areaTargets.slice(0,6).map((t,i) => (
                <CombatantAvatar
                  key={i} name={t.name} icon={t.icon}
                  auraGlow={elCfg ? elCfg.primary : cfg.auraGlow} delay={0.05*i}
                  flashAnim={targetFlashAnim[cardType]}
                />
              ))}
              {areaTargets.length > 6 && (
                <span style={{ fontSize:10, color:cfg.auraGlow, alignSelf:'center', opacity:0.5 }}>
                  +{areaTargets.length-6}
                </span>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const CardRevealAnimation: React.FC<Props> = ({ payload, onComplete }) => {
  const [phase, setPhase] = useState<Phase>(0);
  const [diceVal, setDiceVal] = useState<number | null>(null);
  const [reactionDiceVal, setReactionDiceVal] = useState<number | null>(null);
  const [particles, setParticles] = useState(false);
  const [reactionParticles, setReactionParticles] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const skip = useCallback(() => onComplete(), [onComplete]);

  useEffect(() => {
    if (!payload) return;
    setPhase(0); setDiceVal(null); setReactionDiceVal(null);
    setParticles(false); setReactionParticles(false); setScreenShake(false);

    const hasReaction = !!payload.reactionCard;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_DUR[0]));
    const t2 = PHASE_DUR[0] + PHASE_DUR[1];
    timers.push(setTimeout(() => {
      setPhase(2); setDiceVal(payload.attackRoll.total); setParticles(true);
    }, t2));

    if (hasReaction) {
      const t3 = t2 + PHASE_DUR[2];
      timers.push(setTimeout(() => setPhase(3), t3));
      const t4 = t3 + PHASE_DUR[3];
      timers.push(setTimeout(() => setPhase(4), t4));
      const t5 = t4 + PHASE_DUR[4];
      timers.push(setTimeout(() => {
        setPhase(5); setReactionDiceVal(payload.reactionRoll!.total); setReactionParticles(true);
      }, t5));
      const t6 = t5 + PHASE_DUR[5];
      timers.push(setTimeout(() => setPhase(6), t6));
      const t7 = t6 + PHASE_DUR[6];
      timers.push(setTimeout(() => {
        setPhase(7);
        if (payload.attackCard.type === 'reação' && !payload.isSuccess) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 600);
        }
      }, t7));
      const t8 = t7 + PHASE_DUR[7];
      timers.push(setTimeout(() => setPhase(8), t8));
      timers.push(setTimeout(() => onComplete(), t8 + PHASE_DUR[8]));
    } else {
      const t7 = t2 + PHASE_DUR[2];
      timers.push(setTimeout(() => {
        setPhase(7);
        if (payload.attackCard.type === 'reação' && payload.isSuccess) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 600);
        }
      }, t7));
      const t8 = t7 + PHASE_DUR[7];
      timers.push(setTimeout(() => setPhase(8), t8));
      timers.push(setTimeout(() => onComplete(), t8 + PHASE_DUR[8]));
    }

    return () => timers.forEach(clearTimeout);
  }, [payload]);

  if (!payload) return null;

  const { attackCard, attacker, target, areaTargets, attackRoll, reactionCard, reactionRoll, isSuccess, isCrit, isFumble } = payload;
  const hasReaction = !!reactionCard;
  const cfg = typeColor[attackCard.type] || typeColor['ação'];
  const elCfg = attackCard.element ? elementConfig[attackCard.element] : null;
  const isArea = areaTargets && areaTargets.length > 0;

  const resultColor = isCrit ? '#facc15' : isSuccess ? '#34d399' : '#f43f5e';
  const resultLabel = isCrit ? 'CRÍTICO!' : isFumble ? 'FALHA CRÍTICA!' : isSuccess ? 'ACERTO!' : 'ERROU!';

  const showDicePhase = phase >= 0 && phase <= 5;
  const showClash = hasReaction && phase === 6;
  const showCardAnim = phase === 7;
  const showResult = phase === 8;
  const showAttackCard = showDicePhase && phase <= 2;
  const showAttackDice = showDicePhase && phase >= 1 && phase <= 2;
  const showReactionCard = showDicePhase && hasReaction && phase >= 3 && phase <= 5;
  const showReactionDice = showDicePhase && hasReaction && phase >= 4 && phase <= 5;

  const bgColor = showResult
    ? isSuccess
      ? `radial-gradient(ellipse at 50% 45%, ${elCfg ? elCfg.glow.replace('0.8','0.25').replace('0.9','0.25') : cfg.auraColor.replace('0.22','0.35')} 0%, rgba(2,4,18,0.98) 62%)`
      : 'radial-gradient(ellipse at 50% 45%, rgba(244,63,94,0.18) 0%, rgba(2,4,18,0.98) 62%)'
    : showCardAnim
      ? `radial-gradient(ellipse at 50% 45%, ${elCfg ? elCfg.glow.replace('0.8','0.18').replace('0.9','0.18') : cfg.auraColor} 0%, rgba(2,4,18,0.97) 55%)`
      : 'rgba(2,4,18,0.97)';

  return (
    <div onClick={skip} style={{
      position:'fixed', inset:0, zIndex:9100,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      background: bgColor,
      backdropFilter:'blur(28px) saturate(1.3)',
      cursor:'pointer', userSelect:'none', padding:'2rem',
      transition:'background 0.7s ease',
      animation: screenShake ? 'ca-screen-shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both' : undefined,
      pointerEvents: 'auto',
    }}>
      <style>{`
        @keyframes ca-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ca-card-slam {
          0%   { transform:scale(1); }
          25%  { transform:scale(1.08) translateX(-8px) rotate(-3deg); filter:brightness(1.8); }
          50%  { transform:scale(0.96) translateX(6px) rotate(1.5deg); }
          75%  { transform:scale(1.03) translateX(-3px); }
          100% { transform:scale(1) translateX(0) rotate(0); }
        }
        @keyframes ca-shield-deflect {
          0%   { transform:scale(1) rotate(0); }
          20%  { transform:scale(1.22) rotate(-18deg); filter:brightness(2.2) saturate(1.5); }
          45%  { transform:scale(0.92) rotate(6deg); }
          70%  { transform:scale(1.06) rotate(-2deg); }
          100% { transform:scale(1) rotate(0); }
        }
        @keyframes ca-card-enter {
          0%   { opacity:0; transform:translateY(120px) scale(0.7) rotate(-8deg); filter:blur(12px); }
          60%  { opacity:1; transform:translateY(-8px) scale(1.04) rotate(1deg); filter:blur(0); }
          80%  { transform:translateY(2px) scale(0.98) rotate(-0.5deg); }
          100% { transform:translateY(0) scale(1) rotate(0); }
        }
        @keyframes ca-reaction-enter {
          0%   { opacity:0; transform:translateY(-100px) scale(0.7) rotate(8deg); filter:blur(12px); }
          60%  { opacity:1; transform:translateY(6px) scale(1.04) rotate(-1deg); filter:blur(0); }
          80%  { transform:translateY(-2px) scale(0.98) rotate(0.5deg); }
          100% { transform:translateY(0) scale(1) rotate(0); }
        }
        @keyframes card-anim-die-roll {
          0%  { transform:rotate(0) scale(1); }
          25% { transform:rotate(-16deg) scale(1.08); }
          50% { transform:rotate(0) scale(0.94); }
          75% { transform:rotate(16deg) scale(1.06); }
          100%{ transform:rotate(0) scale(1); }
        }
        @keyframes card-anim-die-land {
          0%  { transform:scale(1.35) rotate(-10deg); opacity:0.5; filter:blur(4px); }
          55% { transform:scale(0.92) rotate(3deg); opacity:1; filter:blur(0); }
          78% { transform:scale(1.06) rotate(-1deg); }
          100%{ transform:scale(1) rotate(0); }
        }
        @keyframes ca-result-slam {
          0%   { transform:scale(2.6) rotate(-4deg); opacity:0; filter:blur(16px); }
          45%  { transform:scale(0.92) rotate(1.5deg); opacity:1; filter:blur(0); }
          70%  { transform:scale(1.05); }
          100% { transform:scale(1) rotate(0); }
        }
        @keyframes ca-impact-ring {
          0%   { transform:scale(0.2); opacity:0.9; }
          100% { transform:scale(4.0); opacity:0; }
        }
        @keyframes ca-impact-ring2 {
          0%   { transform:scale(0.2); opacity:0.7; }
          100% { transform:scale(3.2); opacity:0; }
        }
        @keyframes ca-aura-burst {
          0%   { transform:scale(0.4); opacity:0; }
          25%  { opacity:1; }
          100% { transform:scale(2.2); opacity:0; }
        }
        @keyframes ca-particle {
          0%   { transform:translate(0,0) scale(1); opacity:1; }
          100% { transform:translate(var(--tx),var(--ty)) scale(0); opacity:0; }
        }
        @keyframes ca-avatar-in {
          0%   { opacity:0; transform:scale(0.4) translateY(16px); }
          70%  { transform:scale(1.08) translateY(-2px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ca-aura-ring {
          0%,100% { transform:scale(1); opacity:0.7; }
          50%     { transform:scale(1.18); opacity:1; }
        }
        @keyframes ca-damage-pop {
          0%   { transform:translateY(0) scale(0.4); opacity:0; }
          20%  { transform:translateY(-10px) scale(1.4); opacity:1; }
          65%  { transform:translateY(-22px) scale(1.05); opacity:1; }
          100% { transform:translateY(-40px) scale(0.85); opacity:0; }
        }
        @keyframes ca-fade-up { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        @keyframes ca-label-pulse { 0%,100%{opacity:1;} 50%{opacity:0.45;} }
        @keyframes ca-progress { from{width:100%;} to{width:0%;} }
        @keyframes ca-vs { from{opacity:0;transform:scale(0.4);} to{opacity:0.3;transform:scale(1);} }
        @keyframes ca-hint { from{opacity:0;} to{opacity:0.45;} }
        @keyframes ca-aura-label { from{opacity:0;transform:scaleX(0.5);} to{opacity:0.65;transform:scaleX(1);} }
        @keyframes die-pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
        @keyframes ca-crit-ring {
  0%   { transform:scale(0.3); opacity:0.9; }
  100% { transform:scale(3.5); opacity:0; }
}
@keyframes ca-crit-spark {
  0%   { transform:translate(-50%,-50%) scale(1.5); opacity:1; }
  100% { transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity:0; }
}
@keyframes ca-fumble-ring {
  0%   { transform:scale(2); opacity:0.8; }
  100% { transform:scale(0.2); opacity:0; }
}
@keyframes ca-fumble-skull {
  0%   { transform:translate(-50%,-50%) scale(0) rotate(0deg); opacity:0; }
  30%  { opacity:1; }
  100% { transform:translate(calc(-50% + var(--bx)), calc(-50% + var(--by))) scale(1) rotate(360deg); opacity:0; }
}
@keyframes ca-rwave1 { 0%{transform:scale(0.3);opacity:0.8;} 100%{transform:scale(4.5);opacity:0;} }
        @keyframes ca-rwave2 { 0%{transform:scale(0.3);opacity:0.55;} 100%{transform:scale(3.5);opacity:0;} }
        @keyframes ca-rwave3 { 0%{transform:scale(0.3);opacity:0.3;} 100%{transform:scale(2.5);opacity:0;} }
        @keyframes ca-card-float-zoom {
          0%   { transform:scale(0.5) translateY(30px); opacity:0; filter:blur(8px); }
          60%  { transform:scale(1.15) translateY(-8px); opacity:1; filter:blur(0); }
          80%  { transform:scale(1.08) translateY(-2px); }
          100% { transform:scale(1.1) translateY(0); }
        }
        @keyframes ca-card-fly-attack {
          0%   { transform:scale(1.1) translateY(0) rotate(0); opacity:1; }
          25%  { transform:scale(1.22) translateY(-24px) rotate(-6deg); }
          100% { transform:scale(0.25) translateY(180px) rotate(18deg); opacity:0; filter:blur(10px); }
        }
        @keyframes ca-card-fly-support {
          0%   { transform:scale(1.1) translateY(0) rotate(0); opacity:1; }
          25%  { transform:scale(1.18) translateY(-18px) rotate(4deg); }
          100% { transform:scale(0.25) translateY(170px) rotate(-12deg); opacity:0; filter:blur(8px); }
        }
        @keyframes ca-card-spin-out {
          0%   { transform:scale(1.1) rotate(0); opacity:1; }
          55%  { transform:scale(1.35) rotate(200deg); opacity:0.9; filter:brightness(1.8); }
          100% { transform:scale(0.05) rotate(580deg); opacity:0; filter:blur(12px); }
        }
        @keyframes ca-card-fade-out {
          0%   { transform:scale(1.1); opacity:1; }
          45%  { transform:scale(1.18); opacity:0.75; }
          100% { transform:scale(1.05); opacity:0; filter:blur(14px); }
        }
        @keyframes ca-flash-red {
          0%   { filter:brightness(1); }
          30%  { filter:brightness(2.4) saturate(1.5); box-shadow:0 0 70px rgba(239,68,68,0.95),0 0 140px rgba(239,68,68,0.5); }
          100% { filter:brightness(1); box-shadow:0 0 24px rgba(239,68,68,0.7); }
        }
        @keyframes ca-flash-green {
          0%   { filter:brightness(1); }
          30%  { filter:brightness(2.4) saturate(1.5); box-shadow:0 0 70px rgba(34,197,94,0.95),0 0 140px rgba(34,197,94,0.5); }
          100% { filter:brightness(1); box-shadow:0 0 24px rgba(34,197,94,0.7); }
        }
        @keyframes ca-flash-white {
          0%   { filter:brightness(1); }
          30%  { filter:brightness(2.8) saturate(0.2); box-shadow:0 0 70px rgba(226,232,240,0.9),0 0 140px rgba(226,232,240,0.4); }
          100% { filter:brightness(1); box-shadow:0 0 24px rgba(226,232,240,0.6); }
        }
        @keyframes ca-flash-blue {
          0%   { filter:brightness(1); }
          30%  { filter:brightness(2.4) hue-rotate(200deg); box-shadow:0 0 70px rgba(59,130,246,0.95),0 0 140px rgba(59,130,246,0.5); }
          100% { filter:brightness(1); box-shadow:0 0 24px rgba(59,130,246,0.7); }
        }
        @keyframes ca-energy-burst {
          0%   { transform:scale(0.2); opacity:0; }
          25%  { opacity:1; }
          100% { transform:scale(4.0); opacity:0; }
        }
        @keyframes ca-spark {
          0%   { transform:translate(-50%,-50%) scale(1.5); opacity:1; }
          100% { transform:translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) scale(0); opacity:0; }
        }
        @keyframes ca-vinculo-ring {
          0%   { transform:scale(0.3); opacity:0; }
          35%  { opacity:1; }
          100% { transform:scale(1.5); opacity:0; }
        }
        @keyframes ca-target-pop {
          0%   { opacity:0; transform:scale(0.5) translateY(24px); }
          65%  { transform:scale(1.1) translateY(-4px); opacity:1; }
          100% { transform:scale(1) translateY(0); }
        }
        @keyframes ca-clash-atk-win {
          0%   { transform:translateX(0) scale(1); }
          35%  { transform:translateX(64px) scale(1.14) rotate(-5deg); filter:brightness(2.0); }
          60%  { transform:translateX(22px) scale(1.04) rotate(-1deg); }
          100% { transform:translateX(0) scale(1) rotate(0); }
        }
        @keyframes ca-clash-rea-fling {
          0%   { transform:translateX(0) rotate(0); opacity:1; }
          18%  { transform:translateX(-35px) rotate(-12deg); }
          100% { transform:translateX(340px) rotate(52deg) scale(0.2); opacity:0; filter:blur(10px); }
        }
        @keyframes ca-clash-star {
          0%   { transform:translate(-50%,-50%) scale(0); opacity:0; }
          38%  { transform:translate(-50%,-50%) scale(1.7); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(0.1); opacity:0; }
        }
        @keyframes ca-impact-pulse {
          0%   { transform:scale(0.4); opacity:0; }
          45%  { transform:scale(1.6); opacity:1; }
          100% { transform:scale(1); opacity:0; }
        }
        @keyframes ca-denied-fade {
          100% { transform:scale(0.86); filter:grayscale(1) brightness(0.4); }
        }
        @keyframes ca-x-slam {
          0%   { transform:scale(3.5) rotate(-20deg); opacity:0; filter:blur(8px); }
          55%  { transform:scale(0.86) rotate(4deg); opacity:1; filter:blur(0); }
          100% { transform:scale(1) rotate(0); }
        }
        @keyframes ca-rea-triumph {
          0%   { transform:scale(0.65) translateY(24px); opacity:0; filter:blur(8px); }
          55%  { transform:scale(1.18) translateY(-10px); opacity:1; filter:blur(0); }
          100% { transform:scale(1.05) translateY(0); }
        }
        /* TYPE-SPECIFIC IMPACT */
        @keyframes ca-atk-shockwave {
          0%   { transform:scale(0.3); opacity:0; }
          40%  { opacity:1; }
          100% { transform:scale(3); opacity:0; }
        }
        @keyframes ca-crack {
          0%   { opacity:0; transform:scaleX(0) translateX(-50%) translateY(-50%); }
          20%  { opacity:1; transform:scaleX(1) translateX(-50%) translateY(-50%); }
          80%  { opacity:0.8; }
          100% { opacity:0; }
        }
        @keyframes ca-reaction-shake-glow {
          0%   { opacity:0; transform:scale(0.5); }
          40%  { opacity:1; transform:scale(1.2); }
          100% { opacity:0; transform:scale(2.0); }
        }
        @keyframes ca-armor-plate {
          0%   { transform:translate(calc(-50% + var(--ax)), calc(-50% + var(--ay))) scale(0) rotate(30deg); opacity:0; }
          60%  { transform:translate(calc(-50% + var(--endx)), calc(-50% + var(--endy))) scale(1.2) rotate(-5deg); opacity:1; }
          100% { transform:translate(calc(-50% + var(--endx)), calc(-50% + var(--endy))) scale(1) rotate(0); opacity:0.8; }
        }
        /* SCREEN SHAKE */
        @keyframes ca-screen-shake {
          0%,100%  { transform:translate(0,0) rotate(0); }
          10%      { transform:translate(-12px,-8px) rotate(-0.5deg); }
          20%      { transform:translate(10px,8px) rotate(0.4deg); }
          30%      { transform:translate(-8px,-6px) rotate(-0.3deg); }
          40%      { transform:translate(8px,4px) rotate(0.3deg); }
          50%      { transform:translate(-4px,-3px) rotate(-0.2deg); }
          60%      { transform:translate(4px,3px) rotate(0.1deg); }
          70%      { transform:translate(-2px,-2px); }
          80%      { transform:translate(2px,1px); }
        }
      `}</style>

      {/* Skip hint */}
      <div style={{ position:'absolute', bottom:24, fontSize:10, fontWeight:700, letterSpacing:'0.4em',
        color:'rgba(255,255,255,0.22)', textTransform:'uppercase', animation:'ca-hint 0.5s 1s both',
        pointerEvents:'none' }}>
        Clique para pular
      </div>

      {/* Phase label */}
      {showDicePhase && (
        <div style={{ position:'absolute', top:32, fontSize:10, fontWeight:900, letterSpacing:'0.5em',
          color: phase < 3 ? (elCfg ? elCfg.primary : cfg.border) : typeColor['reação'].border,
          textTransform:'uppercase', animation:'ca-label-pulse 1.4s infinite',
          fontFamily:"'JetBrains Mono',monospace", pointerEvents:'none' }}>
          {phase <= 2
            ? `${elCfg ? elCfg.emoji+' ' : '⚔ '}${attacker.name}`
            : `🛡 ${target?.name ?? 'Alvo'} REAGE`}
        </div>
      )}

      {/* Impact rings on result success */}
      {showResult && isSuccess && (
        <>
          <div style={{ position:'absolute', inset:0, background:cfg.impactBg,
            animation:'ca-aura-burst 1.0s cubic-bezier(0.22,1,0.36,1) both', pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:280, height:280, borderRadius:'50%',
            border:`2.5px solid ${elCfg ? elCfg.primary+'66' : cfg.impactRingColor+'66'}`,
            animation:'ca-impact-ring 0.7s ease-out both', pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%',
            border:`2px solid ${elCfg ? elCfg.primary+'88' : cfg.impactRingColor+'88'}`,
            animation:'ca-impact-ring2 0.7s 0.1s ease-out both', pointerEvents:'none' }} />
        </>
      )}

      {/* MAIN LAYOUT */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, position:'relative', zIndex:1 }}>

        {/* DICE PHASE */}
        {showDicePhase && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:32, position:'relative' }}>
              {showAttackCard && (
                <div style={{ position:'relative', animation:'ca-card-enter 0.65s cubic-bezier(0.22,1,0.36,1) both' }}>
                  <div style={{ position:'absolute', top:-28, left:'50%', transform:'translateX(-50%)',
                    display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap',
                    animation:'ca-fade-up 0.4s 0.3s both' }}>
                    {attacker.icon && (
                      <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:`1px solid ${elCfg ? elCfg.primary+'66' : cfg.border+'66'}` }}>
                        <img src={attacker.icon} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      </div>
                    )}
                    <span style={{ fontSize:9, fontWeight:900, color: elCfg ? elCfg.primary : cfg.border, textTransform:'uppercase', letterSpacing:'0.2em' }}>
                      {attacker.name}
                    </span>
                    <Swords style={{ width:10, height:10, color: elCfg ? elCfg.primary : cfg.border }} />
                  </div>
                  <CardFace card={attackCard} scale={1} />
                </div>
              )}
              {showAttackDice && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, position:'relative' }}>
                  {particles && <Particles color={isCrit ? '#facc15' : isSuccess ? (elCfg ? elCfg.primary : cfg.auraGlow) : '#f43f5e'} count={26} spread={150} />}
                  <DieFace
                    sides={attackRoll.numSides}
                    value={diceVal ?? (phase === 1 ? Math.floor(Math.random() * attackRoll.numSides) + 1 : attackRoll.total)}
                    size={phase === 1 ? 96 : 100} rolling={phase === 1} isCrit={isCrit} isFumble={isFumble}
                  />
                  {phase >= 2 && (
                    <div style={{ animation:'ca-fade-up 0.3s both', textAlign:'center',
                      fontSize:13, fontWeight:900, fontFamily:"'JetBrains Mono',monospace",
                      color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>
                      {attackRoll.notation}
                      {attackRoll.bonus !== 0 && (
                        <span style={{ color: attackRoll.bonus > 0 ? '#86efac' : '#fca5a5' }}>
                          {attackRoll.bonus > 0 ? ` +${attackRoll.bonus}` : ` ${attackRoll.bonus}`}
                        </span>
                      )}
                      <span style={{ color:'rgba(255,255,255,0.8)', marginLeft:6 }}>= {attackRoll.total}</span>
                    </div>
                  )}
                  {phase === 1 && (
                    <div style={{ fontSize:11, fontWeight:900, color:'rgba(255,255,255,0.3)',
                      textTransform:'uppercase', letterSpacing:'0.4em', fontFamily:"'JetBrains Mono',monospace",
                      animation:'ca-label-pulse 1s infinite' }}>rolando...</div>
                  )}
                </div>
              )}
            </div>

            {hasReaction && phase >= 3 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
                <div style={{ fontSize:36, fontWeight:900, fontStyle:'italic', color:'rgba(255,255,255,0.14)',
                  animation:'ca-vs 0.4s cubic-bezier(0.34,1.56,0.64,1) both', letterSpacing:'0.08em' }}>VS</div>
                <div style={{ display:'flex', alignItems:'center', gap:32, position:'relative' }}>
                  {showReactionCard && (
                    <div style={{ position:'relative', animation:'ca-reaction-enter 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
                      <div style={{ position:'absolute', top:-28, left:'50%', transform:'translateX(-50%)',
                        display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap',
                        animation:'ca-fade-up 0.4s 0.2s both' }}>
                        <Shield style={{ width:10, height:10, color:'#3b82f6' }} />
                        <span style={{ fontSize:9, fontWeight:900, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.2em' }}>
                          {target?.name ?? 'Alvo'} reage
                        </span>
                        {target?.icon && (
                          <div style={{ width:22, height:22, borderRadius:6, overflow:'hidden', border:'1px solid rgba(59,130,246,0.5)' }}>
                            <img src={target.icon} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          </div>
                        )}
                      </div>
                      <CardFace card={{ ...reactionCard!, damage:0 }} scale={0.88} glowOverride={typeColor['reação'].border} />
                    </div>
                  )}
                  {showReactionDice && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, position:'relative' }}>
                      {reactionParticles && <Particles color={!isSuccess ? '#34d399' : '#f43f5e'} count={20} />}
                      <DieFace
                        sides={reactionRoll?.numSides ?? 20}
                        value={reactionDiceVal ?? (phase === 4 ? Math.floor(Math.random() * (reactionRoll?.numSides ?? 20)) + 1 : reactionRoll!.total)}
                        size={88} rolling={phase === 4}
                      />
                      {phase >= 5 && reactionRoll && (
                        <div style={{ animation:'ca-fade-up 0.3s both', textAlign:'center',
                          fontSize:12, fontWeight:900, fontFamily:"'JetBrains Mono',monospace",
                          color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em' }}>
                          {reactionRoll.notation}
                          <span style={{ color:'rgba(255,255,255,0.7)', marginLeft:6 }}>= {reactionRoll.total}</span>
                        </div>
                      )}
                      {phase === 4 && (
                        <div style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.25)',
                          textTransform:'uppercase', letterSpacing:'0.35em', fontFamily:"'JetBrains Mono',monospace",
                          animation:'ca-label-pulse 1s infinite' }}>defesa...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* CLASH PHASE */}
        {showClash && reactionCard && (
          <div style={{ animation:'ca-fade-up 0.3s both' }}>
            <ClashAnim attackCard={attackCard} reactionCard={reactionCard} isSuccess={isSuccess} />
          </div>
        )}

        {/* CARD ANIMATION PHASE */}
        {showCardAnim && (
          <CardResultAnim
            attackCard={attackCard} target={target} areaTargets={areaTargets} isSuccess={isSuccess}
          />
        )}

        {/* RESULT SCREEN */}
        {showResult && (
          <div style={{ textAlign:'center' }}>
            {isSuccess && (
              <div style={{ fontSize:9, fontWeight:900, letterSpacing:'0.65em', color: elCfg ? elCfg.primary : cfg.auraGlow,
                textTransform:'uppercase', opacity:0.65, marginBottom:6, animation:'ca-aura-label 0.5s 0.1s both' }}>
                {elCfg ? `${elCfg.emoji} ${elCfg.label} · ` : ''}◆ {cfg.auraLabel} ◆
              </div>
            )}
            <div style={{
              fontSize:'clamp(3rem,10vw,7.5rem)', fontWeight:900, fontStyle:'italic',
              textTransform:'uppercase', lineHeight:1, letterSpacing:'-0.03em', color:resultColor,
              textShadow:`0 0 60px ${resultColor}, 0 0 110px ${resultColor}50`,
              animation:'ca-result-slam 0.5s cubic-bezier(0.22,1,0.36,1) both',
            }}>{resultLabel}</div>
            <div style={{ marginTop:14, display:'flex', alignItems:'center', justifyContent:'center', gap:16,
              animation:'ca-fade-up 0.35s 0.15s both' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Swords style={{ width:14, height:14, color: elCfg ? elCfg.primary : cfg.border }} />
                <span style={{ fontSize:20, fontWeight:900, fontFamily:"'JetBrains Mono',monospace", color:resultColor }}>
                  {attackRoll.total}
                </span>
              </div>
              {hasReaction && reactionRoll && (
                <>
                  <span style={{ fontSize:16, color:'rgba(255,255,255,0.18)', fontWeight:900 }}>VS</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:20, fontWeight:900, fontFamily:"'JetBrains Mono',monospace",
                      color: !isSuccess ? '#34d399' : '#f43f5e' }}>{reactionRoll.total}</span>
                    <Shield style={{ width:14, height:14, color:'#3b82f6' }} />
                  </div>
                </>
              )}
            </div>
            {isSuccess && (attackCard.damage ?? 0) > 0 && (
              <div style={{ display:'inline-block', marginTop:10,
                fontSize:38, fontWeight:900, fontFamily:"'JetBrains Mono',monospace",
                color: attackCard.type === 'ataque' ? '#f87171' : '#86efac',
                textShadow: attackCard.type === 'ataque'
                  ? '0 0 40px rgba(239,68,68,0.9), 0 0 80px rgba(239,68,68,0.5)'
                  : '0 0 40px rgba(34,197,94,0.9), 0 0 80px rgba(34,197,94,0.5)',
                animation:'ca-damage-pop 2s 0.1s ease both',
              }}>
                {attackCard.type === 'ataque' ? '-' : '+'}{attackCard.damage}
                <span style={{ fontSize:16, marginLeft:4, opacity:0.5 }}>♥</span>
              </div>
            )}
            {isSuccess && attackCard.conditionEffect && (
              <div style={{ marginTop:8, fontSize:13, fontWeight:800, color:'#fbbf24',
                background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)',
                borderRadius:8, padding:'4px 16px', display:'inline-block',
                animation:'ca-fade-up 0.4s 0.25s both' }}>✦ {attackCard.conditionEffect}</div>
            )}
            {isSuccess && isArea && (
              <div style={{ marginTop:18, display:'flex', gap:14, justifyContent:'center',
                flexWrap:'wrap', maxWidth:480, margin:'18px auto 0' }}>
                {areaTargets!.slice(0,7).map((t, i) => (
                  <CombatantAvatar key={i} name={t.name} icon={t.icon}
                    auraGlow={elCfg ? elCfg.primary : cfg.auraGlow} delay={0.06*i} />
                ))}
                {areaTargets!.length > 7 && (
                  <div style={{ display:'flex', alignItems:'center', fontSize:11, fontWeight:700,
                    color: elCfg ? elCfg.primary : cfg.auraGlow, opacity:0.55 }}>
                    +{areaTargets!.length - 7} mais
                  </div>
                )}
              </div>
            )}
            {isSuccess && !isArea && target && (
              <div style={{ marginTop:16, display:'flex', justifyContent:'center', animation:'ca-fade-up 0.4s 0.2s both' }}>
                {attackCard.type === 'reação' ? (
                  <div style={{ fontSize:10, fontWeight:700, color:typeColor['reação'].auraGlow,
                    textTransform:'uppercase', letterSpacing:'0.2em', display:'flex', alignItems:'center', gap:8 }}>
                    <Shield style={{ width:14, height:14 }} />Ataque anulado em {target.name}
                  </div>
                ) : (
                  <CombatantAvatar name={target.name} icon={target.icon}
                    auraGlow={elCfg ? elCfg.primary : cfg.auraGlow} />
                )}
              </div>
            )}
            {isCrit && (
              <div style={{ position:'relative', marginTop:14, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                {/* Energy explosion rings */}
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    position:'absolute', top:'50%', left:'50%',
                    width: 60 + i*30, height: 60 + i*30,
                    marginLeft: -(30+i*15), marginTop: -(30+i*15),
                    borderRadius:'50%',
                    border:`2px solid rgba(250,204,21,${0.9-i*0.18})`,
                    animation:`ca-crit-ring 1.2s ${i*0.18}s ease-out infinite`,
                    pointerEvents:'none',
                  }} />
                ))}
                {/* Starburst particles */}
                {[...Array(12)].map((_,i) => {
                  const angle = (i/12)*360;
                  const px = Math.round(Math.cos(angle*Math.PI/180)*55);
                  const py = Math.round(Math.sin(angle*Math.PI/180)*55);
                  return (
                    <div key={i} style={{
                      position:'absolute', top:'50%', left:'50%',
                      width:5, height:5, borderRadius:'50%',
                      background:'#facc15',
                      boxShadow:'0 0 8px #facc15',
                      transform:`translate(-50%,-50%)`,
                      animation:`ca-crit-spark 1.4s ${(i%4)*0.1}s ease-out infinite`,
                      ['--tx' as any]: `${px}px`,
                      ['--ty' as any]: `${py}px`,
                    }} />
                  );
                })}
                <div style={{ fontSize:13, fontWeight:900, letterSpacing:'0.55em',
                  color:'#fde68a', textTransform:'uppercase',
                  textShadow:'0 0 20px #facc15, 0 0 40px rgba(250,204,21,0.6)',
                  animation:'ca-label-pulse 0.7s infinite' }}>
                  ⚡ ACERTO CRÍTICO! ⚡
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(250,204,21,0.7)',
                  textTransform:'uppercase', letterSpacing:'0.35em' }}>
                  Dano e efeitos duplicados!
                </div>
              </div>
            )}
            {isFumble && (
              <div style={{ position:'relative', marginTop:14, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                {/* Crumble / implode rings */}
                {[0,1].map(i => (
                  <div key={i} style={{
                    position:'absolute', top:'50%', left:'50%',
                    width: 50 + i*20, height: 50 + i*20,
                    marginLeft: -(25+i*10), marginTop: -(25+i*10),
                    borderRadius:'50%',
                    border:`2px solid rgba(239,68,68,${0.8-i*0.2})`,
                    animation:`ca-fumble-ring 1.1s ${i*0.2}s ease-in infinite`,
                    pointerEvents:'none',
                  }} />
                ))}
                {/* Skull icons spinning out */}
                {[...Array(5)].map((_,i) => {
                  const angle = (i/5)*360 + 36;
                  const r = 55;
                  const bx = Math.round(Math.cos(angle*Math.PI/180)*r);
                  const by = Math.round(Math.sin(angle*Math.PI/180)*r);
                  return (
                    <div key={i} style={{
                      position:'absolute', top:'50%', left:'50%',
                      fontSize:14, lineHeight:1,
                      transform:'translate(-50%,-50%)',
                      animation:`ca-fumble-skull 1.6s ${i*0.15}s ease-out infinite`,
                      ['--bx' as any]: `${bx}px`,
                      ['--by' as any]: `${by}px`,
                      pointerEvents:'none',
                    }}>💀</div>
                  );
                })}
                <div style={{ fontSize:13, fontWeight:900, letterSpacing:'0.5em',
                  color:'#fca5a5', textTransform:'uppercase',
                  textShadow:'0 0 20px rgba(239,68,68,0.8)',
                  animation:'ca-label-pulse 0.9s infinite' }}>
                  💀 FALHA CRÍTICA! 💀
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(248,113,113,0.65)',
                  textTransform:'uppercase', letterSpacing:'0.3em' }}>
                  Penalidade aplicada!
                </div>
              </div>
            )}
            <div style={{ width:'100%', maxWidth:400, height:3, borderRadius:99,
              background:'rgba(255,255,255,0.06)', overflow:'hidden', marginTop:isCrit||isFumble?50:28, marginLeft:'auto', marginRight:'auto' }}>
              <div style={{ height:'100%', borderRadius:99,
                background: elCfg ? elCfg.primary : resultColor,
                boxShadow:`0 0 8px ${elCfg ? elCfg.primary : resultColor}`,
                animation:`ca-progress ${PHASE_DUR[8] - 400}ms linear both` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardRevealAnimation;