import type { PublicRole } from "../type/PublicRole";
export interface IRegister {
  name: string;
  email: string;
  phone: string;
  role: PublicRole;
  password: string;
  confirmPassword: string;
}
