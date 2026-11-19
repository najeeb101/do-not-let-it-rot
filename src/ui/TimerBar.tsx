type Props = { fraction: number; seconds: string; danger?: boolean };

export function TimerBar({ fraction, seconds, danger }: Props) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex-1 overflow-hidden rounded-full bg-surface-2"
        style={{ height: 'var(--track-h)', boxShadow: '0 0 0 2px var(--track-edge)' }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: danger ? 'var(--danger)' : 'var(--accent)' }}
        />
      </div>
      <span className="num w-12 text-right text-sm text-text">{seconds}s</span>
    </div>
  );
}
