import { strings } from '../content/strings';
import { countdownNumeral } from '../engine/session';
import { rotStage } from '../engine/rot';
import { useRunner } from '../hooks/useRunner';
import type { FinishedGame } from '../hooks/useRunner';
import { fxForEvents } from '../lib/fx';
import { currentMultiplier, initialState, reducer } from '../modes/visualMemory/reducer';
import type { VmAction, VmState } from '../modes/visualMemory/reducer';
import { Grid } from '../ui/Grid';
import type { TileState } from '../ui/Grid';
import { Hud } from '../ui/Hud';
import { EyeIcon, XIcon } from '../ui/icons';
import { PauseOverlay } from '../ui/PauseOverlay';
import { TimerBar } from '../ui/TimerBar';

type Props = {
  onFinish: (game: FinishedGame) => void;
  onQuit: () => void;
};

const finished = (s: VmState): FinishedGame => ({ score: s.score, bestStreak: s.bestStreak });

function tileState(s: VmState, i: number): TileState {
  const lit = s.pattern.includes(i);
  if (s.phase === 'show') return lit ? 'lit' : 'idle';
  if (s.phase === 'input') return s.found.includes(i) ? 'found' : 'idle';
  if (s.phase === 'feedback' || s.phase === 'gameover') {
    if (s.result === 'correct') return lit ? 'correct' : 'idle';
    if (s.wrongTile === i) return 'wrong';
    if (s.found.includes(i)) return 'correct';
    return lit ? 'missed' : 'idle';
  }
  return 'idle';
}

export function VisualMemoryScreen({ onFinish, onQuit }: Props) {
  const { state: s, send, pause, resume, quit } = useRunner<VmState, VmAction>(reducer, initialState, {
    finished,
    onFinish,
    onQuit,
    onEvents: fxForEvents,
  });

  const counting = s.phase === 'countdown' || s.phase === 'idle';
  const inInput = s.phase === 'input';
  const resolved = s.phase === 'feedback' || s.phase === 'gameover';
  const clockNow = s.paused ? s.pausedAt : s.now;
  const remaining = inInput ? Math.max(0, s.deadline - clockNow) : resolved ? s.lastRemaining : s.timerMs;
  const showTimer = inInput || resolved;
  const round = s.result === 'correct' ? s.level - 1 : s.level;
  const left = s.pattern.length - s.found.length;

  let status = '';
  let statusColor = 'text-muted';
  let icon = null;
  if (s.phase === 'show') {
    status = strings.memory.watch;
    icon = <EyeIcon size={22} />;
  } else if (inInput) {
    status = strings.memory.yourTurn(left);
    statusColor = 'text-text';
  } else if (resolved) {
    if (s.result === 'correct') {
      status = `+${s.lastPoints}`;
      statusColor = 'text-success';
    } else {
      status = s.result === 'timeout' ? strings.memory.tooSlow : strings.memory.wrongTile;
      statusColor = 'text-danger';
      icon = <XIcon size={22} />;
    }
  }

  return (
    <main className="screen relative gap-3" aria-label={strings.modes.visualMemory.name}>
      <div className={counting ? 'opacity-40' : ''}>
        <Hud stage={rotStage(s.lives)} lives={s.lives} score={s.score} multiplier={currentMultiplier(s)} onPause={pause} />
      </div>

      {counting ? (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2" aria-live="assertive">
          <span key={countdownNumeral(Math.max(0, s.deadline - clockNow))} className="num anim-pop text-[128px] leading-none text-ink">
            {countdownNumeral(Math.max(0, s.deadline - clockNow))}
          </span>
          <span className="num text-xl text-muted">{strings.modes.visualMemory.name}</span>
        </section>
      ) : (
        <>
          <div>
            <p className="num mb-2 text-center text-sm text-muted" data-testid="round">
              {strings.memory.round(round)}
            </p>
            <div className={showTimer ? '' : 'invisible'}>
              <TimerBar
                fraction={remaining / s.timerMs}
                seconds={String(Math.ceil(remaining / 1000))}
                danger={inInput && remaining < 1000}
              />
            </div>
          </div>

          <p
            className={`num flex h-8 items-center justify-center gap-2 text-xl ${statusColor}`}
            role="status"
            data-testid="status"
          >
            {icon}
            {status}
          </p>

          <section className="flex min-h-0 flex-1 items-start justify-center">
            <Grid
              key={`${s.level}-${s.grid}-${s.pattern.join('.')}`}
              size={s.grid}
              state={(i) => tileState(s, i)}
              onTap={(index) => send((now) => ({ type: 'tap', index, now }))}
            />
          </section>

          <p className="h-6 text-center text-sm text-muted">
            {resolved && s.result !== 'correct' ? strings.memory.missedHint : ''}
          </p>
        </>
      )}

      {s.paused && <PauseOverlay onResume={resume} onQuit={quit} />}
    </main>
  );
}
