import { http } from "./axiosInstance";
import type { IApiResponse } from "../../types/interface/IApiResponse";
import type { IPlace } from "../../types/interface/IPlace";
import type { IRoute } from "../../types/interface/IRoute";
export const searchPlace = async (
  query: string,
  signal?: AbortSignal,
  autocomplete = false,
): Promise<IPlace[]> => {
  const { data } = await http.get<IApiResponse<IPlace[]>>("shipments/places", {
    params: { q: query, autocomplete },
    signal,
  });
  if (!Array.isArray(data?.data))
    throw new Error(
      "Invalid location response. Check your backend deployment and proxy.",
    );
  return data.data;
};
export const routeBetween = async (
  a: IPlace,
  b: IPlace,
  signal?: AbortSignal,
): Promise<IRoute> => {
  const { data } = await http.post<IApiResponse<IRoute>>(
    "shipments/route",
    { pickup: a, destination: b },
    { signal },
  );
  const route = data?.data;
  if (
    !route ||
    !Number.isFinite(route.distance) ||
    !Number.isFinite(route.duration) ||
    !Array.isArray(route.coordinates) ||
    route.coordinates.length < 2
  )
    throw new Error(
      "Invalid route response. Check your backend deployment and proxy.",
    );
  return route;
};
