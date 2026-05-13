/**
 * Shared timing constants for demo recordings.
 * Import from here so pacing can be tuned globally.
 */

/** Short pause after clicks, small UI transitions */
export const PAUSE_SHORT = 400;

/** Medium pause after navigation, form submissions */
export const PAUSE_MEDIUM = 1000;

/** Long pause for "let the viewer read this" moments */
export const PAUSE_LONG = 2000;

/** Delay between keystrokes for pressSequentially (ms per character) */
export const TYPING_DELAY = 80;

/** Helper: sleep for a given duration */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Caption read times
// ---------------------------------------------------------------------------
// Rule of thumb: ~250ms per word of reading time, 1500ms minimum.
// Pick the bucket that matches the word count:
//   ≤7 words  → CAPTION_READ_SHORT
//   8-15 words → CAPTION_READ_MEDIUM
//   >15 words  → CAPTION_READ_LONG

/** Caption read time for ~5 words */
export const CAPTION_READ_SHORT = 2000;

/** Caption read time for ~10 words */
export const CAPTION_READ_MEDIUM = 3500;

/** Caption read time for ~20 words */
export const CAPTION_READ_LONG = 5000;

/** Hold duration for full-screen title cards */
export const TITLE_CARD_DURATION = 3000;
