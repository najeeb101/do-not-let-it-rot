import { strings } from '../content/strings';

type Props = { onDigit: (d: string) => void; disabled?: boolean };

const key =
  'num flex h-16 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-2xl text-text active:scale-95 disabled:opacity-50';

/** Digit-only pad for Pi: 1-9 and a centered 0. No backspace, no OK (D21). */
export function DigitPad({ onDigit, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-[10px]" role="group" aria-label={strings.pad.digits}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} type="button" className={key} disabled={disabled} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" className={`${key} col-start-2`} disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
    </div>
  );
}
