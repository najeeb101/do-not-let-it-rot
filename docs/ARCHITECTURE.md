# Do Not Let It Rot: Architecture

Derived from `docs/MASTER.md` (source of truth). If they disagree, MASTER wins. Anything not in MASTER is marked "(proposed)". Tunable numbers live in `docs/GAME_RULES.md` and `src/config/gameRules.ts`, not here.

- Last updated: 2026-11-19

## 1. Stack and versions

Versions below were read from the npm registry (`npm view <pkg> version`) on 2026-11-19. Pin exact versions in `package.json` (no `latest`), and commit the lockfile.

| Piece | Version (checked 2026-11-19) | Why |
|---|---|---|
| Node | 22.12+ (proposed: develop on 22 LTS; CI uses 22) | Vite 8 needs `^20.19 or >=22.12`. Vitest 5 needs `^22.12 or ^24 or >=26`. 22.12+ satisfies both. Declare in `package.json` `engines` and `.nvmrc`. |
| Vite | 8.3.8 | MASTER D8. Fast dev server, static build for Vercel. |
| React | 19.3.1 | MASTER D8. |
| @vitejs/plugin-react | 6.3.0 | Requires Vite 8. |
| TypeScript | 6.0.3 (pinned, D28; latest is 7.0.2) | typescript-eslint 8.73.0 only supports TypeScript `<6.1.0`. 7.x would break lint. Pinned until typescript-eslint supports 7. |
| Tailwind CSS | 4.3.5 with `@tailwindcss/vite` 4.3.5 | MASTER D8. v4 uses CSS-first `@theme`, which maps cleanly to the DESIGN tokens. No `tailwind.config.js`. |
| vite-plugin-pwa | 2.0.0 (peer: Vite up to 8, `workbox-build` and `workbox-window` ^7.4.1) | Standard PWA plugin for Vite: generates manifest and service worker. Use `generateSW` mode with `registerType: 'autoUpdate'`. Assets generator (`@vite-pwa/assets-generator`) for icons is optional. |
| Vitest | 5.1.1 | Same config as Vite, fast, pure-function tests. Use the `jsdom` environment only for the few UI tests (proposed). |
| Playwright (`@playwright/test`) | 1.65.1 | Mobile viewport e2e per mode. |
| @vercel/analytics | 2.0.1 | MASTER D13. Framework-agnostic `inject()` or the React `<Analytics />` component. |
| ESLint / typescript-eslint | 10.15.0 / 8.73.0 | Lint gate in CI. |
| Router | none | See section 1.1. |

Install-time check (Phase 0): run `npm view <pkg> version` again and update this table if a newer stable has shipped. If a version cannot be installed, record it here as "(unverified)".

### 1.1 Router decision

Recommendation: no router library. Use a tiny state-based screen switch (proposed): a `screen` value in a React context, one of `home | settings | credits | game:<mode> | gameover`.

Reasons:
- Six screens, no deep links needed in v1, no server.
- Less code and less to cache for offline.
- Game screens must not be reachable by a stale URL mid-run.
- Back button: push one `history` entry when entering a game and handle `popstate` to return to the menu (proposed), so the phone back button does not leave the site.

When to reconsider: the Later A stats screen with shareable URLs, or Later B daily challenge links. At that point add React Router (8.5.2 on 2026-11-19) in library mode. The `screen` type is kept as a closed union so this swap is mechanical.

## 2. Setup and scripts

One command from a fresh clone:

```
npm install && npm run dev
```

| Script | Does |
|---|---|
| `dev` | Vite dev server |
| `build` | `tsc --noEmit` then `vite build` |
| `preview` | Serve the production build (needed for PWA checks) |
| `typecheck` | `tsc --noEmit` |
| `lint` | ESLint |
| `test` | Vitest run |
| `test:e2e` | Playwright (starts `preview` itself) |

Env vars: none in v1. No `.env` needed, no secrets. Later B will add Supabase URL and anon key as `VITE_*` vars (public by design, still set in Vercel, never committed with a service key).

## 3. Folder structure

