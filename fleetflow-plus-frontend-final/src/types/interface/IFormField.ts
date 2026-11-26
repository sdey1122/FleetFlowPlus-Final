import type { FieldKind } from "../type/FieldKind";
export interface IFormField {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: {
    value: string;
    label: string;
  }[];
  autoComplete?: string;
}
