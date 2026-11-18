# Canva Brief: Do Not Let It Rot

What to design in Canva so frames map 1:1 to `docs/LAYOUT.md`. Colors, type and component styles come from `docs/DESIGN.md` (tokens such as accent, surface, mode card, pad key). Do not invent new ones. Frame names must match the LAYOUT screen names exactly.

## Setup

- [ ] One Canva design file per size group, or one file with pages named below. Name the file "DNLIR Design".
- [ ] Create the color and font styles from DESIGN.md first (Brand Kit if available, otherwise a swatch page).
- [ ] Dark is the signature theme (near-black with lime accent). Light is the second theme. Build dark first.
- [ ] Use a 4 px grid, 16 px side gutters, 44 px minimum tap targets.

## 1. Mobile frames, 390 x 844 px (each in Dark and Light)

Name pattern: `<Screen> / Dark` and `<Screen> / Light`.

- [ ] Home
- [ ] Mode Intro
- [ ] Countdown
- [ ] Visual Memory Show
- [ ] Visual Memory Recall
- [ ] Visual Memory Feedback (wrong tile revealed)
- [ ] Speed Math
- [ ] Pi Challenge
- [ ] Pi Challenge End (wrong digit with correct digit shown)
- [ ] Pause
- [ ] Game Over
- [ ] Game Over New Best
- [ ] Settings
- [ ] Reset Confirm (dialog over Settings)
- [ ] Credits
- [ ] Install Prompt (banner on Home)

That is 16 screens x 2 themes = 32 frames. If time is short, the minimum set is Home, Speed Math, Visual Memory Recall, Pi Challenge, Game Over (dark and light), 10 frames.

## 2. Small-phone check, 360 x 640 px

- [ ] Home / Dark
- [ ] Speed Math / Dark
- [ ] Pi Challenge / Dark

Purpose: prove nothing overflows at the minimum size.

## 3. Desktop frame, 1440 x 900 px

- [ ] Home / Desktop / Dark (wide home, three mode cards in a row, mascot and title)
- [ ] Optional: Speed Math / Desktop / Dark (480 px centered column on a plain background)

## 4. Components page

Frame name: `Components`. Suggested size 1440 x 1600. Show each in Dark and Light and in its states.

- [ ] Buttons: primary, secondary, destructive, disabled
- [ ] Mode card (3 variants, with personal best line)
- [ ] HUD row (score, streak with multiplier, pause)
- [ ] Timer bar: full, mid, warning
- [ ] Pad key and number pad (4x3 for Speed Math, 3x3 + 0 for Pi)
- [ ] Memory tile: idle, lit, correct, wrong, revealed
- [ ] Digit stream (Pi): prefilled "3.", typed, wrong digit
- [ ] Toggle, segmented control (System / Light / Dark), settings row
- [ ] Dialog, banner, toast
- [ ] Rot Meter HUD sizes (36 px, 4 stages in a row)

## 5. Rot Meter assets (vector, 4 stages)

Separate vector elements, each on its own transparent page, 512 x 512 px artboard, same silhouette so stages can swap or animate.

- [ ] `rot-meter-0-fresh`
- [ ] `rot-meter-1-tired`
- [ ] `rot-meter-2-rotting`
- [ ] `rot-meter-3-rotten`

Keep shapes simple (flat fills, no gradients or blurs) so the SVGs stay small and can be recolored per theme.

## 6. App icon

- [ ] 512 x 512 px, `app-icon-512`. Brain mark, stage 0, on the dark surface with the lime accent.
- [ ] Maskable version, `app-icon-maskable-512`: same size, artwork kept inside the central safe zone (a circle of 80 percent of the width, 410 px diameter, centered), and the background filled edge to edge.
- [ ] Also export 192 x 192 from the same design (`app-icon-192`) for the PWA manifest.

## 7. Social share image

- [ ] 1200 x 630 px, `social-share-1200x630`. Title, tagline "Scroll less. Think more.", mascot, lime on near-black. Keep text away from the outer 60 px.

## 8. Export checklist

| What | Format | File name | Drop in repo |
|---|---|---|---|
| Rot Meter stages | SVG | `rot-meter-0-fresh.svg` ... `rot-meter-3-rotten.svg` | `design/assets/` |
| UI icons (gear, pause, mode icons) | SVG | `icon-<name>.svg` | `design/assets/` |
| App icons | PNG | `app-icon-512.png`, `app-icon-maskable-512.png`, `app-icon-192.png` | `design/icons/` |
| Social share image | PNG | `social-share-1200x630.png` | `design/` (copied to `public/` by the build) |
| Frame references | PNG, 1x or 2x | `<screen-name>-<theme>.png` in kebab-case, for example `speed-math-dark.png` | `design/frames/` |
| Components page | PNG | `components-dark.png`, `components-light.png` | `design/frames/` |

- [ ] Export frames from Canva with "Download", PNG, one page per file.
- [ ] Keep the Canva share link in `design/README.md` (one line) so the source file can be found again.
- [ ] Do not commit anything with personal data.

## 9. Canva free plan notes (unverified, check before relying on them)

- SVG download may be locked to paid plans. If SVG is unavailable, redraw the Rot Meter and icons as SVG by hand or with a code export, and use the Canva PNG only as the reference.
- Transparent PNG background may also be paid-only. Use the flat surface color as the background for app icons if so.
- Brand Kit (saved colors and fonts) may be limited on free. A swatch page works as a substitute.
- Free elements and fonts only (budget rule in MASTER section 7). Avoid Pro-marked elements.
- The Canva connector status is unknown (MASTER Q3). If it is not connected, follow this brief by hand.

## 10. Hand-off

- [ ] Compare each exported frame to its LAYOUT.md wireframe: same regions, same order, same above-the-fold content.
- [ ] Note any layout change in LAYOUT.md rather than only in Canva.
