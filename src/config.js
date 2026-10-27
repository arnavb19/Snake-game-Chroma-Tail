// Every tunable number in the game lives here.

// Board
export const GRID_COLS = 28;
export const GRID_ROWS = 20;
export const CELL_SIZE = 24;
export const BOARD_WIDTH = GRID_COLS * CELL_SIZE;   // 672
export const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;  // 480

// Layout around the board
export const HUD_HEIGHT = 56;
export const FRAME_WIDTH = 12;

// Total game size: HUD strip on top, then the framed board
export const GAME_WIDTH = BOARD_WIDTH + FRAME_WIDTH * 2;                // 696
export const GAME_HEIGHT = HUD_HEIGHT + BOARD_HEIGHT + FRAME_WIDTH * 2; // 560

// Top-left pixel of the board (inside the frame)
export const BOARD_X = FRAME_WIDTH;
export const BOARD_Y = HUD_HEIGHT + FRAME_WIDTH;

// Snake
export const START_LENGTH = 3;
export const START_COL = 8;   // head column, left of centre
export const START_ROW = 10;  // middle row
export const MAX_QUEUED_TURNS = 2;

// Snake drawing (pixels)
export const SNAKE_OUTLINE = 2;
export const BODY_INSET = 3;  // gap between a body segment and its cell edge
export const HEAD_INSET = 1;  // smaller gap, so the head looks slightly larger
export const EYE_RADIUS = 2.5;
export const EYE_FORWARD = 4; // how far the eyes sit towards the front of the head
export const EYE_SPREAD = 5;  // how far each eye sits from the head's centre line

// Speed (milliseconds per move)
export const START_MOVE_MS = 130;
export const MIN_MOVE_MS = 70;
export const SPEED_UP_MS = 3; // faster by this much per fruit eaten

// Fruit
export const FRUIT_COUNT = 2;
export const FRUIT_INSET = 4;   // gap between a fruit and its cell edge (pixels)
export const FRUIT_OUTLINE = 2;

// HUD strip above the frame
export const HUD_LABEL_SIZE = 14;   // Fraunces labels (pixels)
export const HUD_NUMBER_SIZE = 20;  // IBM Plex Mono numbers (pixels)
export const HUD_GAP = 8;           // space between a label and its number
export const CHAIN_SWATCH_SIZE = 14;

// Pause
export const PAUSE_DIM_ALPHA = 0.5; // how dark the board gets while paused
export const PAUSE_FONT_SIZE = 36;

// Saved data
export const BEST_SCORE_KEY = 'chromaTrail.bestScore';

// Temporary game-over message (replaced by the Exhibition screen in step 7)
export const GAME_OVER_FONT_SIZE = 28;
export const GAME_OVER_PADDING = 12;

// Paint and chains
export const PAINT_OPACITY = 0.35;
export const CHAIN_CAP = 5;

// Palette
export const COLORS = {
  canvas: 0xEFEBE3,     // board floor
  gridLine: 0xE2DCD0,   // faint pencil
  frame: 0x3B2F2A,      // walnut
  wall: 0x24201D,       // studio wall (page background)
  ink: 0x1F1B18,        // text, outlines, snake head
  graphite: 0x5A5550,   // snake before the first fruit
};

// The four paint colours. Each fruit shape is unique so colours can be
// told apart without relying on colour vision.
export const PAINTS = [
  { name: 'Vermilion',   color: 0xE4572E, shape: 'circle' },
  { name: 'Ochre',       color: 0xE9A23B, shape: 'triangle' },
  { name: 'Teal',        color: 0x2A9D8F, shape: 'square' },
  { name: 'Ultramarine', color: 0x3D5A98, shape: 'diamond' },
];

// Fonts
export const FONT_SERIF = 'Fraunces';
export const FONT_MONO = 'IBM Plex Mono';
