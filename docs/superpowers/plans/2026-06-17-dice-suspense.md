# Dados com Suspense — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modo de suspense adaptativo na animação de dados: rolagens de combate com CD ganham build-up, ambiente escalando, tease e pausa dramática; rolagens avulsas continuam rápidas.

**Architecture:** Um novo prop `dramatic` no `DiceAnimation` alterna entre o modo rápido (atual) e o dramático (build-up → giro com ambiente escalando → tease → pausa → revelação, com payoff extra de crit/falha). Tudo isolado em `components/DiceAnimation.tsx`; o `App.tsx` só passa `dramatic: true` nos 3 call sites com CD.

**Tech Stack:** React 19, TypeScript, CSS keyframes (sem libs novas).

> **Restrições:** sem git (checkpoint = `npm run build`); sem test runner (verificação = `npm run build` + `npx tsc --noEmit`, baseline **29**). Spec: `docs/superpowers/specs/2026-06-17-dice-suspense-design.md`.

---

## Task 1: Fiação do `dramatic` no App.tsx

**Files:**
- Modify: `App.tsx` (tipo `diceAnim` ~3898; call sites 4537, 4600, 4713; JSX 11350-11360)

- [ ] **Step 1: Adicionar `dramatic` ao tipo do estado**

Localizar (`App.tsx:3898`):

```tsx
  const [diceAnim, setDiceAnim] = useState<{ isVisible: boolean; result: number; defenderResult?: number; isSuccess: boolean; customLabel?: string; notation?: string; individualRolls?: number[]; numSides?: number; bonus?: number } | null>(null);
```

Substituir por (adiciona `dramatic?: boolean`):

```tsx
  const [diceAnim, setDiceAnim] = useState<{ isVisible: boolean; result: number; defenderResult?: number; isSuccess: boolean; customLabel?: string; notation?: string; individualRolls?: number[]; numSides?: number; bonus?: number; dramatic?: boolean } | null>(null);
```

- [ ] **Step 2: Passar `dramatic` no JSX**

Localizar (`App.tsx:11350-11360`) e adicionar a linha do prop após `bonus`:

```tsx
        bonus={diceAnim?.bonus || 0}
        dramatic={diceAnim?.dramatic}
        onComplete={() => setDiceAnim(null)}
```

- [ ] **Step 3: Marcar dramático no item-action roll (~4537)**

Localizar o objeto em `App.tsx:4537` e adicionar `dramatic: dc > 0,` (o `dc` já existe nessa função, linha ~4534):

```tsx
    setDiceAnim({
      isVisible: true,
      result: roll.total,
      isSuccess,
      customLabel: isSuccess ? 'ACERTOU!' : 'FALHOU!',
      notation: item.combatDiceRoll || '1d20',
      individualRolls: roll.individualRolls,
      numSides: roll.numSides,
      bonus: roll.bonus,
      dramatic: dc > 0,
    });
```

- [ ] **Step 4: Marcar dramático no handleUseItem roll (~4600)**

Localizar o objeto em `App.tsx:4600` (o `dc` existe na linha 4598) e adicionar `dramatic: dc > 0,` após `bonus: roll.bonus,`:

```tsx
      setDiceAnim({
        isVisible: true,
        result: roll.total,
        isSuccess,
        customLabel: dc > 0 ? (isSuccess ? 'ACERTOU! CD' + dc : 'FALHOU! CD' + dc) : item.name,
        notation: item.combatDiceRoll || '1d20',
        individualRolls: roll.individualRolls,
        numSides: roll.numSides,
        bonus: roll.bonus,
        dramatic: dc > 0,
      });
```

- [ ] **Step 5: Marcar dramático no seal roll (~4713)**

Localizar o objeto em `App.tsx:4713` (o `dc` existe na linha 4709) e adicionar `dramatic: dc > 0,` após o `customLabel`. Manter os demais campos:

