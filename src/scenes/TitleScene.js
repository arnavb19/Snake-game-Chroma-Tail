// Title screen: game name, how to play, best score; Space starts a run.
import {
  BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT, COLORS, PAINTS, FONT_SERIF, FONT_MONO,
  BEST_SCORE_KEY, INPUT_DELAY_MS, RENDER_SCALE, CHAIN_CAP, HEAD_INSET,
  TITLE_FONT_SIZE, TITLE_BOTTOM, TITLE_HINT_SIZE, TITLE_START_GAP,
  TITLE_BEST_SIZE, TITLE_BEST_MARGIN,
  RULE_FONT_SIZE, RULE_TOP_GAP, RULE_SPACING, RULE_ICON_SCALE, RULE_ICON_COLUMN,
  RULE_ICON_GAP, RULE_PAIR_GAP, PAUSE_HINT_SIZE, PAUSE_HINT_ALPHA, PAUSE_HINT_GAP,
} from '../config.js';
import { loadNumber } from '../systems/storage.js';
import {
  setUpCamera, drawBoard, toCssColor,
  FRUIT_SIZE, drawFruitShape, drawSnakeSegment, drawEyes, drawBlob,
} from './drawing.js';

// The "How to play" list, one rule per line, each with a small icon
const RULES = [
  { icon: 'head', text: 'Arrow keys or WASD to move' },
  { icon: 'fruit', text: 'Eat paint to grow and colour your trail' },
  { icon: 'pair', text: `Same colour in a row multiplies your score, up to ×${CHAIN_CAP}` },
  { icon: 'blob', text: 'Uneaten paint dries into a blob. Avoid walls, blobs and yourself' },
];

// Colour index of a paint by name, so the icons read clearly
function paintIndex(name) {
  return PAINTS.findIndex((paint) => paint.name === name);
}

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    setUpCamera(this);
    drawBoard(this);

    const centreX = BOARD_X + BOARD_WIDTH / 2;
    const titleBottom = BOARD_Y + TITLE_BOTTOM;

    this.add.text(centreX, titleBottom, 'Chroma Trail', {
      fontFamily: FONT_SERIF,
      fontStyle: '600',
      fontSize: TITLE_FONT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0.5, 1);

    const lastRuleY = this.addRules(centreX, titleBottom + RULE_TOP_GAP);
    const pauseY = lastRuleY + PAUSE_HINT_GAP;

    this.add.text(centreX, pauseY, 'P or Esc to pause', {
      fontFamily: FONT_SERIF,
      fontSize: PAUSE_HINT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0.5).setAlpha(PAUSE_HINT_ALPHA);

    this.add.text(centreX, pauseY + TITLE_START_GAP, 'Press Space to start', {
      fontFamily: FONT_SERIF,
      fontSize: TITLE_HINT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0.5);

    this.add.text(centreX, BOARD_Y + BOARD_HEIGHT - TITLE_BEST_MARGIN,
      'BEST ' + loadNumber(BEST_SCORE_KEY), {
        fontFamily: FONT_MONO,
        fontSize: TITLE_BEST_SIZE,
        resolution: RENDER_SCALE,
        color: toCssColor(COLORS.graphite),
      }).setOrigin(0.5);

    this.setUpInput();
  }

  // The rules are left-aligned as a block, and the block is centred under the title.
  // Returns the y of the last rule line.
  addRules(centreX, firstY) {
    const texts = RULES.map((rule, i) => this.add.text(0, firstY + i * RULE_SPACING, rule.text, {
      fontFamily: FONT_SERIF,
      fontSize: RULE_FONT_SIZE,
      resolution: RENDER_SCALE,
      color: toCssColor(COLORS.ink),
    }).setOrigin(0, 0.5));

    // The block is as wide as the icon column plus the longest line
    const widest = Math.max(...texts.map((text) => text.width));
    const left = centreX - (RULE_ICON_COLUMN + RULE_ICON_GAP + widest) / 2;

    RULES.forEach((rule, i) => {
      texts[i].x = left + RULE_ICON_COLUMN + RULE_ICON_GAP;
      this.drawRuleIcon(rule.icon, left + RULE_ICON_COLUMN / 2, texts[i].y);
    });
    return firstY + (RULES.length - 1) * RULE_SPACING;
  }

  // A game actor drawn with the game's own drawing code, around its own centre,
  // then shrunk to icon size
  drawRuleIcon(icon, x, y) {
    const g = this.add.graphics({ x, y }).setScale(RULE_ICON_SCALE);

    if (icon === 'head') {
      drawSnakeSegment(g, 0, 0, HEAD_INSET, PAINTS[paintIndex('Teal')].color);
      drawEyes(g, 0, 0, 'right');
    } else if (icon === 'fruit') {
      drawFruitShape(g, paintIndex('Vermilion'), 0, 0);
    } else if (icon === 'pair') {
      const offset = (FRUIT_SIZE + RULE_PAIR_GAP) / 2;
      drawFruitShape(g, paintIndex('Ochre'), -offset, 0);
      drawFruitShape(g, paintIndex('Ochre'), offset, 0);
    } else {
      drawBlob(g, 0, 0);
    }
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
