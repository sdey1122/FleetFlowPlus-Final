import type { IShipment } from "./IShipment";
import type { IPrice } from "./IPrice";
import type { IPaymentAttempt } from "./IPaymentAttempt";
import type { PaymentStatus } from "../type/PaymentStatus";
import type { OrderStatus } from "../type/OrderStatus";
export interface IOrder {
  id: string;
  number: string;
  trackingId: string;
  createdAt: string;
  paidAt?: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  shipment: IShipment;
  route: {
    distance: number;
    duration: number;
  };
  price: IPrice;
  gatewayOrderId?: string;
  attempts: IPaymentAttempt[];
  timeline: {
    event: string;
    at: string;
  }[];
  customerSnapshot: {
    name: string;
    email: string;
    phone: string | null;
  };
}
