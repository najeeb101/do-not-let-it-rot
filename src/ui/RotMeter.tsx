import type { RotStage } from '../engine/rot';

const BRAIN =
  'M32 8C26 4 16 6 13 14C7 15 4 22 6 28C2 32 3 41 9 44C10 51 18 56 25 53C28 57 36 57 39 53C46 56 54 51 55 44C61 41 62 32 58 28C60 22 57 15 51 14C48 6 38 4 32 8Z';
const FOLD = 'M32 9C30 20 34 30 32 40C31 46 33 50 32 54';
const SQUIGGLES = 'M14 24C18 22 20 26 24 24M12 36C16 34 19 38 23 36M50 24C46 22 44 26 40 24M52 36C48 34 45 38 41 36';
const X_EYES = 'M17 28L24 35M24 28L17 35M40 28L47 35M47 28L40 35';
const SPARKLE = 'M57 2L58.6 6.4L63 8L58.6 9.6L57 14L55.4 9.6L51 8L55.4 6.4Z';

const line = { stroke: '#0E1116', strokeWidth: 2, strokeLinecap: 'round', fill: 'none' } as const;

function Drip() {
  return (
    <g className="rot-drip">
      <path d="M32 55V60" stroke="#6FA33A" strokeWidth={3} strokeLinecap="round" />
      <circle cx={32} cy={61.5} r={2} fill="#6FA33A" />
    </g>
  );
}

function Face({ stage }: { stage: RotStage }) {
  return (
    <>
      <path d={BRAIN} fill={`var(--rot-${stage})`} stroke="var(--text)" strokeWidth={2.5} strokeLinejoin="round" />
      {stage < 3 && (
        <>
          <path d={FOLD} {...line} />
          <path d={SQUIGGLES} {...line} />
        </>
      )}
      {stage === 0 && <path d={SPARKLE} fill="var(--accent)" stroke="var(--text)" strokeWidth={1.2} strokeLinejoin="round" />}
      {stage === 1 && <circle cx={20} cy={31} r={3.5} fill="#3B2A18" />}
      {stage === 2 && (
        <>
          <circle cx={20} cy={31} r={3.5} fill="#3B2A18" />
          <circle cx={45} cy={24} r={3} fill="#3B2A18" />
          <circle cx={37} cy={44} r={2.5} fill="#3B2A18" />
          <Drip />
          <g className="rot-flies">
            <circle cx={55} cy={53} r={1.7} fill="var(--text)" />
            <circle cx={58.6} cy={50} r={1.7} fill="var(--text)" />
          </g>
        </>
      )}
      {stage === 3 && (
        <g transform="translate(0 4.5) scale(1 0.92)">
          <circle cx={15} cy={21} r={4.5} fill="#3B2A18" />
          <circle cx={48} cy={22} r={4.5} fill="#3B2A18" />
          <circle cx={19} cy={44} r={5} fill="#3B2A18" />
          <circle cx={42} cy={45} r={3.5} fill="#3B2A18" />
          <path d={FOLD} {...line} />
          <path d={X_EYES} {...line} />
          <path d="M25 47Q32 42 39 47" {...line} />
          <Drip />
        </g>
      )}
    </>
  );
}

type Props = {
  stage: RotStage;
  size: number;
  /** HUD variant: shows life dots under the brain. */
  lives?: number;
  className?: string;
  label?: string;
};

export function RotMeter({ stage, size, lives, className, label }: Props) {
  const hud = lives !== undefined;
  const h = hud ? (size * 78) / 64 : size;
  return (
    <svg
      viewBox={hud ? '0 0 64 78' : '0 0 64 64'}
      width={size}
      height={h}
      className={className}
      role="img"
      aria-label={label ?? `Rot stage ${stage}`}
    >
      <Face stage={stage} />
      {hud &&
        [22, 32, 42].map((x, i) =>
          i < (lives as number) ? (
            <circle key={x} cx={x} cy={71} r={3.4} fill="var(--text)" />
          ) : (
            <circle key={x} cx={x} cy={71} r={2.8} fill="none" stroke="var(--text)" strokeWidth={1.6} />
          ),
        )}
    </svg>
  );
}
