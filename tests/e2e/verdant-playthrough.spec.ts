import { expect, test } from "@playwright/test";
import { createStarterParty, resolveVisibleCombat } from "./helpers";

// An actual browser playthrough of the verdant scenario (not a headless sim): pick it,
// make a party, walk the living maze in the real first-person view (right-hand rule,
// reading the front-wall the renderer exposes) until a fight fires, beat a verdant foe
// through the real combat UI, and confirm we're back exploring.
test("play verdant: enter the sunken maze, fight a verdant foe, return to exploring", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();
  await page.getByTestId("scenario-card-verdant").click();
  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  const canvas = page.getByTestId("dungeon-canvas");
  await expect(canvas.locator("canvas")).toBeVisible();
  await expect(canvas).toHaveAttribute("data-return-visual", "asset");
  await expect(page.locator("#location-heading")).toHaveText("Sunken Threshold");
  await canvas.click(); // focus the play area for WASD
  await page.screenshot({ path: "test-results/screenshot-review/verdant-dungeon.png" });

  const inCombat = () => page.getByLabel("Battle screen").isVisible().catch(() => false);
  const frontOpen = async () =>
    (await canvas.getAttribute("data-front-traversable").catch(() => "false")) === "true";
  const press = async (k: string) => { await page.keyboard.press(k); await page.waitForTimeout(45); };

  // Right-hand wall-follower: turn right and go if you can, else straight, else left,
  // else back. Guarantees the maze is explored, so a chamber fight eventually fires.
  let fought = false;
  for (let step = 0; step < 90 && !fought; step += 1) {
    if (await inCombat()) { fought = true; break; }
    await press("d"); // face right
    if (await frontOpen()) { await press("w"); }
    else {
      await press("a"); // back to straight
      if (await frontOpen()) { await press("w"); }
      else {
        await press("a"); // face left
        if (await frontOpen()) { await press("w"); }
        else { await press("a"); await press("w"); } // turn around and go
      }
    }
    if (await inCombat()) { fought = true; }
  }
  expect(fought, "should have wandered into a verdant fight").toBe(true);

  // A verdant Act-I foe is on the battlefield (proof it's verdant content, not default).
  await expect(page.getByText(/Moss Mite|Spore Gnat/).first()).toBeVisible();
  await expect(page.getByText("Ash Slime")).toHaveCount(0);
  await page.screenshot({ path: "test-results/screenshot-review/verdant-combat.png" });

  // Win through the real combat UI, then confirm we're back in the dungeon.
  await resolveVisibleCombat(page);
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
});
