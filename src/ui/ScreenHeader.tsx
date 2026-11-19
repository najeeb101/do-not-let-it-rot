import { strings } from '../content/strings';
import { BackIcon } from './icons';

type Props = { title: string; onBack: () => void };

export function ScreenHeader({ title, onBack }: Props) {
  return (
    <header className="flex h-14 items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label={strings.back}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-text"
      >
        <BackIcon />
      </button>
      <h1 className="num text-2xl leading-8">{title}</h1>
    </header>
  );
}
