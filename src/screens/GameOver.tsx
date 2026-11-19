import { strings } from '../content/strings';
import type { GameOverTier } from '../engine/session';
import type { ModeId } from '../engine/types';
import { Button } from '../ui/Button';
import { RotMeter } from '../ui/RotMeter';

export type GameOverData = {
  mode: ModeId;
  score: number;
  bestStreak: number;
  previousBest: number;
  newBest: boolean;
  tier: GameOverTier;
  detail?: { typed: string; expected: string };
};

type Props = { data: GameOverData; onRetry: () => void; onMenu: () => void };

export function GameOver({ data, onRetry, onMenu }: Props) {
  /** Pi has no lives, so its brain reflects the score instead of a fixed rotten one. */
  const healthy = data.mode === 'piChallenge' && (data.newBest || data.tier === 'high');
  const line = data.newBest ? strings.gameOver.newBestLine : strings.gameOver[data.tier];
  return (
    <main className="screen justify-center gap-4">
      <p className="num text-center text-sm uppercase tracking-widest text-muted">{strings.modes[data.mode].name}</p>

      <section className="flex flex-col items-center gap-2 rounded-[20px] border-2 border-border bg-surface p-5 text-center">
        <RotMeter stage={healthy ? 0 : 3} size={80} label={healthy ? 'Healthy brain' : 'Rotten brain'} />
        <h1 className="num max-w-[260px] text-2xl leading-8">{line}</h1>
        <p className="num text-[72px] leading-none text-ink" data-testid="final-score">
          {data.score}
        </p>
        {data.mode === 'piChallenge' && <p className="-mt-2 text-muted">{strings.digitsUnit}</p>}
        {data.detail && <p className="text-sm text-muted">{strings.pi.typedWrong(data.detail.typed, data.detail.expected)}</p>}
        {data.newBest && (
          <span className="num rounded-full border-2 border-edge bg-accent px-3 py-0.5 text-sm text-on-accent">
            {strings.gameOver.newBest}
          </span>
        )}
        <dl className="mt-2 grid w-full grid-cols-[1fr_auto] gap-y-1 text-left">
          {data.mode !== 'piChallenge' && (
            <>
              <dt className="text-muted">{strings.gameOver.bestStreak}</dt>
              <dd className="num">{data.bestStreak}</dd>
            </>
          )}
          <dt className="text-muted">{data.newBest ? strings.gameOver.previousBest : strings.gameOver.personalBest}</dt>
          <dd className="num">{data.previousBest}</dd>
        </dl>
      </section>

      <div className="flex flex-col gap-3">
        <Button onClick={onRetry}>{strings.gameOver.retry}</Button>
        <Button variant="secondary" onClick={onMenu}>
          {strings.gameOver.menu}
        </Button>
      </div>
    </main>
  );
}
