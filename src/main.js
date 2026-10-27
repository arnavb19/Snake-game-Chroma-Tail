import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE, COLORS, FONT_SERIF, FONT_MONO, DEBUG } from './config.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import ExhibitionScene from './scenes/ExhibitionScene.js';
import { runChainSelfCheck } from './systems/Chain.js';

// Phaser draws text onto a canvas once, so the web fonts must be ready
// before any scene starts. If they fail (e.g. offline), start anyway.
async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load(`16px "${FONT_SERIF}"`),
      document.fonts.load(`600 16px "${FONT_SERIF}"`),    // title
      document.fonts.load(`italic 16px "${FONT_SERIF}"`), // museum label
      document.fonts.load(`16px "${FONT_MONO}"`),
    ]);
  } catch (error) {
    console.warn('Fonts did not load, using fallbacks.', error);
  }
}

function startGame() {
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH * RENDER_SCALE,
    height: GAME_HEIGHT * RENDER_SCALE,
    backgroundColor: COLORS.wall,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [TitleScene, GameScene, ExhibitionScene], // the first one starts
  });
}

if (DEBUG) {
  runChainSelfCheck();
}

loadFonts().then(startGame);
