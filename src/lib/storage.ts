export const STORAGE_KEY = 'dnlir:v1';
export const SAVE_VERSION = 1;

export type Theme = 'system' | 'light' | 'dark';

export type SaveV1 = {
  version: 1;
  bests: { speedMath: number; visualMemory: number; piChallenge: number };
  bestStreak: { speedMath: number; visualMemory: number };
  gamesPlayed: { speedMath: number; visualMemory: number; piChallenge: number };
  settings: { sound: boolean; vibration: boolean; theme: Theme };
};

export function defaultSave(): SaveV1 {
  return {
    version: 1,
    bests: { speedMath: 0, visualMemory: 0, piChallenge: 0 },
    bestStreak: { speedMath: 0, visualMemory: 0 },
    gamesPlayed: { speedMath: 0, visualMemory: 0, piChallenge: 0 },
    settings: { sound: true, vibration: true, theme: 'system' },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const count = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/** Validate unknown data into a SaveV1, filling defaults for anything bad. */
export function sanitize(raw: unknown): SaveV1 {
  const d = defaultSave();
  if (!isObj(raw)) return d;
  const bests = isObj(raw.bests) ? raw.bests : {};
  const streak = isObj(raw.bestStreak) ? raw.bestStreak : {};
  const games = isObj(raw.gamesPlayed) ? raw.gamesPlayed : {};
  const settings = isObj(raw.settings) ? raw.settings : {};
  const theme = settings.theme === 'light' || settings.theme === 'dark' ? settings.theme : 'system';
  return {
    version: 1,
    bests: {
      speedMath: count(bests.speedMath, 0),
      visualMemory: count(bests.visualMemory, 0),
      piChallenge: count(bests.piChallenge, 0),
    },
    bestStreak: {
      speedMath: count(streak.speedMath, 0),
      visualMemory: count(streak.visualMemory, 0),
    },
    gamesPlayed: {
      speedMath: count(games.speedMath, 0),
      visualMemory: count(games.visualMemory, 0),
      piChallenge: count(games.piChallenge, 0),
    },
    settings: {
      sound: bool(settings.sound, d.settings.sound),
      vibration: bool(settings.vibration, d.settings.vibration),
      theme,
    },
  };
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Set when a save from a newer app version is found; we then never overwrite it. */
let readOnly = false;

export function load(): SaveV1 {
  readOnly = false;
  const store = getStorage();
  if (!store) return defaultSave();
  try {
    const text = store.getItem(STORAGE_KEY);
    if (text === null) return defaultSave();
    const parsed: unknown = JSON.parse(text);
    if (isObj(parsed) && typeof parsed.version === 'number' && parsed.version > SAVE_VERSION) {
      readOnly = true;
      return defaultSave();
    }
    return sanitize(parsed);
  } catch {
    return defaultSave();
  }
}

/** Returns false if the write was skipped or failed (quota, private mode). */
export function save(data: SaveV1): boolean {
  if (readOnly) return false;
  const store = getStorage();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function reset(): void {
  readOnly = false;
  const store = getStorage();
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
