# Kipp – Tetris, but the board tips over

▶ **Play:** https://marcelweissgerberit.github.io/kipp/

Falling blocks – but the board itself can tip 90°. Every placed piece is a rigid body: whatever isn't resting on something falls. Every so often a timer runs out and the board tips on its own (the auto-tip).

Four materials change the rules, not just the look:
- **Jelly** – wobbly, tears easily, chains score ×3, bodies that fall far bounce back up one cell
- **Stone** – heavy, falls faster, never tears, anchors itself
- **Metal** – magnetic: touching pieces weld together when the board tips
- **Ice** – slippery: after a tip, bodies slide in the tip direction until they hit something; an auto-tip shatters ice into single cells; clearing the whole board pays a big bonus

Modes: Endless (4 board sizes, three shape sets: Standard 3–5 blocks, Extended 4–8 blocks at 1.3×, Ultra 4–16 blocks at 1.6×, optional material mix), Daily board with ghost replay, 40 Story levels with stars (one chapter per material), 5 Challenge boards. Every mode gets 6 % faster every 30 s of play on top of the level speed. Arcade-style initials, local highscores and an optional online world leaderboard, pause and back-to-menu at any time, shareable result card (PNG), EN/DE.

## Power-up pieces
About every sixth piece carries a power-up (not in the tutorial; switchable off in the menu, always on for the daily board). The legend in the menu lists every icon. Anchors and cracks still exist alongside them.
- **Bomb** (fuse icon) – when its row clears, the eight neighbouring cells go with it.
- **Magnet** (U icon) – when the board tips, it welds every touching body to its own. One use.
- **Frost** (snowflake) – clearing its row freezes the auto-tip timer for 10 seconds.
- **Charge** (lightning bolt) – clearing its row refills two tip charges instead of one.
- **Ghost** (translucent, dashed) – the whole piece falls through everything to the lowest free spot. Sideways moves are only allowed where a free spot exists below.
- **Acid** (green drop) – clearing its row dissolves every cell in its column below.
- **Mirror** (two triangles) – your next tip goes the other way, then it is spent.
- **Feather** – clearing its row makes the next piece fall at half speed.
- **Glue** (bottle) – if the piece lands touching a side wall it sticks like an anchor; the first tip leaves it stuck, the second releases it.
- **Joker** (star) – takes the dominant colour of its row and doubles the points when that row clears.
- **Time thief** (hourglass) – clearing its row resets the auto-tip timer without costing a charge.
- **Jelly bounce** – a jelly body that falls three or more cells after a tip hops back up one cell and stays there. Jelly only, also for jelly pieces in the material mix.

An endless run is saved on every landing, on pause and when the tab closes; the menu offers to continue it.

## Controls
The board scales with the screen: 92 % of the width on phones, up to 820 px on large desktops, with the canvas rendered at device resolution.

Touch: tap beside the piece to move, tap it to rotate, swipe down to drop, drag to slide. Cross: blue corners tip the board, green corners switch material / fast-fall.
Keyboard: ← → move · ↑ rotate · ↓ fast · Space drop · Q/E tip · T material · Esc/P pause.

## Online highscores (optional)
Out of the box, highscores live in the browser's localStorage. To get a shared world leaderboard, plug in a free [Supabase](https://supabase.com) project as a mini database:

1. Create a Supabase project, open **SQL Editor** and run `supabase/highscores.sql`. It creates the `highscores` table with row-level security: anyone can read and insert, nobody can update or delete.
2. In **Project Settings → API** copy the *Project URL* and the *anon public* key.
3. In `index.html` search for `const ONLINE=` and fill in `url` and `key`.
4. Commit and push – the end screen now shows a **This device / World** switch, and saving your initials also submits the run to the world list (top 10 per mode and board size, plus your worldwide rank).

The anon key is meant to be public; the SQL policies are what protect the data. Scores are submitted by the client, so treat the world list as a friendly board, not an anti-cheat system.

## Tech
One `index.html`. No framework, no build, no assets. Canvas rendering, WebAudio synth for music and SFX, localStorage for progress, optional Supabase REST for the world leaderboard. Built in a chat with Claude (~35 iterations).

## Run locally
Open `index.html` in a browser. That's it.

## Deploy
Automatic via GitHub Actions (`.github/workflows/pages.yml`): every push to `main` publishes the site. One-time setup: Settings → Pages → Source: **GitHub Actions**.
