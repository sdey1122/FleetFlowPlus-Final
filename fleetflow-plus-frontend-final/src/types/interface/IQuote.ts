import type { IPrice } from "./IPrice";
import type { IRoute } from "./IRoute";
export interface IQuote {
  id: string;
  route: IRoute;
  prices: IPrice[];
  expiresAt: string;
}
