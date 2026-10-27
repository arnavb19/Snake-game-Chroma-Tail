# Chroma Trail

**Snake where every run leaves behind a painting.**

The board is a blank canvas in a wooden frame. The snake paints the floor in the colour of the last fruit it ate, and when the run ends the board is shown as your finished artwork, with a little museum label.

**Play it live:** _link coming soon (GitHub Pages)_

## How to play

| Key | Action |
| --- | --- |
| Arrow keys or WASD | Steer the snake |
| P or Esc | Pause / resume |
| Space | Start a run, or paint again after a run ends |

- **Eat fruit to grow.** There are always two fruit on the board, in two different colours. Each one has its own shape (circle, triangle, square, diamond), so you can tell them apart without relying on colour.
- **Don't hit anything.** The run ends if you hit the frame, your own body or a dried paint blob.
- **Colour chains.** Eat the same colour as last time and your chain multiplier goes up (×1, ×2, ×3, ×4, up to ×5). Eat a different colour and it drops back to ×1. Each fruit is worth points equal to your chain. For example, red, red, red, blue, blue scores 1 + 2 + 3 + 1 + 2 = 9 points.
- **Drying paint.** After your 3rd fruit, uneaten fruit start to dry: they slowly fade and shrink. A fruit left alone for 12 seconds dries into a cross-hatched blob that blocks your way for 12 seconds, then flakes away and leaves a dark stain in your painting. A fruit won't dry while your head is within 3 cells of it, so you can always reach one you're going for.
- **The Exhibition.** When the run ends, everything but the paint fades away, leaving your artwork in its frame.

## Assignment requirements

| # | Requirement | How Chroma Trail meets it |
| --- | --- | --- |
| 1 | Move in four directions with arrow keys | Arrow keys (and WASD). Turning straight back into yourself is ignored. Up to 2 quick turns are queued so double taps both count. |
| 2 | Food appears randomly | Two fruit are always on the board, each on a random free cell, in one of 4 colours. |
| 3 | Snake grows when it eats | +1 segment for every fruit eaten. |
| 4 | Game ends on wall or self collision | Hitting the frame or any part of the body ends the run. |
| 5 | Score tracks food eaten | The HUD shows **FRUIT** (the plain count of fruit eaten) separately from **SCORE** (points including chains). |

## Tech

- Plain HTML and JavaScript ES modules: no build step, no npm.
- [Phaser 3](https://phaser.io/) (3.90.0), loaded from a CDN.
- No image files: everything is drawn with Phaser Graphics.
- Game rules (`src/systems/`) are plain JavaScript with no Phaser code. The scenes (`src/scenes/`) only handle input and drawing.
- Every tunable number (grid size, speeds, colours, timings) lives in `src/config.js`.
- Best score and run count are saved in `localStorage`.

## Run it locally

The game uses ES modules, so it has to be served over HTTP. Opening `index.html` straight from disk won't work.

1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Any other static server works too, for example `python -m http.server` and then open http://localhost:8000.

## Credits

- [Phaser](https://phaser.io/) game framework
- Fonts from [Google Fonts](https://fonts.google.com/): [Fraunces](https://fonts.google.com/specimen/Fraunces) and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
