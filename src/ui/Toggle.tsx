import { CheckIcon } from './icons';

type Props = { label: string; checked: boolean; onChange: (on: boolean) => void; disabled?: boolean };

export function Toggle({ label, checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors disabled:opacity-40 ${
        checked ? 'border-edge bg-accent' : 'border-border bg-surface-2'
      }`}
    >
      <span
        className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
          checked ? 'left-[26px] bg-edge text-accent' : 'left-0.5 bg-muted'
        }`}
      >
        {checked && <CheckIcon size={14} />}
      </span>
    </button>
  );
}
