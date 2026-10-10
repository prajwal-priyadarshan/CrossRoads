export type NotificationType =
  | 'ANSWER'
  | 'COMMENT'
  | 'REQUEST'
  | 'REQUEST_RESPONSE'
  | 'APPLICATION'
  | 'BADGE'
  | 'OPPORTUNITY'
  | 'MENTION'
  | 'SYSTEM';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPage = { items: NotificationItem[]; nextCursor: string | null };
