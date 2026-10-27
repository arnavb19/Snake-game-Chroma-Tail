// Drawing shared by every scene: the framed board and the paint on it.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT, FRAME_WIDTH,
  COLORS, PAINTS, GRAPHITE, STAIN, PAINT_OPACITY,
  SPLAT_DROP_RADIUS, SPLAT_DROP_DISTANCE,
  FRUIT_INSET, FRUIT_OUTLINE, SNAKE_OUTLINE, EYE_RADIUS, EYE_FORWARD, EYE_SPREAD,
  BLOB_RADIUS, BLOB_OUTLINE, BLOB_HATCH_GAP, BLOB_HATCH_WIDTH, BLOB_LUMPS, BLOB_CRACK,
} from '../config.js';
import { DIRECTIONS } from '../systems/Snake.js';

// Width of a full-size fruit
export const FRUIT_SIZE = CELL_SIZE - FRUIT_INSET * 2;

// Turn a colour index (one of PAINTS, GRAPHITE or STAIN) into a colour value
export function getPaintColor(colorIndex) {
  if (colorIndex === GRAPHITE) {
    return COLORS.graphite;
  }
  if (colorIndex === STAIN) {
    return COLORS.ink;
  }
  return PAINTS[colorIndex].color;
}

// Phaser text styles want CSS colours like '#1f1b18', not numbers
export function toCssColor(color) {
  return '#' + color.toString(16).padStart(6, '0');
}

// Zoom the camera by RENDER_SCALE and centre it on the base-size game, so the
// scene can keep using base-unit positions and sizes on the larger canvas.
// Line widths are zoomed too, so they look the same as before.
export function setUpCamera(scene) {
  scene.cameras.main
    .setZoom(RENDER_SCALE)
    .centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

// Walnut frame, blank canvas and faint pencil grid
export function drawBoard(scene) {
  drawFrame(scene);
  drawCanvas(scene);
  drawGridLines(scene);
}

// One rectangle behind the board, larger by the frame width
function drawFrame(scene) {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.frame);
  g.fillRect(
    BOARD_X - FRAME_WIDTH,
    BOARD_Y - FRAME_WIDTH,
    BOARD_WIDTH + FRAME_WIDTH * 2,
    BOARD_HEIGHT + FRAME_WIDTH * 2
  );
}

function drawCanvas(scene) {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.canvas);
  g.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);
}

// Lines between cells only (the board edges are left to the frame)
function drawGridLines(scene) {
  const g = scene.add.graphics();
  g.lineStyle(1, COLORS.gridLine);

  for (let col = 1; col < GRID_COLS; col++) {
    const x = BOARD_X + col * CELL_SIZE + 0.5; // +0.5 keeps 1px lines crisp
    g.lineBetween(x, BOARD_Y, x, BOARD_Y + BOARD_HEIGHT);
  }

  for (let row = 1; row < GRID_ROWS; row++) {
    const y = BOARD_Y + row * CELL_SIZE + 0.5;
    g.lineBetween(BOARD_X, y, BOARD_X + BOARD_WIDTH, y);
  }
}

// Paint is drawn at full strength into a texture over the board, and the whole
// texture is shown at PAINT_OPACITY. Drawing over a cell then simply replaces
// its old colour instead of blending with it.
// The texture has RENDER_SCALE times more pixels and is shown shrunk back to
// board size, so splat edges stay as sharp as everything else.
export class PaintCanvas {
  constructor(scene) {
    this.texture = scene.add.renderTexture(BOARD_X, BOARD_Y,
      BOARD_WIDTH * RENDER_SCALE, BOARD_HEIGHT * RENDER_SCALE)
      .setOrigin(0)
      .setScale(1 / RENDER_SCALE)
      .setAlpha(PAINT_OPACITY);

    // Off-screen brush: shapes are drawn here in base units, scaled up to the
    // texture's pixels, stamped into the texture, then cleared
    this.brush = scene.make.graphics({}, false).setScale(RENDER_SCALE);
  }

  // Draw marks from a PaintLayer, in order
  drawMarks(marks) {
    if (marks.length === 0) {
      return;
    }
    for (const mark of marks) {
      if (mark.kind === 'cell') {
        this.drawCell(mark);
      } else {
        this.drawSplat(mark);
      }
    }
    this.texture.draw(this.brush);
    this.brush.clear();
  }