```tsx
    setDiceAnim({
      isVisible: true,
      result: roll.total,
      isSuccess: isSuccess,
      customLabel: dc > 0 ? (isSuccess ? `ACERTOU! CD${dc}` : `FALHOU! CD${dc}`) : seal.name,
      showSuccessFailure: dc > 0,
      dramatic: dc > 0,
      notation: seal.diceRoll || '1d20',
      individualRolls: roll.individualRolls,
      numSides: roll.numSides,
      bonus: roll.bonus,
    } as any);
```

> Observação: este objeto já tinha um campo `showSuccessFailure` fora do tipo; o `as any` evita erro de excesso de propriedade (e adiciona notation/rolls que faltavam, melhorando a animação do selo). Se preferir não usar `as any`, remover `showSuccessFailure`.

- [ ] **Step 6: Checkpoint**

Run: `npm run build` && `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: build OK; tsc ≤ 29 (o `as any` pode até remover 1 erro pré-existente do `showSuccessFailure`).

---

## Task 2: Reescrever `components/DiceAnimation.tsx` com modo adaptativo

**Files:**
- Modify: `components/DiceAnimation.tsx` (reescrita completa)

> A lógica de fases/timing é interdependente; reescrevemos o arquivo inteiro mantendo `getDieColors`, `DieFacePolygon` e a estética do dado, e adicionando: prop `dramatic`, fase `buildup`, tease estendido + pausa dramática (`hold`), ambiente escalando (vinheta, shake, brasas subindo, heartbeat), payoff de crit/falha (slow-mo + flash), e `prefers-reduced-motion`.

- [ ] **Step 1: Substituir todo o conteúdo de `components/DiceAnimation.tsx` por:**

```tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Shield } from 'lucide-react';

interface DiceAnimationProps {
  isVisible: boolean;
  result: number;
  defenderResult?: number;
  isSuccess: boolean;
  customLabel?: string;
  notation?: string;
  individualRolls?: number[];
  numSides?: number;
  bonus?: number;
  dramatic?: boolean;
  onComplete: () => void;
}

function getDieColors(sides: number) {
  if (sides <= 4)  return { bg:'#12103a', face:'#1e1b4b', border:'#6366f1', glow:'rgba(99,102,241,0.8)',  text:'#a5b4fc' };
  if (sides <= 6)  return { bg:'#0a1a35', face:'#1e3a5f', border:'#3b82f6', glow:'rgba(59,130,246,0.8)',  text:'#93c5fd' };
  if (sides <= 8)  return { bg:'#081a0d', face:'#1a2e1a', border:'#22c55e', glow:'rgba(34,197,94,0.8)',   text:'#86efac' };
  if (sides <= 10) return { bg:'#1a0808', face:'#2e1a1a', border:'#ef4444', glow:'rgba(239,68,68,0.8)',   text:'#fca5a5' };
  if (sides <= 12) return { bg:'#130a1e', face:'#1e1a2e', border:'#a855f7', glow:'rgba(168,85,247,0.8)',  text:'#d8b4fe' };
  return               { bg:'#1a1208', face:'#1a1510', border:'#f59e0b', glow:'rgba(245,158,11,0.8)',   text:'#fde68a' };
}

