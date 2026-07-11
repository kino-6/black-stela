import { expect, test } from "@playwright/test";
import { createStarterParty, startNewExpedition, walkB1fMaxEnemyTypes } from "./helpers";

// #66/#77: multi-TYPE encounters must actually appear in play, not just exist in
// code. Walking B1F, at least one fight fields two DISTINCT enemy figures on the
// stage (slime pack + crawler) — the earlier build only ever showed 1 type × n.
test("a real B1F walk hits a multi-type fight (two distinct enemy figures)", async ({ page }) => {
  await startNewExpedition(page);
  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  // Walk into the maze; fights are resolved as they occur and the distinct enemy
  // figures counted before each is cleared.
  const maxTypes = await walkB1fMaxEnemyTypes(page);
  expect(maxTypes).toBeGreaterThanOrEqual(2);
});
