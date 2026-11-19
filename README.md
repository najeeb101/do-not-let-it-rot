# Do Not Let It Rot

A fast-paced brain-training game that fights brain rot. Short, timed challenges that test memory, math and focus.

> Scroll less. Think more.

Status: in development (Speed Math playable). Start with [docs/MASTER.md](docs/MASTER.md).

Concept by a friend (credit to be added). Built by Najeeb Abdi.

## Modes (v1)
- Visual Memory
- Speed Math
- Pi Challenge

## Docs
- [Master document](docs/MASTER.md) (start here, source of truth)
- [Architecture](docs/ARCHITECTURE.md)
- [Build phases](docs/PHASES.md)
- [Game rules](docs/GAME_RULES.md)
- [Design](docs/DESIGN.md)
- [Layout](docs/LAYOUT.md)
- [Canva brief](docs/CANVA_BRIEF.md)
- [Original concept (PDF)](docs/concept/do-not-let-it-rot-concept.pdf)
- [Contributor and agent notes](CLAUDE.md)

## License
MIT

## Setup
Needs Node 22.12 or newer.

```
npm install && npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`, `npm run lint`, `npm test` (unit), `npm run test:e2e` (Playwright, run `npx playwright install chromium` once).
