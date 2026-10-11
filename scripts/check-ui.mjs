import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3000';
await mkdir("docs/evidence", { recursive: true });
const results = [];
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/login`);
    await page.getByRole("button", { name: "Вход", exact: true }).waitFor();
    await page.screenshot({
      path: `docs/evidence/login-${width}.png`,
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow || errors.length)
      throw new Error(`Layout/runtime failed at ${width}`);
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement?.id);
    if (first !== "email")
      throw new Error(
        `Expected first field focus after route main, got ${first}`,
      );
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    if ((await page.locator("#email").getAttribute("aria-invalid")) !== "true")
      throw new Error("Keyboard submit validation failed");
    await page.locator("#password").fill("synthetic-only");
    await page.locator("#password").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    if ((await page.locator("#password").getAttribute("type")) !== "text")
      throw new Error("Space reveal failed");
    await page.getByRole("link", { name: "Забравена парола?" }).click();
    await page.screenshot({
      path: `docs/evidence/forgot-${width}.png`,
      fullPage: true,
    });
    await page.goto(`${base}/reset-password`);
    await page
      .getByRole("heading", { name: "Линкът липсва или е повреден" })
      .waitFor();
    await page.screenshot({
      path: `docs/evidence/missing-${width}.png`,
      fullPage: true,
    });
    results.push({
      width,
      overflow,
      consoleErrors: errors,
      keyboard: "Tab/Shift+Tab/Enter/Space passed",
      routes: ["login", "forgot", "missing reset"],
    });
    await page.close();
  }
  await writeFile(
    "docs/evidence/browser-checks.json",
    JSON.stringify(
      {
        kind: "real Chromium UI checks; no API simulation or live auth",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
