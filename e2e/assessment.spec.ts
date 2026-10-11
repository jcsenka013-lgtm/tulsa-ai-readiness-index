import { expect, test, type Page } from "@playwright/test";

const UUID = "[0-9a-f-]{36}";

/** Pick the first option of every single-choice group and multi-select on the step. */
async function answerVisibleQuestions(page: Page) {
  for (const group of await page.getByRole("radiogroup").all()) {
    await group.getByRole("radio").first().click();
  }
  for (const set of await page.locator("fieldset").all()) {
    await set.getByRole("checkbox").first().click();
  }
}

async function completeAssessment(page: Page, startPath: string, product: "ai" | "copilot") {
  const assessmentPath = product === "copilot" ? "/copilot/assessment" : "/assessment";
  const resultsPath = product === "copilot" ? "/copilot/results" : "/results";

  await page.goto(startPath);
  await page.waitForURL(new RegExp(`${assessmentPath}/${UUID}$`));
  const id = page.url().split("/").pop()!;

  await page.getByRole("button", { name: "Let's begin" }).click();

  // Firmographics: industry, team size, and repetitive hours are chip groups.
  // The first industry chip is dental, which has an ROI explorer model.
  await expect(page.getByText(/^Step 2 of \d+$/)).toBeVisible();
  for (const group of await page.locator('[role="group"]').all()) {
    await group.getByRole("button").first().click();
  }

  // Domain steps until the contact gate.
  const next = page.getByRole("button", { name: "Next" });
  await next.click();
  while (await page.getByText(/^Step \d+ of \d+$/).isVisible()) {
    if (await page.getByRole("button", { name: "Get My Results" }).isVisible()) break;
    const step = await page.getByText(/^Step \d+ of \d+$/).textContent();
    await answerVisibleQuestions(page);
    await next.click();
    await expect(page.getByText(/^Step \d+ of \d+$/)).not.toHaveText(step!);
  }

  await page.getByLabel("Full name").fill("E2E Tester");
  await page.getByLabel("Business email").fill(`e2e+${product}@tulsa-e2e.test`);
  await page.getByLabel("Company name").fill(`E2E ${product} Dental`);
  await page.getByRole("checkbox").last().click();
  await page.getByRole("button", { name: "Get My Results" }).click();

  await page.waitForURL(new RegExp(`${resultsPath}/${id}`));
  return id;
}

for (const product of ["ai", "copilot"] as const) {
  test(`${product}: completes the assessment and lands on results`, async ({ page, request }) => {
    const id = await completeAssessment(page, product === "copilot" ? "/copilot/assessment" : "/assessment", product);

    await expect(page.getByText(`E2E ${product} Dental`).first()).toBeVisible();
    await expect(page.getByText("ROI estimate (shows the math)")).toBeVisible();
    await expect(page.getByText("Explore your savings by task")).toBeVisible();
    await expect(page.getByText("Likely annual savings")).toBeVisible();

    // Shared results links must not expose the lead's contact details.
    const res = await request.get(`/api/assessment/${id}`);
    expect(res.ok()).toBe(true);
    const row = await res.json();
    expect(row.status).toBe("completed");
    expect(row).not.toHaveProperty("email");
    expect(row).not.toHaveProperty("full_name");
    expect(row).not.toHaveProperty("call_brief");

    // Re-posting complete is idempotent and also hides contact details.
    const again = await request.post(`/api/assessment/${id}/complete`);
    expect(again.ok()).toBe(true);
    const body = await again.json();
    expect(body.assessment).not.toHaveProperty("email");
    expect(body.assessment).not.toHaveProperty("phone");
  });
}

test("old /results links redirect Copilot assessments to the Copilot page", async ({ page }) => {
  const id = await completeAssessment(page, "/copilot/assessment", "copilot");
  await page.goto(`/results/${id}`);
  await page.waitForURL(new RegExp(`/copilot/results/${id}`));
});
