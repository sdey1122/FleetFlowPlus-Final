import type { Role } from "../types/type/Role";
export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  customer: "Customer",
  dispatcher: "Dispatcher",
  driver: "Driver",
};
export const dashboardPath = (role: Role) => `/${role}/dashboard`;
