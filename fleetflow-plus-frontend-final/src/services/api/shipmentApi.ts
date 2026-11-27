import type { IProfileUpdate } from "../../types/interface/IProfileUpdate";
import type { IUser } from "../../types/interface/IUser";
import { http } from "./axiosInstance";
import type { IApiResponse } from "../../types/interface/IApiResponse";
import type { IShipment } from "../../types/interface/IShipment";
import type { IQuote } from "../../types/interface/IQuote";
import type { IOrder } from "../../types/interface/IOrder";
import type { IOrderList } from "../../types/interface/IOrderList";
import type { ICustomerOverview } from "../../types/interface/ICustomerOverview";
import type { ICheckout } from "../../types/interface/ICheckout";
import type { IRazorpayResult } from "../../types/interface/IRazorpayResult";
import type { ServiceTier } from "../../types/type/ServiceTier";
import type { ExpenseGrouping } from "../../types/type/ExpenseGrouping";
const get = async <T>(url: string, signal?: AbortSignal, params?: object) =>
  (await http.get<IApiResponse<T>>(url, { signal, params })).data.data;
const post = async <T>(url: string, body: object) =>
  (await http.post<IApiResponse<T>>(url, body)).data.data;
export const shipmentApi = {
  updateProfile: async (body: IProfileUpdate) =>
    (await http.patch<IApiResponse<IUser>>("shipments/profile", body)).data
      .data,
  quote: (body: IShipment) => post<IQuote>("shipments/quotes", body),
  checkout: (quoteId: string, tier: ServiceTier) =>
    post<ICheckout>("shipments/orders", { quoteId, tier }),
  retry: (id: string) => post<ICheckout>(`shipments/orders/${id}/checkout`, {}),
  verify: (id: string, body: IRazorpayResult) =>
    post<IOrder>(`shipments/orders/${id}/verify`, body),
  sync: (id: string) => post<IOrder>(`shipments/orders/${id}/sync`, {}),
  order: (id: string, signal?: AbortSignal) =>
    get<IOrder>(`shipments/orders/${id}`, signal),
  orders: (
    page: number,
    limit: number,
    search: string,
    payment: string,
    signal?: AbortSignal,
    sort = "createdAt",
    direction = "desc",
  ) =>
    get<IOrderList>("shipments/orders", signal, {
      page,
      limit,
      search,
      payment,
      sort,
      direction,
    }),
  overview: (
    signal?: AbortSignal,
    months = 12,
    year?: number,
    grouping: ExpenseGrouping = "weekly",
  ) =>
    get<ICustomerOverview>("shipments/overview", signal, {
      months,
      year,
      grouping,
    }),
  receipt: async (id: string, paymentId: string) =>
    (
      await http.get<Blob>(`shipments/orders/${id}/receipts/${paymentId}`, {
        responseType: "blob",
      })
    ).data,
};
