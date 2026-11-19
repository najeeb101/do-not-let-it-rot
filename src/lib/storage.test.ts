import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, defaultSave, load, reset, sanitize, save } from './storage';

function installStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  const store = {
    getItem: (k: string) => (k in data ? (data[k] as string) : null),
    setItem: vi.fn((k: string, v: string) => {
      data[k] = v;
    }),
    removeItem: (k: string) => {
      delete data[k];
    },
  };
  vi.stubGlobal('localStorage', store);
  return { data, store };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('storage', () => {
  it('returns defaults when empty', () => {
    installStore();
    expect(load()).toEqual(defaultSave());
  });
  it('round-trips', () => {
    installStore();
    const s = defaultSave();
    s.bests.speedMath = 321;
    s.gamesPlayed.speedMath = 4;
    expect(save(s)).toBe(true);
    expect(load()).toEqual(s);
  });
  it('survives corrupt JSON', () => {
    installStore({ [STORAGE_KEY]: '{nope' });
    expect(load()).toEqual(defaultSave());
  });
  it('fills defaults and rejects bad fields', () => {
    const s = sanitize({ bests: { speedMath: -5, visualMemory: 'x', piChallenge: 12.7 }, settings: { theme: 'neon', sound: 'yes' } });
    expect(s.bests).toEqual({ speedMath: 0, visualMemory: 0, piChallenge: 12 });
    expect(s.settings).toEqual({ sound: true, vibration: true, theme: 'system' });
    expect(sanitize(null)).toEqual(defaultSave());
  });
  it('does not throw on quota errors', () => {
    const { store } = installStore();
    store.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(save(defaultSave())).toBe(false);
  });
  it('does not overwrite a newer save', () => {
    const { data, store } = installStore({ [STORAGE_KEY]: JSON.stringify({ version: 99, future: true }) });
    expect(load()).toEqual(defaultSave());
    expect(save(defaultSave())).toBe(false);
    expect(store.setItem).not.toHaveBeenCalled();
    expect(data[STORAGE_KEY]).toContain('future');
  });
  it('works with no localStorage', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(load()).toEqual(defaultSave());
    expect(save(defaultSave())).toBe(false);
  });
  it('reset clears', () => {
    const { data } = installStore({ [STORAGE_KEY]: '{}' });
    reset();
    expect(data[STORAGE_KEY]).toBeUndefined();
  });
});
