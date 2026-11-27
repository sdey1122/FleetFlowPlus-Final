import type { ExpenseGrouping } from "../type/ExpenseGrouping";
import type { IExpensePoint } from "./IExpensePoint";
export interface IExpenseSeries {
  year: number;
  months: number;
  grouping: ExpenseGrouping;
  start: string;
  end: string;
  total: number;
  points: IExpensePoint[];
}
