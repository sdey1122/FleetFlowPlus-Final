import * as yup from "yup";
import { email } from "./commonFields";
export const forgotSchema = yup.object({ email });
