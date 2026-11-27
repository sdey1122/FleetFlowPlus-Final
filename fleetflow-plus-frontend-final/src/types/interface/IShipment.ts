import type { IPlace } from "./IPlace";
import type { GoodsCategory } from "../type/GoodsCategory";
export interface IShipment {
  pickup: IPlace;
  destination: IPlace;
  pickupAddress: string;
  deliveryAddress: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  category: GoodsCategory;
  description: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  instructions: string;
  declaredSafe: boolean;
}
