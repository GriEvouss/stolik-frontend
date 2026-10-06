const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  assert = require("node:assert/strict");
const source = fs.readFileSync(
  path.join(__dirname, "../src/domain/booking.ts"),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const mod = { exports: {} };
new Function("exports", "require", "module", js)(mod.exports, require, mod);
const {
  visitError,
  overlaps,
  freeTables,
  seats,
  restaurants,
  BookingRepository,
} = mod.exports;
const base = { date: "2090-06-10", time: "18:00", guests: 2 },
  now = new Date("2089-01-01T00:00:00");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function store() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
const input = {
  ...base,
  restaurantId: 2,
  tableIds: [1],
  name: "Тестовый Гость",
  phone: "+7 900 000-00-00",
  comments: "",
};
test("valid date", () => assert.equal(visitError(base, now), null));
for (const [name, v] of Object.entries({
  empty: { date: "" },
  impossible: { date: "2090-02-30" },
  past: { date: "2000-01-01" },
  early: { time: "08:59" },
  late: { time: "21:01" },
  badMinute: { time: "20:99" },
  zeroGuests: { guests: 0 },
  fractionalGuests: { guests: 1.5 },
  notNumber: { guests: NaN },
}))
  test(name, () => assert.ok(visitError({ ...base, ...v }, now)));
for (const time of ["09:00", "21:00"])
  test("boundary " + time, () =>
    assert.equal(visitError({ ...base, time }, now), null),
  );
test("overlap at 19:59", () =>
  assert.equal(overlaps(base, { ...base, time: "19:59" }), true));
test("adjacent at 20:00", () =>
  assert.equal(overlaps(base, { ...base, time: "20:00" }), false));
test("different day", () =>
  assert.equal(overlaps(base, { ...base, date: "2090-06-11" }), false));
test("create persist cancel availability", () => {
  const s = store(),
    r = new BookingRepository(s);
  const b = r.create(input);
  assert.equal(new BookingRepository(s).all().length, 1);
  assert.deepEqual(freeTables(restaurants[1], base, r.all()), [2, 3]);
  assert.throws(() => r.create(input), /заняты/);
  r.cancel(b.id);
  assert.equal(freeTables(restaurants[1], base, r.all()).length, 3);
});
test("combine tables", () => {
  const r = new BookingRepository(store());
  assert.equal(r.create({ ...input, guests: 5, tableIds: [1, 2] }).guests, 5);
  assert.equal(seats(restaurants[1], [1, 2]), 6);
});
for (const [name, value] of Object.entries({
  emptyTables: { tableIds: [] },
  unknownTable: { tableIds: [90] },
  duplicate: { tableIds: [1, 1] },
  tooManyGuests: { guests: 4 },
  invalidName: { name: "  " },
  invalidPhone: { phone: "123" },
  longComment: { comments: "a".repeat(501) },
  unknownRestaurant: { restaurantId: 99 },
}))
  test(name, () =>
    assert.throws(() =>
      new BookingRepository(store()).create({ ...input, ...value }),
    ),
  );
test("corrupt storage kept", () => {
  const s = store();
  s.setItem("restaurant-coursework.bookings.v1", "oops");
  assert.throws(() => new BookingRepository(s).all(), /повреждены/);
  assert.equal(s.getItem("restaurant-coursework.bookings.v1"), "oops");
});
test("write failure surfaced", () =>
  assert.throws(
    () =>
      new BookingRepository({
        getItem: () => null,
        setItem: () => {
          throw Error();
        },
      }).create(input),
    /Не удалось/,
  ));
test("read failure surfaced", () =>
  assert.throws(
    () =>
      new BookingRepository({
        getItem: () => {
          throw Error();
        },
        setItem: () => {},
      }).all(),
    /недоступно/,
  ));
console.log(`${count} tests passed`);
