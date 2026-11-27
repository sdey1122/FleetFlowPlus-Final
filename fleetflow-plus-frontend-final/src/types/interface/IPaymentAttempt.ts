import type { PaymentAttemptStatus } from "../type/PaymentAttemptStatus";
export interface IPaymentAttempt {
  paymentId: string;
  status: PaymentAttemptStatus;
  amount: number;
  method: string;
  at: string;
  errorCode?: string;
}
