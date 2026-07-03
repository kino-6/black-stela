import { expect, test } from "@playwright/test";

test("shows AI off by default and validates endpoint input", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "AI Settings" })).toBeVisible();
  await expect(page.getByLabel("Enable AI")).not.toBeChecked();
  await expect(page.getByText("AI off")).toBeVisible();

  await page.getByLabel("Provider").selectOption("openai-compatible");
  await page.getByLabel("Endpoint").fill("not a url");
  await page.getByLabel("Endpoint").blur();

  await expect(page.getByText("Invalid endpoint URL.")).toBeVisible();

  await page.getByLabel("Endpoint").fill("http://127.0.0.1:8080/v1/chat/completions");
  await page.getByLabel("Endpoint").blur();
  await page.getByLabel("Model").fill("local-model");

  await expect(page.getByText("AI settings updated.")).toBeVisible();
});

test("keeps AI-off proposal separate from the canonical log", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Replay prose" }).click();

  await expect(page.getByRole("heading", { name: "AI Proposal" })).toBeVisible();
  await expect(page.getByText("AI narration is disabled.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Adventure Log" })).toBeVisible();
});

test("shows guard rejection for unsafe provider proposals", async ({ page }) => {
  await page.route("http://127.0.0.1:11434/api/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ response: 'Mira says "I decide to open the door."' })
    });
  });

  await page.goto("/");
  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await page.getByLabel("Enable AI").check();
  await page.getByLabel("Provider").selectOption("ollama");
  await page.getByRole("button", { name: "Replay prose" }).click();

  await expect(page.getByText("AI narration attempted to speak for or act as a player character.")).toBeVisible();
  await expect(page.getByText("Rejected")).toBeVisible();
});
