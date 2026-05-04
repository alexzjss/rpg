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

interface SingleDieProps {
  sides:number; finalValue:number; size:'sm'|'md'|'lg';
  delay:number; revealAt:number; isMax:boolean; isMin:boolean;
}

const SingleDie: React.FC<SingleDieProps> = ({ sides, finalValue, size, delay, revealAt, isMax, isMin }) => {
  const [displayValue, setDisplayValue] = useState<number|null>(null);
  const [phase, setPhase] = useState<'hidden'|'cycling'|'slowing'|'landing'|'revealed'>('hidden');
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const rotRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const colors = getDieColors(sides);
  const px = size==='lg'?130:size==='md'?92:66;

  const clearAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rotRef.current) clearInterval(rotRef.current);
  };

  useEffect(() => {
    const startT = setTimeout(() => {
      setPhase('cycling');
      setDisplayValue(Math.floor(Math.random()*sides)+1);
      intervalRef.current = setInterval(() => setDisplayValue(Math.floor(Math.random()*sides)+1), 38);
      let rx=Math.random()*360, ry=Math.random()*360, rz=0;
      const drx=14+Math.random()*24, dry=18+Math.random()*28;
      rotRef.current = setInterval(() => {
        rx+=drx; ry+=dry; rz+=2.5;
        setRotX(rx); setRotY(ry); setRotZ(rz);
      }, 30);
    }, delay);

    const slowT = setTimeout(() => {
      setPhase('slowing');
      clearAll();
      const allVals = Array.from({length:sides},(_,i)=>i+1);
      const shuffled = [...allVals].sort(()=>Math.random()-0.5).filter(v=>v!==finalValue);
      const seq = [...shuffled.slice(0, Math.min(sides-1, 9)), finalValue];
      let step=0;
      const go = (spd:number) => {
        if (step>=seq.length) return;
        setDisplayValue(seq[step]);
        setRotX(r=>r+7); setRotY(r=>r+9);
        step++;
        if (step<seq.length) setTimeout(()=>go(Math.min(spd+20, 210)), spd);
      };
      go(52);
    }, revealAt-750);

    const landT = setTimeout(() => {
      clearAll();
      setPhase('landing');
      setDisplayValue(finalValue);
      setRotX(0); setRotY(0); setRotZ(0);
    }, revealAt-80);

    const revT = setTimeout(() => setPhase('revealed'), revealAt+260);

    return () => {
      clearTimeout(startT); clearTimeout(slowT); clearTimeout(landT); clearTimeout(revT);
      clearAll();
    };
  }, []);

  if (phase==='hidden') return <div style={{width:px,height:px}}/>;

  const isCrit   = isMax && sides>=20 && finalValue===sides;
  const isFumble = isMin && sides>=20 && finalValue===1 && !isMax;
  const borderColor = isCrit?'#facc15':isFumble?'#ef4444':colors.border;
  const glowColor   = isCrit?'rgba(250,204,21,0.9)':isFumble?'rgba(239,68,68,0.8)':colors.glow;
  const textColor   = isCrit?'#facc15':isFumble?'#fca5a5':'#ffffff';
  const isRolling   = phase==='cycling'||phase==='slowing';

  const fontSize = displayValue!==null && displayValue>=100 ? px*0.22
    : displayValue!==null && displayValue>=10 ? px*0.33 : px*0.46;

  const t3d = isRolling
    ? `perspective(550px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
    : phase==='landing'
    ? 'perspective(550px) rotateX(0deg) rotateY(0deg) scale(1.08)'
    : 'perspective(550px) rotateX(0deg) rotateY(0deg) scale(1)';

  return (
    <div style={{
      width:px, height:px, position:'relative',
      animation: phase==='landing' ? 'die-land3d 0.42s cubic-bezier(0.34,1.56,0.64,1) both'
               : phase==='revealed'&&(isCrit||isMax) ? 'die-pulse 1.8s ease-in-out infinite' : 'none',
    }}>
      <div style={{
        position:'absolute', inset:-12, borderRadius:'50%',
        background:`radial-gradient(circle,${glowColor} 0%,transparent 65%)`,
        opacity:phase==='revealed'?(isCrit?1:0.6):isRolling?0.28:0.45,
        filter:'blur(10px)', pointerEvents:'none', transition:'opacity 0.4s',
      }}/>
      <div style={{
        width:px, height:px,
        transform:t3d,
        transition:phase==='landing'?'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)':isRolling?'none':'transform 0.3s ease',
        transformStyle:'preserve-3d',
      }}>
        <div style={{
          width:px, height:px, borderRadius:px*0.20,
          background:`linear-gradient(145deg,${colors.face},${colors.bg})`,
          border:`2.5px solid ${borderColor}`,
          boxShadow:`0 0 ${phase==='revealed'?28:12}px ${glowColor},inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.3)`,
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

const ROLL_DUR = 1600;
const STAGGER  = 170;
const TOTAL_MS = 5400;

const DiceAnimation: React.FC<DiceAnimationProps> = ({
  isVisible, result, defenderResult, isSuccess, customLabel,
  notation='1d20', individualRolls=[result], numSides=20, bonus=0,
  onComplete,
}) => {
  const [phase, setPhase]         = useState<'rolling'|'burst'|'result'>('rolling');
  const [particles, setParticles] = useState(false);
  const numDice  = individualRolls.length;
  const maxRoll  = Math.max(...individualRolls);
  const minRoll  = Math.min(...individualRolls);
  const isCrit   = numSides>=20 && maxRoll===numSides && numDice===1;
  const isFumble = numSides>=20 && maxRoll===1 && numDice===1;
  const allRevAt = ROLL_DUR + (numDice-1)*STAGGER + 320;
  const resultColor = isCrit?'#facc15':isSuccess?'#34d399':'#f43f5e';
  const glowCss     = isCrit?'rgba(250,204,21,0.3)':isSuccess?'rgba(52,211,153,0.28)':'rgba(244,63,94,0.28)';

  const skip = useCallback(()=>onComplete(),[onComplete]);

  useEffect(()=>{
    if(!isVisible) return;
    setPhase('rolling'); setParticles(false);
    const bt=setTimeout(()=>{setPhase('burst');setParticles(true);}, allRevAt+50);
    const rt=setTimeout(()=>setPhase('result'), allRevAt+280);
    const dt=setTimeout(()=>onComplete(), TOTAL_MS);
    return ()=>{clearTimeout(bt);clearTimeout(rt);clearTimeout(dt);};
  },[isVisible]);

  if(!isVisible) return null;

  const dieSize = numDice>=8?'sm':numDice>=5?'md':'lg';
  const label = customLabel?customLabel:isCrit?'Crítico!':isFumble?'Falha!':isSuccess?'Sucesso':'Falhou';

  return (
    <div onClick={skip} style={{
      position:'fixed',inset:0,zIndex:99999,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      background:`radial-gradient(ellipse at 50% 45%,${glowCss} 0%,rgba(2,4,14,0.97) 65%)`,
      backdropFilter:'blur(8px)',cursor:'pointer',userSelect:'none',padding:'20px',
    }}>
      <style>{`
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
      `}</style>

      <div style={{position:'absolute',bottom:24,fontSize:10,fontWeight:700,letterSpacing:'0.4em',color:'rgba(255,255,255,0.18)',textTransform:'uppercase',animation:'hint-in 0.4s 1.8s both'}}>Clique para pular</div>

      {phase==='rolling'&&(
        <p style={{fontSize:13,fontWeight:900,letterSpacing:'0.65em',marginBottom:48,color:'#7c3aed',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace",animation:'roll-label 1.4s ease-in-out infinite'}}>⚔ Desafiando o Destino ⚔</p>
      )}

      <div style={{position:'relative'}}>
        {particles&&<ParticleBurst color={isCrit?'#facc15':isSuccess?'#34d399':'#f43f5e'} count={isCrit?34:22}/>}
        <div style={{display:'flex',flexWrap:'wrap',gap:dieSize==='sm'?16:22,justifyContent:'center',maxWidth:dieSize==='sm'?520:640,marginBottom:defenderResult!==undefined?28:52,paddingBottom:28}}>
          {individualRolls.map((roll,idx)=>(
            <SingleDie key={idx} sides={numSides} finalValue={roll} size={dieSize} delay={idx*80} revealAt={ROLL_DUR+idx*STAGGER} isMax={numDice>1&&roll===maxRoll} isMin={numDice>1&&roll===minRoll&&minRoll!==maxRoll}/>
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

      {defenderResult!==undefined&&phase!=='rolling'&&(
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
          <div style={{height:'100%',borderRadius:99,background:resultColor,boxShadow:`0 0 8px ${resultColor}`,animation:`progress-drain ${TOTAL_MS-allRevAt-200}ms linear both`,width:'100%'}}/>
        </div>
      )}
    </div>
  );
};

export default DiceAnimation;
