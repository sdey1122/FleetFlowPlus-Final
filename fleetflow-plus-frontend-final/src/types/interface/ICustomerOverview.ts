import type { IOrder } from "./IOrder";
import type { IExpenseSeries } from "./IExpenseSeries";
export interface ICustomerOverview {
  summary: {
    totalOrders: number;
    paid: number;
    awaiting: number;
    expenses: number;
  };
  expenses?: IExpenseSeries; // Optional for compatibility with the previous backend release.
  monthly: {
    _id: string;
    total: number;
  }[];
  recent: Pick<
    IOrder,
    "number" | "createdAt" | "paymentStatus" | "status" | "price"
  >[];
}
