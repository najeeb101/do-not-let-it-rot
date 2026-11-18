# Do Not Let It Rot: Build Phases

Derived from `docs/MASTER.md` and `docs/ARCHITECTURE.md`. Each phase ends in something a reviewer can run. Do not start a phase until the previous one passes its checks. Numbering here is the build plan; MASTER's post-v1 feature groups are named "Later A" and "Later B" to avoid a clash with these phases.

Gate: the Canva designs (MASTER D11) must be approved before Phase 5 UI polish. Phases 0 to 4 use plain placeholder UI (unstyled or minimal Tailwind, system fonts, no final colors).

Every phase: CI green, no new text outside `src/content/strings.ts`, no tunable outside `src/config/gameRules.ts`, no commit co-author line.

## Overview

| Phase | Name | Output |
|---|---|---|
| 0 | Scaffold, CI, deploy | Hello page live on Vercel |
| 1 | Engine, storage, tests | Tested shared logic, no game UI |
| 2 | Speed Math end to end | First playable mode |
| 3 | Visual Memory | Second mode |
| 4 | Pi Challenge | Third mode |
| 5 | Home, settings, game over, Rot Meter, sound, haptics, PWA | v1 feature complete, real design |
| 6 | QA and launch | Shipped v1 |

## Phase 0: Scaffold, CI, deploy

Scope:
- Vite + React + TypeScript + Tailwind v4 project, versions per ARCHITECTURE section 1 (TypeScript pinned to 6.0.3, D28).
- Scripts: dev, build, preview, typecheck, lint, test (one trivial passing test), test:e2e (one smoke test).
- Folder skeleton from ARCHITECTURE section 3 (empty files or placeholders).
- GitHub Actions CI. Vercel connected. `@vercel/analytics` injected.
- README, `CLAUDE.md`, MIT `LICENSE`, `.gitignore`, `.nvmrc`, `engines`.

