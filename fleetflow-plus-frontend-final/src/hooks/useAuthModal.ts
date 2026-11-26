import { useAppDispatch } from "./useAppDispatch";
import {
  openModal,
  closeModal,
  setPending,
  setReset,
} from "../redux/slices/modalSlice";
import type { IPendingVerification } from "../types/interface/IPendingVerification";
import type { AuthModalType } from "../types/type/AuthModalType";
export const useAuthModal = () => {
  const dispatch = useAppDispatch();
  return {
    open: (m: AuthModalType) => dispatch(openModal(m)),
    close: () => dispatch(closeModal()),
    pending: (p: IPendingVerification | null) => dispatch(setPending(p)),
    reset: (email: string, expiresAt: number) =>
      dispatch(setReset({ email, expiresAt })),
  };
};
