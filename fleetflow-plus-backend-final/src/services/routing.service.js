const { apiError } = require("../utils/apiResponse");
const key = () => {
  const value = process.env.ORS_API_KEY?.trim();
  if (!value)
    throw apiError(503, "MAP_NOT_CONFIGURED", "Map provider not configured.");
  return value;
};
async function request(path, params = {}, body) {
  const apiKey = key();
  const apiPath = path.startsWith("/geocode/")
    ? path.replace("/geocode/", "/pelias/v1/")
    : `/openrouteservice${path}`;
  const url = new URL(`https://api.heigit.org${apiPath}`);
  for (const [k, v] of Object.entries(params))
    url.searchParams.set(k, String(v));
  // GET geocoding uses the documented api_key parameter; POST directions uses Authorization.
  if (!body) url.searchParams.set("api_key", apiKey);
  let r;
  try {
    r = await fetch(url, {
      headers: body
        ? { Authorization: apiKey, "Content-Type": "application/json" }
        : {},
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    // Never log full URLs, addresses, request bodies, or API keys.
    console.warn(
      "[HeiGIT]",
      apiPath,
      "network error:",
      err?.cause?.code || err?.name || "UNKNOWN",
    );
    throw apiError(
      503,
      "MAP_UNAVAILABLE",
      "Location or routing provider unavailable.",
    );
  }
  if (!r.ok) console.warn("[HeiGIT]", apiPath, `HTTP ${r.status}`);
  if (r?.status === 401 || r?.status === 403)
    throw apiError(
      503,
      "MAP_KEY_REJECTED",
      "Map provider rejected the API key.",
    );
  if (r?.status === 429)
    throw apiError(503, "MAP_QUOTA_EXCEEDED", "Map provider quota exceeded.");
  if (body && (r?.status === 400 || r?.status === 404))
    throw apiError(
      400,
      "NO_ROUTE",
      "No supported road route found. Try nearby locations or a shorter route.",
    );
  if (!r?.ok)
    throw apiError(
      503,
      "MAP_UNAVAILABLE",
      "Location or routing provider unavailable.",
    );
  return r.json().catch(() => {
    throw apiError(503, "MAP_UNAVAILABLE", "Invalid map provider response.");
  });
}
const places = (data) =>
  (Array.isArray(data?.features) ? data.features : [])
    .filter(
      (f) =>
        ["IND", "IN"].includes(
          String(f.properties?.country_a || "").toUpperCase(),
        ) &&
        typeof f.properties.label === "string" &&
        f.geometry?.coordinates?.length === 2 &&
        f.geometry.coordinates.every(Number.isFinite),
    )
    .map((f) => ({
      label: f.properties.label,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }));
const search = async (text, autocomplete = false) =>
  places(
    await request(autocomplete ? "/geocode/autocomplete" : "/geocode/search", {
      text,
      "boundary.country": "IND",
      size: 5,
    }),
  );
async function reverse(p) {
  const found = places(
    await request("/geocode/reverse", {
      "point.lat": p.lat,
      "point.lon": p.lon,
      size: 1,
    }),
  );
  if (!found.length)
    throw apiError(400, "INDIA_ONLY", "Select an address within India.");
  return { ...p, label: found[0].label };
}
async function route(pickup, destination) {
  const data = await request(
    "/v2/directions/driving-car/geojson",
    {},
    {
      coordinates: [
        [pickup.lon, pickup.lat],
        [destination.lon, destination.lat],
      ],
    },
  );
  const f = data.features?.[0],
    s = f?.properties?.summary;
  if (
    !s ||
    !Number.isFinite(s.distance) ||
    s.distance <= 0 ||
    !Number.isFinite(s.duration) ||
    !Array.isArray(f.geometry?.coordinates) ||
    f.geometry.coordinates.length < 2 ||
    !f.geometry.coordinates.every(
      (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
    )
  )
    throw apiError(400, "NO_ROUTE", "No road route available.");
  return {
    distance: s.distance,
    duration: s.duration,
    coordinates: f.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
}
module.exports = { search, reverse, route };
