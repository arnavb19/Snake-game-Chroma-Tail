// Current colour, chain multiplier and points per fruit. No Phaser.
import { GRAPHITE, CHAIN_CAP, PAINTS } from '../config.js';

export default class Chain {
  constructor() {
    this.colorIndex = GRAPHITE; // the snake's colour: the last fruit eaten
    this.value = 1;             // current multiplier, 1 to CHAIN_CAP
    this.best = 1;              // highest multiplier reached this run
  }

  // Same colour as before: chain +1 (capped). Any other colour: back to 1.
  // Returns the points this fruit is worth.
  onEat(colorIndex) {
    if (colorIndex === this.colorIndex) {
      this.value = Math.min(this.value + 1, CHAIN_CAP);
    } else {
      this.value = 1;
    }
    this.colorIndex = colorIndex;
    this.best = Math.max(this.best, this.value);
    return this.value;
  }
}

// Checks the example from DESIGN.md: red, red, red, blue, blue = 1 + 2 + 3 + 1 + 2 = 9.
// Only runs when DEBUG is true in config.js.
export function runChainSelfCheck() {
  const red = PAINTS.findIndex((paint) => paint.name === 'Vermilion');
  const blue = PAINTS.findIndex((paint) => paint.name === 'Ultramarine');

  const chain = new Chain();
  let score = 0;
  for (const color of [red, red, red, blue, blue]) {
    score += chain.onEat(color);
  }

  console.assert(score === 9, `Chain self-check: expected 9 points, got ${score}`);
  console.assert(chain.best === 3, `Chain self-check: expected best chain 3, got ${chain.best}`);
  console.log(`Chain self-check finished: ${score} points, best chain ×${chain.best}`);
}
