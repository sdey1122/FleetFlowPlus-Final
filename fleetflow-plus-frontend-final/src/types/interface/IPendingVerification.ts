export interface IPendingVerification {
  email: string;
  reverifyToken?: string;
  expiresAt?: number;
  resendAt?: number;
}
