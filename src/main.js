import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_SERIF, FONT_MONO } from './config.js';
import GameScene from './scenes/GameScene.js';

// Phaser draws text onto a canvas once, so the web fonts must be ready
// before any scene starts. If they fail (e.g. offline), start anyway.
async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load(`16px "${FONT_SERIF}"`),
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
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.wall,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
  });
}

loadFonts().then(startGame);
