// Keeps 2 fruit on the board in different colours and spawns them on free cells. No Phaser.

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export default class FruitManager {
  constructor(cols, rows, colorCount, fruitCount) {
    this.cols = cols;
    this.rows = rows;
    this.colorCount = colorCount;
    this.fruitCount = fruitCount;
    this.fruits = []; // each fruit is { x, y, colorIndex }
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
    this.fruits.push({ x: cell.x, y: cell.y, colorIndex });
    return true;
  }

  // Every cell not covered by the snake or another fruit
  getFreeCells(snake) {
    const cells = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = { x, y };
        if (!snake.isOccupied(cell) && !this.hasFruitAt(cell)) {
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
