import type { IUser } from "./IUser";
export interface IAuthState {
  user: IUser | null;
  accessToken: string | null;
  status: "loading" | "guest" | "authenticated" | "unavailable";
}
