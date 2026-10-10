import type { UserLite } from './users';

export type StoryStatus = 'DRAFT' | 'PUBLISHED';

export type StorySummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  tags: string[];
  isSpotlight: boolean;
  status: StoryStatus;
  publishedAt: string | null;
  createdAt: string;
  featuredUser: UserLite | null;
};

export type StoryPage = { items: StorySummary[]; nextCursor: string | null };

export type StoryDetail = StorySummary & { body: string; related: StorySummary[] };
