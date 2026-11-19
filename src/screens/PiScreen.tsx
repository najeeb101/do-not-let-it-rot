import { useEffect, useRef } from 'react';
import { gameRules } from '../config/gameRules';
import { piDigits } from '../config/piDigits';
import { strings } from '../content/strings';
import { countdownNumeral } from '../engine/session';
import { useRunner } from '../hooks/useRunner';
import type { FinishedGame } from '../hooks/useRunner';
import { fxForEvents } from '../lib/fx';
import { initialState, reducer } from '../modes/piChallenge/reducer';
import type { PiAction, PiState } from '../modes/piChallenge/reducer';
import { DigitPad } from '../ui/DigitPad';
import { PauseIcon, XIcon } from '../ui/icons';
import { PauseOverlay } from '../ui/PauseOverlay';
import { TimerBar } from '../ui/TimerBar';

type Props = {
  onFinish: (game: FinishedGame) => void;
  onQuit: () => void;
};

const keyAction = (e: KeyboardEvent, now: number): PiAction | null =>
  /^[0-9]$/.test(e.key) ? { type: 'digit', digit: e.key, now } : null;

const finished = (s: PiState): FinishedGame => ({
  score: s.score,
  bestStreak: 0,
  detail:
    s.endReason === 'wrong' && s.wrongDigit && s.expected ? { typed: s.wrongDigit, expected: s.expected } : undefined,
});

function groups(digits: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < digits.length; i += size) out.push(digits.slice(i, i + size));
  return out;
}

const fade = 'linear-gradient(to right, transparent, #000 28px)';

export function PiScreen({ onFinish, onQuit }: Props) {
  const {
    state: s,
    send,
    pause,
    resume,
    quit,
  } = useRunner<PiState, PiAction>(reducer, initialState, {
    keyAction,
    finished,
    onFinish,
    onQuit,
    onEvents: fxForEvents,
  });
  const ticker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ticker.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [s.typed, s.wrongDigit]);

  const counting = s.phase === 'countdown' || s.phase === 'idle';
  const inInput = s.phase === 'input';
  const ended = s.phase === 'ending' || s.phase === 'gameover';
  const clockNow = s.paused ? s.pausedAt : s.now;
  const timerLeft = ended
    ? s.remainingAtEnd
    : inInput && s.started
      ? Math.max(0, s.deadline - clockNow)
      : gameRules.piRunMs;

  const nextDigits =
    s.endReason === 'wrong' ? piDigits.slice(s.typed.length + 1, s.typed.length + 1 + gameRules.piShownNextDigits) : '';
  const countdownLeft = Math.max(0, s.deadline - clockNow);

  return (
    <main className="screen relative gap-3" aria-label={strings.modes.piChallenge.name}>
      <header className={`flex h-14 items-center gap-3 ${counting ? 'opacity-40' : ''}`}>
        <div className="flex min-w-0 flex-1 flex-col leading-none">
          <span className="text-xs uppercase tracking-wider text-muted">{strings.hud.digits}</span>
          <span className="num text-[28px] leading-8" data-testid="digit-count">
            {s.score}
          </span>
        </div>
        <button
          type="button"
          onClick={pause}
          aria-label={strings.hud.pause}
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-surface-2"
        >
          <PauseIcon size={22} />
        </button>
      </header>

      <TimerBar
        fraction={timerLeft / gameRules.piRunMs}
        seconds={String(Math.ceil(timerLeft / 1000))}
        danger={s.started && inInput && timerLeft < 5000}
      />

      <section className="flex min-h-0 flex-1 flex-col justify-center gap-3">
        {counting ? (
          <div className="flex flex-col items-center gap-2" aria-live="assertive">
            <span key={countdownNumeral(countdownLeft)} className="num anim-pop text-[128px] leading-none text-ink">
              {countdownNumeral(countdownLeft)}
            </span>
            <span className="num text-xl text-muted">{strings.modes.piChallenge.name}</span>
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-muted">{strings.pi.label}</p>
            <div
              ref={ticker}
              role="img"
              aria-label={`${strings.pi.stream}: 3.${s.typed}`}
              data-testid="ticker"
              data-digits={s.typed}
              className="no-scrollbar overflow-x-auto whitespace-nowrap py-1"
              style={{ maskImage: fade, WebkitMaskImage: fade }}
            >
              <span className="num inline-flex items-center text-[44px] leading-[56px]">
                <span className="text-muted">3.</span>
                {groups(s.typed, gameRules.piGroupSize).map((g, i) => (
                  <span key={i} className="ml-3">
                    {g}
                  </span>
                ))}
                {s.endReason === 'wrong' && s.wrongDigit && (
                  <span
                    className={`${s.typed.length % gameRules.piGroupSize === 0 ? 'ml-3' : ''} text-danger`}
                    data-testid="wrong-digit"
                  >
                    {s.wrongDigit}
                  </span>
                )}
                {inInput && <span className="caret ml-1 inline-block h-10 w-[3px] bg-ink" aria-hidden />}
              </span>
            </div>
            <div className="min-h-[72px] text-sm" role="status" data-testid="pi-status">
              {inInput && !s.started && <p className="text-muted">{strings.pi.startHint}</p>}
              {s.endReason === 'wrong' && s.wrongDigit && s.expected && (
                <>
                  <p className="num flex items-center gap-2 text-lg text-danger">
                    <XIcon size={20} />
                    {strings.pi.typedWrong(s.wrongDigit, s.expected)}
                  </p>
                  <p className="mt-1 text-muted">{strings.pi.wrongLine}</p>
                  {nextDigits && (
                    <p className="num mt-1 text-muted">
                      {strings.pi.next}: {nextDigits}
                    </p>
                  )}
                </>
              )}
              {s.endReason === 'time' && <p className="num text-lg text-text">{strings.pi.timeUp}</p>}
              {s.endReason === 'complete' && <p className="num text-lg text-text">{strings.pi.complete}</p>}
            </div>
          </>
        )}
      </section>

      <div className={counting || ended ? 'pointer-events-none opacity-40' : ''}>
        <DigitPad
          onDigit={(d) => send((now) => ({ type: 'digit', digit: d, now }))}
          disabled={counting || ended || s.paused}
        />
      </div>

      {s.paused && <PauseOverlay onResume={resume} onQuit={quit} />}
    </main>
  );
}
