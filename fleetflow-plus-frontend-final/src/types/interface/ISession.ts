import type { IUser } from "./IUser";
export interface ISession {
  user: IUser;
  accessToken: string;
}
