import type { IPlace } from "../../types/interface/IPlace";
import type { IRoute } from "../../types/interface/IRoute";
import type { INominatimResult } from "../../types/interface/INominatimResult";
import type { IOSRMResult } from "../../types/interface/IOSRMResult";
let lastSearch = 0;
export const searchPlace = async (
  query: string,
  signal?: AbortSignal,
): Promise<IPlace[]> => {
  if (Date.now() - lastSearch < 1100)
    throw new Error("Please wait a second between searches.");
  lastSearch = Date.now();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error("Location search is temporarily unavailable.");
  const data: INominatimResult[] = await response.json();
  return data
    .map((v) => ({
      label: v.display_name,
      lat: Number(v.lat),
      lon: Number(v.lon),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
};
export const routeBetween = async (
  a: IPlace,
  b: IPlace,
  signal?: AbortSignal,
): Promise<IRoute> => {
  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error("Route service is temporarily unavailable.");
  const data: IOSRMResult = await r.json();
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route)
    throw new Error("No driving route found. Try different locations.");
  return {
    distance: route.distance,
    duration: route.duration,
    coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
};
