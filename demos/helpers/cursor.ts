/**
 * Injects a visible DOM-based cursor into the page.
 * Works in both headed and headless mode since it's pure DOM/CSS.
 *
 * Call via `page.addInitScript(injectCursor)` BEFORE navigating.
 * Defers to DOMContentLoaded so document.body is guaranteed to exist.
 *
 * Exposes `window.__moveCursor(x, y)` for explicit positioning from test code,
 * since Playwright's CDP mouse events may not reliably fire DOM mousemove events
 * in the recorded video.
 */
export function injectCursor() {
  function init() {
    // Avoid double-injection
    if (document.getElementById("__demo-cursor")) return;

    const cursor = document.createElement("div");
    cursor.id = "__demo-cursor";
    Object.assign(cursor.style, {
      position: "fixed",
      top: "0px",
      left: "0px",
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      background: "rgba(59, 130, 246, 0.5)",
      border: "2px solid rgba(59, 130, 246, 0.8)",
      boxShadow: "0 0 8px rgba(59, 130, 246, 0.3)",
      pointerEvents: "none",
      zIndex: "2147483647",
      transform: "translate(-50%, -50%)",
      transition: "opacity 0.15s ease",
      opacity: "0",
    });
    document.body.appendChild(cursor);

    // CSS for click ripple animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes __demo-ripple {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
      .__demo-click-ripple {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(59, 130, 246, 0.6);
        pointer-events: none;
        z-index: 2147483646;
        animation: __demo-ripple 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);

    let lastX = 0;
    let lastY = 0;

    // Fallback: listen for real DOM mousemove events
    document.addEventListener(
      "mousemove",
      (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursor.style.opacity = "1";
      },
      true
    );

    document.addEventListener(
      "mousedown",
      () => {
        const ripple = document.createElement("div");
        ripple.className = "__demo-click-ripple";
        ripple.style.left = `${lastX}px`;
        ripple.style.top = `${lastY}px`;
        document.body.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      },
      true
    );

    // Explicit positioning API — called from test code via page.evaluate
    (window as any).__moveCursor = (x: number, y: number) => {
      lastX = x;
      lastY = y;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      cursor.style.opacity = "1";
    };

    (window as any).__clickRipple = (x: number, y: number) => {
      const ripple = document.createElement("div");
      ripple.className = "__demo-click-ripple";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    };

    (window as any).__getCursorPos = () => ({ x: lastX, y: lastY });
  }

  // addInitScript runs before DOM is ready — defer until body exists
  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
}

// ---------------------------------------------------------------------------
// Helpers used from test code
// ---------------------------------------------------------------------------

type Page = import("@playwright/test").Page;
type Locator = import("@playwright/test").Locator;

/** Dwell time: cursor rests on target before clicking (ms) */
const CLICK_DWELL = 350;

/**
 * Move the visible cursor to a locator's center, with smooth Playwright mouse movement.
 * If the element is off-screen, smooth-scrolls it into view first while hiding the cursor
 * to avoid the "cursor sits in empty space while page scrolls" glitch.
 */
export async function moveTo(page: Page, locator: Locator) {
  // Check if element needs scrolling into view
  const needsScroll = await locator
    .evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const margin = 120;
      return rect.top < margin || rect.bottom > window.innerHeight - margin;
    })
    .catch(() => false);

  if (needsScroll) {
    // Hide cursor during scroll so it doesn't sit in empty space
    await page.evaluate(() => {
      const cursor = document.getElementById("__demo-cursor");
      if (cursor) cursor.style.opacity = "0";
    });

    await locator.evaluate((el) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    await page.waitForTimeout(500);
  }

  const box = await locator.boundingBox();
  if (!box) return;

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  if (needsScroll) {
    // After scroll, place cursor directly at target (no travel animation from old pos)
    await page.evaluate(
      ({ px, py }) => {
        const fn = (window as any).__moveCursor;
        if (fn) fn(px, py);
      },
      { px: x, py: y }
    );
    await page.mouse.move(x, y);
  } else {
    // Normal smooth cursor travel
    await page.mouse.move(x, y, { steps: 15 });
    await page.evaluate(
      ({ px, py }) => {
        const fn = (window as any).__moveCursor;
        if (fn) fn(px, py);
      },
      { px: x, py: y }
    );
  }
}

/**
 * Click a locator with visible cursor movement, a short dwell, and click ripple.
 */
export async function clickWithCursor(page: Page, locator: Locator) {
  await moveTo(page, locator);

  // Dwell — let the viewer see where the cursor landed before clicking
  await page.waitForTimeout(CLICK_DWELL);

  const box = await locator.boundingBox();
  if (box) {
    await page.evaluate(
      ({ px, py }) => {
        const fn = (window as any).__clickRipple;
        if (fn) fn(px, py);
      },
      { px: box.x + box.width / 2, py: box.y + box.height / 2 }
    );
  }
  await locator.click();
}

/**
 * Smooth scroll with cursor drag animation.
 *
 * Moves the cursor to the center of the viewport, then animates it
 * vertically in the scroll direction while dispatching incremental
 * wheel events — giving the appearance of a natural scroll gesture.
 *
 * @param deltaY  Total pixels to scroll (positive = down, negative = up)
 * @param durationMs  How long the scroll animation takes (default 800ms)
 */
export async function smoothScroll(page: Page, deltaY: number, durationMs = 800) {
  const viewport = page.viewportSize() ?? { width: 1920, height: 1080 };

  // Get current cursor position, or default to center
  const startPos: { x: number; y: number } = (await page.evaluate(() => {
    const fn = (window as any).__getCursorPos;
    return fn ? fn() : null;
  })) ?? { x: viewport.width / 2, y: viewport.height / 2 };

  // Cursor travel: move ~80px in scroll direction (clamped to viewport)
  const cursorTravel = Math.min(80, Math.abs(deltaY) * 0.25) * Math.sign(deltaY);
  const endY = Math.max(100, Math.min(viewport.height - 100, startPos.y + cursorTravel));

  const steps = 20;
  const stepDelay = durationMs / steps;
  const scrollPerStep = deltaY / steps;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Ease-in-out for natural feel
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

    // Animate cursor position
    const cy = startPos.y + (endY - startPos.y) * ease;
    await page.evaluate(
      ({ px, py }) => {
        const fn = (window as any).__moveCursor;
        if (fn) fn(px, py);
      },
      { px: startPos.x, py: cy }
    );

    // Dispatch incremental scroll
    await page.mouse.wheel(0, scrollPerStep);
    await page.waitForTimeout(stepDelay);
  }
}
