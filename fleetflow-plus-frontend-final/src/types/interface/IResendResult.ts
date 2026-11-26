export interface IResendResult {
  email: string;
  reverifyToken: string;
  otpSent: boolean;
  expiresIn: number;
}
