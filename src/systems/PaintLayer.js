// 28x20 grid of paint colour indexes (or null for bare canvas), plus every
// paint mark in the order it was made. No Phaser.
// The scenes draw it; this file only remembers what was painted where.

export default class PaintLayer {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = []; // cells[y][x] is a colour index, or null if unpainted
    for (let y = 0; y < rows; y++) {
      this.cells.push(new Array(cols).fill(null));
    }
    // Splats spill over their cell edges, so the grid alone can't redraw the
    // artwork. Replaying `history` in order gives exactly the same picture.
    this.history = [];
    this.newMarks = [];
  }

  // A newer colour simply replaces the old one: no blending
  paint(x, y, colorIndex) {
    if (this.cells[y][x] === colorIndex) {
      return;
    }
    this.cells[y][x] = colorIndex;
    this.addMark({ kind: 'cell', x, y, colorIndex });
  }

  // A round blob centred on a cell, with `dropCount` drips at random angles
  splat(x, y, colorIndex, radius, dropCount) {
    const dropAngles = [];
    for (let i = 0; i < dropCount; i++) {
      dropAngles.push(Math.random() * Math.PI * 2);
    }
    this.addMark({ kind: 'splat', x, y, colorIndex, radius, dropAngles });
  }

  getColor(x, y) {
    return this.cells[y][x];
  }

  addMark(mark) {
    this.history.push(mark);
    this.newMarks.push(mark);
  }

  // Returns the marks made since the last call, then forgets them
  takeNewMarks() {
    const marks = this.newMarks;
    this.newMarks = [];
    return marks;
  }
}
