import type { UserLite } from './users';

export type ChatConversation = {
  id: string;
  other: UserLite;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastMessageMine: boolean;
  unread: number;
};

export type ChatMessage = { id: string; body: string; createdAt: string; mine: boolean };

export type ChatMessagePage = { items: ChatMessage[]; nextCursor: string | null };
