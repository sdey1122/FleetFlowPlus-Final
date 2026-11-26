import type { INotification } from "./INotification";
export interface INotificationList {
  items: INotification[];
  unreadCount: number;
}
