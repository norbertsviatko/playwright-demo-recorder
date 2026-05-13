# Demo Script Style Guide

Rules for ALL generated demo scripts in `demos/generated/`.

## File Structure

Every generated script MUST start with a comment block linking to its source scenario:

```ts
/**
 * Generated from: demos/scenarios/<name>.md
 *
 * <one-line description>
 */
```

## Text Input

- **Always** use `page.locator(...).pressSequentially(text, { delay: TYPING_DELAY })` for visible typing
- **Never** use `fill()` — it's instant and looks unnatural in recordings
- Import `TYPING_DELAY` from `../helpers/pacing`

## Pausing

- `PAUSE_SHORT` (400ms) — after clicks, small UI transitions
- `PAUSE_MEDIUM` (1000ms) — after navigation, form submissions, page loads
- `PAUSE_LONG` (2000ms) — "let the viewer read this" moments (dashboard, results, key UI states)
- Always `await sleep(PAUSE_*)` — never bare `setTimeout`

## Mouse Movement & Cursor

- **Always** use `clickWithCursor(page, locator)` for clicks — it moves the visible cursor, triggers a click ripple, then clicks
- **Always** use `moveTo(page, locator)` when hovering before typing (e.g., before `pressSequentially`)
- **Always** use `smoothScroll(page, deltaY)` for scrolling — never raw `page.mouse.wheel()`
- Import from `../helpers/cursor`
- **Never** use raw `page.mouse.move()` or `locator.click()` directly — the cursor won't be visible in the recording
- The cursor is a blue circle injected into the DOM. It's positioned explicitly via `page.evaluate` to guarantee visibility in Playwright's video capture

## Selectors

- Prefer `page.getByTestId()`, `page.getByRole()`, `page.getByText()` over raw CSS selectors
- Use `data-testid` attributes on key interactive elements in your app
- Keep selectors stable — avoid positional selectors that break with UI changes

## Navigation

- Use `page.goto(path)` for initial navigation
- After navigation, always `await sleep(PAUSE_MEDIUM)` to let the page render visually
- For SPA navigation (clicking links), `await sleep(PAUSE_MEDIUM)` after the click

## Recorder Lifecycle

```ts
import { test } from "@playwright/test";
import { closeDemoRecorder, createDemoRecorder } from "../helpers/recorder";
import { PAUSE_LONG, sleep } from "../helpers/pacing";

test("scenario name", async () => {
  const { context, page } = await createDemoRecorder({ name: "scenario-name" });

  // ... demo steps ...

  await sleep(PAUSE_LONG); // Final pause so video doesn't cut abruptly
  await closeDemoRecorder(context);
});
```

## General

- One test per file, one scenario per test
- Keep scripts linear — no branching, no conditionals
- Add `// Step: <description>` comments for each logical step matching the scenario
- Target ~15-90 seconds of video per demo (captions will add some time)
- Close the recorder cleanly at the end so the video file is finalized

---

## Captions, Title Cards & Highlights

### Scenario Directives

Scenario `.md` files can include blockquote directives that control on-screen text overlays. These are interpreted by Claude Code when generating specs — they are **not** parsed at runtime.

| Directive | Syntax | Behavior |
|-----------|--------|----------|
| Caption | `> CAPTION: <text>` | Show text overlay, auto-duration based on word count, auto-hides before next action or next caption |
| Held caption | `> CAPTION_HOLD: <text>` | Show text overlay that persists across multiple actions until explicitly cleared |
| Clear caption | `> CAPTION_CLEAR` | Remove a held caption |
| Title card | `> TITLE: <title> \| <optional subtitle>` | Full-screen dark overlay with large centered text, auto-fades |
| Highlight | `> HIGHLIGHT: <selector> \| <optional caption>` | Pulsing glow border around a UI element, auto-clears on next action |
| Pause | `> PAUSE: <ms>` | Extra pause beyond default pacing |

#### Examples in a scenario file

```markdown
> TITLE: Feature Name | Subtitle here

1. Navigate to the page

> CAPTION: Explaining what happens next

2. Click the button
3. Fill in the form

> CAPTION_HOLD: This stays visible across steps

4. Do something
5. Do another thing

> CAPTION_CLEAR

> HIGHLIGHT: [data-testid="status-badge"] | Status is now active

6. Verify the badge
```

### When to Use Captions

- Use a caption at the **start of each logical section** explaining what's about to happen
- Use a caption before any **non-obvious action** (e.g., "Notice the auto-save indicator")
- Do **NOT** caption every single click — that's noise. Caption the *intent*, not the mechanics
- Use **TITLE** cards only for major section breaks (typically 2-4 per demo max)
- Use **HIGHLIGHT** when the relevant UI element is small or easy to miss

### Timing Rules

- **Captions**: After `showCaption`, wait for the appropriate `CAPTION_READ_*` duration before the next action — the viewer needs time to read before things move
- **Held captions** (`CAPTION_HOLD`): The caption stays during a sequence of actions. Subsequent actions still get their normal pacing but **no extra read pause** between them (the viewer reads while watching)
- **Title cards**: `showTitleCard` waits internally for its full duration. After it returns, add `await sleep(PAUSE_SHORT)` before starting the next action
- **Highlights**: Leave highlights visible for at least `PAUSE_LONG` so the viewer can spot them. Clear before the next major interaction

### Caption Read Durations

| Constant | Duration | Word count |
|----------|----------|------------|
| `CAPTION_READ_SHORT` | 2000ms | <=7 words |
| `CAPTION_READ_MEDIUM` | 3500ms | 8-15 words |
| `CAPTION_READ_LONG` | 5000ms | >15 words |
| `TITLE_CARD_DURATION` | 3000ms | (default for title cards) |

Rule of thumb: ~250ms per word of reading time, 1500ms minimum. Use `captionReadTime(text)` from `../helpers/captions` to auto-select the right bucket.

### Generation Pattern

When generating a spec from a scenario with caption directives:

**`> CAPTION: <text>`** — emit:
```ts
await showCaption(page, "<text>");
await page.waitForTimeout(CAPTION_READ_SHORT); // pick SHORT/MEDIUM/LONG by word count
// ... action ...
await hideCaption(page);
```

**`> CAPTION_HOLD: <text>`** — emit:
```ts
await showCaption(page, "<text>");
await page.waitForTimeout(CAPTION_READ_SHORT); // initial read time
// ... multiple actions with normal pacing, no extra read pauses ...
```

**`> CAPTION_CLEAR`** — emit:
```ts
await hideCaption(page);
```

**`> TITLE: <title> | <subtitle>`** — emit:
```ts
await showTitleCard(page, "<title>", "<subtitle>", TITLE_CARD_DURATION);
await sleep(PAUSE_SHORT);
```

**`> HIGHLIGHT: <selector> | <caption>`** — emit:
```ts
const highlight = await highlightElement(page, "<selector>", "<caption>");
// ... action(s) ...
await highlight.clear();
```

**`> PAUSE: <ms>`** — emit:
```ts
await sleep(<ms>);
```

Pick the read duration size based on word count: <=7 words `CAPTION_READ_SHORT`, 8-15 words `CAPTION_READ_MEDIUM`, >15 words `CAPTION_READ_LONG`. Or use `captionReadTime(text)` directly.

Word the captions concisely. If a scenario author writes a long caption, keep it as-is — don't rewrite their narrative voice. But flag in a comment if a caption exceeds 20 words (`// NOTE: long caption — consider shortening`).
