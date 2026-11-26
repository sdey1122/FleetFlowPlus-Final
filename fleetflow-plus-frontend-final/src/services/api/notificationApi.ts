import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { http } from "./axiosInstance";
import { apiError } from "../helper/errors";
import type { IApiError } from "../../types/interface/IApiError";
import type { IApiResponse } from "../../types/interface/IApiResponse";
import type { INotificationList } from "../../types/interface/INotificationList";
export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fakeBaseQuery<IApiError>(),
  tagTypes: ["Notifications"],
  endpoints: (b) => ({
    notifications: b.query<INotificationList, string>({
      queryFn: async () => {
        try {
          return {
            data: (
              await http.get<IApiResponse<INotificationList>>("notifications")
            ).data.data,
          };
        } catch (e) {
          return { error: apiError(e) };
        }
      },
      providesTags: ["Notifications"],
    }),
    readAll: b.mutation<void, void>({
      queryFn: async () => {
        try {
          await http.patch("notifications/read-all", {});
          return { data: undefined };
        } catch (e) {
          return { error: apiError(e) };
        }
      },
      invalidatesTags: ["Notifications"],
    }),
    readOne: b.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await http.patch(`notifications/${id}/read`, {});
          return { data: undefined };
        } catch (e) {
          return { error: apiError(e) };
        }
      },
      invalidatesTags: ["Notifications"],
    }),
  }),
});
export const { useNotificationsQuery, useReadAllMutation, useReadOneMutation } =
  notificationApi;
