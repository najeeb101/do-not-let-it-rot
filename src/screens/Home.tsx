import type { ReactNode } from 'react';
import { strings } from '../content/strings';
import type { ModeId } from '../engine/types';
import type { SaveV1 } from '../lib/storage';
import { GearIcon, GridIcon, MathIcon, PiIcon } from '../ui/icons';
import { RotMeter } from '../ui/RotMeter';

type Props = {
  save: SaveV1;
  onPlay: (mode: ModeId) => void;
  onSettings: () => void;
  onCredits: () => void;
};

const cards: { id: ModeId; icon: ReactNode }[] = [
  { id: 'visualMemory', icon: <GridIcon /> },
  { id: 'speedMath', icon: <MathIcon /> },
  { id: 'piChallenge', icon: <PiIcon /> },
];

export function Home({ save, onPlay, onSettings, onCredits }: Props) {
  return (
    <main className="screen">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSettings}
          aria-label={strings.home.openSettings}
          title={strings.home.openSettings}
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-text"
        >
          <GearIcon />
        </button>
      </div>

      <div className="flex-[0.4]" />
      <div className="flex flex-col items-center gap-2 text-center">
        <RotMeter stage={0} size={128} className="anim-breathe" label="Healthy brain" />
        <h1 className="num mt-2 text-[32px] leading-10">{strings.appName}</h1>
        <p className="text-muted">{strings.tagline}</p>
      </div>
      <div className="flex-[0.7]" />

      <nav className="flex flex-col gap-3" aria-label={strings.home.modes}>
        {cards.map((c) => {
          const m = strings.modes[c.id];
          const best = save.bests[c.id];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPlay(c.id)}
              className="flex min-h-[88px] items-center gap-3 rounded-[20px] border-2 border-border bg-surface p-4 text-left active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink">
                {c.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-lg font-semibold leading-6">{m.name}</span>
                <span className="text-sm text-muted">{m.hint}</span>
              </span>
              <span className="flex flex-col items-end">
                <span className="text-xs text-muted">{strings.best}</span>
                <span className="num text-[32px] leading-9 text-ink">{best > 0 ? best : strings.noScore}</span>
                {c.id === 'piChallenge' && best > 0 && (
                  <span className="-mt-1 text-xs text-muted">{strings.digitsUnit}</span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex-[0.6]" />
      <button type="button" onClick={onCredits} className="mx-auto min-h-11 px-3 text-xs text-muted">
        {strings.conceptBy} {strings.friendName} | {strings.version}
      </button>
    </main>
  );
}
