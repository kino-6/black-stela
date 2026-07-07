import { test, expect } from "@playwright/test";
import { startNewExpedition, createStarterParty } from "./helpers";

/**
 * DRPG fixed dungeon frame: on a desktop viewport the exploration screen is a
 * single, non-scrolling frame — a large first-person scene, a rail holding the
 * minimap plus the full six-member front/back formation, a short message band,
 * and a fixed command window — and the party is driven by the keyboard.
 */
async function enterDungeon(page: import("@playwright/test").Page) {
  await startNewExpedition(page);
  await createStarterParty(page);
  await page.getByRole("button", { name: "Dungeon Entry" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByTestId("dungeon-canvas").waitFor();
}

test("dungeon frame shows scene, minimap, six-member formation, and a fixed command window at once", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterDungeon(page);

  // All the fixed regions are visible simultaneously (single-screen frame).
  await expect(page.getByTestId("dungeon-canvas")).toBeVisible();
  await expect(page.getByTestId("minimap")).toBeVisible();
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();

  // Six-member formation, front and back rows both present.
  await expect(page.getByTestId("party-front-row").getByTestId("party-token")).toHaveCount(3);
  await expect(page.getByTestId("party-back-row").getByTestId("party-token")).toHaveCount(3);
  for (const token of await page.getByTestId("party-token").all()) {
    await expect(token).toBeVisible();
  }

  // The page itself does not scroll — the frame fits the viewport.
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return { scrollH: el.scrollHeight, clientH: el.clientHeight };
  });
  expect(overflow.scrollH).toBeLessThanOrEqual(overflow.clientH + 1);
});

test("dungeon party is driven by the keyboard (controller-first movement)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Past the first fight and facing east down an open corridor, so forward walks
  // room-to-room instead of triggering the teaching encounter.
  await page.goto("/?debug=1&progress=after_encounter");
  await page.getByTestId("dungeon-canvas").waitFor();

  const roomBefore = await page.getByTestId("map-current").textContent();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("map-current")).not.toHaveText(roomBefore ?? "");
});
