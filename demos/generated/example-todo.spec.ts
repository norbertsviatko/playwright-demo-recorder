/**
 * Generated from: demos/scenarios/example-todo.md
 *
 * A short demo showing basic todo list interactions.
 */

import { test } from "@playwright/test";
import { showCaption, hideCaption, showTitleCard, highlightElement } from "../helpers/captions";
import { clickWithCursor, moveTo } from "../helpers/cursor";
import {
  PAUSE_SHORT,
  PAUSE_MEDIUM,
  PAUSE_LONG,
  TYPING_DELAY,
  CAPTION_READ_SHORT,
  CAPTION_READ_MEDIUM,
  TITLE_CARD_DURATION,
  sleep,
} from "../helpers/pacing";
import { closeDemoRecorder, createDemoRecorder } from "../helpers/recorder";

test("todo app demo", async () => {
  const { context, page } = await createDemoRecorder({ name: "example-todo" });

  // Step: Title card
  await showTitleCard(page, "Todo App", "Adding, completing, and deleting tasks", TITLE_CARD_DURATION);
  await sleep(PAUSE_SHORT);

  // Step: Open the app
  await page.goto("/");
  await sleep(PAUSE_MEDIUM);

  // Step: Pause briefly on the empty state
  await sleep(PAUSE_LONG);

  // Step: Add first task — "Buy groceries"
  await showCaption(page, "Let's add our first task");
  await sleep(CAPTION_READ_SHORT);

  const input = page.locator('[data-testid="todo-input"]');
  const addButton = page.locator('[data-testid="add-button"]');

  await moveTo(page, input);
  await sleep(PAUSE_SHORT);
  await input.pressSequentially("Buy groceries", { delay: TYPING_DELAY });
  await sleep(PAUSE_SHORT);
  await clickWithCursor(page, addButton);
  await hideCaption(page);
  await sleep(PAUSE_SHORT);

  // Step: Add second task — "Walk the dog"
  await showCaption(page, "Adding a second task");
  await sleep(CAPTION_READ_SHORT);

  await moveTo(page, input);
  await sleep(PAUSE_SHORT);
  await input.pressSequentially("Walk the dog", { delay: TYPING_DELAY });
  await sleep(PAUSE_SHORT);
  await clickWithCursor(page, addButton);
  await hideCaption(page);
  await sleep(PAUSE_SHORT);

  // Step: Add third task — "Read a book"
  await showCaption(page, "And a third one");
  await sleep(CAPTION_READ_SHORT);

  await moveTo(page, input);
  await sleep(PAUSE_SHORT);
  await input.pressSequentially("Read a book", { delay: TYPING_DELAY });
  await sleep(PAUSE_SHORT);
  await clickWithCursor(page, addButton);
  await hideCaption(page);
  await sleep(PAUSE_MEDIUM);

  // Step: Complete "Buy groceries"
  await showCaption(page, "Three tasks added \u2014 let\u2019s complete one");
  await sleep(CAPTION_READ_MEDIUM);

  const firstCheckbox = page.locator('[data-testid="todo-checkbox"]').first();
  await clickWithCursor(page, firstCheckbox);
  await sleep(PAUSE_LONG);
  await hideCaption(page);

  // Step: Highlight the counter
  const highlight = await highlightElement(page, '[data-testid="counter"]', "2 remaining");
  await sleep(PAUSE_LONG);
  await highlight.clear();

  // Step: Delete "Buy groceries"
  await showCaption(page, "Now let\u2019s remove the completed task");
  await sleep(CAPTION_READ_SHORT);

  const firstDeleteButton = page.locator('[data-testid="todo-delete"]').first();
  await clickWithCursor(page, firstDeleteButton);
  await hideCaption(page);
  await sleep(PAUSE_MEDIUM);

  // Step: Final pause
  await showCaption(page, "Clean and simple!");
  await sleep(CAPTION_READ_SHORT);
  await hideCaption(page);

  await sleep(PAUSE_LONG);
  await closeDemoRecorder(context);
});
