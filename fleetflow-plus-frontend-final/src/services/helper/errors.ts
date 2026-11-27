import axios from "axios";
import type { IApiError } from "../../types/interface/IApiError";
const friendly: Record<string, string> = {
  MAP_NOT_CONFIGURED:
    "Map provider is not configured. Add ORS_API_KEY to the Render backend.",
  MAP_KEY_REJECTED:
    "OpenRouteService rejected the API key. Check ORS_API_KEY on the active backend.",
  MAP_QUOTA_EXCEEDED: "Map provider quota reached. Please try again later.",
  NOT_FOUND:
    "Requested API route not found. Check that the latest backend is running and the frontend proxy targets it.",
  MAP_UNAVAILABLE:
    "Location or routing service unavailable. Try again shortly.",
  PAYMENT_NOT_CONFIGURED:
    "Razorpay Test Mode is not configured on the backend.",
  PAYMENT_GATEWAY_UNAVAILABLE:
    "Payment gateway unavailable. Open order history to retry the existing order.",
  PROFILE_IMAGE_NOT_CONFIGURED:
    "Profile image storage is not configured. You can still save your bio and date of birth.",
};
export const apiError = (error: unknown): IApiError => {
  if (axios.isAxiosError<IApiError>(error)) {
    const body = error.response?.data;
    if (body && typeof body.message === "string")
      return {
        ...body,
        message: (body.code && friendly[body.code]) || body.message,
      };
    return {
      message: error.response?.status
        ? `Request failed (HTTP ${error.response.status}).`
        : "Connection unavailable. Please try again.",
    };
  }
  return {
    message: error instanceof Error ? error.message : "Something went wrong.",
  };
};
