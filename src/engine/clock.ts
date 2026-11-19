export interface Clock {
  /** Monotonic milliseconds. */
  now(): number;
}

/** Real clock: performance.now() deltas, immune to system clock changes. */
export const realClock: Clock = {
  // eslint-disable-next-line no-restricted-properties
  now: () => performance.now(),
};

export type FakeClock = Clock & {
  advance(ms: number): number;
  set(ms: number): void;
};

/** Manual clock for tests. */
export function createFakeClock(start = 0): FakeClock {
  let t = start;
  return {
    now: () => t,
    advance(ms) {
      t += ms;
      return t;
    },
    set(ms) {
      t = ms;
    },
  };
}
