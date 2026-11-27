import type { ICheckout } from "../../types/interface/ICheckout";
import type { IRazorpayWindow } from "../../types/interface/IRazorpayWindow";
import type { IRazorpayResult } from "../../types/interface/IRazorpayResult";
let loading: Promise<void> | undefined;
function load() {
  const w = window as IRazorpayWindow;
  if (w.Razorpay) return Promise.resolve();
  if (!loading)
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () =>
        w.Razorpay
          ? resolve()
          : reject(new Error("Razorpay checkout unavailable."));
      script.onerror = () => {
        script.remove();
        reject(new Error("Could not load Razorpay checkout."));
      };
      document.head.appendChild(script);
    }).catch((e) => {
      loading = undefined;
      throw e;
    });
  return loading;
}
export async function openRazorpay(
  data: ICheckout,
  onFailure: () => void,
): Promise<IRazorpayResult | null> {
  await load();
  const Razorpay = (window as IRazorpayWindow).Razorpay;
  if (!Razorpay || !data.order.gatewayOrderId)
    throw new Error("Payment checkout is not ready.");
  return new Promise((resolve, reject) => {
    try {
      const o = data.order;
      const instance = new Razorpay({
        key: data.key,
        amount: o.price.total,
        currency: "INR",
        order_id: o.gatewayOrderId!,
        name: "FleetFlow Plus",
        description: o.number,
        prefill: {
          name: o.customerSnapshot.name,
          email: o.customerSnapshot.email,
          contact: o.customerSnapshot.phone || undefined,
        },
        theme: { color: "#A6342C" },
        handler: resolve,
        modal: { ondismiss: () => resolve(null) },
      });
      instance.on("payment.failed", onFailure);
      instance.open();
    } catch (e) {
      reject(e);
    }
  });
}
