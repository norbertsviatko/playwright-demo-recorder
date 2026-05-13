import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, chromium, type Page } from "@playwright/test";
import { injectCursor } from "./cursor";

const DEMOS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

interface RecorderOptions {
  /** Scenario name — used for output directory and final file naming */
  name: string;
  /** Viewport width (default 1920) */
  width?: number;
  /** Viewport height (default 1080) */
  height?: number;
}

interface RecorderResult {
  context: BrowserContext;
  page: Page;
}

/**
 * Create a configured browser context for demo recording.
 *
 * - 1920x1080 viewport (configurable)
 * - Video recording to demos/output/<name>/
 * - Cursor injection applied
 * - Headed/headless via DEMO_HEADED env var (default headless)
 */
export async function createDemoRecorder(options: RecorderOptions): Promise<RecorderResult> {
  const { name, width = 1920, height = 1080 } = options;
  const headed = process.env.DEMO_HEADED === "true" || process.env.DEMO_HEADED === "1";

  const outputDir = path.join(DEMOS_ROOT, "output", name);

  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({
    viewport: { width, height },
    baseURL: BASE_URL,
    recordVideo: {
      dir: outputDir,
      size: { width, height },
    },
    colorScheme: "light",
  });

  const page = await context.newPage();

  // Inject cursor on every navigation (including SPAs that do client-side routing)
  await page.addInitScript(injectCursor);

  // Stash the name on the context for closeDemoRecorder
  (context as any).__demoName = name;
  (context as any).__demoPage = page;

  return { context, page };
}

/**
 * Cleanly close the recorder so the video file is finalized,
 * then rename the output file from the random hash to `<name>.webm`.
 * If a file with that name already exists, appends `(1)`, `(2)`, etc.
 */
export async function closeDemoRecorder(context: BrowserContext): Promise<void> {
  const name: string = (context as any).__demoName ?? "unnamed";
  const page: Page | undefined = (context as any).__demoPage;

  // Get the video path before closing (only available while page is open)
  const videoPath = page ? await page.video()?.path() : undefined;

  await context.close();

  // Rename the random-hash webm to a human-readable name
  if (videoPath && fs.existsSync(videoPath)) {
    const dir = path.dirname(videoPath);
    let targetName = `${name}.webm`;
    let targetPath = path.join(dir, targetName);

    // Deduplicate if file already exists
    let counter = 1;
    while (fs.existsSync(targetPath)) {
      targetName = `${name} (${counter}).webm`;
      targetPath = path.join(dir, targetName);
      counter++;
    }

    fs.renameSync(videoPath, targetPath);
  }
}
