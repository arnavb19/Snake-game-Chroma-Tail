// Title screen: game name, controls, best score; Space starts a run.
import {
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT, COLORS, FONT_SERIF, FONT_MONO,
  BEST_SCORE_KEY, INPUT_DELAY_MS, RENDER_SCALE,
  TITLE_FONT_SIZE, TITLE_HINT_SIZE, TITLE_HINT_GAP, TITLE_BEST_SIZE, TITLE_BEST_MARGIN,
} from '../config.js';
import { loadNumber } from '../systems/storage.js';
import { setUpCamera, drawBoard, toCssColor } from './drawing.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    setUpCamera(this);
    drawBoard(this);

    const centreX = BOARD_X + BOARD_WIDTH / 2;
    const centreY = BOARD_Y + BOARD_HEIGHT / 2;

    this.add.text(centreX, centreY, 'Chroma Trail', {
      fontFamily: FONT_SERIF,
      fontStyle: '600',
      fontSize: TITLE_FONT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0.5, 1);

    this.addHint(centreX, centreY + TITLE_HINT_GAP,
      'Arrow keys to move · Same colour in a row multiplies your score');
    this.addHint(centreX, centreY + TITLE_HINT_GAP * 2, 'Press Space to start');

    this.add.text(centreX, BOARD_Y + BOARD_HEIGHT - TITLE_BEST_MARGIN,
      'BEST ' + loadNumber(BEST_SCORE_KEY), {
        fontFamily: FONT_MONO,
        fontSize: TITLE_BEST_SIZE,
        resolution: RENDER_SCALE,
        color: toCssColor(COLORS.graphite),
      }).setOrigin(0.5);

    this.setUpInput();
  }

  addHint(x, y, message) {
    this.add.text(x, y, message, {
      fontFamily: FONT_SERIF,
      fontSize: TITLE_HINT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0.5);
  }

  // Space starts a run, but only after a short delay
  setUpInput() {
    this.input.keyboard.addCapture('SPACE');
    this.inputReady = false;
    this.time.delayedCall(INPUT_DELAY_MS, () => { this.inputReady = true; });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.inputReady) {
        this.scene.start('GameScene');
      }
    });
  }
}
