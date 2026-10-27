// Dried paint blobs: temporary 1-cell walls left by fruit that dried. No Phaser.
import { BLOB_MS } from '../config.js';

export default class BlobManager {
  constructor() {
    this.blobs = []; // each blob is { x, y, msLeft }
  }

  add(x, y) {
    this.blobs.push({ x, y, msLeft: BLOB_MS });
  }

  isBlocked(x, y) {
    return this.blobs.some((blob) => blob.x === x && blob.y === y);
  }

  // Count every blob down by `deltaMs` of game time.
  // Returns the blobs that just expired (they are removed from the board).
  update(deltaMs) {
    const expired = [];
    for (const blob of this.blobs) {
      blob.msLeft -= deltaMs;
      if (blob.msLeft <= 0) {
        expired.push(blob);
      }
    }
    this.blobs = this.blobs.filter((blob) => blob.msLeft > 0);
    return expired;
  }
}
