import { strings } from '../content/strings';
import { Button } from './Button';

type Props = { onResume: () => void; onQuit: () => void };

export function PauseOverlay({ onResume, onQuit }: Props) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-overlay px-8"
      role="dialog"
      aria-label={strings.pause.title}
    >
      <h2 className="num mb-4 text-4xl text-white">{strings.pause.title}</h2>
      <Button onClick={onResume}>{strings.pause.resume}</Button>
      <Button variant="secondary" onClick={onQuit} className="bg-bg">
        {strings.pause.quit}
      </Button>
    </div>
  );
}