```
do-not-let-it-rot/
  CLAUDE.md
  README.md                  setup, credit "Concept by ...", license MIT
  docs/                      MASTER, ARCHITECTURE, PHASES, DESIGN, LAYOUT, GAME_RULES, CANVA_BRIEF
  public/                    icons, manifest assets, favicon
  e2e/                       Playwright specs (one per mode + settings)
  .github/workflows/ci.yml
  src/
    main.tsx                 mount, register SW, inject analytics
    App.tsx                  screen switch
    config/
      gameRules.ts           ALL tunable constants and difficulty tables
    content/
      strings.ts             ALL UI text (D9)
      piDigits.ts            static string, 1000+ digits after "3."
    engine/                  shared, mode-agnostic, pure
      clock.ts               Clock interface + realClock + fakeClock
      rng.ts                 seeded RNG
      scoring.ts             points, multiplier, time bonus
      rot.ts                 Rot Meter / lives (3 -> stages)
      streak.ts
      session.ts             shared phase machine helpers
      types.ts
    modes/
      speedMath/             generator.ts, reducer.ts, SpeedMathScreen.tsx, *.test.ts
      visualMemory/          generator.ts, reducer.ts, VisualMemoryScreen.tsx, *.test.ts
      piChallenge/           checker.ts, reducer.ts, PiChallengeScreen.tsx, *.test.ts
    ui/                      shared components: Hud, RotMeter, NumberPad, Button, Card, Toggle, Modal
    screens/                 Home, Settings, GameOver, Credits
    lib/
      storage.ts             versioned localStorage
      audio.ts               Web Audio
      haptics.ts             vibration
      theme.ts               system/light/dark
      analytics.ts           typed event wrapper
    assets/
      sounds/                short effects (see 8)
    styles/
      index.css              Tailwind import + @theme tokens + CSS variables
```

Rules:
- `engine/` and `modes/*/reducer.ts|generator.ts|checker.ts` import no React, no DOM, no `Date.now`, no `Math.random`. This is what makes them unit-testable.
- UI components never hold game logic. They dispatch actions and render state.
- No literal UI text outside `content/strings.ts`.
- No tunable number outside `config/gameRules.ts`.

## 4. Game state machine

Each mode has a typed reducer: `(state, action) => state`. Pure, no side effects. Side effects (sound, vibrate, save, analytics) are run by a thin hook in the screen component in response to state transitions or returned effect descriptors (proposed: reducer state carries an `events` list that the hook drains).

### 4.1 Phases

```
idle -> countdown -> show -> input -> feedback -> next -> (show | gameover)
                                                  \-> gameover
```

| Phase | Meaning | Modes |
|---|---|---|
| idle | Ready screen, waiting for Start | all |
| countdown | One 3-2-1 (1.5 s total) before each game, not between rounds (D18) | all, Pi included |
| show | Question or pattern displayed | Speed Math: question visible (input open too, see below). Visual Memory: tiles lit. Pi: skipped |
| input | Player answers, timer running. Pi: waits for the first digit, and the 30 s clock starts on it (D19) | all |
| feedback | Right/wrong flash, short fixed delay | Speed Math, Visual Memory. Pi gives per-digit feedback inline, no pause |
| next | Apply score, streak, lives, difficulty; pick next question | all |
| gameover | Run ended; final score, save result | all |

Speed Math has no separate memorize step, so `show` and `input` collapse into one tick (proposed: the reducer still passes through `show` so the machine is uniform). Pi Challenge uses `idle -> countdown -> input -> gameover` only (D15, D19).

### 4.2 Typed shape (proposed)

```ts
type Phase = 'idle' | 'countdown' | 'show' | 'input' | 'feedback' | 'next' | 'gameover';

type RunState<Q, A> = {
  phase: Phase;
  level: number;
  question: Q | null;
  score: number;
  streak: number;
  multiplier: number;
  lives: number;            // 3..0, drives Rot Meter stage; only decreases (D20); unused by Pi (D21)
  phaseEndsAt: number | null; // clock ms deadline
  seed: number;
  rngState: number;         // so the run is replayable
  events: GameEvent[];      // for sound/haptics/analytics hooks
};

type Action =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }       // from the clock
  | { type: 'answer'; value: unknown; now: number }
  | { type: 'restart'; now: number };
```

