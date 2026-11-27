import type { ServiceTier } from "../type/ServiceTier";
export interface IPrice {
  tier: ServiceTier;
  label: string;
  delivery: number;
  platformFee: number;
  tax: number;
  total: number;
  volumetric: number;
  chargeable: number;
  currency: "INR";
}
