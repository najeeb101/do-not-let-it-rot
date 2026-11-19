import { strings } from '../content/strings';
import type { GameOverTier } from '../engine/session';
import { Button } from '../ui/Button';
import { RotMeter } from '../ui/RotMeter';

export type GameOverData = {
  score: number;
  bestStreak: number;
  previousBest: number;
  newBest: boolean;
  tier: GameOverTier;
};

type Props = { data: GameOverData; onRetry: () => void; onMenu: () => void };

export function GameOver({ data, onRetry, onMenu }: Props) {
  const line = data.newBest ? strings.gameOver.newBestLine : strings.gameOver[data.tier];
  return (
    <main className="screen justify-center gap-6">
      <p className="num text-center text-sm uppercase tracking-widest text-muted">{strings.modes.speedMath.name}</p>

      <section className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-border bg-surface p-6 text-center">
        <RotMeter stage={3} size={80} label="Rotten brain" />
        <h1 className="num max-w-[260px] text-2xl leading-8">{line}</h1>
        <p className="num text-[72px] leading-none text-ink" data-testid="final-score">
          {data.score}
        </p>
        {data.newBest && (
          <span className="num rounded-full border-2 border-edge bg-accent px-3 py-0.5 text-sm text-on-accent">
            {strings.gameOver.newBest}
          </span>
        )}
        <dl className="mt-2 grid w-full grid-cols-[1fr_auto] gap-y-1 text-left">
          <dt className="text-muted">{strings.gameOver.bestStreak}</dt>
          <dd className="num">{data.bestStreak}</dd>
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
