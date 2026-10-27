// 28x20 grid of paint colour indexes (or null for bare canvas). No Phaser.
// The scene draws it; this file only remembers what colour each cell is.

export default class PaintLayer {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = []; // cells[y][x] is a colour index, or null if unpainted
    for (let y = 0; y < rows; y++) {
      this.cells.push(new Array(cols).fill(null));
    }
    this.changedCells = [];
  }

  // A newer colour simply replaces the old one: no blending
  paint(x, y, colorIndex) {
    if (this.cells[y][x] === colorIndex) {
      return;
    }
    this.cells[y][x] = colorIndex;
    this.changedCells.push({ x, y, colorIndex });
  }

  getColor(x, y) {
    return this.cells[y][x];
  }

  // Returns the cells painted since the last call, then forgets them
  takeChangedCells() {
    const changed = this.changedCells;
    this.changedCells = [];
    return changed;
  }
}