Shared helpers in `engine/` (scoring, streak, rot) are called by each mode's reducer so rules are not duplicated. Pi does not call streak, multiplier, time bonus or rot (D15, D21). The time bonus is added after the multiplier, never multiplied, and a multiplier step applies from the attempt after reaching it (D25).

### 4.3 Time

The reducer never reads the real clock. It receives `now` in actions and stores deadlines.

- `engine/clock.ts` defines `interface Clock { now(): number }`.
- `realClock` uses `performance.now()`. `fakeClock` lets tests advance time manually.
- A `useGameLoop` hook runs `requestAnimationFrame` and dispatches `tick` with `clock.now()`. It pauses when the tab is hidden or the app is backgrounded (`visibilitychange`, `pagehide`, D26); the run resumes by tap on Resume with deadlines shifted by the paused time, so switching tabs is not punished and not exploitable. Quitting mid-game saves the score as a finished game (D26).
- Timeouts are a `tick` whose `now >= phaseEndsAt`. Tests dispatch ticks directly with chosen times, with no timers and no sleeping.

## 5. Config, difficulty, RNG

### 5.1 `src/config/gameRules.ts`

One exported, typed, readonly object. Everything tunable is here and nowhere else: lives, multiplier step and cap, time bonus curve, per-mode timers, difficulty tables (level to parameters), feedback delay, countdown length, Pi duration. `docs/GAME_RULES.md` documents these values and names the same keys. Changing a number means editing this file only. A unit test asserts invariants (for example multiplier cap >= 1, tables are monotonic where the rules say they are).

### 5.2 Seeded RNG

`engine/rng.ts`: a small seedable PRNG (proposed: mulberry32; 32-bit state, fine for a game). API: `createRng(seed)`, `next()`, `int(min, max)`, `pick(array)`, `shuffle(array)`. All generators take an `Rng` argument. No `Math.random` in `engine/` or `modes/`. Normal runs seed from `crypto.getRandomValues` once at start (the seed is stored in state). Later B Daily Challenge passes a date-derived seed (for example a hash of `YYYY-MM-DD` in UTC) and gets identical questions for everyone.

### 5.3 Pi digits

`content/piDigits.ts` exports one static string of the digits after "3." (at least 1,000, MASTER section 6). The checker is `isCorrectDigit(index, char)` plus `expectedDigit(index)`. A unit test asserts the string length is at least 1000, contains only 0-9, and its first 30 digits equal the known prefix. Source the digits from a trusted reference and record the source in a comment (do not type them by hand). Pi mode scoring is the count of correct digits after the decimal point. The 30 s deadline is set when the first digit action arrives (D19). When the player passes the last stored digit (unrealistic in 30 s), the run ends as a perfect run (proposed).

## 6. Storage

`src/lib/storage.ts`, localStorage only, no server (D5).

- One key: `dnlir:v1` (proposed) holding one JSON object.
- Schema (proposed shape, decisions D22):

```ts
type SaveV1 = {
  version: 1;
  bests: { speedMath: number; visualMemory: number; piChallenge: number };
  bestStreak: { speedMath: number; visualMemory: number };      // none for Pi (D22)
  gamesPlayed: { speedMath: number; visualMemory: number; piChallenge: number }; // per mode (D22)
  settings: { sound: boolean; vibration: boolean; theme: 'system' | 'light' | 'dark' };
};
```

- `load()`: `try { parse } catch { return defaults }`. Validates shape, fills missing fields with defaults, runs migrations in order (`migrations[n]` upgrades n to n+1) until `version` is current. Unknown newer version: do not overwrite, use defaults in memory (proposed).
- `save()`: `try { setItem } catch {}` (private mode, quota, disabled storage). The game must run fully with storage unavailable (values live in memory for the session).
- `reset()`: clears the key (Settings "reset local data").
- Pure functions (`migrate`, `validate`) are unit-tested with old, corrupt and empty payloads. The Later A stats history will be a `v2` migration.
- Best streak and games played are per mode, Pi has no streak (D22). Reset clears all of it.

## 7. Theming

