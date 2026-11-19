/** All UI text lives here (D-copy). No em dashes, no emojis. */
export const strings = {
  appName: 'Do Not Let It Rot',
  tagline: 'Keep your brain sharp.',
  credit: 'Concept by a friend | v1.0.0',
  best: 'Best',
  noScore: '-',
  comingSoon: 'Soon',
  settings: 'Settings',
  modes: {
    visualMemory: { name: 'Visual Memory', hint: 'Watch. Remember. Tap.' },
    speedMath: { name: 'Speed Math', hint: "Solve fast. Don't blink." },
    piChallenge: { name: 'Pi Challenge', hint: 'Type pi. 30 seconds.' },
  },
  hud: {
    score: 'Score',
    pause: 'Pause',
    lives: (n: number) => `${n} lives left`,
    streak: (m: number) => `Streak multiplier x${m}`,
    seconds: (s: string) => `${s}s`,
  },
  pad: {
    backspace: 'Delete',
    ok: 'OK',
    answer: 'Your answer',
  },
  pause: {
    title: 'Paused',
    resume: 'Resume',
    quit: 'Quit',
  },
  feedback: {
    timeout: 'Too slow. The feed took you again.',
    streak2: 'Warming up.',
    streak3: 'Brain cells are cooking.',
    streak5: 'Max focus. Unscrollable.',
  },
  gameOver: {
    low: 'Brain officially rotten. Please open a window.',
    mid: 'Your brain is getting a bit smelly.',
    high: 'Brain still crispy. Show-off.',
    newBestLine: 'New personal best. Brain: 1, scroll: 0.',
    newBest: 'NEW BEST',
    bestStreak: 'Best streak',
    previousBest: 'Previous best',
    personalBest: 'Personal best',
    retry: 'One more try',
    menu: 'Back to menu',
  },
  theme: {
    system: 'Theme: system',
    light: 'Theme: light',
    dark: 'Theme: dark',
  },
} as const;

export type Strings = typeof strings;
