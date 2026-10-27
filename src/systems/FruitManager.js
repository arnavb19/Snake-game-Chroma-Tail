// Keeps 2 fruit on the board in different colours, spawns them on free cells,
// and dries uneaten fruit into blobs. No Phaser.
import { DRY_MS, DRY_MS_DEBUG, DRY_SAFE_DISTANCE } from '../config.js';

// DRY_MS_DEBUG lets you shorten drying while testing
const DRY_TIME = DRY_MS_DEBUG ?? DRY_MS;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Grid distance counting only straight steps (no diagonals)
function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export default class FruitManager {
  constructor(cols, rows, colorCount, fruitCount, blobs) {
    this.cols = cols;
    this.rows = rows;
    this.colorCount = colorCount;
    this.fruitCount = fruitCount;
    this.blobs = blobs; // a BlobManager: dried fruit become blobs, and fruit never spawn on one
    this.fruits = [];   // each fruit is { x, y, colorIndex, dryMs }
  }

  // Spawn fruit until the board has the full count.
  // Returns false if there was no free cell left (the board is full).
  fillBoard(snake) {
    while (this.fruits.length < this.fruitCount) {
      if (!this.spawnOne(snake)) {
        return false;
      }
    }
    return true;
  }

  hasFruitAt(cell) {
    return this.findIndexAt(cell) !== -1;
  }

  // The fruit at `cell`, or undefined if there is none
  getFruitAt(cell) {
    return this.fruits[this.findIndexAt(cell)];
  }

  // Remove the fruit at `cell` and spawn its replacement.
  // Returns false if the replacement had nowhere to go.
  eatAt(cell, snake) {
    this.fruits.splice(this.findIndexAt(cell), 1);
    return this.fillBoard(snake);
  }

  // Run each fruit's drying timer by `deltaMs` of game time.
  // `isDrying` is false until enough fruit have been eaten this run.
  // Returns false if a replacement fruit had nowhere to go.
  update(deltaMs, snake, isDrying) {
    if (!isDrying) {
      return true;
    }

    const head = snake.getHead();
    for (const fruit of [...this.fruits]) {
      // Hold at "fully dry" instead of finishing while the head is close
      fruit.dryMs = Math.min(fruit.dryMs + deltaMs, DRY_TIME);
      const headIsClose = manhattanDistance(head, fruit) <= DRY_SAFE_DISTANCE;

      if (fruit.dryMs >= DRY_TIME && !headIsClose) {
        this.dry(fruit);
      }
    }
    return this.fillBoard(snake);
  }

  // The fruit's cell becomes a blob; fillBoard then spawns its replacement
  dry(fruit) {
    this.fruits.splice(this.fruits.indexOf(fruit), 1);
    this.blobs.add(fruit.x, fruit.y);
  }

  // 0 for a fresh fruit, 1 for a fully dried one
  getDryProgress(fruit) {
    return fruit.dryMs / DRY_TIME;
  }

  findIndexAt(cell) {
    return this.fruits.findIndex((fruit) => fruit.x === cell.x && fruit.y === cell.y);
  }

  spawnOne(snake) {
    const freeCells = this.getFreeCells(snake);
    if (freeCells.length === 0) {
      return false;
    }
    const cell = pickRandom(freeCells);
    const colorIndex = pickRandom(this.getUnusedColors());
    this.fruits.push({ x: cell.x, y: cell.y, colorIndex, dryMs: 0 });
    return true;
  }

  // Every cell not covered by the snake, a blob or another fruit
  getFreeCells(snake) {
    const cells = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = { x, y };
        if (!snake.isOccupied(cell) && !this.blobs.isBlocked(x, y) && !this.hasFruitAt(cell)) {
          cells.push(cell);
        }
      }
    }
    return cells;
  }

  // Colour indexes not used by any fruit already on the board
  getUnusedColors() {
    const colors = [];
    for (let i = 0; i < this.colorCount; i++) {
      if (!this.fruits.some((fruit) => fruit.colorIndex === i)) {
        colors.push(i);
      }
    }
    return colors;
  }
}
