const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const checks = [];
  try {
    for (const scheme of ["light", "dark"]) {
      const context = await browser.newContext({
        colorScheme: scheme,
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:3001");
      const theme = () => page.locator("html").getAttribute("data-theme");
      assert.equal(await theme(), scheme);
      await page.emulateMedia({
        colorScheme: scheme === "light" ? "dark" : "light",
      });
      await page.waitForFunction(
        (t) => document.documentElement.dataset.theme === t,
        scheme === "light" ? "dark" : "light",
      );
      const toggle = page.getByRole("button", {
        name: "Тёмная тема",
        exact: true,
      });
      await toggle.focus();
      await page.keyboard.press("Enter");
      assert.equal(await theme(), scheme);
      await page.reload();
      assert.equal(await theme(), scheme);
      await page.emulateMedia({
        colorScheme: scheme === "light" ? "dark" : "light",
      });
      assert.equal(await theme(), scheme);
      if (scheme === "dark") {
        await page.screenshot({
          path: path.resolve("test-results/theme-dark-catalog.png"),
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Выбрать столик" })
          .first()
          .click();
        const dialog = page.getByRole("dialog");
        assert.equal(
          await dialog
            .getByLabel("Ваше имя")
            .evaluate((el) => getComputedStyle(el).backgroundColor),
          "rgb(27, 43, 36)",
        );
        await dialog
          .getByRole("button", { name: "№ 1 3 мест Свободен", exact: true })
          .click();
        await dialog.getByLabel("Ваше имя").fill("Тестовый Гость");
        await dialog.getByLabel("Телефон").fill("+7 900 000-00-00");
        await dialog.screenshot({
          path: path.resolve("test-results/theme-dark-form.png"),
        });
        await dialog
          .getByRole("button", { name: "Сохранить демобронь" })
          .click();
        await dialog.locator(".notice_success").waitFor();
        await dialog.getByRole("link", { name: "Мои бронирования" }).click();
        await page
          .getByRole("heading", { name: "Мои бронирования", exact: true })
          .waitFor();
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.screenshot({
          path: path.resolve("test-results/theme-dark-mobile.png"),
          fullPage: true,
        });
      }
      checks.push(
        `${scheme}: system preference, live system change, keyboard toggle, persistence, explicit override PASS`,
      );
      await context.close();
    }
    const context = await browser.newContext({ colorScheme: "light" });
    await context.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Blocked", "SecurityError");
      };
      Storage.prototype.getItem = () => {
        throw new DOMException("Blocked", "SecurityError");
      };
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3001");
    await page
      .getByRole("button", { name: "Тёмная тема", exact: true })
      .click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    checks.push(
      "Unavailable storage: toggle works PASS; dark booking and mobile overflow PASS",
    );
    fs.writeFileSync(
      "test-results/theme-report.json",
      JSON.stringify(
        {
          browser: browser.version(),
          checkedAt: new Date().toISOString(),
          checks,
        },
        null,
        2,
      ),
    );
    console.log(checks.join("\n"));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
