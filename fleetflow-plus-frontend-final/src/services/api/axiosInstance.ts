import axios from "axios";
import type { ISessionRequestConfig } from "../../types/interface/ISessionRequestConfig";
import type { ISession } from "../../types/interface/ISession";
import type { IApiResponse } from "../../types/interface/IApiResponse";
export const http = axios.create({
  baseURL: "/",
  withCredentials: true,
  timeout: 65000,
  headers: { "Content-Type": "application/json", "X-FleetFlow-Client": "web" },
});
const refreshHttp = axios.create({
  baseURL: "/",
  withCredentials: true,
  timeout: 65000,
  headers: { "Content-Type": "application/json", "X-FleetFlow-Client": "web" },
});
let getToken: () => string | null = () => null;
let accept: (session: ISession) => void = () => {};
let reject: () => void = () => {};
let generation = 0;
let pending: Promise<ISession> | null = null;
export const configureSession = (
  get: () => string | null,
  onAccept: (session: ISession) => void,
  onReject: () => void,
) => {
  getToken = get;
  accept = onAccept;
  reject = onReject;
};
export const invalidateSessionRequests = () => {
  generation++;
};
export const waitForRefresh = async () => {
  if (pending)
    try {
      await pending;
    } catch {
      /* Failed refresh does not prevent explicit sign-in or logout. */
    }
};
export const restoreSession = () => {
  if (!pending) {
    const current = generation;
    pending = refreshHttp
      .post<IApiResponse<ISession>>("auth/refresh-token", {})
      .then((r) => {
        if (current !== generation) throw new Error("Session changed");
        accept(r.data.data);
        return r.data.data;
      })
      .catch((e) => {
        if (
          current === generation &&
          axios.isAxiosError(e) &&
          e.response?.status === 401
        )
          reject();
        throw e;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
};
// A request must never be retried using a different account's credentials.
http.interceptors.request.use(
  (config) => {
    const cfg: ISessionRequestConfig = config;
    if (
      cfg._fleetflowGeneration !== undefined &&
      cfg._fleetflowGeneration !== generation
    ) {
      throw new axios.CanceledError("Account changed");
    }
    cfg._fleetflowGeneration = generation;
    const token = getToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    else cfg.headers.delete("Authorization");
    return cfg;
  },
  (error) => {
    throw error;
  },
  { synchronous: true },
);
http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config as ISessionRequestConfig | undefined;
    if (
      !cfg ||
      cfg._retried ||
      cfg.signal?.aborted ||
      cfg._fleetflowGeneration !== generation ||
      error.response?.status !== 401 ||
      !getToken() ||
      !/^(?:\/?notifications(?:\/|$)|\/?auth\/me$)/.test(cfg.url || "")
    )
      throw error;
    cfg._retried = true;
    const old = cfg.headers.Authorization;
    const token = getToken();
    if (token && old !== `Bearer ${token}`) {
      cfg.headers.Authorization = `Bearer ${token}`;
      return http(cfg);
    }
    const session = await restoreSession();
    if (
      cfg._fleetflowGeneration !== generation ||
      cfg.signal?.aborted ||
      !getToken()
    )
      throw error;
    cfg.headers.Authorization = `Bearer ${session.accessToken}`;
    return http(cfg);
  },
);
