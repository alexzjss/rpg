import React, { useMemo } from 'react';
import {
  AnimFxStyles,
  deriveTier,
  getJuice,
  getPacing,
  prefersReducedMotion,
  RESULT_TONES,
  useAnimSequence,
} from './combat/animFx';

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

type DicePhase = 'rolls' | 'result';

function rollBreakdown(individualRolls: number[], bonus: number): string {
  const body = individualRolls.join(' + ');
  if (bonus > 0) return `${body} + ${bonus}`;
  if (bonus < 0) return `${body} - ${Math.abs(bonus)}`;
  return body;
}

const DiceAnimation: React.FC<DiceAnimationProps> = ({
  isVisible,
  result,
  defenderResult,
  isSuccess,
  customLabel,
  notation = '1d20',
  individualRolls = [result],
  numSides = 20,
  bonus = 0,
  dramatic = false,
  onComplete,
}) => {
  const reduced = prefersReducedMotion();
  const safeResult = Number.isFinite(result) ? result : 0;
  const safeSides = Math.max(1, numSides || 20);

  const isCrit = individualRolls.length === 1 && safeSides >= 4 && individualRolls[0] >= safeSides;
  const isFumble = individualRolls.length === 1 && safeSides >= 4 && individualRolls[0] === 1;
  const hasDefender = defenderResult !== undefined;

  const tier = deriveTier({ dramatic, hasReaction: hasDefender, isCrit, isFumble });
  const pacing = getPacing(tier, reduced);

  const kind = isCrit ? 'crit' : isFumble ? 'fumble' : isSuccess ? 'hit' : 'miss';
  const juice = getJuice(kind, reduced);
  const toneKey = isCrit ? 'crit' : isFumble ? 'fumble' : isSuccess ? 'hit' : 'miss';
  const tone = RESULT_TONES[toneKey];

  const label = customLabel || (isCrit ? 'CRITICO' : isFumble ? 'FALHA' : isSuccess ? 'SUCESSO' : 'FALHOU');

  const steps = useMemo(() => ([
    { phase: 'rolls' as DicePhase, delay: 0 },
    { phase: 'result' as DicePhase, delay: pacing.rollsShown },
  ]), [pacing.rollsShown]);

  const { phase, skip } = useAnimSequence<DicePhase>({
    steps,
    tailMs: pacing.resultShown,
    runKey: isVisible ? `${safeResult}|${defenderResult ?? ''}|${notation}` : null,
    onComplete,
    active: isVisible,
  });

  if (!isVisible) return null;

  const showResult = phase === 'result';
  const flash = showResult && juice.flash;

  return (
    <div
      className={`mp-dicelite ${showResult && juice.shakePx > 0 ? 'mp-fx-shake' : ''}`}
      style={{
        ['--fx-shake' as any]: `${juice.shakePx}px`,
        ['--dl-tone' as any]: tone,
      } as React.CSSProperties}
      onClick={skip}
    >
      <AnimFxStyles />
      {flash && <div className="mp-fx-flash" style={{ ['--fx-flash-color' as any]: tone } as React.CSSProperties} />}
      <style>{`
        .mp-dicelite {
          position: fixed;
          inset: 0;
          z-index: 99990;
          display: grid;
          place-items: center;
          gap: 18px;
          cursor: pointer;
          color: #fff7d6;
          font-family: "Inter", "Rajdhani", system-ui, sans-serif;
          background:
            radial-gradient(circle at 50% 44%, color-mix(in srgb, var(--dl-tone) 22%, transparent), transparent 36%),
            linear-gradient(110deg, rgba(4,7,14,0.4), rgba(5,8,12,0.62));
          animation: mp-dicelite-in 160ms ease-out both;
        }
        @keyframes mp-dicelite-in { from { opacity: 0; } to { opacity: 1; } }

        .mp-dicelite__panel {
          position: relative;
          min-width: min(300px, 80vw);
          padding: 26px 34px 22px;
          display: grid;
          justify-items: center;
          gap: 8px;
          clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%);
          border: 2px solid color-mix(in srgb, var(--dl-tone) 72%, rgba(255,255,255,0.12));
          background:
            linear-gradient(160deg, color-mix(in srgb, var(--dl-tone) 26%, transparent), transparent 42%),
            rgba(8,10,16,0.92);
          box-shadow: 0 22px 70px rgba(0,0,0,0.6), inset 0 0 36px rgba(255,255,255,0.04);
          animation: mp-dicelite-pop 360ms cubic-bezier(0.2, 1, 0.24, 1) both;
        }
        @keyframes mp-dicelite-pop {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        .mp-dicelite__label {
          font-size: 11px; font-weight: 1000; letter-spacing: 0.2em;
          text-transform: uppercase; color: color-mix(in srgb, var(--dl-tone) 80%, #fff);
        }
        .mp-dicelite__notation {
          font-size: 12px; font-weight: 900; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.6);
        }
        .mp-dicelite__number {
          font-size: clamp(64px, 11vw, 120px); line-height: 0.86; font-weight: 1000;
          color: #fff; text-shadow: 0 0 30px var(--dl-tone);
          animation: mp-dicelite-num 520ms cubic-bezier(0.2, 1.7, 0.25, 1) both;
        }
        @keyframes mp-dicelite-num {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          65% { transform: scale(1.16) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .mp-dicelite__breakdown {
          font-size: 12px; font-weight: 800; letter-spacing: 0.08em;
          color: rgba(255,255,255,0.6); text-transform: uppercase;
          display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
        }
        .mp-dicelite__vs {
          margin-top: 6px; font-size: 13px; font-weight: 1000;
          letter-spacing: 0.12em; text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) {
          .mp-dicelite, .mp-dicelite *, .mp-dicelite__panel, .mp-dicelite__number {
            animation-duration: 1ms !important;
          }
        }
      `}</style>

      <div className="mp-dicelite__panel">
        <span className="mp-dicelite__label">{showResult ? label : 'Rolando'}</span>
        <span className="mp-dicelite__notation">{notation}</span>
        <span className="mp-dicelite__number">{safeResult}</span>
        <div className="mp-dicelite__breakdown">
          <span>{rollBreakdown(individualRolls, bonus)}</span>
          {hasDefender && <span>DEF {defenderResult}</span>}
        </div>
        {hasDefender && (
          <div className="mp-dicelite__vs" style={{ color: tone }}>
            {safeResult > (defenderResult as number) ? 'AÇÃO VENCE' : 'DEFESA SEGURA'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceAnimation;
