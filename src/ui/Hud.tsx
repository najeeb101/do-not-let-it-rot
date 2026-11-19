import { strings } from '../content/strings';
import type { RotStage } from '../engine/rot';
import { PauseIcon, SparkIcon } from './icons';
import { RotMeter } from './RotMeter';

type Props = {
  stage: RotStage;
  lives: number;
  score: number;
  multiplier: number;
  onPause: () => void;
};

export function Hud({ stage, lives, score, multiplier, onPause }: Props) {
  return (
    <header className="flex h-14 items-center gap-3">
      <RotMeter stage={stage} size={40} lives={lives} label={strings.hud.lives(lives)} />
      <div className="flex min-w-0 flex-1 flex-col leading-none">
        <span className="text-xs uppercase tracking-wider text-muted">{strings.hud.score}</span>
        <span className="num text-[28px] leading-8" aria-live="off">
          {score}
        </span>
      </div>
      {multiplier >= 2 && (
        <span
          key={multiplier}
          className={`num anim-pop flex h-8 items-center gap-1 rounded-full border-2 border-edge bg-accent px-2.5 text-sm text-on-accent`}
          aria-label={strings.hud.streak(multiplier)}
        >
          <SparkIcon size={14} />x{multiplier}
        </span>
      )}
      <button
        type="button"
        onClick={onPause}
        aria-label={strings.hud.pause}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-surface-2`}
      >
        <PauseIcon size={22} />
      </button>
    </header>
  );
}
