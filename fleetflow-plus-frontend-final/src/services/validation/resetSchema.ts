import * as yup from "yup";
import { email, otp, password, confirmPassword } from "./commonFields";
export const resetSchema = yup.object({
  email,
  otp,
  password,
  confirmPassword,
});
