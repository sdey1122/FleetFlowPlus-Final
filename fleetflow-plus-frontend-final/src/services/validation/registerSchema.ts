import * as yup from "yup";
import { email, name, password, confirmPassword } from "./commonFields";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
export const registerSchema = yup.object({
  name,
  email,
  phone: yup
    .string()
    .required("Phone is required")
    .test("phone", "Enter a valid international phone number", (v) => {
      const p = parsePhoneNumberFromString(v || "");
      return !!p?.isValid() && p.number === v;
    }),
  role: yup.string().oneOf(["customer", "dispatcher", "driver"]).required(),
  password,
  confirmPassword,
});
