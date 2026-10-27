// Play screen: tick loop, input, collisions, HUD.
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT,
  GAME_WIDTH, HUD_HEIGHT, COLORS, PAINTS, FONT_SERIF, FONT_MONO,
  START_LENGTH, START_COL, START_ROW, MAX_QUEUED_TURNS,
  START_MOVE_MS, MIN_MOVE_MS, SPEED_UP_MS,
  BODY_INSET, HEAD_INSET, FRUIT_COUNT,
  HUD_LABEL_SIZE, HUD_NUMBER_SIZE, HUD_GAP, CHAIN_SWATCH_SIZE,
  PAUSE_DIM_ALPHA, PAUSE_FONT_SIZE, BEST_SCORE_KEY, RUN_COUNT_KEY,
  STAIN, INPUT_DELAY_MS, RENDER_SCALE, DEATH_FADE_MS, DEATH_SPLAT_RADIUS, DEATH_SPLAT_DROPS,
  DRY_START_FRUIT, BLOB_FADE_MS, DRIED_FADE_ALPHA, DRIED_FADE_SCALE,
  SPLAT_RADIUS, SPLAT_DROPS, CHAIN_CAP,
  POP_SCALE, POP_MS, CHAIN_PULSE_SCALE, CHAIN_PULSE_MS, CHAIN_RING_GAP, CHAIN_RING_WIDTH,
  CHAIN_SHAKE_PX, CHAIN_SHAKE_MS, CHAIN_SHAKE_REPEATS, DEATH_SHAKE_MS, DEATH_SHAKE_INTENSITY,
} from '../config.js';
import Snake, { isOpposite } from '../systems/Snake.js';
import FruitManager from '../systems/FruitManager.js';
import PaintLayer from '../systems/PaintLayer.js';
import Chain from '../systems/Chain.js';
import BlobManager from '../systems/BlobManager.js';
import { loadNumber, saveNumber } from '../systems/storage.js';
import {
  setUpCamera, drawBoard, PaintCanvas, getPaintColor, toCssColor,
  FRUIT_SIZE, drawFruitShape, drawSnakeSegment, drawEyes, drawBlob,
} from './drawing.js';

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
    this.drawPaintChanges();
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
    const previousChain = this.chain.value;
    const points = this.chain.onEat(this.fruit.getFruitAt(cell).colorIndex);
    this.fruitEaten += 1;
    this.score += points;
    this.bestScore = Math.max(this.bestScore, this.score);
    this.updateHud();

    // Points above 1 mean the same colour again; dropping back to 1 means the chain broke
    if (points > 1) {
      this.pulseChainSwatch();
    } else if (previousChain > 1) {
      this.shakeChainText();
    }
  }

  // Pop, splat, replacement fruit and speed-up
  eatFruit(cell) {
    this.popFruit(this.fruit.getFruitAt(cell));
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

  // A copy of the eaten fruit that grows and fades, then removes itself.
  // It's drawn around its own centre so it scales from the middle.
  popFruit(fruit) {
    const centre = this.getCellCentre(fruit);
    const pop = this.add.graphics({ x: centre.x, y: centre.y });
    this.drawOneFruit(pop, fruit, 0, 0);

    this.tweens.add({
      targets: pop,
      scale: POP_SCALE,
      alpha: 0,
      duration: POP_MS,
      onComplete: () => pop.destroy(),
    });
  }

  // The swatch grows and shrinks back once
  pulseChainSwatch() {
    this.tweens.killTweensOf(this.chainSwatch);
    this.chainSwatch.setScale(1);
    this.tweens.add({
      targets: this.chainSwatch,
      scale: CHAIN_PULSE_SCALE,
      duration: CHAIN_PULSE_MS,
      yoyo: true,
    });
  }

  // The multiplier text jiggles sideways a few times
  shakeChainText() {
    this.tweens.killTweensOf(this.chainText);
    this.chainText.x = this.chainTextX;
    this.tweens.add({
      targets: this.chainText,
      x: this.chainTextX + CHAIN_SHAKE_PX,
      duration: CHAIN_SHAKE_MS,
      yoyo: true,
      repeat: CHAIN_SHAKE_REPEATS,
    });
  }

  // The snake breaks into paint and the camera shakes. Then everything but
  // the painting fades out, and the Exhibition screen shows the finished artwork.
  endRun() {
    this.isOver = true;
    this.moveTimer.remove();

    this.splatSnake();
    this.stainBlobs();
    this.drawPaintChanges();
    const stats = this.saveRun();

    this.cameras.main.shake(DEATH_SHAKE_MS, DEATH_SHAKE_INTENSITY);
    this.tweens.add({
      targets: [...this.hudItems, this.snakeGraphics, this.fruitGraphics, this.blobGraphics],
      alpha: 0,
      delay: DEATH_SHAKE_MS,
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

  // Pixel position of a grid cell's centre
  getCellCentre(cell) {
    return {
      x: BOARD_X + cell.x * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_Y + cell.y * CELL_SIZE + CELL_SIZE / 2,
    };
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
  // The swatch is drawn around its own centre so it pulses from the middle.
  createChainItem(x, y) {
    this.chainSwatch = this.add.graphics({ x: x - HUD_GAP / 2 - CHAIN_SWATCH_SIZE / 2, y });

    this.chainTextX = x + HUD_GAP / 2; // remembered so the text can shake and settle back
    this.chainText = this.add.text(this.chainTextX, y, '', {
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

  // At the chain cap, a thin ring around the swatch. It's drawn in canvas
  // colour because ink would vanish against the dark studio wall behind the HUD.
  drawChainSwatch() {
    const g = this.chainSwatch;
    const half = CHAIN_SWATCH_SIZE / 2;
    g.clear();
    g.fillStyle(getPaintColor(this.chain.colorIndex));
    g.fillRect(-half, -half, CHAIN_SWATCH_SIZE, CHAIN_SWATCH_SIZE);

    if (this.chain.value === CHAIN_CAP) {
      g.lineStyle(CHAIN_RING_WIDTH, COLORS.canvas);
      g.strokeCircle(0, 0, half * Math.SQRT2 + CHAIN_RING_GAP); // clears the corners
    }
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
      const centre = this.getCellCentre(fruit);
      this.drawOneFruit(g, fruit, centre.x, centre.y);
    }
  }

  // Draw a fruit into `g`. As it dries it fades and shrinks,
  // which shows its timer without numbers.
  drawOneFruit(g, fruit, centreX, centreY) {
    const dryProgress = this.fruit.getDryProgress(fruit);
    const alpha = lerp(1, DRIED_FADE_ALPHA, dryProgress);
    const size = FRUIT_SIZE * lerp(1, DRIED_FADE_SCALE, dryProgress);
    drawFruitShape(g, fruit.colorIndex, centreX, centreY, size, alpha);
  }

  // Each blob fades out over its last BLOB_FADE_MS
  drawBlobs() {
    this.blobGraphics.clear();
    for (const blob of this.blobs.blobs) {
      const centre = this.getCellCentre(blob);
      const alpha = Math.min(1, blob.msLeft / BLOB_FADE_MS);
      drawBlob(this.blobGraphics, centre.x, centre.y, alpha);
    }
  }

  drawSnake() {
    const g = this.snakeGraphics;
    const color = getPaintColor(this.chain.colorIndex);
    g.clear();

    // Tail first, so the head is drawn on top
    for (let i = this.snake.body.length - 1; i > 0; i--) {
      const centre = this.getCellCentre(this.snake.body[i]);
      drawSnakeSegment(g, centre.x, centre.y, BODY_INSET, color);
    }
    const head = this.getCellCentre(this.snake.getHead());
    drawSnakeSegment(g, head.x, head.y, HEAD_INSET, color);
    drawEyes(g, head.x, head.y, this.snake.direction);
  }
}
