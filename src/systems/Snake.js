// Snake body array: move, grow, and self-hit check. No Phaser.

// One grid step in each direction
export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(a, b) {
  return DIRECTIONS[a].x === -DIRECTIONS[b].x
    && DIRECTIONS[a].y === -DIRECTIONS[b].y;
}

export default class Snake {
  // The head starts at (headX, headY) facing right, with the body trailing left
  constructor(headX, headY, length) {
    this.body = []; // grid cells, head first
    for (let i = 0; i < length; i++) {
      this.body.push({ x: headX - i, y: headY });
    }
    this.direction = 'right';
  }

  getHead() {
    return this.body[0];
  }

  // The cell the head would enter if it moved one step this way
  getNextHead(direction) {
    const head = this.getHead();
    const step = DIRECTIONS[direction];
    return { x: head.x + step.x, y: head.y + step.y };
  }

  // Add a new head. Without growing, the tail is dropped so the length stays the same.
  move(direction, grow = false) {
    this.body.unshift(this.getNextHead(direction));
    if (!grow) {
      this.body.pop();
    }
    this.direction = direction;
  }

  isOccupied(cell) {
    return this.body.some((part) => part.x === cell.x && part.y === cell.y);
  }

  // Would the head hit the body by entering `cell`?
  // When not growing, the tail leaves its cell this tick, so that cell is safe.
  hitsBody(cell, grow) {
    const parts = grow ? this.body : this.body.slice(0, -1);
    return parts.some((part) => part.x === cell.x && part.y === cell.y);
  }
}
