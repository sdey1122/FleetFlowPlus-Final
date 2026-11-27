const test = require("node:test");
const assert = require("node:assert/strict");
const {
  expenseWindow,
  expenseSeries,
} = require("../src/services/expense-series.service");
const now = new Date("2026-11-27T01:00:00Z");
const row = (_id, total) => ({ _id, total });
test("12 month current period includes dates across years with IST boundaries", () => {
  const w = expenseWindow(12, 2026, "daily", now);
  assert.equal(w.start, "2025-12-01");
  assert.equal(w.end, "2026-11-27");
  assert.equal(w.matchFrom.toISOString(), "2025-11-30T18:30:00.000Z");
  assert.equal(w.matchUntil.toISOString(), now.toISOString());
  const { expenses, monthly } = expenseSeries(w, [
    row("2025-12-01", 5000),
    row("2026-11-27", 9000),
  ]);
  assert.equal(expenses.points.length, 362);
  assert.equal(expenses.points[1].total, 0);
  assert.equal(expenses.total, 14000);
  assert.deepEqual(monthly, [row("2025-12", 5000), row("2026-11", 9000)]);
});
test("calendar weeks have partial boundary buckets and preserve payment totals", () => {
  const w = expenseWindow(3, 2026, "weekly", now);
  const { expenses } = expenseSeries(w, [
    row("2026-09-01", 100),
    row("2026-09-06", 200),
    row("2026-09-07", 300),
  ]);
  assert.deepEqual(expenses.points[0], {
    start: "2026-09-01",
    end: "2026-09-06",
    total: 300,
  });
  assert.deepEqual(expenses.points[1], {
    start: "2026-09-07",
    end: "2026-09-13",
    total: 300,
  });
  assert.equal(expenses.points.at(-1).end, "2026-11-27");
  assert.equal(expenses.total, 600);
});
test("historical leap year includes February 29, and six month filter uses July–December", () => {
  const full = expenseWindow(12, 2024, "daily", now);
  assert.equal(expenseSeries(full, []).expenses.points.length, 366);
  const half = expenseWindow(6, 2024, "weekly", now);
  assert.equal(half.start, "2024-07-01");
  assert.equal(half.end, "2024-12-31");
  assert.equal(half.matchUntil.toISOString(), "2024-12-31T18:30:00.000Z");
});
test("future years have no matching payment dates and zero-filled buckets", () => {
  const w = expenseWindow(12, 2027, "weekly", now);
  assert.ok(w.matchFrom > w.matchUntil);
  const { expenses } = expenseSeries(w, []);
  assert.equal(expenses.start, "2027-01-01");
  assert.equal(expenses.end, "2027-12-31");
  assert.ok(expenses.points.length >= 52);
  assert.ok(expenses.points.every((p) => p.total === 0));
});
test("Today uses IST calendar day even near UTC midnight", () => {
  const instant = new Date("2026-12-31T19:00:00Z");
  const w = expenseWindow(0, undefined, "weekly", instant);
  assert.equal(w.year, 2027);
  assert.equal(w.grouping, "daily");
  assert.equal(w.start, "2027-01-01");
  assert.equal(w.matchFrom.toISOString(), "2026-12-31T18:30:00.000Z");
  assert.deepEqual(expenseSeries(w, [row("2027-01-01", 123)]).expenses.points, [
    { start: "2027-01-01", end: "2027-01-01", total: 123 },
  ]);
});
test("invalid year, period, grouping and historical Today are rejected", () => {
  for (const args of [
    [2, 2026, "weekly"],
    [12, 9999, "weekly"],
    [12, 2026, "hourly"],
    [0, 2025, "daily"],
  ])
    assert.throws(
      () => expenseWindow(...args, now),
      (e) => e.status === 400,
    );
});
test("overview aggregation is scoped to customer and captured payment date, without changing all-time summary", async () => {
  const Module = require("node:module");
  const original = Module._load;
  let pipeline;
  const summary = { totalOrders: 3, paid: 2, awaiting: 1, expenses: 40000 };
  Module._load = function (name, ...args) {
    if (name === "mongoose")
      return {
        Types: {
          ObjectId: class {
            constructor(id) {
              this.id = id;
            }
          },
        },
      };
    if (name === "../model/order.model")
      return {
        aggregate: async (p) => {
          pipeline = p;
          return [{ summary: [summary], daily: [], recent: [] }];
        },
      };
    if (
      [
        "../model/quote.model",
        "./routing.service",
        "./pricing.service",
        "./notification.service",
      ].includes(name)
    )
      return {};
    return original.call(this, name, ...args);
  };
  let orders;
  try {
    orders = require("../src/services/order.service");
  } finally {
    Module._load = original;
  }
  const result = await orders.overview(
    { id: "customer-test" },
    12,
    2024,
    "weekly",
  );
  assert.equal(pipeline[0].$match.customer.id, "customer-test");
  const daily = pipeline[1].$facet.daily;
  assert.equal(daily[0].$match.paymentStatus, "paid");
  assert.equal(
    daily[0].$match.paidAt.$gte.toISOString(),
    "2023-12-31T18:30:00.000Z",
  );
  assert.equal(
    daily[0].$match.paidAt.$lt.toISOString(),
    "2024-12-31T18:30:00.000Z",
  );
  assert.equal(daily[1].$group._id.$dateToString.timezone, "Asia/Kolkata");
  assert.deepEqual(result.summary, summary);
  assert.equal(result.expenses.total, 0);
});
