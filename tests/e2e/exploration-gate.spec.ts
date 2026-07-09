import { expect, test } from "@playwright/test";
import { createStarterParty, resolveVisibleCombat, startNewExpedition } from "./helpers";

// Real-UI proof of the #2 exploration gate: a straight-line dash to the B1F stair
// (no crank, no lap) is refused — the "Use stairs" button is replaced by the gate's
// clue, and the party cannot descend. Guards against the exact "beeline / one-member
// clear" the redesign set out to kill.
test("a beeline to the B1F stair is refused with a clue, not a dead button", async ({ page }) => {
  test.setTimeout(90000);
  await startNewExpedition(page);
  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  const cur = async () => ((await page.getByTestId("map-current").textContent().catch(() => "")) ?? "").trim();
  const cov = async () => Number(((await page.getByTestId("floor-coverage").textContent().catch(() => "")) ?? "").match(/(\d+)/)?.[1] ?? "-1");
  const move = async () => {
    await page.getByRole("button", { name: "Move", exact: true }).click().catch(() => {});
    await page.waitForTimeout(55);
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) await resolveVisibleCombat(page);
  };

  for (let i = 0; i < 20 && !(await cur()).includes("Winding Stair"); i += 1) await move();
  await expect(page.getByRole("heading", { name: "Winding Stair" })).toBeVisible();

  // A beeline covers only a fraction of the floor — well under the 80% gate.
  expect(await cov()).toBeLessThan(80);

  // The descent is refused: the clue shows in place of a usable stair button.
  await expect(page.getByTestId("descent-locked")).toBeVisible();
  await expect(page.getByRole("button", { name: "Use stairs" })).toHaveCount(0);

  await page.screenshot({
    path: "/private/tmp/claude-501/-Users-kinoshitayuki-work-black-stela/087b3756-015e-46d4-800e-7226ed401f6d/scratchpad/descent-locked.png"
  });

  // Confirm the party is still on B1F (pressing forward into the stair does nothing).
  await move();
  await expect(page.getByTestId("map-current")).not.toContainText("Split Dust");
});
