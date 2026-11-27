import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import axios from "axios";
import { http } from "./axiosInstance";
import type { IApiError } from "../../types/interface/IApiError";
import type { IApiResponse } from "../../types/interface/IApiResponse";
import type { INotificationList } from "../../types/interface/INotificationList";
import type { IReadNotification } from "../../types/interface/IReadNotification";
import type { IAuthState } from "../../types/interface/IAuthState";

const failure = (e: unknown): IApiError => {
  if (!axios.isAxiosError<IApiError>(e))
    return {
      message:
        e instanceof Error ? e.message : "Unable to load account updates.",
    };
  const body = e.response?.data;
  const status = e.response?.status;
  return {
    message:
      body?.code === "NOT_FOUND"
        ? "Notification API route not found. Deploy the updated backend on Render (or check your local proxy target)."
        : typeof body?.message === "string"
          ? body.message
          : status
            ? `Notification request failed (HTTP ${status}).`
            : "Connection unavailable. Please try again.",
    code:
      typeof body?.code === "string"
        ? body.code
        : status
          ? `HTTP_${status}`
          : e.code || "NETWORK_ERROR",
  };
};
const currentAccount = (state: unknown) =>
  (state as { auth: IAuthState }).auth.user?.id;
const accountChanged = {
  message: "Account changed. Please try again.",
  code: "ACCOUNT_CHANGED",
};
export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fakeBaseQuery<IApiError>(),
  tagTypes: ["Notifications"],
  endpoints: (b) => ({
    notifications: b.query<INotificationList, string>({
      async queryFn(userId, api) {
        if (currentAccount(api.getState()) !== userId)
          return { error: accountChanged };
        try {
          const response = await http.get<IApiResponse<INotificationList>>(
            "notifications",
            { signal: api.signal },
          );
          if (currentAccount(api.getState()) !== userId)
            return { error: accountChanged };
          const data = response.data?.data;
          if (
            !Array.isArray(data?.items) ||
            typeof data.unreadCount !== "number"
          )
            return {
              error: {
                message:
                  "Invalid notification response. Check the deployed notification API.",
                code: "INVALID_RESPONSE",
              },
            };
          return { data };
        } catch (e) {
          return { error: failure(e) };
        }
      },
      providesTags: (_result, _error, userId) => [
        { type: "Notifications", id: userId },
      ],
      keepUnusedDataFor: 0,
    }),
    readAll: b.mutation<null, string>({
      async queryFn(userId, api) {
        if (currentAccount(api.getState()) !== userId)
          return { error: accountChanged };
        try {
          await http.patch(
            "notifications/read-all",
            {},
            { signal: api.signal },
          );
          return { data: null };
        } catch (e) {
          return { error: failure(e) };
        }
      },
      invalidatesTags: (_result, error, userId) =>
        error ? [] : [{ type: "Notifications", id: userId }],
    }),
    readOne: b.mutation<null, IReadNotification>({
      async queryFn({ userId, id }, api) {
        if (currentAccount(api.getState()) !== userId)
          return { error: accountChanged };
        try {
          await http.patch(
            `notifications/${id}/read`,
            {},
            { signal: api.signal },
          );
          return { data: null };
        } catch (e) {
          return { error: failure(e) };
        }
      },
      invalidatesTags: (_result, error, arg) =>
        error ? [] : [{ type: "Notifications", id: arg.userId }],
    }),
  }),
});
export const { useNotificationsQuery, useReadAllMutation, useReadOneMutation } =
  notificationApi;
