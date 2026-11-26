import { http, waitForRefresh } from "./axiosInstance";
import type { IApiResponse } from "../../types/interface/IApiResponse";
import type { ISession } from "../../types/interface/ISession";
import type { IUser } from "../../types/interface/IUser";
import type { IVerificationResult } from "../../types/interface/IVerificationResult";
import type { IResendResult } from "../../types/interface/IResendResult";
import type { ILogin } from "../../types/interface/ILogin";
import type { IRegister } from "../../types/interface/IRegister";
import type { IVerifyEmail } from "../../types/interface/IVerifyEmail";
import type { IResetPassword } from "../../types/interface/IResetPassword";
const post = async <T>(url: string, body: object) =>
  (await http.post<IApiResponse<T>>(url, body)).data.data;
export const authApi = {
  register: (v: IRegister) => post<IVerificationResult>("auth/register", v),
  login: async (v: ILogin) => {
    await waitForRefresh();
    return post<ISession>("auth/login", v);
  },
  verify: (v: IVerifyEmail) =>
    post<{
      user: IUser;
    }>("auth/verify-email", v),
  resend: (reverifyToken: string) =>
    post<IResendResult>("auth/resend-otp", { reverifyToken }),
  forgot: (email: string) =>
    post<{
      expiresIn: number;
    }>("auth/forgot-password", { email }),
  reset: async (v: IResetPassword) => {
    await waitForRefresh();
    return post<unknown>("auth/reset-password", v);
  },
  logout: async () => {
    await waitForRefresh();
    return post<unknown>("auth/logout", {});
  },
  me: async () =>
    (
      await http.get<
        IApiResponse<{
          user: IUser;
        }>
      >("auth/me")
    ).data.data.user,
};
