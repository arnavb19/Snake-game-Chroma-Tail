// Play screen: tick loop, input, collisions, HUD.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT,
  FRAME_WIDTH, COLORS, PAINTS, FONT_SERIF,
  START_LENGTH, START_COL, START_ROW, MAX_QUEUED_TURNS,
  START_MOVE_MS, MIN_MOVE_MS, SPEED_UP_MS,
  SNAKE_OUTLINE, BODY_INSET, HEAD_INSET,
  EYE_RADIUS, EYE_FORWARD, EYE_SPREAD,
  FRUIT_COUNT, FRUIT_INSET, FRUIT_OUTLINE,
  GAME_OVER_FONT_SIZE, GAME_OVER_PADDING,
} from '../config.js';
import Snake, { DIRECTIONS, isOpposite } from '../systems/Snake.js';
import FruitManager from '../systems/FruitManager.js';

// Phaser text styles want CSS colours like '#1f1b18', not numbers
function toCssColor(color) {
  return '#' + color.toString(16).padStart(6, '0');
}

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

    this.fruit = new FruitManager(GRID_COLS, GRID_ROWS, PAINTS.length, FRUIT_COUNT);
    this.fruit.fillBoard(this.snake);

    // Fruit graphics come first so the snake is drawn on top
    this.fruitGraphics = this.add.graphics();
    this.snakeGraphics = this.add.graphics();
    this.drawFruit();
    this.drawSnake();

    this.setUpInput();
    this.startMoveTimer(START_MOVE_MS);
  }

  // Move on a fixed tick, not every frame. Called again whenever the speed changes.
  startMoveTimer(delay) {
    if (this.moveTimer) {
      this.moveTimer.remove();
    }
    this.moveDelay = delay;
    this.moveTimer = this.time.addEvent({
      delay,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });
  }

  setUpInput() {
    // Stop the arrow keys from scrolling the page
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');

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
    const next = this.snake.getNextHead(direction);
    const isEating = this.fruit.hasFruitAt(next);

    if (!this.isOnBoard(next) || this.snake.hitsBody(next, isEating)) {
      this.endRun('Game over, Space to restart');
      return;
    }

    this.snake.move(direction, isEating);
    this.drawSnake();

    if (isEating) {
      this.eatFruit(next);
    }
  }

  eatFruit(cell) {
    const hasRoom = this.fruit.eatAt(cell, this.snake);
    this.drawFruit();

    if (!hasRoom) {
      this.endRun('Board full, you win! Space to restart');
      return;
    }

    const delay = Math.max(MIN_MOVE_MS, this.moveDelay - SPEED_UP_MS);
    this.startMoveTimer(delay);
  }

  // Temporary game over: freeze the board and wait for Space.
  // The Exhibition screen replaces this in step 7.
  endRun(message) {
    this.moveTimer.remove();

    this.add.text(BOARD_X + BOARD_WIDTH / 2, BOARD_Y + BOARD_HEIGHT / 2, message, {
      fontFamily: FONT_SERIF,
      fontSize: GAME_OVER_FONT_SIZE,
      color: toCssColor(COLORS.ink),
      backgroundColor: toCssColor(COLORS.canvas),
      padding: { x: GAME_OVER_PADDING, y: GAME_OVER_PADDING },
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
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

  drawFruit() {
    const g = this.fruitGraphics;
    g.clear();
    for (const fruit of this.fruit.fruits) {
      this.drawFruitShape(fruit);
    }
  }

  // A paint dab in the fruit's colour and shape, with an ink outline
  drawFruitShape(fruit) {
    const g = this.fruitGraphics;
    const paint = PAINTS[fruit.colorIndex];
    const left = BOARD_X + fruit.x * CELL_SIZE + FRUIT_INSET;
    const top = BOARD_Y + fruit.y * CELL_SIZE + FRUIT_INSET;
    const size = CELL_SIZE - FRUIT_INSET * 2;
    const centreX = left + size / 2;
    const centreY = top + size / 2;

    g.fillStyle(paint.color);
    g.lineStyle(FRUIT_OUTLINE, COLORS.ink);

    if (paint.shape === 'circle') {
      g.fillCircle(centreX, centreY, size / 2);
      g.strokeCircle(centreX, centreY, size / 2);
    } else if (paint.shape === 'square') {
      g.fillRect(left, top, size, size);
      g.strokeRect(left, top, size, size);
    } else {
      const points = this.getCornerPoints(paint.shape, left, top, size);
      g.fillPoints(points, true);
      g.strokePoints(points, true);
    }
  }

  // Corner points for the triangle and diamond fruit
  getCornerPoints(shape, left, top, size) {
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
