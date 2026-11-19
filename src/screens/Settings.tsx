import { useState } from 'react';
import { strings } from '../content/strings';
import { vibrationSupported } from '../lib/haptics';
import type { SaveV1, Theme } from '../lib/storage';
import { ChevronIcon } from '../ui/icons';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Toggle } from '../ui/Toggle';

type Props = {
  settings: SaveV1['settings'];
  onChange: (patch: Partial<SaveV1['settings']>) => void;
  onReset: () => void;
  onCredits: () => void;
  onBack: () => void;
};

const themes: Theme[] = ['system', 'light', 'dark'];
const row = 'flex min-h-14 items-center justify-between gap-3 border-b border-border';

export function Settings({ settings, onChange, onReset, onCredits, onBack }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [erased, setErased] = useState(false);
  const canVibrate = vibrationSupported();
  const t = strings.settingsScreen;

  return (
    <main className="screen relative">
      <ScreenHeader title={strings.settings} onBack={onBack} />

      <div className="flex flex-col">
        <div className={row}>
          <span>{t.sound}</span>
          <Toggle label={t.sound} checked={settings.sound} onChange={(sound) => onChange({ sound })} />
        </div>
        <div className={row}>
          <span className="flex flex-col">
            {t.vibration}
            {!canVibrate && <span className="text-xs text-muted">{t.vibrationUnsupported}</span>}
          </span>
          <Toggle
            label={t.vibration}
            checked={canVibrate && settings.vibration}
            disabled={!canVibrate}
            onChange={(vibration) => onChange({ vibration })}
          />
        </div>

        <div className="flex flex-col gap-2 border-b border-border py-3">
          <span id="theme-label">{t.theme}</span>
          <div
            role="radiogroup"
            aria-labelledby="theme-label"
            className="grid grid-cols-3 overflow-hidden rounded-xl border-2 border-border"
          >
            {themes.map((th) => (
              <button
                key={th}
                type="button"
                role="radio"
                aria-checked={settings.theme === th}
                onClick={() => onChange({ theme: th })}
                className={`num h-11 text-sm ${settings.theme === th ? 'bg-accent text-on-accent' : 'bg-surface text-text'}`}
              >
                {t.themeOptions[th]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setErased(false);
            setConfirming(true);
          }}
          className={`${row} text-left text-danger`}
        >
          {t.reset}
          <ChevronIcon className="text-muted" />
        </button>
        <button type="button" onClick={onCredits} className={`${row} text-left`}>
          {t.credits}
          <ChevronIcon className="text-muted" />
        </button>
        {erased && (
          <p role="status" className="pt-3 text-sm text-muted">
            {t.erased}
          </p>
        )}
      </div>

      <div className="flex-1" />
      <p className="text-right text-xs text-muted">{strings.version}</p>

      {confirming && (
        <ConfirmDialog
          title={t.confirmTitle}
          body={t.confirmBody}
          confirmLabel={t.erase}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            onReset();
            setConfirming(false);
            setErased(true);
          }}
        />
      )}
    </main>
  );
}
