// Play screen: tick loop, input, collisions, HUD.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT,
  FRAME_WIDTH, COLORS,
} from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.drawFrame();
    this.drawCanvas();
    this.drawGridLines();
  }

  // Walnut frame: one rectangle behind the board, larger by the frame width
  drawFrame() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.frame);
    g.fillRect(
      BOARD_X - FRAME_WIDTH,
      BOARD_Y - FRAME_WIDTH,
      BOARD_WIDTH + FRAME_WIDTH * 2,
      BOARD_HEIGHT + FRAME_WIDTH * 2
    );
  }

  drawCanvas() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.canvas);
    g.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);
  }

  // Faint pencil lines between cells (the board edges are left to the frame)
  drawGridLines() {
    const g = this.add.graphics();
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
}
