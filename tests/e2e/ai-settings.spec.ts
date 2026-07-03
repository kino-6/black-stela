import { startNewExpedition } from "./helpers";
import { expect, test } from "@playwright/test";

test("keeps the title screen free of explanatory AI copy", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Black Stela" })).toBeVisible();
  await expect(page.locator(".title-mark p")).toHaveCount(0);
  await expect(page.getByText(/local narration|local ai|ローカル描写|ローカルAI|街、隊列|裏側/i)).toHaveCount(0);
});

test("keeps AI and narration controls hidden from players", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByText("AI Settings")).toHaveCount(0);
  await expect(page.getByLabel("Enable AI")).toHaveCount(0);
  await expect(page.getByLabel("Provider")).toHaveCount(0);
  await expect(page.getByLabel("Endpoint")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replay prose" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Narration" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Adventure Log" })).toHaveCount(0);
});
