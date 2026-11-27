const test = require("node:test");
const assert = require("node:assert/strict");
const { price } = require("../src/services/pricing.service");
test("prices in integer paise with GST and increasing tier rates", () => {
  const p = price({ weight: 0.5, length: 20, width: 15, height: 10 }, 25000);
  assert.equal(p[0].chargeable, 1);
  assert.equal(p[0].platformFee, 5000);
  for (const x of p) {
    assert.equal(x.total, x.delivery + x.platformFee + x.tax);
    assert.equal(x.tax, Math.round((x.delivery + 5000) * 0.18));
    assert.ok(Number.isInteger(x.total));
  }
  assert.ok(p.every((x, i) => i === 0 || x.total > p[i - 1].total));
});
test("rejects overweight, volumetric overweight and nonpositive measurements", () => {
  for (const x of [
    { weight: 101, length: 1, width: 1, height: 1 },
    { weight: 1, length: 100, width: 100, height: 100 },
    { weight: 0, length: 1, width: 1, height: 1 },
  ])
    assert.throws(() => price(x, 1000));
});
