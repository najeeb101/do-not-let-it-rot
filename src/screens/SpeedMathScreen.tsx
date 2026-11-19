import { useEffect, useRef } from 'react';
import { strings } from '../content/strings';
import { gameRules } from '../config/gameRules';
import { countdownNumeral } from '../engine/session';
import { rotStage } from '../engine/rot';
import { useSpeedMath } from '../hooks/useSpeedMath';
import { opGlyph } from '../modes/speedMath/generator';
import { currentMultiplier } from '../modes/speedMath/reducer';
import { Button } from '../ui/Button';
import { Hud } from '../ui/Hud';
import { NumberPad } from '../ui/NumberPad';
import { TimerBar } from '../ui/TimerBar';

export type FinishedGame = { score: number; bestStreak: number };

type Props = {
  onFinish: (game: FinishedGame) => void;
  onQuit: () => void;
};

export function SpeedMathScreen({ onFinish, onQuit }: Props) {
  const { state: s, start, digit, backspace, submit, pause, resume } = useSpeedMath();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
  }, [start]);

  const finished = useRef(false);
  useEffect(() => {
    if (s.phase === 'gameover' && !finished.current) {
      finished.current = true;
      onFinish({ score: s.score, bestStreak: s.bestStreak });
    }
  }, [s.phase, s.score, s.bestStreak, onFinish]);

  const quit = () => {
    if (s.phase === 'countdown' || s.phase === 'idle') {
      onQuit();
      return;
    }
    if (!finished.current) {
      finished.current = true;
      onFinish({ score: s.score, bestStreak: s.bestStreak });
    }
  };

  const counting = s.phase === 'countdown';
  const clockNow = s.paused ? s.pausedAt : s.now;
  const remaining = Math.max(0, s.deadline - clockNow);
  const inInput = s.phase === 'input';
  const timerMs = counting ? (gameRules.mathTimerMsByTier[0] as number) : s.timerMs;
  const fraction = counting ? 1 : inInput ? remaining / s.timerMs : 0;
  const seconds = ((counting ? timerMs : inInput ? remaining : 0) / 1000).toFixed(1);
  const q = s.question;
  const multiplier = currentMultiplier(s);

  let feedback = '';
  let feedbackColor = 'text-muted';
  if (s.phase === 'feedback' || s.phase === 'gameover') {
    if (s.result === 'correct') {
      feedback = `+${s.lastPoints}`;
      feedbackColor = 'text-success';
    } else if (s.result === 'timeout') {
      feedback = strings.feedback.timeout;
      feedbackColor = 'text-danger';
    } else if (s.result === 'wrong' && q) {
      feedback = `${q.a} ${opGlyph[q.op]} ${q.b} = ${q.answer}`;
      feedbackColor = 'text-danger';
    }
  }

  const answerText = s.phase === 'feedback' && s.result === 'wrong' ? s.buffer : s.buffer;

  return (
    <main className="screen relative gap-3" aria-label={strings.modes.speedMath.name}>
      <div className={counting ? 'opacity-40' : ''}>
        <Hud stage={rotStage(s.lives)} lives={s.lives} score={s.score} multiplier={multiplier} onPause={pause} />
      </div>
      <TimerBar fraction={fraction} seconds={seconds} danger={inInput && remaining < 1000} />

      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
        {counting ? (
          <div className="flex flex-col items-center gap-2" aria-live="assertive">
            <span key={countdownNumeral(remaining)} className="num anim-pop text-[128px] leading-none text-ink">
              {countdownNumeral(remaining)}
            </span>
            <span className="num text-xl text-muted">{strings.modes.speedMath.name}</span>
          </div>
        ) : (
          <>
            <p className="num text-[clamp(48px,18vw,72px)] leading-none" data-testid="question">
              {q ? `${q.a} ${opGlyph[q.op]} ${q.b}` : ''}
            </p>
            <div className="mt-3 flex h-14 w-[200px] items-center justify-center border-b-[3px] border-text" data-testid="answer">
              <span className="num text-5xl leading-none">{answerText}</span>
              {inInput && <span className="caret ml-0.5 inline-block h-9 w-[3px] bg-ink" aria-hidden />}
            </div>
            <p className={`num mt-1 h-8 text-2xl leading-8 ${feedbackColor}`} role="status">
              {feedback}
            </p>
          </>
        )}
      </section>

      <div className={counting ? 'pointer-events-none opacity-40' : ''}>
        <NumberPad onDigit={digit} onBackspace={backspace} onOk={submit} disabled={counting || s.paused} />
      </div>

      {s.paused && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-overlay px-8" role="dialog" aria-label={strings.pause.title}>
          <h2 className="num mb-4 text-4xl text-white">{strings.pause.title}</h2>
          <Button onClick={resume}>{strings.pause.resume}</Button>
          <Button variant="secondary" onClick={quit} className="bg-bg">
            {strings.pause.quit}
          </Button>
        </div>
      )}
    </main>
  );
}
