import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthModalType } from "../../types/type/AuthModalType";
import type { IModalState } from "../../types/interface/IModalState";
import type { IPendingVerification } from "../../types/interface/IPendingVerification";
import { readPending } from "../../services/helper/pending";
const initialState: IModalState = {
  active: null,
  pending: readPending(),
  resetEmail: "",
  resetExpiresAt: 0,
};
const slice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (s, a: PayloadAction<AuthModalType>) => {
      s.active = a.payload;
    },
    closeModal: (s) => {
      s.active = null;
    },
    setPending: (s, a: PayloadAction<IPendingVerification | null>) => {
      s.pending = a.payload;
    },
    setReset: (
      s,
      a: PayloadAction<{
        email: string;
        expiresAt: number;
      }>,
    ) => {
      s.resetEmail = a.payload.email;
      s.resetExpiresAt = a.payload.expiresAt;
    },
  },
});
export const { openModal, closeModal, setPending, setReset } = slice.actions;
export default slice.reducer;
