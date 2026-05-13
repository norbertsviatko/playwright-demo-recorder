# Demo Video Recording System

Turn human-written scenario files into polished demo videos using Playwright.

## How It Works

1. **Write a scenario** in `scenarios/<name>.md` — plain English, non-technical
2. **Generate a script** — ask Claude Code to generate `generated/<name>.spec.ts` from the scenario following the [style guide](./style-guide.md)
3. **Run the demo** — Playwright executes the script with video recording, producing `.webm` files

## Quick Start

```bash
# Interactive picker — select which demos to run
npm run demo:run

# Run all demos without prompting
npm run demo:run:all

# Run headed (see the browser)
DEMO_HEADED=true npm run demo:run

# Run a single demo directly
npx playwright test --config playwright.demos.config.ts demos/generated/<name>.spec.ts
```

## Writing a Scenario

Create `scenarios/<name>.md` with a simple step-by-step flow:

```markdown
# Login Flow

1. Open the login page
2. Type email "admin@example.com"
3. Type password
4. Click "Sign in"
5. Wait for the dashboard to load
6. Pause on the dashboard for 2 seconds
```

Keep it non-technical — describe what the user sees and does, not selectors or code.

## Captions and Narration

Scenarios can include **on-screen captions** that are burned into the recorded video as DOM overlays.

### Scenario Directives

Add blockquote lines anywhere in the scenario flow:

```markdown
> TITLE: Feature Name | Subtitle

1. Navigate to the page

> CAPTION: Explaining what happens next

2. Click the button

> CAPTION_HOLD: This stays visible across multiple steps

3. Do something
4. Do another thing

> CAPTION_CLEAR

> HIGHLIGHT: [data-testid="badge"] | Label text

5. Verify the badge

> PAUSE: 3000
```

| Directive | Purpose |
|-----------|---------|
| `> TITLE: text \| subtitle` | Full-screen title card with dark backdrop (2-4 per demo max) |
| `> CAPTION: text` | Bottom-of-screen caption, auto-hides based on word count |
| `> CAPTION_HOLD: text` | Caption that stays visible across multiple steps |
| `> CAPTION_CLEAR` | Remove a held caption |
| `> HIGHLIGHT: selector \| caption` | Pulsing glow around a UI element |
| `> PAUSE: ms` | Extra hold beyond default pacing |

## Generating a Script

Ask Claude Code:

> Generate a demo script from `demos/scenarios/<name>.md` following `demos/style-guide.md`. Output to `demos/generated/<name>.spec.ts`.

Claude Code will:
- Read the scenario and style guide
- Use the recorder helper for video setup
- Follow pacing conventions for natural-looking interactions
- Translate caption directives into overlay calls

## Tuning Pacing

All timing is in `helpers/pacing.ts`:

| Constant | Default | Use |
|----------|---------|-----|
| `PAUSE_SHORT` | 400ms | After clicks, small transitions |
| `PAUSE_MEDIUM` | 1000ms | After navigation, page loads |
| `PAUSE_LONG` | 2000ms | "Read this" moments |
| `TYPING_DELAY` | 80ms | Per-character typing speed |
| `CAPTION_READ_SHORT` | 2000ms | Caption <=7 words |
| `CAPTION_READ_MEDIUM` | 3500ms | Caption 8-15 words |
| `CAPTION_READ_LONG` | 5000ms | Caption >15 words |
| `TITLE_CARD_DURATION` | 3000ms | Full-screen title cards |

Change these to speed up or slow down all demos globally.

## Directory Structure

```
playwright-demo-recorder/
  app/
    index.html                    # Example app (static todo list)
  playwright.demos.config.ts      # Playwright config for demos
  demos/
    scenarios/                    # Human-written .md scenario files
    generated/                    # Generated .spec.ts scripts
    helpers/
      captions.ts                 # On-screen captions, title cards, highlights
      cursor.ts                   # DOM-based visible cursor + click ripple
      pacing.ts                   # Timing constants
      recorder.ts                 # Browser context factory with video recording
    scripts/
      run-demos.mjs               # Interactive demo picker CLI
    output/                       # Recorded .webm files (gitignored)
    style-guide.md
    README.md
```

## Known Limitations

- **No audio** — Playwright recordings are video-only
- **App must be running** — the Playwright config starts `serve app` automatically via `webServer`
- **One video per test** — each `.spec.ts` should contain a single `test()` block
- **Captions are burned in** — they are part of the video frames, not a toggleable subtitle track
