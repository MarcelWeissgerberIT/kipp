# Kipp – Design System

Single-file browser game (`index.html`). Tokens live as CSS custom properties in the `:root` block of `index.html`; material colours live in the `THEMES` object in the same file. This document mirrors those values for Claude Design and for anyone restyling the game. If they ever disagree, `index.html` wins.

## Palette

| Token | Value | Use |
|---|---|---|
| `--chalk` | `#EDE8DC` | Primary text, row numbers |
| `--dim` | `rgba(237,232,220,.45)` | Labels, secondary text |
| `--ochre` | `#D9A441` | Score, primary buttons, own leaderboard row, combo toast |
| `--ochre-hi` | `#E8B54F` | Top of primary-button gradient |
| `--ochre-base` | `#9A6E22` | Primary-button base shadow (`0 5px 0`) |
| `--on-ochre` | `#1F3A2E` | Text on ochre |
| `--sky` | `#6FA3C7` | Tip-charge battery cells |
| `--mint` | `#4DFFB4` | Positive kicker (level cleared), challenge selection |
| `--danger` | `#FF5E5B` | Quake toast, hot quake bar, quake icon |
| `--danger-soft` | `#FF9A98` | Game-over kicker |
| `--ov-72` / `--ov-86` | `rgba(10,14,13,.72 / .86)` | Pause / game-over overlay backdrops (with `blur(10px)`) |
| `--glass` | `rgba(237,232,220,.06)` | Tiles, list rows, secondary buttons |
| `--line` | `rgba(237,232,220,.18)` | Secondary-button border |
| `--board` | per material | Board background, set from `THEMES[x].board` |

Material colours (8 piece colours, board and background gradient per material) are defined in `THEMES` inside `index.html` and must not be duplicated elsewhere.

## Typography

- **Bungee** – numbers and titles: header stats `1.55rem`, pause stats `1.5rem`, tiles `1.1rem`, overlay titles `3rem` (pause `3.2rem`), big score `3.6rem`, leaderboard names `.85rem`. Canvas text (toasts, point popups) uses the same face at `1.7rem` / `2.2rem` (combo) / `1.6rem` (popup) relative to a 440px board.
- **Nunito 600/800** – body, labels, buttons.
- Label scale: `.52–.62rem`, tracking `.14–.22em`, uppercase, colour `--dim` (class `.lbl` and the `small` elements in stats, tiles, kickers).

## Shape

- Radii: cells 3px (stone, metal) / 7px (jelly) at a 35px block, buttons 12–14px, board 14px, bezel 22px, next box 12px, tiles 10px, list rows 8px.
- Cells sit 2.5px inside their grid cell on every side.

## Elevation and glow

- Primary button: `0 5px 0 --ochre-base, 0 10px 20px rgba(0,0,0,.4)`; pressed `translateY(4px)`, `0 1px 0 --ochre-base`.
- D-pad: gradient faces (`#343C42→#272E33` grey, `#43709F→#34577E` blue, `#378C62→#2A6B4B` green) with `0 5px 0 <base>` and `0 8px 14px rgba(0,0,0,.4)`; pressed state adds a coloured glow.
- Board bezel: `0 22px 50px rgba(0,0,0,.5)`, board inset `0 12px 40px rgba(0,0,0,.55)`.
- Jelly glow `0 0 10px col@47%`, metal glow `0 0 6px col@33%`, stone drop shadow `0 2px 4px rgba(0,0,0,.4)`.

## Motion

All animations are disabled under `prefers-reduced-motion: reduce`.

| Event | Effect | Timing |
|---|---|---|
| Piece lands | cells `scaleY(.82) translateY(6%) → 1.06 → 1` | .28s |
| Row clears | white flash + glow, `scaleX → 1.12`, fade out, 14 sparks per row | .42s / .55s |
| Points | `+pts` rises 54px and fades | 1s ease-out |
| Toast | scale `.8 → 1`, hold, fade at 34% board height | 1.4s |
| Quake | whole `.world` shakes ±4px / ±.8° | .6s |
| Quake bar ≥ 80% | fill brightness pulse, icon ring pulse | .4s / .8s loop |
| Overlay opens | fade + content slide-up 18px | .25–.4s |

## Components

- **Header**: title, three stat blocks (number + label), next-piece box (56px, 4×4 grid, material look at 85%), material chip (hidden below 440px), mute, pause.
- **Board**: canvas inside a DOM bezel, grid lines `rgba(237,232,220,.055)`, danger gradient over the top third when the stack reaches row 4.
- **Quake bar**: 16 segments, gradient fill `#3FC1FF → #FFD23F → #FF5E5B`, `〰` icon to the right.
- **Tip charge**: label + 5-cell battery (12px cells), full state glows.
- **Overlays**: pause (kicker, title, text, 3 stats, primary, secondary, footnote) and game over (kicker quip, title, big score, 4 tiles, initials, leaderboard tabs + list, primary, share | menu).
