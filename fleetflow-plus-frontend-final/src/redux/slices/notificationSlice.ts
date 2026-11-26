import { createSlice } from "@reduxjs/toolkit";
import type { INotification } from "../../types/interface/INotification";
const initialState: {
  guest: INotification[];
} = { guest: [] };
const slice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    verifiedNotice: (s) => {
      s.guest = [
        {
          id: "verification",
          title: "Welcome to FleetFlow Plus!",
          message: "Account verified. Sign in to start your journey.",
          kind: "welcome",
          createdAt: new Date().toISOString(),
          readAt: null,
        },
      ];
    },
    readGuest: (s) => {
      s.guest = s.guest.map((n) => ({
        ...n,
        readAt: new Date().toISOString(),
      }));
    },
    clearGuest: (s) => {
      s.guest = [];
    },
  },
});
export const { verifiedNotice, readGuest, clearGuest } = slice.actions;
export default slice.reducer;
