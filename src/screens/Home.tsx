import type { ReactNode } from 'react';
import { strings } from '../content/strings';
import type { ModeId } from '../engine/types';
import type { SaveV1 } from '../lib/storage';
import { GearIcon, GridIcon, MathIcon, PiIcon } from '../ui/icons';
import { RotMeter } from '../ui/RotMeter';

type Props = {
  save: SaveV1;
  onPlay: (mode: 'speedMath') => void;
  onTheme: () => void;
};

const cards: { id: ModeId; icon: ReactNode; playable: boolean }[] = [
  { id: 'visualMemory', icon: <GridIcon />, playable: false },
  { id: 'speedMath', icon: <MathIcon />, playable: true },
  { id: 'piChallenge', icon: <PiIcon />, playable: false },
];

export function Home({ save, onPlay, onTheme }: Props) {
  return (
    <main className="screen">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onTheme}
          aria-label={strings.theme[save.settings.theme]}
          title={strings.theme[save.settings.theme]}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted"
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

      <nav className="flex flex-col gap-3" aria-label="Game modes">
        {cards.map((c) => {
          const m = strings.modes[c.id];
          const best = save.bests[c.id];
          return (
            <button
              key={c.id}
              type="button"
              disabled={!c.playable}
              onClick={() => c.playable && onPlay('speedMath')}
              className={`flex min-h-[88px] items-center gap-3 rounded-[20px] border-2 bg-surface p-4 text-left ${
                c.playable ? 'border-border active:scale-[0.98]' : 'border-border opacity-60'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink">
                {c.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-lg font-semibold leading-6">{m.name}</span>
                <span className="text-sm text-muted">{c.playable ? m.hint : strings.comingSoon}</span>
              </span>
              {c.playable && (
                <span className="flex flex-col items-end">
                  <span className="text-xs text-muted">{strings.best}</span>
                  <span className="num text-[32px] leading-9 text-ink">{best > 0 ? best : strings.noScore}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <p className="mt-4 text-center text-xs text-muted">{strings.credit}</p>
    </main>
  );
}
