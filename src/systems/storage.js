// Saved numbers (best score, run count) in localStorage. No Phaser.
// Storage can be blocked (e.g. private browsing), so never let it crash the game.

export function loadNumber(key) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch (error) {
    return 0;
  }
}

export function saveNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    // Ignore: the number just won't be remembered
  }
}