Files touched: `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `.github/workflows/ci.yml`, `README.md`, `CLAUDE.md`, `LICENSE`, `.gitignore`, `.nvmrc`, `playwright.config.ts`, `e2e/smoke.spec.ts`.

Acceptance checks:
| Check | How |
|---|---|
| One-command setup | Fresh clone, `npm install && npm run dev`, page loads at the printed URL |
| Gates pass | `npm run typecheck && npm run lint && npm test && npm run build` exit 0 |
| CI | A pull request shows the CI workflow green |
| Deploy | `main` is live on a `*.vercel.app` URL; a PR gets a preview URL |
| Analytics | Page view appears in the Vercel Analytics dashboard (may take minutes) |
| Hygiene | `git log` has no Claude co-author line; no `.env` or secrets in the repo |

## Phase 1: Engine, storage, tests

Scope: all shared, mode-agnostic logic, pure and tested. No game UI.
- `config/gameRules.ts` with the shared constants (lives 3, multiplier rules, time bonus curve) from GAME_RULES.md.
- `engine/`: `clock` (real and fake), `rng` (seeded), `scoring`, `streak`, `rot` (only rots, no healing, D20), shared phase types and helpers (including the 3-2-1 countdown phase and pause on hidden tab, D18, D26).
- `lib/storage.ts` with versioned schema, validation, migration, try/catch, reset.
- `content/strings.ts` skeleton.

Files touched: `src/config/gameRules.ts`, `src/engine/*`, `src/lib/storage.ts`, `src/content/strings.ts`, matching `*.test.ts`.

Acceptance checks:
| Check | How |
|---|---|
| Unit tests | `npm test` passes; scoring, streak and multiplier cap, lives to Rot stage, rng determinism, storage (defaults, corrupt JSON, migration, quota error) all have tests |
| Purity | `grep -rE "Math.random|Date.now|document|window" src/engine` returns nothing |
| Same seed | Test shows same seed gives same sequence |
| Storage safety | With `localStorage.setItem` stubbed to throw, `save()` does not throw |

## Phase 2: Speed Math end to end

Scope: first full playable mode, placeholder UI.
- Question generator with difficulty ramp (GAME_RULES tables), even division only, integers only.
- Reducer with the full phase machine (countdown first, D18) and per-question timer, wrong or timeout costs a life. Pauses when the tab is hidden (D26).
- `useGameLoop` (rAF + clock), custom number pad, plain HUD (score, streak, multiplier, timer, lives as text or simple icons), plain game over with Retry and Menu.
- Saves best score, best streak and games played per mode (D22). Quitting mid-game saves the score (D26).
- Minimal Home with a Speed Math button; minimal screen switch.
- First Playwright happy path.

Files touched: `src/modes/speedMath/*`, `src/engine/session.ts`, `src/ui/{Hud,NumberPad,Button}.tsx`, `src/screens/{Home,GameOver}.tsx`, `src/App.tsx`, `src/hooks/useGameLoop.ts`, `src/content/strings.ts`, `src/config/gameRules.ts`, `e2e/speedMath.spec.ts`.

Acceptance checks:
| Check | How |
|---|---|
| Playable | From Home to the first question in 2 taps (countdown not counted, D18), then play to game over on a phone-size viewport |
| Rules | 3 wrong or timed-out answers end the run; streak resets on a miss; multiplier follows the config |
| Unit tests | Generator (integers, even division, per-level ranges, seed determinism), reducer (every transition, timeout via fake clock), difficulty monotonic |
| e2e | `npm run test:e2e` passes the Speed Math happy path and a reload shows the saved best |
| No scroll | At 360 x 640 there is no scrolling during play |
| Keyboard | Desktop digits, Backspace and Enter work; no minus key (D23) |

## Phase 3: Visual Memory

Scope:
- Grid pattern generator (3x3 growing to 4x4, 5x5), lit count and display time per level.
- Reducer: countdown, show (tiles lit for 1500 ms down to 800 ms, D24), input with timer, strict mode (one wrong tap fails the round and costs a life, D16), timeout costs a life.
- Grid component with tap targets of at least 44 px; lit tiles distinguished by shape or brightness, not color only.
- Home gets a second card.

Files touched: `src/modes/visualMemory/*`, `src/ui/Grid.tsx` (or in the mode folder), `src/screens/Home.tsx`, `src/content/strings.ts`, `src/config/gameRules.ts`, `e2e/visualMemory.spec.ts`.

Acceptance checks:
| Check | How |
|---|---|
| Rules | One wrong tap fails the round and costs one life; recall timeout costs one life |
| Unit tests | Generator (count, no duplicates, in bounds, seeded), reducer, level table |
| e2e | Happy path passes (uses a test-only `data-lit` hook, absent in production build) |
| Fit | Grid fits 360 px width at every grid size, tiles at least 44 px |
| Accessibility | Tiles are keyboard operable; lit state is visible with colors ignored (check in grayscale) |

## Phase 4: Pi Challenge

Scope:
- `content/piDigits.ts` (1,000+ digits from a trusted source) and checker.
- Reducer: 3-2-1 countdown, then a 30 s single run whose clock starts on the first digit typed (D19), "3." pre-filled, live per-digit check, stops at the first wrong digit, no lives, no multiplier, no time bonus (D15). HUD is timer and digit count only, no Rot Meter (D21).
- Digit input via the number pad, plus desktop keys.
- Home gets the third card.

Files touched: `src/content/piDigits.ts`, `src/modes/piChallenge/*`, `src/screens/Home.tsx`, `src/content/strings.ts`, `src/config/gameRules.ts`, `e2e/piChallenge.spec.ts`.

Acceptance checks:
| Check | How |
|---|---|
| Digits | Test: length >= 1000, only 0-9, known prefix matches an independent source |
| Rules | A wrong digit ends the run at once; 30 s from the first digit ends it; score = correct digits after the point |
| No shared mechanics | Test shows lives, streak, multiplier and time bonus do not change Pi score |
| e2e | Typing the first N digits scores N; a wrong digit ends the run |
| Pasting | Pasted or auto-filled input is rejected (digits come only from key or pad presses, proposed) |

## Phase 5: Home, settings, game over, Rot Meter, sound, haptics, PWA

Precondition: Canva designs approved (MASTER D11), lime and near-black matched exactly to the concept PDF (D29), and DESIGN.md / LAYOUT.md final. This is where placeholder UI becomes the real UI.

Scope:
- Real Home (three mode cards with personal bests, tagline, mascot, settings button), Settings (sound, vibration, theme, reset data), Game Over (final score, best streak, new best moment, score-tier line, Retry, Menu; D27), Credits ("Concept by ..." and the one-line privacy note, D30).
- DESIGN tokens as CSS variables and Tailwind `@theme`; light and dark with system default; no flash on load.
- Rot Meter component: 3 lives shown as a brain with stages, only rots (D20), not used by Pi (D21); decay animation; reduced-motion fallback.
- Animations: tile flash, number pops, game over moment. All respect reduced motion.
- `lib/audio.ts` (Web Audio, preloaded, mute) and `lib/haptics.ts` (guarded).
- PWA: manifest, icons, service worker, offline. Custom analytics events.

Files touched: `src/styles/index.css`, `src/ui/*`, `src/screens/*`, `src/lib/{audio,haptics,theme,analytics}.ts`, `src/assets/sounds/*`, `public/*` (icons), `vite.config.ts` (PWA), `src/content/strings.ts`, e2e specs.

Acceptance checks:
| Check | How |
|---|---|
| Design match | Each screen compared against the approved Canva frames (side by side screenshots) |
| Settings | Sound, vibration and theme persist across reload; reset clears bests |
| Theme | System, light and dark all work; changing OS theme updates in "system" mode |
| Audio | Mute silences all effects; sounds play after first tap on iOS Safari |
| Haptics | Works on Android Chrome; on iOS nothing throws |
| Reduced motion | With the OS setting on, no decay or flash animation plays, game still fully playable |
| PWA | Lighthouse installable check passes; after one visit, airplane mode reload still plays all three modes |
| Analytics | `game_start` and `game_over` events fire in the production build only |

## Phase 6: QA and launch

Scope: fix what the checks find; no new features.
- 360 px fit on every screen and state (idle, countdown, show, input, feedback, game over).
- Light and dark review of every screen.
- Lighthouse mobile run on the production URL.
- Real-device pass: one Android phone and one iPhone (Safari), plus desktop Chrome, Firefox.
- Playtest and tune constants in `gameRules.ts`; update GAME_RULES.md to match.
- README final (screenshots, setup, credit), credits text, add friend as collaborator (needs handle, MASTER Q1).

Acceptance checks (all of MASTER section 8):
| Check | How |
|---|---|
| All modes playable offline | Airplane-mode test on phone and desktop |
| 2 taps to play | Open site, tap a mode card, tap Start (or fewer) |
| Lighthouse | Performance, Accessibility, Best Practices each >= 90 on mobile (MASTER section 8) |
| No overflow | Automated 360 px scroll check passes on all screens; manual pass on a real small phone |
| Tests | `npm test` and `npm run test:e2e` green; the unit areas MASTER lists are covered |
| Live | Production URL shared with the friend |

## Later A and Later B (after v1 ships, from MASTER section 5)

Later A (no backend, MASTER section 5):
| Item | Notes |
|---|---|
| Sequence Memory, Number Recall, Odd One Out | One mode folder each; same reducer shape |
| Stats screen | Accuracy, average reaction time, best streak, history; storage v2 migration |
| Share button | Score text first, image card later |
| Mixed Mode | Chain random mini-games |

Later B (needs backend, MASTER section 5):
| Item | Notes |
|---|---|
| Daily Challenge | Date-derived seed through the existing seeded RNG |
| Leaderboards | Supabase, anonymous accounts first; decide how to treat untrusted client scores |
| Arabic (RTL) | Strings already centralized; layout uses logical properties |

Each later item gets its own mini-plan with scope and acceptance checks written before work starts.
