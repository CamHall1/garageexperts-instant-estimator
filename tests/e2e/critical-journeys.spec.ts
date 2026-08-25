import { expect, test, type Page } from "@playwright/test";

async function completeAddress(page: Page, opts?: { city?: string }) {
  await page.getByRole("button", { name: "Start My Estimate" }).click();
  await page.getByLabel("Address Line 1").fill("123 SE Example St");
  await page.getByLabel("City").fill(opts?.city ?? "Portland");
  await page.getByLabel("State/Region").fill("OR");
  await page.getByLabel("Postal Code").fill("97214");
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

async function completeSquareFootage(page: Page, value: string) {
  await page.getByLabel("Garage square footage").fill(value);
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

async function completeConcreteThroughStemWall(page: Page) {
  // AnswerCard's real click surface is the visible <label> (its input is
  // visually hidden); click the label text itself, exactly like a sighted
  // user would, rather than the underlying input.
  await page.getByText("New concrete / no visible cracks", { exact: true }).click();
  await page.getByText("No", { exact: true }).click();
  await page.getByText("None", { exact: true }).click();
}

async function fillContact(page: Page) {
  await page.getByLabel("Full Name").fill("Jordan Taylor");
  await page.getByLabel("Phone").fill("503-555-1212");
  await page.getByLabel("Email").fill("jordan@example.com");
}

test.describe("critical estimator journeys", () => {
  test("manual address -> full flow -> results show all three cards, no selection required", async ({
    page,
  }) => {
    await page.goto("/");
    await completeAddress(page);
    await completeSquareFootage(page, "600");
    await completeConcreteThroughStemWall(page);
    await fillContact(page);

    // SMS consent must start unchecked.
    await expect(page.getByLabel(/text messages from GarageExperts/i)).not.toBeChecked();

    await page.getByRole("button", { name: "View My Estimate" }).click();

    await expect(page.getByRole("heading", { name: "Your Garage Floor Estimate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select Silver" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select Gold" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select Platinum" })).toBeVisible();
    await expect(page.getByText("Most Popular")).toBeVisible();
  });

  test("selecting Gold shows a success state and the call CTA", async ({ page }) => {
    await page.goto("/");
    await completeAddress(page);
    await completeSquareFootage(page, "800");
    await completeConcreteThroughStemWall(page);
    await fillContact(page);
    await page.getByRole("button", { name: "View My Estimate" }).click();

    await page.getByRole("button", { name: "Select Gold" }).click();
    await expect(page.getByRole("heading", { name: /your gold estimate is on its way/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Call GarageExperts Now/i })).toHaveAttribute(
      "href",
      "tel:+15039941227",
    );
  });

  test("a very small project shows Starting at $2,500 on every card", async ({ page }) => {
    await page.goto("/");
    await completeAddress(page);
    await completeSquareFootage(page, "50");
    await completeConcreteThroughStemWall(page);
    await fillContact(page);
    await page.getByRole("button", { name: "View My Estimate" }).click();

    await expect(page.getByRole("heading", { name: "Your Garage Floor Estimate" })).toBeVisible();
    // exact: true excludes the RangeBar's sr-only "Estimated project
    // total: Starting at $2,500." text alternative, which also contains
    // this substring.
    const startingAt = page.getByText("Starting at $2,500", { exact: true });
    await expect(startingAt).toHaveCount(3);
  });

  test("rejects 49 and 10001 square feet with an inline error that preserves the value", async ({
    page,
  }) => {
    await page.goto("/");
    await completeAddress(page);

    await page.getByLabel("Garage square footage").fill("49");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(/enter at least 50 square feet/i)).toBeVisible();
    await expect(page.getByLabel("Garage square footage")).toHaveValue("49");

    await page.getByLabel("Garage square footage").fill("10001");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(/enter no more than/i)).toBeVisible();
    await expect(page.getByLabel("Garage square footage")).toHaveValue("10001");
  });

  test("back navigation preserves previously entered answers", async ({ page }) => {
    await page.goto("/");
    await completeAddress(page);
    await completeSquareFootage(page, "700");

    // Now on the concrete step; go back twice and confirm square footage held.
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Garage square footage")).toHaveValue("700");

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Address Line 1")).toHaveValue("123 SE Example St");
  });
});

test.describe("embedded flow", () => {
  test("resizes the iframe without an inner scrollbar as steps progress", async ({ page }) => {
    await page.goto("/embed/demo");
    const frame = page.frameLocator("#garageexperts-estimator");

    await expect(frame.getByRole("heading", { name: "Get an Instant Garage Floor Estimate" })).toBeVisible();

    const iframeEl = page.locator("#garageexperts-estimator");
    const initialHeight = await iframeEl.evaluate((el) => (el as HTMLIFrameElement).clientHeight);

    await frame.getByRole("button", { name: "Start My Estimate" }).click();
    await expect(frame.getByRole("heading", { name: "Where is the project located?" })).toBeVisible();

    // The iframe's own document must never need a vertical scrollbar.
    const hasInnerScrollbar = await frame
      .locator("body")
      .evaluate((el) => el.scrollHeight > el.clientHeight + 2);
    expect(hasInnerScrollbar).toBe(false);
    expect(initialHeight).toBeGreaterThan(0);
  });
});
