// Play screen: tick loop, input, collisions, HUD.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT,
  GAME_WIDTH, HUD_HEIGHT, COLORS, PAINTS, FONT_SERIF, FONT_MONO,
  START_LENGTH, START_COL, START_ROW, MAX_QUEUED_TURNS,
  START_MOVE_MS, MIN_MOVE_MS, SPEED_UP_MS,
  SNAKE_OUTLINE, BODY_INSET, HEAD_INSET,
  EYE_RADIUS, EYE_FORWARD, EYE_SPREAD,
  FRUIT_COUNT, FRUIT_INSET, FRUIT_OUTLINE,
  HUD_LABEL_SIZE, HUD_NUMBER_SIZE, HUD_GAP, CHAIN_SWATCH_SIZE,
  PAUSE_DIM_ALPHA, PAUSE_FONT_SIZE, BEST_SCORE_KEY, RUN_COUNT_KEY,
  STAIN, INPUT_DELAY_MS, RENDER_SCALE, DEATH_FADE_MS, DEATH_SPLAT_RADIUS, DEATH_SPLAT_DROPS,
  DRY_START_FRUIT, BLOB_FADE_MS, DRIED_FADE_ALPHA, DRIED_FADE_SCALE,
  BLOB_RADIUS, BLOB_OUTLINE, BLOB_HATCH_GAP, BLOB_HATCH_WIDTH,
  SPLAT_RADIUS, SPLAT_DROPS,
} from '../config.js';
import Snake, { DIRECTIONS, isOpposite } from '../systems/Snake.js';
import FruitManager from '../systems/FruitManager.js';
import PaintLayer from '../systems/PaintLayer.js';
import Chain from '../systems/Chain.js';
import BlobManager from '../systems/BlobManager.js';
import { loadNumber, saveNumber } from '../systems/storage.js';
import { setUpCamera, drawBoard, PaintCanvas, getPaintColor, toCssColor } from './drawing.js';

// Blend from `from` to `to` as `amount` goes from 0 to 1
function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

// Arrow keys and WASD both steer (event.code is the physical key)
const KEY_TO_DIRECTION = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

// A blob's lumpy outline: the distance of each point from the centre,
// as a fraction of BLOB_RADIUS, going once around the circle
const BLOB_LUMPS = [1, 0.82, 0.95, 0.78, 1, 0.86, 0.92, 0.76, 0.98, 0.84];

