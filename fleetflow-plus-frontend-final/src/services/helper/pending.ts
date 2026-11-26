import type { IPendingVerification } from "../../types/interface/IPendingVerification";
const key = "fleetflow.pending.v1";
export const readPending = (): IPendingVerification | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
export const savePending = (p: IPendingVerification | null) => {
  try {
    if (p) sessionStorage.setItem(key, JSON.stringify(p));
    else sessionStorage.removeItem(key);
  } catch {
    /* Browser storage unavailable */
  }
};
