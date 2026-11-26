import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IAuthState } from "../../types/interface/IAuthState";
import type { ISession } from "../../types/interface/ISession";
const initialState: IAuthState = {
  user: null,
  accessToken: null,
  status: "loading",
};
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionReceived: (s, a: PayloadAction<ISession>) => {
      s.user = a.payload.user;
      s.accessToken = a.payload.accessToken;
      s.status = "authenticated";
    },
    sessionCleared: (s) => {
      s.user = null;
      s.accessToken = null;
      s.status = "guest";
    },
    sessionUnavailable: (s) => {
      if (!s.user) s.status = "unavailable";
    },
  },
});
export const { sessionReceived, sessionCleared, sessionUnavailable } =
  slice.actions;
export default slice.reducer;