  drawCell(mark) {
    this.brush.fillStyle(getPaintColor(mark.colorIndex));
    this.brush.fillRect(mark.x * CELL_SIZE, mark.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  // A round blob, with a few small drips around it
  drawSplat(mark) {
    const centreX = mark.x * CELL_SIZE + CELL_SIZE / 2;
    const centreY = mark.y * CELL_SIZE + CELL_SIZE / 2;

    this.brush.fillStyle(getPaintColor(mark.colorIndex));
    this.brush.fillCircle(centreX, centreY, mark.radius);

    for (const angle of mark.dropAngles) {
      this.brush.fillCircle(
        centreX + Math.cos(angle) * SPLAT_DROP_DISTANCE,
        centreY + Math.sin(angle) * SPLAT_DROP_DISTANCE,
        SPLAT_DROP_RADIUS
      );
    }
  }
}

// Snake, fruit and blobs: used by the game and by the title screen's icons.
// Each one is drawn into `g` around a centre point.

// A filled square with an ink outline: one cell shrunk by `inset` on every side
export function drawSnakeSegment(g, centreX, centreY, inset, color) {
  const size = CELL_SIZE - inset * 2;
  const x = centreX - size / 2;
  const y = centreY - size / 2;

  g.fillStyle(color);
  g.fillRect(x, y, size, size);
  g.lineStyle(SNAKE_OUTLINE, COLORS.ink);
  g.strokeRect(x, y, size, size);
}

// Two ink dots near the front of the head, one on each side
export function drawEyes(g, centreX, centreY, direction) {
  const forward = DIRECTIONS[direction];
  const side = { x: -forward.y, y: forward.x }; // forward turned 90°
  const eyesX = centreX + forward.x * EYE_FORWARD;
  const eyesY = centreY + forward.y * EYE_FORWARD;

  g.fillStyle(COLORS.ink);
  g.fillCircle(eyesX + side.x * EYE_SPREAD, eyesY + side.y * EYE_SPREAD, EYE_RADIUS);
  g.fillCircle(eyesX - side.x * EYE_SPREAD, eyesY - side.y * EYE_SPREAD, EYE_RADIUS);
}

// A paint dab in the fruit's colour and shape, with an ink outline
export function drawFruitShape(g, colorIndex, centreX, centreY, size = FRUIT_SIZE, alpha = 1) {
  const paint = PAINTS[colorIndex];
  const left = centreX - size / 2;
  const top = centreY - size / 2;

  g.fillStyle(paint.color, alpha);
  g.lineStyle(FRUIT_OUTLINE, COLORS.ink, alpha);

  if (paint.shape === 'circle') {
    g.fillCircle(centreX, centreY, size / 2);
    g.strokeCircle(centreX, centreY, size / 2);
  } else if (paint.shape === 'square') {
    g.fillRect(left, top, size, size);
    g.strokeRect(left, top, size, size);
  } else {
    const points = getCornerPoints(paint.shape, left, top, size);
    g.fillPoints(points, true);
    g.strokePoints(points, true);
  }
}

// Corner points for the triangle and diamond fruit
function getCornerPoints(shape, left, top, size) {
  const right = left + size;
  const bottom = top + size;
  const middleX = left + size / 2;
  const middleY = top + size / 2;

  if (shape === 'triangle') {
    return [{ x: middleX, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
  }
  // diamond
  return [{ x: middleX, y: top }, { x: right, y: middleY }, { x: middleX, y: bottom }, { x: left, y: middleY }];
}

// A lumpy dried-umber dab with ink cross-hatching and a pale crack
export function drawBlob(g, centreX, centreY, alpha = 1) {
  const outline = BLOB_LUMPS.map((lump, i) => {
    const angle = (i / BLOB_LUMPS.length) * Math.PI * 2;
    return {
      x: centreX + Math.cos(angle) * BLOB_RADIUS * lump,
      y: centreY + Math.sin(angle) * BLOB_RADIUS * lump,
    };
  });
  g.fillStyle(COLORS.driedUmber, alpha);
  g.fillPoints(outline, true);

  drawCrossHatching(g, centreX, centreY, alpha);

  const crack = BLOB_CRACK.map((point) => ({ x: centreX + point.x, y: centreY + point.y }));
  g.lineStyle(BLOB_OUTLINE, COLORS.canvas, alpha);
  g.strokePoints(crack, false);

  g.lineStyle(BLOB_OUTLINE, COLORS.ink, alpha);
  g.strokePoints(outline, true);
}

// Two sets of diagonal ink lines (\ and /), kept inside a circle
// smaller than the blob's narrowest lump so they never poke out
function drawCrossHatching(g, centreX, centreY, alpha) {
  const radius = BLOB_RADIUS * Math.min(...BLOB_LUMPS) - BLOB_OUTLINE;
  const s = Math.SQRT1_2; // cos and sin of 45°
  const first = -Math.floor(radius / BLOB_HATCH_GAP) * BLOB_HATCH_GAP;

  g.lineStyle(BLOB_HATCH_WIDTH, COLORS.ink, alpha);
  // `offset` is each line's distance from the centre; `half` is half its length
  for (let offset = first; offset < radius; offset += BLOB_HATCH_GAP) {
    const half = Math.sqrt(radius * radius - offset * offset);
    g.lineBetween(
      centreX + (offset - half) * s, centreY - (offset + half) * s,
      centreX + (offset + half) * s, centreY - (offset - half) * s
    );
    g.lineBetween(
      centreX + (offset + half) * s, centreY + (offset - half) * s,
      centreX + (offset - half) * s, centreY + (offset + half) * s
    );
  }
}
