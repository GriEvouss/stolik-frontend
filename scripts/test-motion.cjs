const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const out = path.resolve(__dirname, "../test-results");
  try {
    const report = {
      browser: browser.version(),
      checks: [],
      checkedAt: new Date().toISOString(),
    };
    for (const preference of ["no-preference", "reduce"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
        locale: "ru-RU",
        reducedMotion: preference,
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:3001");
      await page
        .getByRole("button", { name: "Выбрать столик" })
        .first()
        .click();
      const dialog = page.getByRole("dialog");
      const duration = await dialog.evaluate(
        (el) => getComputedStyle(el).transitionDuration,
      );
      assert.equal(duration, preference === "reduce" ? "0s" : "0.18s, 0.18s");
      await dialog.getByLabel("Гостей", { exact: true }).fill("5");
      assert.match(
        await dialog.locator('[aria-current="step"]').innerText(),
        /Выбор столиков/,
      );
      await dialog
        .getByRole("button", { name: "№ 1 3 мест Свободен", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "№ 2 3 мест Свободен", exact: true })
        .click();
      assert.match(
        await dialog.locator('[aria-current="step"]').innerText(),
        /Данные и сохранение/,
      );
      const summary = dialog.getByRole("status");
      assert.match(await summary.innerText(), /Выбрано мест: 6 \/ 5/);
      await dialog.getByLabel("Ваше имя").fill("Тестовый Гость");
      await dialog.getByLabel("Телефон").fill("+7 900 000-00-00");
      if (preference === "reduce") {
        fs.mkdirSync(out, { recursive: true });
        await dialog
          .locator(".booking-form")
          .screenshot({ path: path.join(out, "form-refined.png") });
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(
          await dialog
            .locator(".booking-form")
            .evaluate((el) => el.scrollWidth <= el.clientWidth),
        );
        await page.screenshot({
          path: path.join(out, "form-refined-mobile.png"),
          fullPage: true,
        });
      }
      await dialog.getByRole("button", { name: "Сохранить демобронь" }).click();
      const success = dialog.locator(".notice_success");
      await success.waitFor();
      const successDuration = await success.evaluate(
        (el) => getComputedStyle(el).transitionDuration,
      );
      assert.equal(
        successDuration,
        preference === "reduce" ? "0s" : "0.2s, 0.2s",
      );
      await dialog.getByRole("link", { name: "Мои бронирования" }).click();
      await page
        .getByRole("heading", { name: "Мои бронирования", exact: true })
        .waitFor();
      report.checks.push({
        preference,
        dialogDuration: duration,
        successDuration,
        result: "PASS",
      });
      await context.close();
    }
    fs.writeFileSync(
      path.join(out, "motion-report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      "PASS motion and booking steps: normal and reduced motion; mobile overflow; successful booking",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
