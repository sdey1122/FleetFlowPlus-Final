import * as yup from "yup";
import { email } from "./commonFields";
export const loginSchema = yup.object({
  email,
  password: yup.string().required("Password is required").max(256),
});
