# Kipp – Tetris, but the board tips over

▶ **Play:** https://marcelweissgerberit.github.io/kipp/

Falling blocks – but the board itself can tip 90°. Every placed piece is a rigid body: whatever isn't resting on something falls. Every so often the board quakes and tips on its own.

Three materials change the rules, not just the look:
- **Jelly** – wobbly, tears easily, chains score ×3
- **Stone** – heavy, falls faster, never tears, anchors itself
- **Metal** – magnetic: touching pieces weld together when the board tips

Modes: Endless (4 board sizes, optional material mix), Daily board with ghost replay, 30 Story levels with stars, 5 Challenge boards. Arcade-style initials and local highscores, shareable result card (PNG), EN/DE.

## Controls
Touch: tap beside the piece to move, tap it to rotate, swipe down to drop, drag to slide. Cross: blue corners tip the board, green corners switch material / fast-fall.
Keyboard: ← → move · ↑ rotate · ↓ fast · Space drop · Q/E tip · T material.

## Tech
One `index.html`. No framework, no build, no assets. Canvas rendering, WebAudio synth for music and SFX, localStorage for progress. Built in a chat with Claude (~35 iterations).

## Run locally
Open `index.html` in a browser. That's it.

## Deploy
Automatic via GitHub Actions (`.github/workflows/pages.yml`): every push to `main` publishes the site. One-time setup: Settings → Pages → Source: **GitHub Actions**.
