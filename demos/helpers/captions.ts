/**
 * On-screen captions, title cards, and element highlights for demo recordings.
 *
 * All overlays are injected via page.evaluate with inline styles — no dependency
 * on app CSS. A single root container (`#__demo_overlay_root__`) holds every
 * overlay so cleanup is reliable.
 *
 * z-index 999999 — high enough to sit above app modals but below the cursor
 * (which uses 2147483647).
 */

type Page = import("@playwright/test").Page;

// ---------------------------------------------------------------------------
// Caption positions
// ---------------------------------------------------------------------------

export type CaptionPosition =
  | "bottom"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type CaptionVariant = "caption" | "title" | "step";

export interface ShowCaptionOptions {
  /** Where to anchor the caption (default "bottom") */
  position?: CaptionPosition;
  /** Auto-hide after this many ms. If omitted, stays until hideCaption / next showCaption. */
  duration?: number;
  /** Visual variant (default "caption") */
  variant?: CaptionVariant;
}

// ---------------------------------------------------------------------------
// Overlay root bootstrap (idempotent)
// ---------------------------------------------------------------------------

const OVERLAY_ROOT_ID = "__demo_overlay_root__";

async function ensureOverlayRoot(page: Page): Promise<void> {
  await page.evaluate((rootId) => {
    const existing = document.getElementById(rootId);
    // Re-create if missing (e.g. SPA navigation removed it)
    if (existing && document.body.contains(existing)) return;
    if (existing) existing.remove();
    const root = document.createElement("div");
    root.id = rootId;
    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "999999",
      fontFamily: "system-ui, -apple-system, sans-serif",
    });
    document.body.appendChild(root);
  }, OVERLAY_ROOT_ID);
}

// ---------------------------------------------------------------------------
// showCaption
// ---------------------------------------------------------------------------

/**
 * Show a caption overlay. Replaces any existing caption.
 *
 * @param page     Playwright page
 * @param text     Caption text
 * @param options  Position, duration, variant
 */
export async function showCaption(
  page: Page,
  text: string,
  options: ShowCaptionOptions = {}
): Promise<void> {
  const { position = "bottom", duration, variant = "caption" } = options;
  await ensureOverlayRoot(page);

  await page.evaluate(
    ({ rootId, text, position, variant, duration }) => {
      const root = document.getElementById(rootId);
      if (!root) return;

      // Remove previous caption (instant, no fade — the new one fades in)
      const prev = root.querySelector("[data-demo-caption]") as HTMLElement | null;
      if (prev) prev.remove();

      const el = document.createElement("div");
      el.setAttribute("data-demo-caption", "true");

      // --- Position ---
      const posStyles: Record<string, Record<string, string>> = {
        bottom: { bottom: "48px", left: "50%", transform: "translateX(-50%)" },
        top: { top: "48px", left: "50%", transform: "translateX(-50%)" },
        "top-left": { top: "48px", left: "48px", transform: "none" },
        "top-right": { top: "48px", right: "48px", transform: "none" },
        "bottom-left": { bottom: "48px", left: "48px", transform: "none" },
        "bottom-right": { bottom: "48px", right: "48px", transform: "none" },
      };

      // --- Variant styles ---
      const variantStyles: Record<string, Record<string, string>> = {
        caption: {
          fontSize: "28px",
          fontWeight: "600",
          padding: "18px 36px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.92), rgba(99, 60, 255, 0.92))",
          color: "#fff",
          boxShadow: "0 6px 32px rgba(59, 130, 246, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)",
          maxWidth: "860px",
          lineHeight: "1.4",
          textAlign: "center",
          letterSpacing: "-0.01em",
        },
        step: {
          fontSize: "14px",
          fontWeight: "600",
          padding: "6px 14px",
          borderRadius: "8px",
          background: "rgba(59, 130, 246, 0.85)",
          color: "#fff",
          boxShadow: "0 2px 12px rgba(59, 130, 246, 0.3)",
          maxWidth: "400px",
          lineHeight: "1.3",
          textAlign: "center",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        },
        title: {
          // Title variant via showCaption is lightweight — use showTitleCard for full-screen
          fontSize: "36px",
          fontWeight: "700",
          padding: "20px 40px",
          borderRadius: "16px",
          background: "rgba(0, 0, 0, 0.8)",
          color: "#fff",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4)",
          maxWidth: "900px",
          lineHeight: "1.3",
          textAlign: "center",
        },
      };

      Object.assign(el.style, {
        position: "fixed",
        ...posStyles[position],
        ...variantStyles[variant],
        opacity: "0",
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
        whiteSpace: "pre-line",
      });

      el.textContent = text;
      root.appendChild(el);

      // Fade in on next frame
      requestAnimationFrame(() => {
        el.style.opacity = "1";
      });

      // Auto-hide
      if (duration != null && duration > 0) {
        setTimeout(() => {
          el.style.opacity = "0";
          setTimeout(() => el.remove(), 350);
        }, duration);
      }
    },
    { rootId: OVERLAY_ROOT_ID, text, position, variant, duration }
  );
}

