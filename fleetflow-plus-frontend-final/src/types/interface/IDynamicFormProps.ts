import type { ReactNode } from "react";
import type { ObjectSchema, AnyObject } from "yup";
import type { IFormField } from "./IFormField";
export interface IDynamicFormProps {
  fields: IFormField[];
  schema: ObjectSchema<AnyObject>;
  initial: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  submitLabel: string;
  extra?: ReactNode;
}
