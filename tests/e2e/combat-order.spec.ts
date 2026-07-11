import { test, expect } from "@playwright/test";

/**
 * #64: command entry follows classic DRPG order — the front row is commanded
 * first, not the raw party-array order (which started on a back-row caster).
 * With the full six-member debug party, the first actor to receive a command
 * must be a front-row member, never a back-row caster (Mira/Sei/Lio).
 */
test("full-party combat starts command entry on the front row", async ({ page }) => {
  await page.goto("/?debug=1&progress=ready");
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("combat-command-window")).toBeVisible();

  // The party strip renders the front group first, so the first token — the active
  // actor — must be a front-row member (never a back-row caster).
  const firstActor = await page.getByTestId("combat-actor").locator(".pt-name").first().textContent();
  expect(["Rook", "Vale", "Bran"]).toContain((firstActor ?? "").trim());
});
