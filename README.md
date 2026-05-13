# Playwright Demo Recorder

Automated demo video recordings using Playwright and Claude Code.

Write a plain-English scenario, let Claude Code generate a Playwright script, run it, get a polished `.webm` demo video with visible cursor, captions, title cards, and element highlights.

```
Scenario (.md)  ->  Claude Code  ->  Playwright spec (.spec.ts)  ->  Playwright (video)  ->  .webm
   (human)          (generator)       (automated)                    (recording)          (final)
```

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run the example demo (interactive picker)
npm run demo:run

# Or run all demos
npm run demo:run:all

# Watch the browser while recording
DEMO_HEADED=true npm run demo:run
```

The recorded video will appear in `demos/output/example-todo/example-todo.webm`.

## What's Included

- **`app/`** — A minimal static todo app used as the demo target
- **`demos/helpers/`** — Reusable recording infrastructure:
  - `recorder.ts` — Browser context with video recording (1920x1080)
  - `cursor.ts` — Visible DOM cursor with click ripple animation
  - `captions.ts` — On-screen captions, full-screen title cards, element highlights
  - `pacing.ts` — Global timing constants for natural-looking demos
- **`demos/scenarios/`** — Human-written scenario files (plain English + directives)
- **`demos/generated/`** — Claude-generated Playwright specs
- **`demos/scripts/`** — Interactive CLI demo picker
- **`demos/style-guide.md`** — Rules Claude Code follows when generating specs

## Creating Your Own Demo

### 1. Write a scenario

Create `demos/scenarios/my-feature.md`:

```markdown
# My Feature

> TITLE: My Feature | A quick walkthrough

1. Open the app
2. Click on the input

> CAPTION: Adding a new item

3. Type "Hello world"
4. Click the Add button

> HIGHLIGHT: [data-testid="todo-item"] | Item added!

5. Pause on the result
```

### 2. Generate the spec

Ask Claude Code:

> Generate a demo script from `demos/scenarios/my-feature.md` following `demos/style-guide.md`. Output to `demos/generated/my-feature.spec.ts`.

### 3. Run it

```bash
npm run demo:run
```

## Adapting for Your Project

This repo is a self-contained example. To use it in your own project:

1. Copy the `demos/` directory and `playwright.demos.config.ts` into your project
2. Update `playwright.demos.config.ts` to point to your app's URL/port
3. Update `recorder.ts` base URL if needed
4. Remove the `app/` directory and `webServer` config (use your own app)
5. Write scenarios targeting your app's UI
6. Add `data-testid` attributes to your app's key elements

The helpers (`cursor.ts`, `captions.ts`, `pacing.ts`, `recorder.ts`) are **framework-agnostic** — they work with any web app by injecting DOM elements via `page.evaluate()`.

## How It Works

See [demos/README.md](./demos/README.md) for the full system documentation, and [demos/style-guide.md](./demos/style-guide.md) for the code generation rules.

## License

MIT
