import type { IUser } from "./IUser";
export interface IVerificationResult {
  user: IUser;
  reverifyToken: string;
  otpSent: boolean;
  expiresIn: number;
}
