// Game-over screen: the finished painting in its frame, with a museum-style label.
import {
  GAME_WIDTH, BOARD_Y, BOARD_HEIGHT, FRAME_WIDTH, COLORS, FONT_SERIF,
  INPUT_DELAY_MS, RENDER_SCALE, LABEL_FONT_SIZE, LABEL_PADDING, LABEL_TOP_GAP,
  LABEL_HINT_SIZE, LABEL_FADE_MS,
} from '../config.js';
import { setUpCamera, drawBoard, PaintCanvas, toCssColor } from './drawing.js';

export default class ExhibitionScene extends Phaser.Scene {
  constructor() {
    super('ExhibitionScene');
  }

  // `data` comes from GameScene: the paint layer and the run's stats
  create(data) {
    setUpCamera(this);
    drawBoard(this);
    // Replaying every mark with the same drawing code gives an identical picture
    new PaintCanvas(this).drawMarks(data.paintLayer.history);

    const label = this.createLabel(data);
    label.setAlpha(0);
    this.tweens.add({ targets: label, alpha: 1, duration: LABEL_FADE_MS });

    this.setUpInput();
  }

  // A small off-white card under the frame:
  // "Untitled No. 7 — 12 fruit · best chain ×4 · 27 points", then a hint below it
  createLabel(data) {
    const cardCentreY = BOARD_Y + BOARD_HEIGHT + FRAME_WIDTH + LABEL_TOP_GAP
      + LABEL_FONT_SIZE / 2 + LABEL_PADDING;

    const title = this.add.text(0, cardCentreY, `Untitled No. ${data.runNumber}`, {
      fontFamily: FONT_SERIF,
      fontStyle: 'italic',
      fontSize: LABEL_FONT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0, 0.5);

    const stats = this.add.text(0, cardCentreY, this.getStatsText(data), {
      fontFamily: FONT_SERIF,
      fontSize: LABEL_FONT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0, 0.5);

    // Centre the two texts together as one line
    const lineWidth = title.width + stats.width;
    title.x = GAME_WIDTH / 2 - lineWidth / 2;
    stats.x = title.x + title.width;

    const card = this.add.rectangle(GAME_WIDTH / 2, cardCentreY,
      lineWidth + LABEL_PADDING * 2, title.height + LABEL_PADDING, COLORS.canvas);

    const hintY = cardCentreY + card.height / 2 + LABEL_TOP_GAP;
    const hint = this.add.text(GAME_WIDTH / 2, hintY, 'Space to paint again', {
      fontFamily: FONT_SERIF,
      fontSize: LABEL_HINT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.canvas),
    }).setOrigin(0.5);

    // The card goes first in the container so it sits behind the text
    return this.add.container(0, 0, [card, title, stats, hint]);
  }

  getStatsText(data) {
    let text = ` — ${data.fruitEaten} fruit · best chain ×${data.bestChain} · ${data.score} points`;
    if (data.isNewBest) {
      text += ' · New best';
    }
    return text;
  }

  // Space starts a new run, but only after a short delay
  setUpInput() {
    this.inputReady = false;
    this.time.delayedCall(INPUT_DELAY_MS, () => { this.inputReady = true; });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.inputReady) {
        this.scene.start('GameScene');
      }
    });
  }
}
