import * as yup from "yup";
import { email } from "./commonFields";
export const contactSchema = yup.object({
  name: yup.string().trim().min(3).max(80).required(),
  email,
  message: yup.string().trim().min(10).max(2000).required(),
});
