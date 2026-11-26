import type { InternalAxiosRequestConfig } from "axios";

export interface ISessionRequestConfig extends InternalAxiosRequestConfig {
  _fleetflowGeneration?: number;
  _retried?: boolean;
}