- Three settings: system, light, dark (D10). Applied as `data-theme="light|dark"` on `<html>`; "system" removes the attribute and follows `prefers-color-scheme`.
- Set the attribute in an inline script in `index.html` before first paint to avoid a flash (proposed).
- Tokens from `docs/DESIGN.md` live as CSS variables in `styles/index.css` (`--color-bg`, `--color-surface`, `--color-accent`, and so on), with light and dark values. Tailwind v4 `@theme` maps them (`--color-*: var(...)`) so utilities like `bg-bg` and `text-accent` work. Components use utilities, not hex values.
- Update `<meta name="theme-color">` when the theme changes.

## 8. Audio and haptics

Audio (`lib/audio.ts`):
- Web Audio API, one shared `AudioContext`, created or resumed on the first user gesture (browsers block it before).
- Short effects (correct, wrong, tick, streak up, game over, new best) preloaded as `AudioBuffer` during the first interaction, in `src/assets/sounds/`. Small files (proposed: `.mp3` or `.ogg`, under ~30 KB each), precached by the service worker so they work offline.
- Mute setting from storage; `play(name)` is a no-op when muted or when decode failed.
- Never throws into the game loop.

Haptics (`lib/haptics.ts`):
- `navigator.vibrate` guarded: `if ('vibrate' in navigator && settings.vibration)`. iOS Safari does not support it, so it silently does nothing there. The toggle can be hidden where unsupported (proposed).
- Short patterns: wrong answer, game over. Vibration follows only its own setting; reduced motion does not change it (proposed).

## 9. Accessibility

- Reduced motion: CSS `@media (prefers-reduced-motion: reduce)` plus a `useReducedMotion` hook. Replace flashes, shakes and the Rot Meter decay animation with instant state changes. The Visual Memory tile display still works (shape or brightness changes, not motion).
- Keyboard play on desktop: Speed Math accepts digits, Backspace, Enter (no minus, answers are never negative, D23). Pi accepts digits only (no Backspace). Visual Memory tiles are focusable buttons with arrow-key movement and Space/Enter to select (proposed). Escape returns to the menu with a confirm.
- Focus: move focus to the primary control on each screen change; visible focus ring from DESIGN tokens; focus is never trapped except in modals.
- Tap targets at least 44 px. Color is never the only signal (lit tiles change shape or brightness; correct/wrong also use icon or text).
- Live regions: `aria-live="polite"` for score and feedback text, `role="img"` with label on the Rot Meter (for example "2 of 3 lives").
- Custom number pad uses real `<button>` elements, and the on-screen input is `readOnly`/`inputMode="none"` so the system keyboard stays closed on phones.

## 10. PWA and offline

- `vite-plugin-pwa`, `generateSW`, `registerType: 'autoUpdate'`. Precache the full build output including sounds and fonts.
- Manifest (from DESIGN): name "Do Not Let It Rot", `display: standalone`, `orientation: portrait` (proposed), theme and background colors from tokens, 192 and 512 icons plus maskable.
- Fonts self-hosted (proposed) so offline works and no third-party request is made.
- Update flow: new version activates on next launch; no blocking prompt (proposed).
- Install: rely on the browser install prompt; add an optional in-app "Install" hint on Home (build Phase 5, proposed). iOS: Share, Add to Home Screen (shown as a text hint).
- Check offline with `npm run build && npm run preview`, then DevTools offline. The dev server does not exercise the service worker by default.

## 11. Analytics

Vercel Analytics only (D13). No other tracking, no cookies added by us, no personal data. A one-line privacy note is shown on the Credits screen (D30).

- Page-level: `<Analytics />` or `inject()` in `main.tsx`.
- Custom events (`lib/analytics.ts` wraps `track()` from `@vercel/analytics`; the event names are a closed union, props are small and non-identifying):

| Event | Props |
|---|---|
| `game_start` | `mode` |
| `game_over` | `mode`, `score`, `new_best` (bool) |
| `new_best` | `mode`, `score` |
| `settings_changed` | `key` (sound, vibration, theme) |
| `install_prompt_accepted` | none |
| `data_reset` | none |

- Custom events may require a paid plan on Vercel; the free tier shows page views. Confirm in the Vercel dashboard (unverified). If unavailable, keep the wrapper and let it be a no-op.
- Analytics is disabled in dev and tests (wrapper checks `import.meta.env.PROD`).

