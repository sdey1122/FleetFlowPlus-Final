import * as yup from "yup";
export const email = yup
  .string()
  .trim()
  .lowercase()
  .email("Enter a valid email")
  .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email")
  .max(254)
  .required("Email is required");
export const name = yup
  .string()
  .trim()
  .min(3)
  .max(32)
  .required("Name is required");
export const password = yup
  .string()
  .required("Password is required")
  .min(9)
  .max(32)
  .matches(/[A-Z]/, "Include an uppercase letter")
  .matches(/[a-z]/, "Include a lowercase letter")
  .matches(/[^\p{L}\p{N}\s]/u, "Include a special character")
  .test(
    "bytes",
    "Maximum 72 UTF-8 bytes",
    (v) => !v || new TextEncoder().encode(v).length <= 72,
  );
export const confirmPassword = yup
  .string()
  .required("Confirm your password")
  .oneOf([yup.ref("password")], "Passwords must match");
export const otp = yup
  .string()
  .matches(/^\d{6}$/, "Enter all six digits")
  .required();
