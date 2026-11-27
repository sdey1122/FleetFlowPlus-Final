const { apiError } = require("../utils/apiResponse");
const DAY = 86400000;
const IST = 19800000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Treat calendar dates as UTC day numbers; convert to IST instants only for MongoDB.
function expenseWindow(
  months = 12,
  year,
  grouping = "weekly",
  now = new Date(),
) {
  const local = new Date(now.getTime() + IST);
  const currentYear = local.getUTCFullYear();
  const count = Number(months);
  if (![0, 3, 6, 12].includes(count))
    throw apiError(400, "INVALID_PERIOD", "Choose Today, 3, 6 or 12 months.");
  const selected = year === undefined ? currentYear : Number(year);
  if (
    !Number.isInteger(selected) ||
    selected < 2000 ||
    selected > currentYear + 2
  )
    throw apiError(400, "INVALID_YEAR", "Select a supported year.");
  if (!["daily", "weekly"].includes(grouping))
    throw apiError(400, "INVALID_GROUPING", "Choose daily or weekly expenses.");
  if (count === 0 && selected !== currentYear)
    throw apiError(
      400,
      "INVALID_PERIOD",
      "Today is only available for the current year.",
    );
  const last =
    selected === currentYear
      ? Date.UTC(currentYear, local.getUTCMonth(), local.getUTCDate())
      : Date.UTC(selected, 11, 31);
  const end = new Date(last);
  const first =
    count === 0 ? last : Date.UTC(selected, end.getUTCMonth() - count + 1, 1);
  return {
    year: selected,
    months: count,
    grouping: count === 0 ? "daily" : grouping,
    first,
    last,
    start: iso(first),
    end: iso(last),
    matchFrom: new Date(first - IST),
    // Never count a payment dated in the future, even when viewing a future year.
    matchUntil: new Date(Math.min(last + DAY - IST, now.getTime())),
  };
}

function expenseSeries(window, rows) {
  const daily = new Map(rows.map((row) => [row._id, row.total]));
  const points = [];
  const monthly = new Map();
  for (let d = window.first; d <= window.last; ) {
    // Calendar weeks run Monday–Sunday; the first/last week may be partial.
    const days =
      window.grouping === "daily" ? 1 : 7 - ((new Date(d).getUTCDay() + 6) % 7);
    const end = Math.min(window.last, d + (days - 1) * DAY);
    let total = 0;
    for (let day = d; day <= end; day += DAY) {
      const key = iso(day);
      const amount = daily.get(key) || 0;
      total += amount;
      if (daily.has(key)) {
        const month = key.slice(0, 7);
        monthly.set(month, (monthly.get(month) || 0) + amount);
      }
    }
    points.push({ start: iso(d), end: iso(end), total });
    d = end + DAY;
  }
  return {
    expenses: {
      year: window.year,
      months: window.months,
      grouping: window.grouping,
      start: window.start,
      end: window.end,
      total: points.reduce((sum, p) => sum + p.total, 0),
      points,
    },
    // Retain the legacy monthly response for older frontend builds.
    monthly: [...monthly].map(([_id, total]) => ({ _id, total })),
  };
}
module.exports = { expenseWindow, expenseSeries };
