// Drawing shared by every scene: the framed board and the paint on it.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT, FRAME_WIDTH,
  COLORS, PAINTS, GRAPHITE, STAIN, PAINT_OPACITY,
  SPLAT_DROP_RADIUS, SPLAT_DROP_DISTANCE,
} from '../config.js';

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
