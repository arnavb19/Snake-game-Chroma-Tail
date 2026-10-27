# Chroma Trail — Design Spec

## Concept

**Snake where every run leaves behind a painting.** The board is a blank canvas. The snake paints the floor in the colour of the last fruit it ate, and eating the same colour in a row builds a score multiplier. When the run ends, the UI fades away and the board is shown as your finished artwork.

Two small systems sit on top of classic Snake, and nothing else changes:

- **Paint:** a visual trail that turns each run into a unique picture.
- **Colour chains:** a light risk-reward choice about which fruit to chase.

Working title: *Chroma Trail*. Alternatives: *Brushstroke*, *Wet Paint*.

## Assignment requirements

All five requirements are met by the classic core; the twist only adds to it.

| # | Requirement | How Chroma Trail meets it |
| --- | --- | --- |
| 1 | Move in four directions with arrow keys | Arrow keys (WASD as a bonus). 180° reversal is blocked. |
| 2 | Food appears randomly | Two fruit always on the board, each spawned on a random free cell in one of 4 colours. |
| 3 | Snake grows when it eats | +1 segment per fruit. |
| 4 | Game ends on wall or self collision | Hitting the frame or any body segment ends the run. |
| 5 | Score tracks food eaten | HUD shows **Fruit** (count eaten) as its own number, separate from chain **Score**. |

Requirement 5 is why the HUD shows two numbers. The evaluator can always see the plain fruit count, even though chains change the points.

## Core rules

The board is a 28 × 20 grid of 24 px cells, so a run of 1–3 minutes covers a visible share of the canvas.

| Setting | Value |
| --- | --- |
| Grid | 28 columns × 20 rows |
| Cell size | 24 px |
| Board size | 672 × 480 px, plus a 56 px HUD strip above |
| Start | Length 3, left of centre, moving right |
| Start speed | 1 move every 130 ms |
| Speed-up | 3 ms faster per fruit eaten |
| Top speed | 1 move every 70 ms |
| Fruit on board | Always 2, in different colours |

**Movement.** The game moves on a fixed tick, not every frame. Arrow keys queue up to 2 turns, so quick double taps (for example up then left) both register. A turn straight back into the body is ignored.

**Food.** Two fruit are always on the board, in two different colours. When one is eaten, a replacement spawns on a random free cell in a colour different from the fruit still on the board. The uneaten fruit stays where it is.

**Collisions.** Leaving the grid or touching any body segment ends the run. Moving into the cell the tail is leaving that same tick is allowed, as in classic Snake.

## Paint system

Every cell the snake's head enters is painted in the snake's current colour. The painting is purely visual: it never blocks movement or affects the score.

- **Starting colour:** before the first fruit, the snake is graphite and paints faint graphite.
- **Overwrite, don't blend:** a newer colour simply replaces the older one in that cell. Blending turns muddy and adds code.
- **Soft paint, bold actors:** paint is drawn at 35% opacity. The snake and fruit are drawn at full strength with a dark outline, so they stay readable on any painted floor.
- **Storage:** a 28 × 20 array holding a colour index (or empty) for each cell. It's needed to redraw the artwork on the game-over screen.

Readability is the main risk of this twist. If the snake or fruit is ever hard to see during testing, lower the paint opacity before changing anything else.

## Colour chains and scoring

Eating a fruit of the snake's current colour raises the chain by 1; any other colour resets it to ×1. Each fruit is worth points equal to the chain value, capped at ×5.

1. The snake takes the colour of the fruit it just ate (body tint and paint).
2. Same colour as before → chain +1. Different colour → chain resets to ×1.
3. Points for that fruit = chain value (1, 2, 3, 4, then 5 for every fruit after).
4. Fruit count always goes up by exactly 1.

Example run: red, red, red, blue, blue gives 1 + 2 + 3 + 1 + 2 = **9 points** from **5 fruit**.

With two fruit on the board, every bite is a small decision: chase the matching colour for the multiplier, or take the closer, safer fruit. This is the only reason there are two fruit, and it keeps the chain a choice instead of luck.

## Visual style

The game should look like **a stretched canvas in a wooden frame on a studio wall**. Everything follows from that one real-world material, which keeps it away from neon arcade and tutorial looks.

| Role | Colour | Hex | Fruit shape |
| --- | --- | --- | --- |
| Canvas (board floor) | Warm off-white | `#EFEBE3` | — |
| Grid lines | Faint pencil | `#E2DCD0` | — |
| Frame (walls) | Walnut | `#3B2F2A` | — |
| Studio wall (page background) | Dark umber | `#24201D` | — |
| Ink (text, outlines, snake head) | Near-black | `#1F1B18` | — |
| Snake before first fruit | Graphite | `#5A5550` | — |
| Paint 1 | Vermilion | `#E4572E` | Circle |
| Paint 2 | Ochre | `#E9A23B` | Triangle |
| Paint 3 | Teal | `#2A9D8F` | Square |
| Paint 4 | Ultramarine | `#3D5A98` | Diamond |

**Fruit** are drawn as paint dabs, each with a distinct shape. The shapes mean players with colour blindness can still tell fruit apart and build chains.

**Snake.** The body is the current colour at full strength with a 2 px ink outline. The head is slightly larger, with two small ink dots for eyes.

