/**
 * Shared timing constants for demo recordings.
 * Import from here so pacing can be tuned globally.
 */

/** Short pause after clicks, small UI transitions */
export const PAUSE_SHORT = 250;

/** Medium pause after navigation, form submissions */
export const PAUSE_MEDIUM = 600;

/** Long pause for "let the viewer read this" moments */
export const PAUSE_LONG = 1200;

/** Delay between keystrokes for pressSequentially (ms per character) */
export const TYPING_DELAY = 50;

/** Helper: sleep for a given duration */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Caption read times
// ---------------------------------------------------------------------------
// Tuned for comfortable viewer reading — assume ~350ms per word of reading time
// with a generous minimum dwell. Captions are the primary narration channel,
// so erring on the side of "slightly too long" keeps the demo accessible.
//
// Pick the bucket that matches the word count:
//   ≤7 words   → CAPTION_READ_SHORT
//   8-15 words → CAPTION_READ_MEDIUM
//   >15 words  → CAPTION_READ_LONG

/** Caption read time for ≤7 words */
export const CAPTION_READ_SHORT = 2200;

/** Caption read time for 8-15 words */
export const CAPTION_READ_MEDIUM = 3800;

/** Caption read time for >15 words */
export const CAPTION_READ_LONG = 5500;

/** Hold duration for full-screen title cards */
export const TITLE_CARD_DURATION = 2400;
