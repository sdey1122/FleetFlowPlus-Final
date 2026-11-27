import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { goodsOptions } from "../../constants/shipment";
const text = (max: number, min = 3) =>
  yup.string().trim().min(min).max(max).required();
const phone = yup
  .string()
  .required()
  .test(
    "e164",
    "Enter a valid international phone number",
    (v) => !!v && /^\+[1-9]\d{6,14}$/.test(v) && isValidPhoneNumber(v),
  );
const numeric = (max: number) =>
  yup.number().typeError("Enter a valid number").positive().max(max).required();
export const shipmentSchema = yup.object({
  senderName: text(80, 2),
  senderPhone: phone,
  pickupAddress: text(500),
  recipientName: text(80, 2),
  recipientPhone: phone,
  deliveryAddress: text(500),
  category: yup
    .string()
    .oneOf(goodsOptions.map((x) => x.value))
    .required(),
  description: text(300),
  weight: numeric(100),
  length: numeric(250),
  width: numeric(250),
  height: numeric(250),
  instructions: yup.string().max(300).default(""),
});
