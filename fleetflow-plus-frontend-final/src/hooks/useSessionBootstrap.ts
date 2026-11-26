import { useEffect } from "react";
import { restoreSession } from "../services/api/axiosInstance";
import { store } from "../redux/store";
import { sessionUnavailable } from "../redux/slices/authSlice";
let started = false;
export const useSessionBootstrap = () => {
  useEffect(() => {
    if (started) return;
    started = true;
    restoreSession().catch(() => {
      if (store.getState().auth.status === "loading")
        store.dispatch(sessionUnavailable());
    });
  }, []);
};