// A jagged crack across the blob, as offsets from its centre (pixels)
const BLOB_CRACK = [
  { x: -5, y: -7 }, { x: -1, y: -3 }, { x: -3, y: 1 }, { x: 2, y: 4 }, { x: 1, y: 8 },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    setUpCamera(this);
    drawBoard(this);
    this.paintCanvas = new PaintCanvas(this);

    this.snake = new Snake(START_COL, START_ROW, START_LENGTH);
    this.chain = new Chain(); // also holds the snake's colour
    this.paintLayer = new PaintLayer(GRID_COLS, GRID_ROWS);
    this.turnQueue = [];
    this.isOver = false;
    this.isPaused = false;

    // Ignore keys for a moment, so the Space that started this run does nothing here
    this.inputReady = false;
    this.time.delayedCall(INPUT_DELAY_MS, () => { this.inputReady = true; });

    // FRUIT is the plain count of fruit eaten. SCORE adds up the chain points.
    this.fruitEaten = 0;
    this.score = 0;
    this.previousBest = loadNumber(BEST_SCORE_KEY);
    this.bestScore = this.previousBest;

    this.blobs = new BlobManager();
    this.fruit = new FruitManager(GRID_COLS, GRID_ROWS, PAINTS.length, FRUIT_COUNT, this.blobs);
    this.fruit.fillBoard(this.snake);

    // Blobs and fruit graphics come first so the snake is drawn on top
    this.blobGraphics = this.add.graphics();
    this.fruitGraphics = this.add.graphics();
    this.snakeGraphics = this.add.graphics();
    this.drawFruit();
    this.drawSnake();

    this.createHud();
    this.createPauseOverlay();
    this.setUpInput();
    this.startMoveTimer(START_MOVE_MS);
  }

  // Runs every frame. `delta` is the ms since the last frame; skipping it while
  // paused means drying and blob timers only count game time.
  update(time, delta) {
    if (this.isOver || this.isPaused) {
      return;
    }

    this.updateBlobs(delta);

    const isDrying = this.fruitEaten >= DRY_START_FRUIT;
    const hasRoom = this.fruit.update(delta, this.snake, isDrying);
    this.drawFruit();

    if (!hasRoom) {
      this.endRun();
    }
  }

  // Count blobs down, and leave a dark stain where each expired one was
  updateBlobs(delta) {
    const expired = this.blobs.update(delta);
    for (const blob of expired) {
      this.paintLayer.paint(blob.x, blob.y, STAIN);
    }
    if (expired.length > 0) {
      this.drawPaintChanges();
    }
    this.drawBlobs();
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
      if (direction && !this.isPaused && this.inputReady) {
        this.queueTurn(direction);
      }
    });

    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
  }

  // P or Esc: freeze the tick and dim the board. The same key resumes.
  togglePause() {
    if (this.isOver || !this.inputReady) {
      return;
    }
    this.isPaused = !this.isPaused;
    this.moveTimer.paused = this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);
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

    if (!this.isOnBoard(next) || this.snake.hitsBody(next, isEating)
      || this.blobs.isBlocked(next.x, next.y)) {
      this.endRun();
      return;
    }

    // Score first, so the snake has the fruit's colour when it paints the cell it enters
    if (isEating) {
      this.scoreFruit(next);
    }

    this.snake.move(direction, isEating);
    this.paintCell(next);
    this.drawSnake();

    if (isEating) {
      this.eatFruit(next);
    }
  }

  paintCell(cell) {
    this.paintLayer.paint(cell.x, cell.y, this.chain.colorIndex);
    this.drawPaintChanges();
  }

  scoreFruit(cell) {
    const points = this.chain.onEat(this.fruit.getFruitAt(cell).colorIndex);
    this.fruitEaten += 1;
    this.score += points;
    this.bestScore = Math.max(this.bestScore, this.score);
    this.updateHud();
  }

  // Splat, replacement fruit and speed-up
  eatFruit(cell) {
    this.paintLayer.splat(cell.x, cell.y, this.chain.colorIndex, SPLAT_RADIUS, SPLAT_DROPS);
    this.drawPaintChanges();

    const hasRoom = this.fruit.eatAt(cell, this.snake);
    this.drawFruit();

    if (!hasRoom) {
      this.endRun();
      return;
    }

    const delay = Math.max(MIN_MOVE_MS, this.moveDelay - SPEED_UP_MS);
    this.startMoveTimer(delay);
  }

  // The snake breaks into paint, everything but the painting fades out,
  // then the Exhibition screen shows the finished artwork.
  endRun() {
    this.isOver = true;
    this.moveTimer.remove();

    this.splatSnake();
    this.stainBlobs();
    this.drawPaintChanges();
    const stats = this.saveRun();

    this.tweens.add({
      targets: [...this.hudItems, this.snakeGraphics, this.fruitGraphics, this.blobGraphics],
      alpha: 0,
      duration: DEATH_FADE_MS,
      onComplete: () => this.scene.start('ExhibitionScene', stats),
    });
  }

  // Every segment leaves a splat in the snake's colour
  splatSnake() {
    for (const part of this.snake.body) {
      this.paintLayer.splat(part.x, part.y, this.chain.colorIndex,
        DEATH_SPLAT_RADIUS, DEATH_SPLAT_DROPS);
    }
  }

  // Blobs still on the board become stains, the same as when they expire
  stainBlobs() {
    for (const blob of this.blobs.blobs) {
      this.paintLayer.paint(blob.x, blob.y, STAIN);
    }
  }

  // Save the best score and run count, and return what the Exhibition needs
  saveRun() {
    const runNumber = loadNumber(RUN_COUNT_KEY) + 1;
    saveNumber(RUN_COUNT_KEY, runNumber);
    saveNumber(BEST_SCORE_KEY, this.bestScore);

    return {
      paintLayer: this.paintLayer,
      fruitEaten: this.fruitEaten,
      score: this.score,
      bestChain: this.chain.best,
      runNumber,
      isNewBest: this.score > this.previousBest,
    };
  }

  isOnBoard(cell) {
    return cell.x >= 0 && cell.x < GRID_COLS && cell.y >= 0 && cell.y < GRID_ROWS;
  }

  // Four items spread evenly across the strip: FRUIT, SCORE, chain, BEST
  createHud() {
    const slotWidth = GAME_WIDTH / 4;
    const centreY = HUD_HEIGHT / 2;
    const slotCentre = (slot) => slotWidth * slot + slotWidth / 2;
    this.hudItems = []; // everything in the strip, so it can fade out on death

    this.fruitText = this.createHudItem('FRUIT', slotCentre(0), centreY);
    this.scoreText = this.createHudItem('SCORE', slotCentre(1), centreY);
    this.createChainItem(slotCentre(2), centreY);
    this.bestText = this.createHudItem('BEST', slotCentre(3), centreY);
    this.updateHud();
  }

  // A Fraunces label ending just left of `x`, and a mono number starting just right of it.
  // Returns the number text so it can be updated.
  createHudItem(label, x, y) {
    const labelText = this.add.text(x - HUD_GAP / 2, y, label, {
      fontFamily: FONT_SERIF,
      fontSize: HUD_LABEL_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.canvas),
    }).setOrigin(1, 0.5);

    const numberText = this.add.text(x + HUD_GAP / 2, y, '0', {
      fontFamily: FONT_MONO,
      fontSize: HUD_NUMBER_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.canvas),
    }).setOrigin(0, 0.5);

    this.hudItems.push(labelText, numberText);
    return numberText;
  }

  // A swatch in the current colour, then the multiplier (e.g. ■ ×3)
  createChainItem(x, y) {
    this.chainSwatch = this.add.graphics();
    this.chainSwatchX = x - HUD_GAP / 2 - CHAIN_SWATCH_SIZE;
    this.chainSwatchY = y - CHAIN_SWATCH_SIZE / 2;

    this.chainText = this.add.text(x + HUD_GAP / 2, y, '', {
      fontFamily: FONT_MONO,
      fontSize: HUD_NUMBER_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.canvas),
    }).setOrigin(0, 0.5);

    this.hudItems.push(this.chainSwatch, this.chainText);
  }

  updateHud() {
    this.fruitText.setText(this.fruitEaten);
    this.scoreText.setText(this.score);
    this.chainText.setText('×' + this.chain.value);
    this.drawChainSwatch();
    this.bestText.setText(this.bestScore);
  }

  drawChainSwatch() {
    this.chainSwatch.clear();
    this.chainSwatch.fillStyle(getPaintColor(this.chain.colorIndex));
    this.chainSwatch.fillRect(this.chainSwatchX, this.chainSwatchY,
      CHAIN_SWATCH_SIZE, CHAIN_SWATCH_SIZE);
  }

  // Dark layer over the board with "Paused", hidden until P or Esc is pressed
  createPauseOverlay() {
    const dim = this.add.rectangle(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT,
      COLORS.ink, PAUSE_DIM_ALPHA).setOrigin(0);

    const label = this.add.text(BOARD_X + BOARD_WIDTH / 2, BOARD_Y + BOARD_HEIGHT / 2, 'Paused', {
      fontFamily: FONT_SERIF,
      fontSize: PAUSE_FONT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.canvas),
    }).setOrigin(0.5);

    this.pauseOverlay = this.add.container(0, 0, [dim, label]).setVisible(false);
  }

  // Draw only the paint marks made since last time
  drawPaintChanges() {
    this.paintCanvas.drawMarks(this.paintLayer.takeNewMarks());
  }

  drawFruit() {
    const g = this.fruitGraphics;
    g.clear();
    for (const fruit of this.fruit.fruits) {
      this.drawFruitShape(fruit);
    }
  }

  // A paint dab in the fruit's colour and shape, with an ink outline.
  // As it dries it fades and shrinks, which shows its timer without numbers.
  drawFruitShape(fruit) {
    const g = this.fruitGraphics;
    const paint = PAINTS[fruit.colorIndex];
    const dryProgress = this.fruit.getDryProgress(fruit);
    const alpha = lerp(1, DRIED_FADE_ALPHA, dryProgress);
    const size = (CELL_SIZE - FRUIT_INSET * 2) * lerp(1, DRIED_FADE_SCALE, dryProgress);
    const centreX = BOARD_X + fruit.x * CELL_SIZE + CELL_SIZE / 2;
    const centreY = BOARD_Y + fruit.y * CELL_SIZE + CELL_SIZE / 2;
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

  drawBlobs() {
    this.blobGraphics.clear();
    for (const blob of this.blobs.blobs) {
      this.drawBlob(blob);
    }
  }

  // A lumpy dried-umber dab with ink cross-hatching and a pale crack.
  // It fades out over its last BLOB_FADE_MS.
  drawBlob(blob) {
    const g = this.blobGraphics;
    const alpha = Math.min(1, blob.msLeft / BLOB_FADE_MS);
    const centreX = BOARD_X + blob.x * CELL_SIZE + CELL_SIZE / 2;
    const centreY = BOARD_Y + blob.y * CELL_SIZE + CELL_SIZE / 2;

    const outline = BLOB_LUMPS.map((lump, i) => {
      const angle = (i / BLOB_LUMPS.length) * Math.PI * 2;
      return {
        x: centreX + Math.cos(angle) * BLOB_RADIUS * lump,
        y: centreY + Math.sin(angle) * BLOB_RADIUS * lump,
      };
    });
    g.fillStyle(COLORS.driedUmber, alpha);
    g.fillPoints(outline, true);

    this.drawCrossHatching(centreX, centreY, alpha);

    const crack = BLOB_CRACK.map((point) => ({ x: centreX + point.x, y: centreY + point.y }));
    g.lineStyle(BLOB_OUTLINE, COLORS.canvas, alpha);
    g.strokePoints(crack, false);

    g.lineStyle(BLOB_OUTLINE, COLORS.ink, alpha);
    g.strokePoints(outline, true);
  }

  // Two sets of diagonal ink lines (\ and /), kept inside a circle
  // smaller than the blob's narrowest lump so they never poke out
  drawCrossHatching(centreX, centreY, alpha) {
    const g = this.blobGraphics;
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

    g.fillStyle(getPaintColor(this.chain.colorIndex));
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
