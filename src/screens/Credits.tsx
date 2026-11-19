import { strings } from '../content/strings';
import { RotMeter } from '../ui/RotMeter';
import { ScreenHeader } from '../ui/ScreenHeader';

type Props = { onBack: () => void };

const chip = 'num rounded-full bg-surface-2 px-3 py-2 text-sm text-text';

export function Credits({ onBack }: Props) {
  const c = strings.credits;
  return (
    <main className="screen">
      <ScreenHeader title={c.title} onBack={onBack} />
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <RotMeter stage={0} size={96} label="Healthy brain" />
        <p className="num mt-2 text-[28px] leading-9">{strings.appName}</p>
        <p className="text-muted">{c.sub}</p>
      </div>
      <section className="mt-6 flex flex-col gap-2">
        <h2 className="num text-lg">
          {strings.conceptBy} {strings.friendName}
        </h2>
        <p className="text-muted">{c.builtBy}</p>
        <p className="text-muted">{c.blurb}</p>
        <div className="mt-2 flex gap-2">
          <a className={chip} href={c.githubUrl} target="_blank" rel="noreferrer">
            {c.github}
          </a>
          <span className={chip}>{c.license}</span>
        </div>
      </section>
      <div className="flex-1" />
      <section className="rounded-[20px] border-2 border-border bg-surface p-4" data-testid="privacy">
        <p className="text-xs uppercase tracking-wider text-muted">{c.privacyLabel}</p>
        <p className="mt-1">{c.privacy}</p>
      </section>
    </main>
  );
}