const DieFacePolygon: React.FC<{ sides:number; size:number; color:string }> = ({ sides, size, color }) => {
  const c = size / 2;
  if (sides <= 4) {
    const h = size * 0.80;
    const pts = `${c},${(size-h)/2+2} ${size-6},${size-9} 6,${size-9}`;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><polygon points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/></svg>;
  }
  if (sides <= 6) return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><rect x="7" y="7" width={size-14} height={size-14} rx="8" fill="none" stroke={color} strokeWidth="2.5"/></svg>;
  if (sides <= 8) {
    const pts = `${c},5 ${size-5},${c} ${c},${size-5} 5,${c}`;
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><polygon points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/></svg>;
  }
  const n = sides <= 10 ? 5 : sides <= 12 ? 6 : 8;
  const pts = Array.from({length:n},(_,i)=>{
    const a=(i*(360/n)-(sides<=10?90:sides<=12?-30:-22.5))*(Math.PI/180);
    return `${c+(c-7)*Math.cos(a)},${c+(c-7)*Math.sin(a)}`;
  }).join(' ');
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><polygon points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/></svg>;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Durações por modo (ms)
const TIMING = {
  fast:   { buildup: 0,    cycle: 850, tease: 520, hold: 0,   land: 420 },
  drama:  { buildup: 1000, cycle: 950, tease: 880, hold: 520, land: 440 },
};
const STAGGER = 150;

interface SingleDieProps {
  sides:number; finalValue:number; size:'sm'|'md'|'lg';
  startDelay:number; dramatic:boolean; reduced:boolean;
  isMax:boolean; isMin:boolean;
}

const SingleDie: React.FC<SingleDieProps> = ({ sides, finalValue, size, startDelay, dramatic, reduced, isMax, isMin }) => {
  const [displayValue, setDisplayValue] = useState<number|null>(null);
  const [phase, setPhase] = useState<'hidden'|'cycling'|'slowing'|'hold'|'landing'|'revealed'>('hidden');
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const [jitter, setJitter] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const rotRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const colors = getDieColors(sides);
  const px = size==='lg'?130:size==='md'?92:66;
  const T = dramatic ? TIMING.drama : TIMING.fast;

  const clearAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rotRef.current) clearInterval(rotRef.current);
  };

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    // 1) cycling
    timeouts.push(setTimeout(() => {
      setPhase('cycling');
      setDisplayValue(Math.floor(Math.random()*sides)+1);
      intervalRef.current = setInterval(() => setDisplayValue(Math.floor(Math.random()*sides)+1), 38);
      let rx=Math.random()*360, ry=Math.random()*360, rz=0;
      const drx=14+Math.random()*24, dry=18+Math.random()*28;
      rotRef.current = setInterval(() => { rx+=drx; ry+=dry; rz+=2.5; setRotX(rx); setRotY(ry); setRotZ(rz); }, 30);
    }, startDelay));

    // 2) slowing (tease): valores enviesados para perto do finalValue
    timeouts.push(setTimeout(() => {
      setPhase('slowing');
      clearAll();
      const near = [finalValue-2, finalValue+1, finalValue-1, finalValue+2, finalValue-1, finalValue+1]
        .map(v => ((v-1+sides) % sides) + 1)
        .filter(v => v !== finalValue);
      const seq = [...near.slice(0, 6), finalValue];
      let step=0;
      const go = (spd:number) => {
        if (step>=seq.length) return;
        setDisplayValue(seq[step]);
        setRotX(r=>r+7); setRotY(r=>r+9);
        step++;
        if (step<seq.length) timeouts.push(setTimeout(()=>go(Math.min(spd+22, 220)), spd));
      };
      go(48);
    }, startDelay + T.cycle));

    // 3) hold (só dramático): treme na borda
    if (dramatic) {
      timeouts.push(setTimeout(() => {
        setPhase('hold');
        setDisplayValue(finalValue);
        if (!reduced) {
          const jt = setInterval(() => setJitter(j => (j === 0 ? 1.5 : j === 1.5 ? -1.5 : 0)), 60);
          intervalRef.current = jt;
        }
      }, startDelay + T.cycle + T.tease));
    }

    // 4) landing
    timeouts.push(setTimeout(() => {
      clearAll();
      setPhase('landing');
      setDisplayValue(finalValue);
      setJitter(0); setRotX(0); setRotY(0); setRotZ(0);
    }, startDelay + T.cycle + T.tease + (dramatic ? T.hold : 0)));

    // 5) revealed
    timeouts.push(setTimeout(() => setPhase('revealed'),
      startDelay + T.cycle + T.tease + (dramatic ? T.hold : 0) + T.land));

    return () => { timeouts.forEach(clearTimeout); clearAll(); };
  }, []);

  if (phase==='hidden') return <div style={{width:px,height:px}}/>;

  const isCrit   = isMax && sides>=20 && finalValue===sides;
  const isFumble = isMin && sides>=20 && finalValue===1 && !isMax;
  const borderColor = isCrit?'#facc15':isFumble?'#ef4444':colors.border;
  const glowColor   = isCrit?'rgba(250,204,21,0.9)':isFumble?'rgba(239,68,68,0.8)':colors.glow;
  const textColor   = isCrit?'#facc15':isFumble?'#fca5a5':'#ffffff';
  const isRolling   = phase==='cycling'||phase==='slowing';
  const isHold      = phase==='hold';

  const fontSize = displayValue!==null && displayValue>=100 ? px*0.22
    : displayValue!==null && displayValue>=10 ? px*0.33 : px*0.46;

  const t3d = isRolling
    ? `perspective(550px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
    : isHold
    ? `perspective(550px) translateX(${jitter}px) rotateZ(${jitter*0.4}deg) scale(1.04)`
    : phase==='landing'
    ? 'perspective(550px) rotateX(0deg) rotateY(0deg) scale(1.08)'
    : 'perspective(550px) rotateX(0deg) rotateY(0deg) scale(1)';

  return (
    <div style={{
      width:px, height:px, position:'relative',
      animation: phase==='cycling' ? 'die-materialize 0.4s ease both'
               : phase==='landing' ? 'die-land3d 0.42s cubic-bezier(0.34,1.56,0.64,1) both'
               : phase==='revealed'&&(isCrit||isMax) ? 'die-pulse 1.8s ease-in-out infinite' : 'none',
    }}>
      <div style={{
        position:'absolute', inset:-12, borderRadius:'50%',
        background:`radial-gradient(circle,${glowColor} 0%,transparent 65%)`,
        opacity:phase==='revealed'?(isCrit?1:0.6):isHold?0.7:isRolling?0.28:0.45,
        filter:'blur(10px)', pointerEvents:'none', transition:'opacity 0.4s',
      }}/>
      <div style={{
        width:px, height:px,
        transform:t3d,
        transition:phase==='landing'?'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)':isRolling||isHold?'none':'transform 0.3s ease',
        transformStyle:'preserve-3d',
      }}>
        <div style={{
          width:px, height:px, borderRadius:px*0.20,
          background:`linear-gradient(145deg,${colors.face},${colors.bg})`,
          border:`2.5px solid ${borderColor}`,
          boxShadow:`0 0 ${phase==='revealed'?28:isHold?20:12}px ${glowColor},inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.3)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          position:'relative', overflow:'hidden',
          transition:'box-shadow 0.4s',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'45%',background:'linear-gradient(180deg,rgba(255,255,255,0.08),transparent)',borderRadius:`${px*0.18}px ${px*0.18}px 0 0`,pointerEvents:'none'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:isRolling?0.06:0.14,transition:'opacity 0.3s'}}>
            <DieFacePolygon sides={sides} size={px-10} color={borderColor}/>
          </div>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontWeight:900, fontSize,
            color:textColor,
            textShadow:`0 0 16px ${glowColor},0 2px 4px rgba(0,0,0,0.8)`,
            lineHeight:1, position:'relative', zIndex:1,
            letterSpacing:'-0.02em', userSelect:'none',
            transition:isRolling?'none':'color 0.25s',
          }}>
            {displayValue??'?'}
          </span>
          {phase==='revealed'&&isCrit&&<span style={{position:'absolute',top:2,right:4,fontSize:13,color:'#facc15',animation:'die-pulse 0.7s ease-in-out infinite'}}>✦</span>}
        </div>
      </div>
      <div style={{position:'absolute',bottom:-20,left:'50%',transform:'translateX(-50%)',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em',color:colors.text,opacity:0.55,whiteSpace:'nowrap',fontFamily:"'JetBrains Mono',monospace"}}>d{sides}</div>
    </div>
  );
};

