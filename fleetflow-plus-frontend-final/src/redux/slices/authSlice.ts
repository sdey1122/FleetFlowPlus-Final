import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "../../types/interface/IUser";
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
    profileUpdated: (s, a: PayloadAction<IUser>) => {
      if (s.user?.id === a.payload.id) s.user = a.payload;
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
export const {
  sessionReceived,
  sessionCleared,
  sessionUnavailable,
  profileUpdated,
} = slice.actions;
export default slice.reducer;
