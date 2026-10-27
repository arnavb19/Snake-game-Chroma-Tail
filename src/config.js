// Every tunable number in the game lives here.

// Set to true to run self-checks in the browser console on page load
export const DEBUG = false;

// Board
export const GRID_COLS = 28;
export const GRID_ROWS = 20;
export const CELL_SIZE = 24;
export const BOARD_WIDTH = GRID_COLS * CELL_SIZE;   // 672
export const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;  // 480

// Layout around the board
export const HUD_HEIGHT = 56;
export const FRAME_WIDTH = 12;
export const LABEL_STRIP_HEIGHT = 84; // space under the frame for the museum label

// Total game size: HUD strip on top, then the framed board, then the label strip
export const GAME_WIDTH = BOARD_WIDTH + FRAME_WIDTH * 2;                // 696
export const GAME_HEIGHT = HUD_HEIGHT + BOARD_HEIGHT + FRAME_WIDTH * 2
  + LABEL_STRIP_HEIGHT;                                                 // 644

// The canvas is drawn this many times larger than the sizes above, then shrunk
// to fit the window, so it stays sharp on high-DPI and scaled displays.
// Scenes zoom their camera by this, so every position stays in base units.
export const RENDER_SCALE = Math.min(Math.ceil(window.devicePixelRatio || 1) * 2, 3);

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
export const RUN_COUNT_KEY = 'chromaTrail.runCount';

// Screens
export const INPUT_DELAY_MS = 300; // keys are ignored this long after a scene starts
export const TITLE_FONT_SIZE = 64;
export const TITLE_HINT_SIZE = 16;
export const TITLE_HINT_GAP = 28;     // space between the title and the hint lines
export const TITLE_BEST_SIZE = 14;
export const TITLE_BEST_MARGIN = 24;  // distance of the best score from the canvas bottom

// Death and Exhibition
export const DEATH_FADE_MS = 600;     // HUD, snake, fruit and blobs fade out this long
export const DEATH_SPLAT_RADIUS = 12; // each snake segment leaves a splat this big
export const DEATH_SPLAT_DROPS = 1;
export const LABEL_FONT_SIZE = 16;
export const LABEL_PADDING = 10;      // space between the label text and its card edge
export const LABEL_TOP_GAP = 14;      // space between the frame and the label card
export const LABEL_HINT_SIZE = 14;
export const LABEL_FADE_MS = 500;

// Paint and chains
export const PAINT_OPACITY = 0.35;
export const GRAPHITE = -1; // colour index for the snake before its first fruit
export const STAIN = -2;    // colour index for the dark stain a blob leaves behind
export const CHAIN_CAP = 5;

// Splat left on the cell where a fruit was eaten (pixels)
export const SPLAT_RADIUS = 16;        // a bit wider than a cell
export const SPLAT_DROPS = 3;          // small drips around the main blob
export const SPLAT_DROP_RADIUS = 3;
export const SPLAT_DROP_DISTANCE = 17; // from the cell centre

// Drying paint: uneaten fruit dries into a temporary 1-cell wall (a blob)
export const DRY_START_FRUIT = 3;     // drying timers only run once this many fruit are eaten
export const DRY_MS = 12000;          // how long a fruit takes to dry
export const DRY_MS_DEBUG = null;     // testing only: set to e.g. 3000 to override DRY_MS
export const BLOB_MS = 12000;         // how long a blob lasts
export const BLOB_FADE_MS = 2000;     // a blob fades out over its last this-many ms
export const DRY_SAFE_DISTANCE = 3;   // a fruit can't dry while the head is this close (Manhattan)
export const DRIED_FADE_ALPHA = 0.55; // a fully dried fruit's opacity
export const DRIED_FADE_SCALE = 0.8;  // a fully dried fruit's size

// Blob drawing (pixels)
export const BLOB_RADIUS = 10;
export const BLOB_OUTLINE = 2;
export const BLOB_HATCH_GAP = 4;   // space between cross-hatch lines
export const BLOB_HATCH_WIDTH = 1;

// Palette
export const COLORS = {
  canvas: 0xEFEBE3,     // board floor
  gridLine: 0xE2DCD0,   // faint pencil
  frame: 0x3B2F2A,      // walnut
  wall: 0x24201D,       // studio wall (page background)
  ink: 0x1F1B18,        // text, outlines, snake head
  graphite: 0x5A5550,   // snake before the first fruit
  driedUmber: 0x5C4A3D, // dried paint blobs
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