**Typography** comes from Google Fonts, and uses two fonts only:

- *Fraunces* (serif) for the title, the game-over caption and labels.
- *IBM Plex Mono* for numbers (fruit, score, chain), so digits don't jump around as they change.

Avoid glow effects, gradients, emoji and drop shadows.

## Screens and HUD

There are three screens in one loop: Title → Play → Exhibition → Play again.

**1. Title.** A blank framed canvas with the title in Fraunces, centred. Below it are two short lines: *Arrow keys to move · Same colour in a row multiplies your score*, and *Press Space to start*. The best score is shown small at the bottom.

**2. Play.** The HUD strip above the frame has four items, left to right:

| HUD item | Shows | Example |
| --- | --- | --- |
| Fruit | Number of fruit eaten (requirement 5) | `FRUIT 12` |
| Score | Points including chains | `SCORE 27` |
| Chain | A small swatch in the current colour plus the multiplier | `■ ×3` |
| Best | Highest score saved on this browser | `BEST 41` |

Press P or Esc to pause. The board dims and shows *Paused*.

**3. Exhibition (game over).** The snake breaks into paint splats, then the HUD and snake fade out, leaving only the painted canvas in its frame. Under the frame is a small museum-style label:

> *Untitled No. 7* — 12 fruit · best chain ×4 · 27 points

The number is how many runs this browser has played. Below that: *Space to paint again*. If the score is a new best, add one extra word: *New best*.

The Exhibition screen is the game's signature moment. Give it more polish than anything else.

## Feedback and polish

There are five small touches, each under about 10 lines of code. Polish should be small and quiet.

- **Eat:** the fruit pops (scales to 1.4× and fades over 150 ms) and leaves a slightly larger paint splat on that cell.
- **Chain up:** the chain swatch in the HUD pulses once. At ×5 it gets a thin ink ring.
- **Chain break:** the multiplier text briefly shakes.
- **Death:** a 120 ms camera shake, then the Exhibition fade.
- **Sound (optional):** a soft brush stroke on each eat, rising slightly in pitch with the chain, and a low thud on death. All sound is muted by default with an M toggle, so evaluators aren't surprised by noise.

## Tech and file structure

The game uses plain HTML + JavaScript ES modules + Phaser loaded from a CDN. There's no build step, so it runs from VS Code Live Server and deploys to GitHub Pages as-is.

**Phaser version.** Phaser 4 is the current stable release, but most tutorials, examples and answers online are still for Phaser 3. Use the latest Phaser 3.x pinned to an exact CDN version.

**Drawing.** No image assets. Everything is drawn with Phaser Graphics, so shapes and colours come straight from the palette. The paint layer is redrawn only when a cell changes.

**Logic vs rendering.** Snake position, fruit and paint are plain arrays and objects. Phaser only draws them, which keeps the rules easy to test and explain.

```
chroma-trail/
├── index.html          # loads fonts, Phaser CDN, src/main.js
├── style.css           # page background, centring
├── src/
│   ├── main.js         # Phaser config, registers scenes
│   ├── config.js       # grid, speeds, palette, opacity: every tunable number
│   ├── scenes/
│   │   ├── TitleScene.js
│   │   ├── GameScene.js        # tick loop, input, collisions, HUD
│   │   └── ExhibitionScene.js  # game-over artwork + label
│   └── systems/
│       ├── Snake.js            # body array, move, grow, self-hit check
│       ├── FruitManager.js     # 2 fruit, spawn rules
│       ├── PaintLayer.js       # paint grid + drawing
│       └── Chain.js            # colour, multiplier, scoring
├── assets/sfx/         # optional sounds
└── README.md           # how to play, the twist, live link
```

**Saved data:** best score and run count in `localStorage`, wrapped in try/catch so the game still works if storage is blocked.

**Deploy:** push to GitHub, then Settings → Pages → deploy from the `main` branch root.

## Build steps

Build the game in 8 steps, each ending in something playable you can commit to Git. Steps 1–4 deliver every assignment requirement before any twist is added.

1. **Scaffold.** Folder structure, `index.html`, Phaser config, an empty framed canvas on screen.
2. **Snake + input.** Tick loop, arrow-key movement, turn queue, no reversal.
3. **Food, growth, collisions.** 2 fruit, growing on eat, game over on wall or self-hit, restart with Space.
4. **Score + HUD.** Fruit count and score shown. Classic Snake is complete; tagged `v1-classic`.
5. **Paint layer.** Head paints cells; snake colour follows the last fruit.
6. **Colour chains.** Multiplier, chain swatch in the HUD, scoring rules.
7. **Screens.** Title, pause, Exhibition with the museum label, best score and run count saved.
8. **Polish + deploy.** Feedback touches, optional sound, README, GitHub Pages, test in Chrome and Firefox.

## Out of scope

Deliberately left out to keep the game simple: obstacles, levels, power-ups, colour blending, a "% painted" goal, speed tied to the multiplier, mobile touch controls, online leaderboards. Downloading the artwork as a PNG is the one extra worth adding if time is left over.

## Decisions

- Name: Chroma Trail
- Sound: TBD
- WASD as well as arrow keys: TBD
