import type { IRazorpayResult } from "./IRazorpayResult";
export interface IRazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (r: IRazorpayResult) => void;
  modal: {
    ondismiss: () => void;
  };
}
