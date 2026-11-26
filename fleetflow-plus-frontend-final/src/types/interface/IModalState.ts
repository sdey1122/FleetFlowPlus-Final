import type { AuthModalType } from "../type/AuthModalType";
import type { IPendingVerification } from "./IPendingVerification";
export interface IModalState {
  active: AuthModalType | null;
  pending: IPendingVerification | null;
  resetEmail: string;
  resetExpiresAt: number;
}
