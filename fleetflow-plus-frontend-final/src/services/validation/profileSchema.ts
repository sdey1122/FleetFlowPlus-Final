import * as yup from "yup";
export const profileSchema = yup.object({
  bio: yup.string().trim().max(500).default(""),
  dob: yup
    .string()
    .default("")
    .test(
      "dob",
      "Enter a valid past date",
      (v) =>
        !v ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v &&
          Date.parse(v) <= Date.now()),
    ),
});
