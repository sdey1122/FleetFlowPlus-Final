import type { IFormField } from "../../types/interface/IFormField";
export const email: IFormField = {
  name: "email",
  label: "Email address",
  kind: "email",
  autoComplete: "email",
};
export const loginPassword: IFormField = {
  name: "password",
  label: "Password",
  kind: "password",
  autoComplete: "current-password",
};
export const password: IFormField = {
  ...loginPassword,
  autoComplete: "new-password",
};
export const confirm: IFormField = {
  name: "confirmPassword",
  label: "Confirm password",
  kind: "password",
  autoComplete: "new-password",
};
export const otp: IFormField = {
  name: "otp",
  label: "Verification code",
  kind: "otp",
};
export const registerFields: IFormField[] = [
  { name: "name", label: "Full name", kind: "text", autoComplete: "name" },
  email,
  { name: "phone", label: "Phone number", kind: "phone" },
  {
    name: "role",
    label: "Account role",
    kind: "select",
    options: [
      { value: "customer", label: "Customer" },
      { value: "dispatcher", label: "Dispatcher" },
      { value: "driver", label: "Driver" },
    ],
  },
  password,
  confirm,
];