// ---------------------------------------------------------------------------
// hideCaption
// ---------------------------------------------------------------------------

/**
 * Fade out and remove the current caption.
 */
export async function hideCaption(page: Page): Promise<void> {
  await page.evaluate((rootId) => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const el = root.querySelector("[data-demo-caption]") as HTMLElement | null;
    if (!el) return;
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 350);
  }, OVERLAY_ROOT_ID);

  // Wait for the fade-out transition
  await page.waitForTimeout(350);
}

// ---------------------------------------------------------------------------
// showTitleCard
// ---------------------------------------------------------------------------

/**
 * Full-screen title card with dark backdrop, large centered text, and optional subtitle.
 * Fades in, holds for `durationMs`, then fades out. Returns after the full sequence.
 */
export async function showTitleCard(
  page: Page,
  title: string,
  subtitle?: string,
  durationMs = 3000
): Promise<void> {
  // Small delay so the page is stable before injecting the overlay
  await page.waitForTimeout(300);
  await ensureOverlayRoot(page);

  await page.evaluate(
    ({ rootId, title, subtitle }) => {
      const root = document.getElementById(rootId);
      if (!root) return;

      // Remove any existing title card
      const prev = root.querySelector("[data-demo-title-card]") as HTMLElement | null;
      if (prev) prev.remove();

      const backdrop = document.createElement("div");
      backdrop.setAttribute("data-demo-title-card", "true");
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.85)",
        opacity: "0",
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
        gap: "16px",
      });

      const h = document.createElement("div");
      Object.assign(h.style, {
        fontSize: "48px",
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        lineHeight: "1.2",
        maxWidth: "900px",
        padding: "0 40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      });
      h.textContent = title;
      backdrop.appendChild(h);

      if (subtitle) {
        const sub = document.createElement("div");
        Object.assign(sub.style, {
          fontSize: "24px",
          fontWeight: "400",
          color: "rgba(255, 255, 255, 0.7)",
          textAlign: "center",
          lineHeight: "1.4",
          maxWidth: "700px",
          padding: "0 40px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        });
        sub.textContent = subtitle;
        backdrop.appendChild(sub);
      }

      root.appendChild(backdrop);
      requestAnimationFrame(() => {
        backdrop.style.opacity = "1";
      });
    },
    { rootId: OVERLAY_ROOT_ID, title, subtitle }
  );

  // Wait for fade-in + hold
  await page.waitForTimeout(400 + durationMs);

  // Fade out
  await page.evaluate((rootId) => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const card = root.querySelector("[data-demo-title-card]") as HTMLElement | null;
    if (card) card.style.opacity = "0";
  }, OVERLAY_ROOT_ID);

  // Wait for fade-out, then remove
  await page.waitForTimeout(400);

  await page.evaluate((rootId) => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const card = root.querySelector("[data-demo-title-card]") as HTMLElement | null;
    if (card) card.remove();
  }, OVERLAY_ROOT_ID);
}