const ParticleBurst: React.FC<{color:string;count?:number}> = ({color,count=22}) => (
  <div style={{position:'absolute',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
    {Array.from({length:count},(_,i)=>{
      const angle=(i/count)*360, dist=65+Math.random()*140, sz=3+Math.random()*5;
      const dur=0.5+Math.random()*0.5, del=Math.random()*0.1;
      const rad=angle*(Math.PI/180);
      return <div key={i} style={{position:'absolute',width:sz,height:sz,borderRadius:Math.random()>0.5?'50%':2,background:color,boxShadow:`0 0 5px ${color}`,animation:`particle-fly ${dur}s ${del}s cubic-bezier(0.22,1,0.36,1) both`,'--tx':`${Math.cos(rad)*dist}px`,'--ty':`${Math.sin(rad)*dist}px`} as React.CSSProperties}/>;
    })}
  </div>
);

const RisingEmbers: React.FC<{color:string}> = ({color}) => (
  <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
    {Array.from({length:18},(_,i)=>{
      const left=Math.random()*100, sz=2+Math.random()*4, dur=2+Math.random()*2.5, del=Math.random()*2.5;
      return <div key={i} style={{position:'absolute',bottom:-10,left:`${left}%`,width:sz,height:sz,borderRadius:'50%',background:color,boxShadow:`0 0 6px ${color}`,opacity:0.5,animation:`rising-ember ${dur}s ${del}s linear infinite`} as React.CSSProperties}/>;
    })}
  </div>
);

const STAGGER_MS = STAGGER;

const DiceAnimation: React.FC<DiceAnimationProps> = ({
  isVisible, result, defenderResult, isSuccess, customLabel,
  notation='1d20', individualRolls=[result], numSides=20, bonus=0,
  dramatic=false, onComplete,
}) => {
  const reduced = prefersReducedMotion();
  const isDrama = (dramatic || defenderResult !== undefined);
  const T = isDrama ? TIMING.drama : TIMING.fast;
  const [phase, setPhase] = useState<'buildup'|'rolling'|'burst'|'result'>(isDrama?'buildup':'rolling');
  const [particles, setParticles] = useState(false);
  const [flash, setFlash] = useState(false);
  const numDice  = individualRolls.length;
  const maxRoll  = Math.max(...individualRolls);
  const minRoll  = Math.min(...individualRolls);
  const isCrit   = numSides>=20 && maxRoll===numSides && numDice===1;
  const isFumble = numSides>=20 && maxRoll===1 && numDice===1;

  // Quando o último dado revela (relativo ao início do componente)
  const rollStart = isDrama ? T.buildup : 0;
  const allRevAt = rollStart + (numDice-1)*STAGGER_MS + T.cycle + T.tease + (isDrama?T.hold:0) + T.land;
  const slowmo = isCrit||isFumble ? 220 : 0;
  const totalMs = allRevAt + 320 + slowmo + 2600;

  const resultColor = isCrit?'#facc15':isSuccess?'#34d399':'#f43f5e';
  const glowCss     = isCrit?'rgba(250,204,21,0.3)':isSuccess?'rgba(52,211,153,0.28)':'rgba(244,63,94,0.28)';

  const skip = useCallback(()=>onComplete(),[onComplete]);

  useEffect(()=>{
    if(!isVisible) return;
    setPhase(isDrama?'buildup':'rolling'); setParticles(false); setFlash(false);
    const ts: ReturnType<typeof setTimeout>[] = [];
    if (isDrama) ts.push(setTimeout(()=>setPhase('rolling'), T.buildup));
    ts.push(setTimeout(()=>{ setPhase('burst'); setParticles(true); if(isCrit||isFumble) setFlash(true); }, allRevAt+50+slowmo));
    ts.push(setTimeout(()=>setFlash(false), allRevAt+450+slowmo));
    ts.push(setTimeout(()=>setPhase('result'), allRevAt+280+slowmo));
    ts.push(setTimeout(()=>onComplete(), totalMs));
    return ()=>{ ts.forEach(clearTimeout); };
  },[isVisible]);

  if(!isVisible) return null;

  const dieSize = numDice>=8?'sm':numDice>=5?'md':'lg';
  const label = customLabel?customLabel:isCrit?'Crítico!':isFumble?'Falha!':isSuccess?'Sucesso':'Falhou';
  const isBuild = phase==='buildup';
  const shakeAnim = (isDrama && !reduced && (phase==='rolling')) ? 'screen-shake 0.5s ease-in-out infinite' : 'none';

  return (
    <div onClick={skip} style={{
      position:'fixed',inset:0,zIndex:99999,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      background:`radial-gradient(ellipse at 50% 45%,${glowCss} 0%,rgba(2,4,14,0.97) 65%)`,
      backdropFilter:'blur(8px)',cursor:'pointer',userSelect:'none',padding:'20px',
      animation: shakeAnim,
    }}>
      <style>{`
        @keyframes die-materialize { 0%{opacity:0;transform:scale(0.6);} 100%{opacity:1;transform:scale(1);} }
        @keyframes die-land3d {
          0%   { transform:perspective(550px) rotateX(40deg) rotateY(-30deg) scale(0.7); opacity:0.6; }
          55%  { transform:perspective(550px) rotateX(-6deg) rotateY(4deg) scale(1.12); }
          75%  { transform:perspective(550px) rotateX(3deg) rotateY(-2deg) scale(0.97); }
          100% { transform:perspective(550px) rotateX(0deg) rotateY(0deg) scale(1); opacity:1; }
        }
        @keyframes die-pulse { 0%,100%{transform:scale(1);filter:brightness(1);} 50%{transform:scale(1.07);filter:brightness(1.35);} }
        @keyframes particle-fly { 0%{transform:translate(0,0) scale(1);opacity:1;} 100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0;} }
        @keyframes result-slam { 0%{opacity:0;transform:scale(2.4) translateY(-12px);filter:blur(14px);} 40%{opacity:1;transform:scale(0.92) translateY(4px);filter:blur(0);} 62%{transform:scale(1.07);} 80%{transform:scale(0.97);} 100%{transform:scale(1);} }
        @keyframes sub-appear { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes vs-pop { from{opacity:0;transform:scale(0.4) rotate(-15deg);} to{opacity:1;transform:scale(1) rotate(0deg);} }
        @keyframes progress-drain { from{width:100%;} to{width:0%;} }
        @keyframes roll-label { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes hint-in { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
        @keyframes suspense-heartbeat { 0%,100%{transform:scale(1);opacity:0.5;} 30%{transform:scale(1.18);opacity:0.85;} 45%{transform:scale(1.02);} 60%{transform:scale(1.12);opacity:0.7;} }
        @keyframes screen-shake { 0%,100%{transform:translate(0,0);} 25%{transform:translate(1.5px,-1px);} 50%{transform:translate(-1.5px,1px);} 75%{transform:translate(1px,1.5px);} }
        @keyframes buildup-label { 0%{opacity:0;letter-spacing:0.2em;transform:scale(0.85);} 100%{opacity:1;letter-spacing:0.65em;transform:scale(1);} }
        @keyframes vignette-close { from{box-shadow:inset 0 0 0px 0px rgba(0,0,0,0);} to{box-shadow:inset 0 0 220px 60px rgba(0,0,0,0.85);} }
        @keyframes rising-ember { 0%{transform:translateY(0) scale(1);opacity:0;} 15%{opacity:0.6;} 100%{transform:translateY(-100vh) scale(0.3);opacity:0;} }
        @keyframes crit-flash { 0%{opacity:0;} 12%{opacity:0.55;} 100%{opacity:0;} }
      `}</style>

      {/* Vinheta escalando (dramático) */}
      {isDrama && (phase==='buildup'||phase==='rolling') && (
        <div style={{position:'absolute',inset:0,pointerEvents:'none',animation:'vignette-close 1.6s ease-out both'}}/>
      )}
      {/* Brasas subindo (dramático, durante o giro) */}
      {isDrama && phase==='rolling' && <RisingEmbers color={isSuccess?'#fbbf24':'#fb7185'}/>}
      {/* Flash de crit/falha */}
      {flash && <div style={{position:'absolute',inset:0,pointerEvents:'none',background:isCrit?'#facc15':'#ef4444',animation:'crit-flash 0.45s ease-out both'}}/>}

      <div style={{position:'absolute',bottom:24,fontSize:10,fontWeight:700,letterSpacing:'0.4em',color:'rgba(255,255,255,0.18)',textTransform:'uppercase',animation:'hint-in 0.4s 1.8s both'}}>Clique para pular</div>

      {/* Build-up: orbe pulsando + label crescendo */}
      {isBuild && (
        <>
          <div style={{position:'absolute',width:180,height:180,borderRadius:'50%',background:`radial-gradient(circle,${glowCss.replace('0.28','0.5').replace('0.3','0.5')} 0%,transparent 70%)`,animation:'suspense-heartbeat 0.9s ease-in-out infinite'}}/>
          <p style={{fontSize:14,fontWeight:900,color:'#7c3aed',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace",animation:'buildup-label 1s ease-out both',zIndex:1}}>⚔ Desafiando o Destino ⚔</p>
        </>
      )}

      {phase==='rolling'&&(
        <p style={{fontSize:13,fontWeight:900,letterSpacing:'0.65em',marginBottom:48,color:'#7c3aed',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace",animation:'roll-label 1.4s ease-in-out infinite'}}>⚔ Desafiando o Destino ⚔</p>
      )}

      {!isBuild && (
      <div style={{position:'relative'}}>
        {particles&&<ParticleBurst color={isCrit?'#facc15':isSuccess?'#34d399':'#f43f5e'} count={isCrit?40:isFumble?34:22}/>}
        <div style={{display:'flex',flexWrap:'wrap',gap:dieSize==='sm'?16:22,justifyContent:'center',maxWidth:dieSize==='sm'?520:640,marginBottom:defenderResult!==undefined?28:52,paddingBottom:28}}>
          {individualRolls.map((roll,idx)=>(
            <SingleDie key={idx} sides={numSides} finalValue={roll} size={dieSize} startDelay={idx*STAGGER_MS} dramatic={isDrama} reduced={reduced} isMax={numDice>1&&roll===maxRoll} isMin={numDice>1&&roll===minRoll&&minRoll!==maxRoll}/>
          ))}
        </div>
        {bonus!==0&&phase!=='rolling'&&(
          <div style={{textAlign:'center',marginTop:-6,marginBottom:6,fontSize:14,fontWeight:900,letterSpacing:'0.1em',color:bonus>0?'#86efac':'#fca5a5',fontFamily:"'JetBrains Mono',monospace",animation:'sub-appear 0.35s 0.1s both'}}>
            {bonus>0?`+${bonus} bônus`:`${bonus} penalidade`}
          </div>
        )}
        {numDice>1&&phase!=='rolling'&&(
          <div style={{textAlign:'center',marginBottom:4,fontSize:11,fontWeight:700,letterSpacing:'0.3em',color:'rgba(255,255,255,0.28)',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace",animation:'sub-appear 0.35s 0.2s both'}}>
            {individualRolls.join(' + ')}{bonus!==0?(bonus>0?` + ${bonus}`:` ${bonus}`):''}
            {' = '}<span style={{color:'rgba(255,255,255,0.65)'}}>{result}</span>
          </div>
        )}
      </div>
      )}

      {defenderResult!==undefined&&phase!=='rolling'&&!isBuild&&(
        <div style={{display:'flex',alignItems:'center',gap:36,marginBottom:44}}>
          <div style={{fontSize:44,fontWeight:900,fontStyle:'italic',color:'rgba(255,255,255,0.2)',animation:'vs-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both'}}>VS</div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            <span style={{fontSize:10,fontWeight:900,letterSpacing:'0.5em',color:'#94a3b8',textTransform:'uppercase'}}>Defesa do Alvo</span>
            <div style={{width:92,height:92,borderRadius:20,background:!isSuccess?'#14532d':'#2e1065',border:`3px solid ${!isSuccess?'#22c55e':'#a855f7'}`,boxShadow:!isSuccess?'0 0 28px rgba(34,197,94,0.55)':'0 0 28px rgba(168,85,247,0.45)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',animation:'die-land3d 0.4s cubic-bezier(0.34,1.56,0.64,1) both'}}>
              <Shield style={{position:'absolute',top:-10,right:-10,width:22,height:22,color:'#a78bfa',filter:'drop-shadow(0 0 6px rgba(167,139,250,0.8))'}}/>
              <span style={{fontSize:34,fontWeight:900,color:'#fff',fontFamily:"'JetBrains Mono',monospace",textShadow:'0 0 18px rgba(255,255,255,0.5)'}}>{defenderResult}</span>
            </div>
          </div>
        </div>
      )}

      {phase==='result'&&(
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'clamp(3.5rem,11vw,8.5rem)',fontWeight:900,fontStyle:'italic',textTransform:'uppercase',lineHeight:1,letterSpacing:'-0.03em',color:resultColor,textShadow:`0 0 70px ${resultColor},0 0 120px ${resultColor}50`,animation:'result-slam 0.5s cubic-bezier(0.22,1,0.36,1) both'}}>
            {label}
          </div>
          {!customLabel&&(
            <div style={{marginTop:14,fontSize:20,fontWeight:900,color:'rgba(255,255,255,0.4)',fontFamily:"'JetBrains Mono',monospace",letterSpacing:'0.08em',animation:'sub-appear 0.3s 0.15s both'}}>
              {notation}<span style={{color:'rgba(255,255,255,0.2)'}}> → </span><span style={{color:'rgba(255,255,255,0.85)'}}>{result}</span>
            </div>
          )}
          {isCrit&&<div style={{marginTop:10,fontSize:12,fontWeight:900,letterSpacing:'0.55em',color:'#fde68a',textTransform:'uppercase',animation:'roll-label 0.9s infinite'}}>✦ Resultado Máximo! ✦</div>}
          {isFumble&&<div style={{marginTop:10,fontSize:12,fontWeight:900,letterSpacing:'0.55em',color:'#fca5a5',textTransform:'uppercase',animation:'roll-label 0.9s infinite'}}>✦ Falha Crítica! ✦</div>}
        </div>
      )}

      {phase==='result'&&(
        <div style={{width:'100%',maxWidth:440,height:3,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden',marginTop:36}}>
          <div style={{height:'100%',borderRadius:99,background:resultColor,boxShadow:`0 0 8px ${resultColor}`,animation:`progress-drain ${Math.max(800, totalMs-allRevAt-slowmo-400)}ms linear both`,width:'100%'}}/>
        </div>
      )}
    </div>
  );
};

export default DiceAnimation;
```

- [ ] **Step 2: Checkpoint**

Run: `npm run build` && `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: build OK; tsc ≤ 29 (sem novos erros).

---

## Task 3: Verificação final

- [ ] **Step 1: Build + tsc**

Run: `npm run build` && `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: build OK; tsc ≤ 29.

- [ ] **Step 2: Roteiro de verificação visual (usuário)**

1. Combate ativo → usar item/selo **com CD** (`combatDc`/`dc` > 0) → deve haver build-up (orbe pulsando + label crescendo), giro com vinheta/brasas/leve shake, tease com números perto do final, pausa com tremor, e revelação.
2. Rolagem avulsa (aba Extras / quick roll d20) → deve ser **rápida**, sem build-up.
3. Forçar um crit (d20=20) e um fumble (d20=1) numa rolagem com CD → payoff extra (burst maior, flash dourado/vermelho, leve slow-mo).
4. Conferir com `prefers-reduced-motion` ativo (config do SO) → sem tremor de tela/jitter, demais transições suaves.
5. "Clique para pular" funciona em qualquer fase.

---

## Notas
- Sem git: checkpoints via `npm run build`.
- Baseline tsc = 29; não introduzir novos erros.
- Toda a feature vive em `components/DiceAnimation.tsx` + fiação mínima no `App.tsx`.
- O `defenderResult` continua suportado (auto-ativa dramático), embora não seja setado por nenhum call site hoje.
