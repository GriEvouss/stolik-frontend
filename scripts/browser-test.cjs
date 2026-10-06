const assert = require("node:assert/strict");
const pw = require("playwright");
const fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const browser = await pw.chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const out = path.resolve(__dirname, "../test-results");
  fs.mkdirSync(out, { recursive: true });
  let count = 0;
  const pass = (n) => {
    count++;
    console.log("PASS " + n);
  };
  await page.goto("http://127.0.0.1:3001");
  await page.getByRole("heading", { name: "Подходящие рестораны" }).waitFor();
  assert.equal(await page.locator(".restaurant-card").count(), 3);
  pass("catalog");
  await page.screenshot({ path: path.join(out, "home.png"), fullPage: true });
  await page.getByLabel("Сначала").selectOption("check");
  assert.deepEqual(
    await page.locator(".restaurant-card h2").allTextContents(),
    ["Молодость", "Мясо и Салат", "Каравелла"],
  );
  pass("sort by check");
  await page.getByLabel("Гостей", { exact: true }).fill("34");
  assert.equal(await page.locator(".restaurant-card").count(), 1);
  pass("filter capacity");
  await page.getByLabel("Гостей", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Выбрать столик" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  pass("modal Escape");
  await page.getByRole("button", { name: "Выбрать столик" }).first().click();
  await dialog.getByLabel("Гостей", { exact: true }).fill("5");
  await dialog
    .getByRole("button", { name: "№ 1 3 мест Свободен", exact: true })
    .click();
  assert.equal(
    await dialog
      .getByRole("button", { name: "Сохранить демобронь" })
      .isDisabled(),
    true,
  );
  await dialog
    .getByRole("button", { name: "№ 2 3 мест Свободен", exact: true })
    .click();
  pass("multiple tables and capacity guard");
  await dialog.getByLabel("Ваше имя").fill("Тестовый Гость");
  await dialog.getByLabel("Телефон").fill("123");
  await dialog.getByRole("button", { name: "Сохранить демобронь" }).click();
  assert.match(await dialog.getByRole("alert").innerText(), /телефон/);
  pass("invalid phone");
  await dialog.getByLabel("Телефон").fill("+7 900 000-00-00");
  await dialog
    .getByLabel("Комментарий")
    .fill("Тестовая запись для проверки приложения");
  await page.screenshot({
    path: path.join(out, "booking.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Сохранить демобронь" }).click();
  await dialog
    .getByText("Демонстрационная бронь сохранена", { exact: true })
    .waitFor();
  pass("create booking");
  await dialog.getByRole("link", { name: "Мои бронирования" }).click();
  await page.reload();
  assert.equal(await page.locator(".booking-card").count(), 1);
  pass("persistence and direct route");
  await page.screenshot({
    path: path.join(out, "bookings.png"),
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:3001/restaurant/2");
  await page.getByRole("heading", { name: "Молодость", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "№ 1 3 мест Занят", exact: true })
      .isDisabled(),
    true,
  );
  pass("occupied tables");
  await page.getByLabel("Время", { exact: true }).fill("19:59");
  assert.equal(
    await page
      .getByRole("button", { name: "№ 1 3 мест Занят", exact: true })
      .isDisabled(),
    true,
  );
  pass("overlapping interval");
  await page.getByLabel("Время", { exact: true }).fill("20:00");
  assert.equal(
    await page
      .getByRole("button", { name: "№ 1 3 мест Свободен", exact: true })
      .isEnabled(),
    true,
  );
  pass("adjacent interval");
  await page
    .getByRole("button", { name: "№ 1 3 мест Свободен", exact: true })
    .click();
  await page.getByLabel("Время", { exact: true }).fill("21:01");
  assert.equal(await page.locator('[aria-pressed="true"]').count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Сохранить демобронь" })
      .isDisabled(),
    true,
  );
  pass("invalid time and selection reset");
  await page.goto("http://127.0.0.1:3001/bookings");
  await page
    .getByRole("button", { name: "Отменить бронь", exact: true })
    .click();
  await page.getByRole("button", { name: "Оставить", exact: true }).click();
  assert.equal(await page.getByText("Активно", { exact: true }).count(), 1);
  await page
    .getByRole("button", { name: "Отменить бронь", exact: true })
    .click();
  await page.getByRole("button", { name: "Да, отменить" }).click();
  await page.getByText("Отменено", { exact: true }).waitFor();
  await page.getByLabel("Показать").selectOption("active");
  await page
    .getByRole("heading", { name: "Здесь пока нет бронирований" })
    .waitFor();
  pass("cancellation and filter");
  await page.goto("http://127.0.0.1:3001/restaurant/2");
  assert.equal(
    await page
      .getByRole("button", { name: "№ 1 3 мест Свободен", exact: true })
      .isEnabled(),
    true,
  );
  pass("cancel frees tables");
  await page.goto("http://127.0.0.1:3001/restaurant/999");
  await page.getByRole("heading", { name: "Ресторан не найден" }).waitFor();
  await page.goto("http://127.0.0.1:3001/missing");
  await page.getByRole("heading", { name: "Страница не найдена" }).waitFor();
  pass("missing routes");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3001");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: path.join(out, "mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Выбрать столик" }).first().click();
  assert.equal(
    await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth),
    true,
  );
  await page.screenshot({
    path: path.join(out, "mobile-booking.png"),
    fullPage: true,
  });
  pass("mobile catalog and form no overflow");
  await page.keyboard.press("Escape");
  await page.evaluate(() =>
    localStorage.setItem("restaurant-coursework.bookings.v1", "broken"),
  );
  await page.reload();
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /повреждены/);
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("restaurant-coursework.bookings.v1"),
    ),
    "broken",
  );
  pass("corrupt storage preserved");
  assert.deepEqual(errors, []);
  pass("no browser runtime errors");
  const report = {
    browser: await browser.version(),
    viewport: [1440, 1000],
    mobile: [390, 844],
    passed: count,
    errors,
    checkedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(out, "browser-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
