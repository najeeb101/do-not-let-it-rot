# Do Not Let It Rot

Mobile-first brain-training web game that fights brain rot: Visual Memory, Speed Math, Pi Challenge. Vite + React + TypeScript + Tailwind, no backend, local saves, PWA on Vercel. Status: in development.

## Read first
Read `docs/MASTER.md` before anything else. It is the source of truth (decisions D1 to D30); if another doc disagrees, MASTER wins and the other doc gets fixed.

| Doc | Covers |
|---|---|
| `docs/MASTER.md` | Idea, decisions, features, mode rules, constraints, open questions |
| `docs/ARCHITECTURE.md` | Stack and versions, folders, state machine, storage schema, PWA, testing |
| `docs/PHASES.md` | Build phases 0 to 6 with acceptance checks |
| `docs/GAME_RULES.md` | Exact formulas, tier tables, constants, test cases |
| `docs/DESIGN.md` | Tokens (light and dark), type, components, motion, sound, copy |
| `docs/LAYOUT.md` | Every screen and flow, wireframes |
| `docs/CANVA_BRIEF.md` | Frames and assets to design in Canva |

## Commands
- Install: `npm install` (Node 22.12+; e2e needs `npx playwright install chromium` once)
- Dev server: `npm run dev`
- Test: `npm test` (unit), `npm run test:e2e` (Playwright)
- Build: `npm run build`
- Also: `npm run typecheck`, `npm run lint`

## Rules
- Build in the phases of `docs/PHASES.md`. Do not start a phase before the previous one passes its checks.
- All tunables (timers, tiers, scoring, countdown) live in `src/config/gameRules.ts` only.
- All UI text lives in `src/content/strings.ts` only.
- `engine/` and mode reducers are pure: no React, no DOM, no `Date.now`, no `Math.random`.
- No secrets in git. Document env var names only, never values.
- No Claude co-author line or "Generated with" footer in commits.
- Mobile-first: 360 px wide must fit with no overflow and no scroll during play.
- Light and dark mode both supported; respect reduced motion.
- TypeScript stays pinned to 6.0.3 (D28).