// ---------------------------------------------------------------------------
// highlightElement
// ---------------------------------------------------------------------------

export interface HighlightHandle {
  /** Remove the highlight overlay */
  clear: () => Promise<void>;
}

/**
 * Draw a pulsing glow border around a target element, optionally with a caption.
 * Returns a handle to clear the highlight when done.
 *
 * @param page         Playwright page
 * @param selector     CSS selector for the target element
 * @param captionText  Optional label shown near the highlight
 */
export async function highlightElement(
  page: Page,
  selector: string,
  captionText?: string
): Promise<HighlightHandle> {
  await ensureOverlayRoot(page);

  const id = `__demo_highlight_${Date.now()}`;

  await page.evaluate(
    ({ rootId, selector, captionText, id }) => {
      const root = document.getElementById(rootId);
      const target = document.querySelector(selector);
      if (!root || !target) return;

      const rect = target.getBoundingClientRect();

      // Inject keyframes if not already present
      if (!document.getElementById("__demo_highlight_keyframes")) {
        const style = document.createElement("style");
        style.id = "__demo_highlight_keyframes";
        style.textContent = `
          @keyframes __demo-highlight-pulse {
            0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.5); }
          }
        `;
        document.head.appendChild(style);
      }

      const wrapper = document.createElement("div");
      wrapper.id = id;
      wrapper.setAttribute("data-demo-highlight", "true");
      Object.assign(wrapper.style, {
        position: "fixed",
        top: `${rect.top - 4}px`,
        left: `${rect.left - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
        borderRadius: "8px",
        animation: "__demo-highlight-pulse 1.5s ease-in-out infinite",
        opacity: "0",
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      });

      root.appendChild(wrapper);

      if (captionText) {
        const label = document.createElement("div");
        Object.assign(label.style, {
          position: "fixed",
          top: `${rect.bottom + 12}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
          fontSize: "18px",
          fontWeight: "500",
          padding: "8px 18px",
          borderRadius: "8px",
          background: "rgba(0, 0, 0, 0.75)",
          color: "#fff",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: "0",
          transition: "opacity 0.3s ease",
          fontFamily: "system-ui, -apple-system, sans-serif",
        });
        label.textContent = captionText;
        label.setAttribute("data-demo-highlight-label", id);
        root.appendChild(label);

        requestAnimationFrame(() => {
          label.style.opacity = "1";
        });
      }

      requestAnimationFrame(() => {
        wrapper.style.opacity = "1";
      });
    },
    { rootId: OVERLAY_ROOT_ID, selector, captionText, id }
  );

  return {
    clear: async () => {
      await page.evaluate(
        ({ rootId, id }) => {
          const root = document.getElementById(rootId);
          if (!root) return;
          const wrapper = root.querySelector(`#${id}`) as HTMLElement | null;
          const label = root.querySelector(
            `[data-demo-highlight-label="${id}"]`
          ) as HTMLElement | null;
          if (wrapper) {
            wrapper.style.opacity = "0";
            setTimeout(() => wrapper.remove(), 350);
          }
          if (label) {
            label.style.opacity = "0";
            setTimeout(() => label.remove(), 350);
          }
        },
        { rootId: OVERLAY_ROOT_ID, id }
      );
      await page.waitForTimeout(350);
    },
  };
}

// ---------------------------------------------------------------------------
// Utility: caption read time
// ---------------------------------------------------------------------------

/**
 * Calculate an appropriate read duration for a caption based on word count.
 * Rule of thumb: ~250ms per word, minimum 1500ms.
 *
 * Returns one of the standard CAPTION_READ_* bucket values so timing stays
 * consistent across demos.
 */
export function captionReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  if (words <= 7) return 2000; // CAPTION_READ_SHORT
  if (words <= 15) return 3500; // CAPTION_READ_MEDIUM
  return 5000; // CAPTION_READ_LONG
}
