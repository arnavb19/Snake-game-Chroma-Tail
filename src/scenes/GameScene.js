// Play screen: tick loop, input, collisions, HUD.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT,
  FRAME_WIDTH, COLORS,
  START_LENGTH, START_COL, START_ROW, START_MOVE_MS, MAX_QUEUED_TURNS,
  SNAKE_OUTLINE, BODY_INSET, HEAD_INSET,
  EYE_RADIUS, EYE_FORWARD, EYE_SPREAD,
} from '../config.js';
import Snake, { DIRECTIONS, isOpposite } from '../systems/Snake.js';

// Arrow keys and WASD both steer (event.code is the physical key)
const KEY_TO_DIRECTION = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.drawFrame();
    this.drawCanvas();
    this.drawGridLines();

    this.snake = new Snake(START_COL, START_ROW, START_LENGTH);
    this.turnQueue = [];
    this.snakeGraphics = this.add.graphics();
    this.drawSnake();

    this.setUpInput();

    // Move on a fixed tick, not every frame
    this.moveTimer = this.time.addEvent({
      delay: START_MOVE_MS,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });
  }

  setUpInput() {
    // Stop the arrow keys from scrolling the page
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT');

    this.input.keyboard.on('keydown', (event) => {
      const direction = KEY_TO_DIRECTION[event.code];
      if (direction) {
        this.queueTurn(direction);
      }
    });
  }

  // Store up to 2 turns so quick double taps (e.g. up then left) both count
  queueTurn(direction) {
    if (this.turnQueue.length >= MAX_QUEUED_TURNS) {
      return;
    }

    // Compare with the last queued turn, or the current direction if none
    const last = this.turnQueue.length > 0
      ? this.turnQueue[this.turnQueue.length - 1]
      : this.snake.direction;

    if (direction === last || isOpposite(direction, last)) {
      return;
    }
    this.turnQueue.push(direction);
  }

  tick() {
    const direction = this.turnQueue.shift() || this.snake.direction;

    // Wall hit: just stop for now (game over comes in step 3)
    if (!this.isOnBoard(this.snake.getNextHead(direction))) {
      this.moveTimer.remove();
      return;
    }

    this.snake.move(direction);
    this.drawSnake();
  }

  isOnBoard(cell) {
    return cell.x >= 0 && cell.x < GRID_COLS && cell.y >= 0 && cell.y < GRID_ROWS;
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

  drawSnake() {
    const g = this.snakeGraphics;
    g.clear();

    // Tail first, so the head is drawn on top
    for (let i = this.snake.body.length - 1; i > 0; i--) {
      this.drawSegment(this.snake.body[i], BODY_INSET);
    }
    this.drawSegment(this.snake.getHead(), HEAD_INSET);
    this.drawEyes();
  }

  // A filled square with an ink outline, shrunk by `inset` on every side
  drawSegment(cell, inset) {
    const g = this.snakeGraphics;
    const x = BOARD_X + cell.x * CELL_SIZE + inset;
    const y = BOARD_Y + cell.y * CELL_SIZE + inset;
    const size = CELL_SIZE - inset * 2;

    g.fillStyle(COLORS.graphite);
    g.fillRect(x, y, size, size);
    g.lineStyle(SNAKE_OUTLINE, COLORS.ink);
    g.strokeRect(x, y, size, size);
  }

  // Two ink dots near the front of the head, one on each side
  drawEyes() {
    const g = this.snakeGraphics;
    const head = this.snake.getHead();
    const forward = DIRECTIONS[this.snake.direction];
    const side = { x: -forward.y, y: forward.x }; // forward turned 90°

    const centreX = BOARD_X + head.x * CELL_SIZE + CELL_SIZE / 2;
    const centreY = BOARD_Y + head.y * CELL_SIZE + CELL_SIZE / 2;
    const eyesX = centreX + forward.x * EYE_FORWARD;
    const eyesY = centreY + forward.y * EYE_FORWARD;

    g.fillStyle(COLORS.ink);
    g.fillCircle(eyesX + side.x * EYE_SPREAD, eyesY + side.y * EYE_SPREAD, EYE_RADIUS);
    g.fillCircle(eyesX - side.x * EYE_SPREAD, eyesY - side.y * EYE_SPREAD, EYE_RADIUS);
  }
}
