export type OrderStatus =
  | "payment_pending"
  | "awaiting_dispatch"
  | "dispatcher_assigned"
  | "driver_assigned"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
