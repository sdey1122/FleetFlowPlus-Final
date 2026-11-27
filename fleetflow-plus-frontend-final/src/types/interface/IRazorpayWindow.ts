import type { IRazorpayOptions } from "./IRazorpayOptions";
import type { IRazorpayInstance } from "./IRazorpayInstance";
export interface IRazorpayWindow extends Window {
  Razorpay?: new (options: IRazorpayOptions) => IRazorpayInstance;
}
