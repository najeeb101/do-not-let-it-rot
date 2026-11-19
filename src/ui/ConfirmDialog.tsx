import { useEffect, useRef } from 'react';
import { strings } from '../content/strings';
import { Button } from './Button';

type Props = { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void };

/** In-app confirm (never window.confirm). Focus starts on Cancel, Tab is trapped, Esc cancels. */
export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab' || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>('button')];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-overlay px-6">
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="flex w-full flex-col gap-4 rounded-[20px] border-2 border-border bg-surface p-5"
      >
        <h2 id="confirm-title" className="num text-xl leading-7">
          {title}
        </h2>
        <p id="confirm-body" className="text-muted">
          {body}
        </p>
        <div className="flex flex-col gap-3">
          <button
            ref={cancel}
            type="button"
            onClick={onCancel}
            className="num flex h-14 w-full items-center justify-center rounded-xl border-2 border-text text-lg text-text"
          >
            {strings.settingsScreen.cancel}
          </button>
          <Button onClick={onConfirm} className="!border-danger !bg-danger !text-white">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
