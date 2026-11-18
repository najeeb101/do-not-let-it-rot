# Do Not Let It Rot: Design

Derived from `docs/MASTER.md` (D3, D6, D10, D11, D12 and section 7). If this file and MASTER.md disagree, MASTER.md wins. Anything not in MASTER.md is marked "(proposed)". Contrast ratios below were computed with the WCAG 2.x relative luminance formula.

Note on the concept PDF: it was read as text only. Its colors could not be extracted from the file, so the hex values here (lime #C6F24E on near-black #0E1116) are estimates (MASTER D29). They must be matched exactly to the concept PDF before the UI build.

## 1. Identity

| Trait | Meaning in the UI |
|---|---|
| Bold | One huge number or word per screen. Thick type, thick outlines. |
| Minimal | No decoration that is not information. One accent color. Max 3 type sizes per screen. |
| High contrast | Lime on near-black in dark mode, near-black on lime and white in light mode. |
| Funny copy, serious play | Meme tone lives in text, empty states and game over lines only. Tiles, timers and HUD stay clean. |
| One screen | Every game state fits 360 x 640 with no scroll and no overlap. Layout is in `LAYOUT.md`. |
| Own identity | Not Human Benchmark: no blue, no flat page chrome. Our signature is the lime brain (Rot Meter), chunky rounded tiles, and the rot color shift. We borrow only the one-task-per-screen feel (D12). |

Signature elements (proposed): the lime brain mascot, a hard 2 px outline on lit things, numbers in a heavy display face.

## 2. Color tokens

Tokens are semantic. Components never use raw hex. Implement as CSS variables on `:root` and `[data-theme="dark"]`, mapped in Tailwind.

### 2.1 Dark mode (default look, matches concept) (hex are estimates, D29)

| Token | Hex | Use |
|---|---|---|
| bg | #0E1116 | App background |
| surface | #171B22 | Cards, HUD, modal |
| surface-2 | #212731 | Raised or pressed surfaces, keys |
| text | #F4F6F8 | Primary text |
| text-muted | #9AA4B2 | Secondary text, labels |
| border | #3A4352 | Outlines of cards and keys |
| accent | #C6F24E | Lime: fills, big numbers, focus ring |
| accent-ink | #C6F24E | Lime used as text (same as accent in dark) |
| accent-contrast | #0E1116 | Text or icon on top of accent |
| success | #3DDC84 | Correct |
| danger | #FF6B78 | Wrong, timer urgency |
| warning | #FFB84D | Low time, caution |
| tile-idle | #1C222B | Unlit tile |
| tile-lit | #C6F24E | Tile shown or selected |
| tile-correct | #3DDC84 | Tile confirmed right |
| tile-wrong | #FF6B78 | Tile tapped wrong |
| rot-0 (fresh) | #C6F24E | Brain, full life |
| rot-1 (1 lost) | #A3C23A | Brain, slightly off |
| rot-2 (2 lost) | #B58A3A | Brain, decaying |
| rot-3 (rotten) | #8A6A4A | Brain, game over |
| overlay | rgba(14,17,22,0.72) | Modal scrim |

### 2.2 Light mode (proposed hex, derived from the D29 estimates)

| Token | Hex | Use |
|---|---|---|
| bg | #F7F8F4 | App background (slightly warm white) |
| surface | #FFFFFF | Cards, HUD, modal |
| surface-2 | #EDEFE8 | Raised or pressed surfaces, keys |
| text | #0E1116 | Primary text |
| text-muted | #505A68 | Secondary text |
| border | #8A93A0 | Outlines (3:1 or better for UI) |
| accent | #C6F24E | Lime for FILLS only (buttons, bars, lit tiles) |
| accent-ink | #4A6600 | Dark lime for text, icons and thin lines |
| accent-contrast | #0E1116 | Text on lime fills |
| success | #1E7A3E | Correct |
| danger | #C62839 | Wrong |
| warning | #8A5A00 | Caution |
| tile-idle | #DDE1D6 | Unlit tile (always with a 2 px border token) |
| tile-lit | #C6F24E | Lit tile, always with a 2 px text-colored outline |
| tile-correct | #1E7A3E | Confirmed right |
| tile-wrong | #C62839 | Wrong |
| rot-0 | #C6F24E | Fresh brain (outlined in text color) |
| rot-1 | #B9C94A | 1 lost |
| rot-2 | #C4A24A | 2 lost |
| rot-3 | #8A6A4A | Rotten |
| overlay | rgba(14,17,22,0.55) | Modal scrim |

Light mode rule: bright lime is never text and never a lone shape on white (1.30:1). Lime shapes carry a 2 px `text` outline, and lime text becomes `accent-ink`.

### 2.3 Contrast checks (computed)

Targets: text 4.5:1 (AA), large text and UI components 3:1.

| Pair | Dark | Light |
|---|---|---|
| text on bg | 17.46 | 17.73 |
| text on surface | 15.94 | 18.91 |
| text on surface-2 | 13.85 | 16.31 |
| text-muted on bg | 7.50 | 6.56 |
| text-muted on surface | 6.85 | 6.99 |
| text-muted on surface-2 | 5.95 | 6.03 |
| accent on bg | 14.60 | 1.21 (fail, so fills only) |
| accent on surface | 13.33 | 1.30 (fail, so fills only) |
| accent-ink on bg | 14.60 (same as accent) | 6.17 |
| accent-ink on surface | 13.33 | 6.58 |
| accent-ink on surface-2 | n/a | 5.67 |
| accent-contrast on accent | 14.60 | 14.60 |
| danger on bg | 6.87 | 5.23 |
| danger on surface | 6.27 | 5.58 |
| success on bg | 10.60 | 5.04 |
| warning on bg | 11.00 | 5.56 |
| border on bg (UI 3:1) | 1.90 (decorative only, see below) | 2.91 (decorative only, see below) |
| tile-lit on tile-idle | 12.35 | n/a (outline carries it: text on lit 14.60) |
| white on tile-wrong (light) | n/a | 5.58 |
| dark on tile-correct (dark) | 10.60 | n/a |
| white on tile-correct (light) | n/a | 5.37 |

Border note: `border` is decorative separation. Anything that must be perceivable as a control (key, tile, toggle) also differs by fill, so it does not rely on border alone. Idle tiles on bg are low contrast on purpose (1.18 dark, 1.24 light); they get a 2 px `border` outline plus the shape rules in section 5.5 so they remain findable. If testing shows idle tiles are hard to see, raise tile outline to `text-muted` (7.50 dark, 6.56 light) (proposed).

The rot stage fills are non-text graphics. In light mode they are outlined in `text`, so the outline (not the fill) meets 3:1. In dark mode rot-3 on bg is about 3.8:1; others are higher.

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Display (scores, titles, big numbers) | **Space Grotesk** (Google Fonts, OFL), weights 700 | Chunky, techy, slightly quirky digits, feels meme-literate without being childish. Has tabular figures. Not the default look of Human Benchmark. |
| UI (labels, buttons, body) | **Inter** (Google Fonts, OFL), weights 400, 500, 600 | Very readable at 12 to 16 px, excellent numerals, wide language support. |
| Fallback stack | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Offline and first paint. |

Self-host both as WOFF2 subsets (Latin) so the PWA works offline and there is no third-party request (aligns with D13 and D7) (proposed). Use `font-display: swap`. If the Arabic version comes later (D9), Space Grotesk and Inter have no Arabic glyphs, so add an Arabic face then (for example IBM Plex Sans Arabic).

### Scale (mobile first, rem at 16 px) (proposed)

| Token | Size / line | Weight | Use |
|---|---|---|---|
| text-xs | 12 / 16 | 500 | Captions, chip labels |
| text-sm | 14 / 20 | 500 | Secondary text, hints |
| text-base | 16 / 24 | 400 | Body |
| text-lg | 18 / 24 | 600 | Button labels, card titles |
| text-xl | 24 / 28 | 700 display | Screen titles |
| text-2xl | 32 / 36 | 700 display | HUD score |
| text-3xl | 48 / 52 | 700 display | Math question, pi digits |
| text-hero | 72 / 76 | 700 display | Game over score |

At 768 px and up, text-3xl becomes 64 and text-hero 96 (proposed). Minimum body text is 16 px so iOS does not zoom on focus.

Numbers: all score, timer, streak, multiplier and digit displays use `font-variant-numeric: tabular-nums` so they do not jitter as they change. Pi digits use `letter-spacing: 0.04em` and group in blocks of 5 (proposed).

## 4. Spacing, radius, shadows, grid

| Token group | Values (proposed) |
|---|---|
| Spacing (4 px base) | 4, 8, 12, 16, 24, 32, 48 (space-1 to space-7) |
| Page gutter | 16 px at 360, 20 px at 390, 32 px at 768 |
| Radius | sm 8, md 12, lg 20, tile 14, pill 999 |
| Border | 2 px for interactive and lit things, 1 px for dividers |
| Shadow dark | None. Use border and surface steps. Lit tile glow: `0 0 16px` accent at 40% |
| Shadow light | `0 2px 0` in text color at 100% for buttons (hard "sticker" shadow), `0 1px 2px` rgba(14,17,22,0.12) for cards |
| Max content width | 480 px game column, centered on larger screens |

Breakpoints (proposed, mobile first):

| Name | Width | Notes |
|---|---|---|
| base | 360 | Smallest supported. Everything must fit without scroll. |
| sm | 390 | Typical modern phone. Slightly larger gutters and tiles. |
| md | 768 | Tablet. Column stays 480 to 560 px, centered. Menu cards may sit 1 per row still. |
| lg | 1024+ | Desktop. Same column, larger type, keyboard hints visible. Side area stays empty or shows best scores (proposed). |

Use `100dvh` for the app height. Respect `env(safe-area-inset-*)`. Game height budget at 360 x 640: HUD 72, play area flexible, bottom controls up to 280 (number pad), with no scroll.

Grid: the game column is a single flex column. Visual Memory board is a square sized `min(100% width, available height)`, with a 8 px gap at 3x3, 6 px at 4x4, 4 px at 5x5.

## 5. Components

### 5.1 Mode card (menu)

Surface card, radius lg, 2 px border, min height 88 px, full width. Left: mode icon (24 px, accent / accent-ink). Middle: mode name (text-lg) and one-line joke (text-sm, muted). Right: "Best" label (text-xs, muted) over the best score (text-2xl, accent / accent-ink, tabular). States: default, pressed (surface-2, scale 0.98), focus (3 px accent ring, offset 2), disabled not used in v1. Three cards plus header and Rot Meter mascot fit in 640 px.

### 5.2 Buttons

| Button | Style |
|---|---|
| Primary | Fill accent, text accent-contrast, radius md, height 56, text-lg bold, 2 px outline in text color (light only), hard shadow in light. Pressed: translate 2 px down, shadow removed. |
| Secondary | Transparent, 2 px border in text, text color text. Pressed: surface-2. |
| Icon button | 44 x 44 minimum, radius pill or md, surface-2 fill. Used for settings, mute, back. |
| Disabled | 40% opacity plus no shadow. Never rely on opacity alone: also `aria-disabled` and no pressed animation. |

### 5.3 HUD

One row, height 72 px, sits at top of every game. Layout left to right:

| Slot | Content |
|---|---|
| Score | Label "SCORE" text-xs muted, value text-2xl display tabular |
| Streak chip | Pill, surface-2, text "x3" (text-lg) plus a small flame-free spark icon. Shows only from x2 up (proposed). Pops on increase. |
| Rot Meter | 40 x 40 brain icon with 3 life ticks (see section 6). Not shown in Pi Challenge. |
| Timer bar | Full width bar under the row, height 8, radius pill. Track surface-2, fill accent, drains left to right. Last 30% of time: fill changes to warning, then danger in the last 10% (proposed), plus pulse animation. Remaining seconds shown as text beside the bar so color is not the only signal. |

In Pi Challenge the HUD shows only the digit count and the timer (D21): no Rot Meter, no streak chip, no multiplier. The timer bar is the single 30 s clock and starts on the first digit typed (D19), so it sits full until then.

### 5.4 Grid tile (Visual Memory)

Radius tile (14), 2 px border. Sized by grid (section 4).

| State | Look | Non-color signal |
|---|---|---|
| idle | tile-idle fill, border outline | Plain, flat |
| lit (shown) | tile-lit fill, glow (dark) or text outline (light) | Inner filled dot or check shape plus higher brightness; also a scale to 1.04 |
| selected (recall, before result) | tile-lit with 3 px outline | Same inner dot |
| correct | tile-correct fill | Check mark icon |
| wrong | tile-wrong fill | X icon plus a shake |
| missed (revealed after fail) | idle fill with 3 px dashed tile-lit outline | Dashed outline |

Minimum tile size at 5x5 on 360 px: (360 - 32 gutter - 4 x 4 gap) / 5 about 62 px, above the 44 px target.

### 5.5 Number pad keys (Speed Math)

3 columns by 4 rows: 1 to 9, then backspace, 0, enter. Key height 56 (min 44), gap 8, radius md, surface-2 fill, 2 px border, label text-xl display. Enter key uses accent fill. Pressed: surface darker, scale 0.96, 60 ms. There is no minus key because answers are never negative (D23). Total pad height about 56 x 4 + 8 x 3 = 248 px. Pad is fixed to the bottom, answer display above it. Desktop: physical number keys, Enter, Backspace also work.

### 5.6 Pi digit display

Top line shows "3." pre-filled, in muted. Typed digits follow in text-3xl display, grouped in blocks of 5, auto-scrolling horizontally within one line (the last 15 digits visible) with the newest at the right. Correct digit: brief accent flash. Wrong digit: that digit turns danger, shakes, run ends, and the correct digit is shown below in text-muted with the label "Should be". Uses a digits-only pad (0 to 9; no backspace, no enter, no minus), because a digit is never editable (GAME_RULES 4.1).

### 5.7 Toast and feedback flash

| Type | Look |
|---|---|
| Correct flash | 150 ms full-play-area overlay of success at 12% opacity plus the "+points" text floating up 24 px and fading |
| Wrong flash | 200 ms danger at 16% plus screen shake (see motion) |
| Toast | Pill at top under the HUD, surface-2, text-sm, auto-hides in 2 s (for "Sound off", "Saved") |

Every flash also carries an icon (check or X) so color is not the only signal.

### 5.8 Game over card

Centered surface card, radius lg, 2 px border, slides up. Contents top to bottom: Rot Meter at the rotten stage (80 px; lives modes only, Pi has none), the score-tier line of copy (text-xl, see section 10), final score (text-hero, accent), "NEW BEST" badge when true (accent fill pill), then two rows of small stats (best streak, personal best; Pi shows personal best only), then Retry (primary) and Menu (secondary). Retry is auto-focused for keyboard users.

### 5.9 Settings toggles

Row height 56, label left (text-base), switch right: 52 x 32 track, radius pill, thumb 24. On: accent track plus a check glyph in the thumb. Off: surface-2 track plus a dot. Theme control is a 3-segment control: System, Light, Dark. Rows: Sound, Vibration, Theme, Reset data (danger text button with confirm modal). Credits line at the bottom: "Concept by [friend]" (D14).

### 5.10 Modal

Scrim `overlay`, panel surface, radius lg, max width 360, padding 24. Title text-xl, body text-base, buttons stacked on phones. Focus trapped, Escape closes on desktop, first focus on the safe action. Used for reset data confirm and quit game confirm (proposed).

## 6. Rot Meter

The lives display (D3): a simple brain with 4 stages (fresh plus 3 states of decay). It only rots, never heals (D20). Pi Challenge does not show it (D21). Pure vector: one brain outline path, a lobe line, a few extra shapes. Each stage reuses the same base, so it is easy to draw in Canva (a brain shape plus small shapes) and to export as SVG.

Base drawing (proposed): a rounded brain silhouette (two lobes joined) with a center fold line and 2 small squiggle folds per lobe. 2 px outline in `text` color, fill from `rot-N` token. Drawn in a 64 x 64 viewBox.

| Stage | Lives left | Fill token | Visual | Animation on entering stage |
|---|---|---|---|---|
| 0 Fresh | 3 | rot-0 | Full lime fill, happy squiggles, small sparkle shape top right | Idle: slow breathing, scale 1.0 to 1.04, 2.4 s loop |
| 1 One lost | 2 | rot-1 | Fill slightly yellower. One small dark spot on the left lobe. Sparkle gone. | Spot grows in (scale 0 to 1, 200 ms), brain does a quick wobble (rotate -6 to 6 deg) |
| 2 Two lost | 1 | rot-2 | Fill brown-yellow. Two or three spots. A thin green drip line from the bottom. One fly (tiny 2 dot shape) orbits. | Drip draws down (300 ms), fly starts a slow orbit loop (3 s). Brain tilts 4 deg. |
| 3 Rotten | 0, game over | rot-3 | Brown, droopy (lobes sagged 4 px lower), big spots, X eyes (two small x marks), dripping. | Sag plus shake (400 ms), spots spread, then holds still. Plays only once at game over. |

Life ticks: three small dots under the brain (filled = alive, hollow = lost), so the count never relies on color or the brain alone. Loss also changes the stage text for screen readers ("Brain health: 2 of 3 lives left").

Canva note: build each stage as one group. Keep shapes to the base brain, circles (spots), one line (drip), two dots (fly), two small crosses (eyes). No gradients, no filters.

Reduced motion: the idle breathing and fly orbit stop; stage change swaps instantly with a 150 ms opacity cross-fade.

## 7. Motion

Tokens (proposed):

| Token | Value | Use |
|---|---|---|
| dur-instant | 60 ms | Key press feedback |
| dur-fast | 120 ms | Tile press, chips |
| dur-base | 200 ms | Most transitions, flashes |
| dur-slow | 400 ms | Panels, game over, rot change |
| ease-out | cubic-bezier(0.2, 0.8, 0.2, 1) | Enter, pop |
| ease-in-out | cubic-bezier(0.4, 0, 0.2, 1) | Fills, bars |
| ease-spring | cubic-bezier(0.34, 1.56, 0.64, 1) | Pops, streak chip |

| Event | Motion | Reduced motion |
|---|---|---|
| Tile flash (show phase) | Fill snaps to tile-lit in 80 ms, holds for the display time (MASTER: 1.5 s down to 0.8 s), fades out in 120 ms | Same timing, no scale or glow, shape marker stays |
| Tile tap | Scale 0.96 then back, dur-fast | Color change only |
| Correct | Success flash dur-base, "+points" floats up 24 px, tile pops to 1.06 | Flash only at 12% opacity, no float |
| Wrong | Danger flash dur-base, 3 horizontal shakes of 6 px over 240 ms | Danger flash, no shake |
| Streak pop | Chip scales 1 to 1.3 to 1 with ease-spring, 300 ms; multiplier number swaps | Number swaps with no scale |
| Timer urgency (last 30%) | Bar turns warning, pulses opacity 1 to 0.6 at 1 Hz; last 10% danger and 2 Hz; the seconds text also pulses | Color change and bold text only, no pulse |
| Rot transition | See section 6 | Cross-fade |
| Game over | Play area dims 40%, card slides up 24 px and fades in over dur-slow, score counts up over 600 ms | Card fades in, score appears final |
| New best | Badge pops with ease-spring, lime confetti-free: a 2 px accent ring expands once from the score | Badge appears, no ring |
| Screen change | 150 ms fade | Instant |

Honor `prefers-reduced-motion: reduce` globally: no shakes, no pulses, no loops, durations of 1 ms except opacity fades. Add an in-app toggle later if needed (proposed, not in MASTER settings).

## 8. Sound

All events respect the mute toggle (D6). Sounds are short (under 400 ms, except game over up to 900 ms), quiet by default, and start only after the first user tap (browser autoplay rules). Tone: chunky, a little arcade, soft attack, no harsh high frequencies; the correct sound rises, the wrong sound drops.

| Event | Character (proposed) | Length |
|---|---|---|
| tap | Soft click, short low tick | 40 ms |
| correct | Bright two-note rise (like a major third up) | 150 ms |
| wrong | Low buzzy dip, falling pitch | 250 ms |
| streak up | Three-note quick arpeggio rising, pitch higher with the multiplier | 250 ms |
| tick (final seconds) | Dry woodblock tick, once per second in last 3 s (Speed Math) or last 5 s (Pi) | 30 ms |
| game over | Descending wobble, deflating, then a soft thud | 900 ms |
| new best | Rising fanfare of 4 notes plus a sparkle | 800 ms |

Sources: the simplest free option is to generate them at runtime with the Web Audio API (oscillators plus a gain envelope), which needs no files, no licenses and works offline. Alternative is CC0 packs (for example Kenney audio packs on kenney.nl, or freesound.org items filtered to CC0). No specific file has been checked here, so verify the license of any file before adding it, and record the source in the README or credits.

## 9. Haptics

Uses `navigator.vibrate` where supported (Android Chrome; iOS Safari does not support it, so the game must work without it). Toggle in settings (D6). Patterns in milliseconds (proposed):

| Event | Pattern |
|---|---|
| tap | 10 |
| correct | 20 |
| wrong | 60, 40, 60 |
| streak up | 15, 30, 15 |
| final-seconds tick | none (avoid buzzing for a whole countdown) |
| game over | 200 |
| new best | 30, 50, 30, 50, 80 |

## 10. Copy voice

Playful, short, a little roasting, never mean. No slurs, no body or mental-health jokes (do not joke about real conditions), no swearing, safe for school-age players. Brain rot slang is fine in small doses. All strings live in one strings file (D9).

| Moment | Line (proposed) |
|---|---|
| Home tagline | Scroll less. Think more. (from concept) |
| Home sub | Your brain called. It wants a workout. (from concept) |
| Start button | Unrot me |
| Game over, low score | Brain officially rotten. Please open a window. |
| Game over, mid score | Your brain is getting a bit smelly. |
| Game over, high score | Brain still crispy. Show-off. |
| Game over, new personal best (replaces the tier line) | New personal best. Brain: 1, scroll: 0. |
| Pi, first wrong digit | Pi is irrational. So is that digit. |
| Streak x2 | Warming up. |
| Streak x3 | Brain cells are cooking. |
| Streak x5 (max) | Max focus. Unscrollable. |
| Timeout | Too slow. The feed took you again. |
| Retry button | One more try |
| Menu button | Back to menu |
| Reset data confirm | Delete all scores? Your brain will forget them too. |
| Sound off toast | Sound off. Silent focus mode. |

Game over lines are chosen by score tier (low, mid, high, new best), not by rot stage (D27). Tier thresholds per mode are in GAME_RULES section 1.9. Keep a count: a line is at most about 8 words so it fits the game over card on 360 px.

## 11. Accessibility

| Rule | How |
|---|---|
| Tap targets | 44 x 44 px minimum (all keys, tiles, icons, toggles). Number keys are 56. |
| Color not sole signal | Tiles use icons, dots and outline styles; Rot Meter has dots and text; timer has numbers; correct and wrong have check and X. |
| Contrast | Text at least 4.5:1 and UI parts at least 3:1, per section 2.3. Lime is never text on light backgrounds. |
| Focus rings | 3 px ring, offset 2 px, accent in dark, text color (or accent-ink) in light, on every focusable element; visible only for keyboard focus (`:focus-visible`). |
| Keyboard | Digits, Enter, Backspace, Space or Enter to activate buttons; arrow keys to move between tiles with Space or Enter to select (proposed). |
| Reduced motion | Section 7; also respected for flash intensity (no flashing faster than 3 per second, to avoid photosensitivity risk). |
| Screen readers | Live region announces score, lives and result ("Correct. Streak 3."). Tile grid uses buttons with labels ("Row 2, column 3"). Game status changes use `aria-live="polite"`. |
| Time pressure | The game is timed by design; the round pauses automatically when the tab is hidden and has a manual pause button (D26, LAYOUT section 8). |
| Zoom and text size | Layout works at 200% browser zoom with no horizontal scroll; use rem. |
| Sound and haptics | Never the only feedback; every sound and haptic has a visual twin. |

## 12. Open items

Everything else that used to be listed here is settled by MASTER D18 to D30.

1. Exact lime and near-black hex must be matched to the concept PDF before the UI build (D29).
2. Concept friend's name for the credits line (MASTER Q1).
3. Canva designs are made via the browser (MASTER Q3); tokens and the Rot Meter can be recreated by hand.
4. Later A: Sequence Memory needs a categorical, colorblind-safe palette. Not needed for v1.
5. Later B: Arabic (RTL). Fonts here lack Arabic glyphs and icons/timer direction should use logical properties (proposed).
6. Analytics calls made while offline are dropped silently (proposed, no consent banner needed under D30).
