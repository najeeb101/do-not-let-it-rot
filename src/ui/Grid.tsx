import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { strings } from '../content/strings';
import { CheckIcon, XIcon } from './icons';

export type TileState = 'idle' | 'lit' | 'found' | 'correct' | 'wrong' | 'missed';

type Props = {
  size: number;
  state: (index: number) => TileState;
  onTap: (index: number) => void;
};

const GAP: Record<number, number> = { 3: 8, 4: 6, 5: 4 };

const look: Record<TileState, string> = {
  idle: 'bg-surface-2 border-2 border-border',
  lit: 'bg-accent border-2 border-edge text-on-accent',
  found: 'bg-accent border-[3px] border-text text-on-accent',
  correct: 'bg-success border-2 border-success text-bg',
  wrong: 'bg-danger border-2 border-danger text-bg anim-shake',
  missed: 'bg-surface-2 border-[3px] border-dashed border-ink',
};

const stateLabel = (s: TileState): string =>
  s === 'lit'
    ? strings.memory.stateLit
    : s === 'found'
      ? strings.memory.stateFound
      : s === 'correct'
        ? strings.memory.stateCorrect
        : s === 'wrong'
          ? strings.memory.stateWrong
          : s === 'missed'
            ? strings.memory.stateMissed
            : '';

/**
 * Square tile grid. Every non-idle state also changes shape (dot, check, X,
 * dashed outline) so color is never the only signal. Arrow keys move focus;
 * Enter and Space tap (native button behavior).
 */
export function Grid({ size, state, onTap }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const gap = GAP[size] ?? 4;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const dy = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    const row = Math.min(size - 1, Math.max(0, Math.floor(focus / size) + dy));
    const col = Math.min(size - 1, Math.max(0, (focus % size) + dx));
    const next = row * size + col;
    setFocus(next);
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-label={strings.memory.grid}
      onKeyDown={onKeyDown}
      className="mx-auto grid aspect-square"
      style={{
        width: 'min(100%, calc(100dvh - 300px))',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap,
      }}
      data-size={size}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const s = state(i);
        const label = `${strings.memory.cell(Math.floor(i / size) + 1, (i % size) + 1)}${stateLabel(s) ? `, ${stateLabel(s)}` : ''}`;
        return (
          <button
            key={i}
            type="button"
            data-testid="tile"
            data-index={i}
            data-state={s}
            aria-label={label}
            tabIndex={i === focus ? 0 : -1}
            onFocus={() => setFocus(i)}
            onClick={() => onTap(i)}
            className={`relative flex items-center justify-center rounded-[14px] transition-[transform,background-color] duration-100 active:scale-[0.96] ${look[s]}`}
          >
            {(s === 'lit' || s === 'found') && <span className="h-[22%] w-[22%] rounded-full bg-on-accent" aria-hidden />}
            {s === 'correct' && <CheckIcon size={36} />}
            {s === 'wrong' && <XIcon size={36} />}
          </button>
        );
      })}
    </div>
  );
}
