import * as yup from "yup";
import { email, otp } from "./commonFields";
export const verifySchema = yup.object({ email, otp });
