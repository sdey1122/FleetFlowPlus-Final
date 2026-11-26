import axios from "axios";
import type { IApiError } from "../../types/interface/IApiError";
export const apiError = (error: unknown): IApiError =>
  axios.isAxiosError<IApiError>(error)
    ? error.response?.data || {
        message: "Connection unavailable. Please try again.",
      }
    : {
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      };
