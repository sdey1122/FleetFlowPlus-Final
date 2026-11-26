import type { NotificationKind } from "../type/NotificationKind";
export interface INotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: string;
  readAt: string | null;
}