## 12. Testing

Vitest (unit, pure, no browser needed):

| Area | Cases |
|---|---|
| scoring | points x multiplier, time bonus bounds, rounding |
| streak/multiplier | step every N, cap, reset on miss |
| lives/Rot | lose a life, stage mapping, zero is gameover |
| reducers (each mode) | every phase transition, countdown, timeout via `tick`, wrong answer, gameover, restart, pause and resume, Pi ignores lives and multiplier and starts its clock on the first digit |
| generators | Speed Math: answers are integers, division is even, operands within level range, same seed gives same questions. Visual Memory: lit count and grid size per level, no duplicate tiles |
| difficulty | tables monotonic, level lookup clamps at the max |
| pi checker | prefix, wrong digit stops, index past end, string length >= 1000 |
| storage | defaults, corrupt JSON, migration, quota error, unavailable storage, per-mode streak and games played |
| rng | determinism, range |

Playwright e2e, mobile viewport (proposed: Pixel 7 and a 360 x 640 custom viewport; Chromium; WebKit optional):
- One happy path per mode: start from Home, play to game over using the real UI (Speed Math reads the question text and answers via the number pad; Visual Memory reads the lit tiles from a test hook (proposed: `data-lit` attribute) ; Pi types digits from the known prefix), verify Game Over screen and saved best on reload.
- Settings: theme toggle, mute persists across reload.
- Offline: after first load, go offline, reload, Home still renders (run against `preview`).
- No horizontal scroll or overflow at 360 px on each screen (`scrollWidth <= clientWidth`).
- Tests use a fake clock via an injectable clock: the app reads an injectable clock from `window.__clock` only when `import.meta.env.MODE === 'test'` (proposed), so e2e does not wait real 30 s.

Coverage target: no number set (MASTER only requires scoring, difficulty, generation, pi checking to be covered).

## 13. CI and deploy

GitHub Actions `.github/workflows/ci.yml`, on push and pull request:

1. checkout, setup-node 22 with npm cache
2. `npm ci`
3. `npm run typecheck`
4. `npm run lint`
5. `npm test`
6. `npm run build`
7. Playwright e2e on pull requests and main (installs Chromium; proposed, may be split into a second job so the fast gate stays fast)

Deploy: Vercel, Git integration on `najeeb101/do-not-let-it-rot`. Production from `main`, a preview URL per pull request, free `*.vercel.app` domain (D17). Framework preset Vite, build `npm run build`, output `dist`. No env vars in v1. Branch protection on `main` requiring the CI check (proposed).

## 14. Later A and Later B extension points (not built)

| Future feature | Hook already in place |
|---|---|
| New modes (Sequence Memory, Number Recall, Odd One Out) | Add `src/modes/<mode>/` with the same reducer shape; register in a mode list; strings and rules keys added. Home renders cards from the list. |
| Mixed Mode | Modes expose `createInitialState`, `reducer`, `Screen`. A wrapper chains them using the shared RunState. |
| Stats screen | Storage `v2` migration adds history; engine already emits `events` per answer (correct, reaction time). |
| Share button | Pure function builds score text; image via canvas later. |
| Daily Challenge | Seeded RNG, seed derived from UTC date. Local best per day stored in a `v2` field. |
| Leaderboard (Supabase, anonymous auth) | A `src/lib/api.ts` behind an interface; submit on `game_over` event. Needs rules for server validation (client scores are untrusted, decide then). Not added in v1; no Supabase dependency installed. |
| Arabic / RTL | All text in `strings.ts`; use CSS logical properties (`ms-`, `me-`, `start`) from day one (proposed). |

## 15. Repo hygiene

- `CLAUDE.md` at root: setup commands, folder rules from section 3, "read docs/MASTER.md first", conventions (no UI strings or tunables outside their files, pure engine).
- No secrets in git. `.gitignore`: `node_modules`, `dist`, `.env*`, `playwright-report`, `test-results`. No `.env` is needed.
- Commits: no Claude co-author line, no "Generated with" footer.
- MIT `LICENSE`, README credits friend ("Concept by ..." once the name is known, D14).
- Docs live in `docs/`; the concept PDF stays in `docs/concept/`.
