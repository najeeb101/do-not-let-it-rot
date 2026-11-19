import { strings } from '../content/strings';
import { BackspaceIcon } from './icons';

type Props = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onOk: () => void;
  disabled?: boolean;
};

const key =
  'num flex h-16 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-2xl text-text active:scale-95 disabled:opacity-60';

/** 3x4 pad: 1-9, backspace, 0, OK. No minus key (answers are never negative). */
export function NumberPad({ onDigit, onBackspace, onOk, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-[10px]" role="group" aria-label="Number pad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} type="button" className={key} disabled={disabled} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" className={key} disabled={disabled} onClick={onBackspace} aria-label={strings.pad.backspace}>
        <BackspaceIcon size={26} />
      </button>
      <button type="button" className={key} disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
      <button
        type="button"
        className={`${key} !border-edge !bg-accent !text-xl !text-on-accent`}
        disabled={disabled}
        onClick={onOk}
      >
        {strings.pad.ok}
      </button>
    </div>
  );
}
