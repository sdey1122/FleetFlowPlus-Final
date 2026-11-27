const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const routing = require("../src/services/routing.service");
const originalFetch = global.fetch;
const originalKey = process.env.ORS_API_KEY;
afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.ORS_API_KEY;
  else process.env.ORS_API_KEY = originalKey;
});
const feature = (country_a, label) => ({
  properties: { country_a, label },
  geometry: { coordinates: [88, 22] },
});
const response = (body, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => body,
});
test("missing ORS key is diagnosed before network request", async () => {
  delete process.env.ORS_API_KEY;
  global.fetch = () => {
    throw new Error("unexpected network");
  };
  await assert.rejects(routing.search("Kolkata"), {
    code: "MAP_NOT_CONFIGURED",
  });
});
test("autocomplete sends key and India filter and keeps Indian results", async () => {
  process.env.ORS_API_KEY = "test-key";
  global.fetch = async (url) => {
    assert.equal(url.origin, "https://api.heigit.org");
    assert.equal(url.pathname, "/pelias/v1/autocomplete");
    assert.equal(url.searchParams.get("api_key"), "test-key");
    assert.equal(url.searchParams.get("boundary.country"), "IND");
    return response({
      features: [
        feature("IND", "Kolkata"),
        feature("IN", "Howrah"),
        feature("USA", "Other"),
      ],
    });
  };
  assert.deepEqual(await routing.search("Kol", true), [
    { label: "Kolkata", lon: 88, lat: 22 },
    { label: "Howrah", lon: 88, lat: 22 },
  ]);
});
test("invalid provider key and quota get distinct errors", async () => {
  process.env.ORS_API_KEY = "test-key";
  global.fetch = async () => response({}, 403);
  await assert.rejects(routing.search("Kolkata"), { code: "MAP_KEY_REJECTED" });
  global.fetch = async () => response({}, 429);
  await assert.rejects(routing.search("Kolkata"), {
    code: "MAP_QUOTA_EXCEEDED",
  });
});
test("road route uses longitude first and returns Leaflet latitude first", async () => {
  process.env.ORS_API_KEY = "test-key";
  global.fetch = async (url, opts) => {
    assert.equal(url.origin, "https://api.heigit.org");
    assert.equal(
      url.pathname,
      "/openrouteservice/v2/directions/driving-car/geojson",
    );
    assert.equal(opts.headers.Authorization, "test-key");
    assert.deepEqual(JSON.parse(opts.body).coordinates, [
      [88, 22],
      [89, 23],
    ]);
    return response({
      features: [
        {
          properties: { summary: { distance: 150000, duration: 7200 } },
          geometry: {
            coordinates: [
              [88, 22],
              [89, 23],
            ],
          },
        },
      ],
    });
  };
  assert.deepEqual(
    await routing.route({ lat: 22, lon: 88 }, { lat: 23, lon: 89 }),
    {
      distance: 150000,
      duration: 7200,
      coordinates: [
        [22, 88],
        [23, 89],
      ],
    },
  );
});

test("search and reverse use migrated Pelias endpoints", async () => {
  process.env.ORS_API_KEY = "test-key";
  const paths = [];
  global.fetch = async (url) => {
    assert.equal(url.origin, "https://api.heigit.org");
    paths.push(url.pathname);
    return response({ features: [feature("IND", "Kolkata")] });
  };
  await routing.search("Kolkata");
  assert.deepEqual(await routing.reverse({ lat: 22, lon: 88 }), {
    lat: 22,
    lon: 88,
    label: "Kolkata",
  });
  assert.deepEqual(paths, ["/pelias/v1/search", "/pelias/v1/reverse"]);
});
test("provider HTTP 500 and network failures remain unavailable", async () => {
  process.env.ORS_API_KEY = "test-key";
  global.fetch = async () => response({}, 500);
  await assert.rejects(routing.search("Kolkata"), { code: "MAP_UNAVAILABLE" });
  global.fetch = async () => {
    throw Object.assign(new Error("network"), { cause: { code: "ENOTFOUND" } });
  };
  await assert.rejects(routing.search("Kolkata"), { code: "MAP_UNAVAILABLE" });
});
