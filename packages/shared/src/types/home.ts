import type { ConnectionKind, EventCategory, OpportunityType } from './enums';
import type { PostCard } from './posts';
import type { PersonCard, UserLite } from './users';

export type FeedItem = PostCard & { reason: string | null };
export type FeedPage = { items: FeedItem[]; nextCursor: string | null };

export type WeekEvent = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string | null;
  link: string | null;
  location: string | null;
};

export type Quest = { id: string; label: string; hint: string; done: boolean; href: string };
export type Quests = { items: Quest[]; done: number; total: number };
export type WayToHelp = { id: string; label: string; href: string; count?: number };

export type RailData = {
  thisWeek: WeekEvent[];
  quests: Quests | null;
  waysToHelp: WayToHelp[] | null;
  suggested: PersonCard[];
  pendingRequests: Array<{ id: string; kind: ConnectionKind; topic: string | null; message: string; createdAt: string; requester: UserLite }>;
  opportunities: Array<{ id: string; title: string; opportunityType: OpportunityType | null; deadline: string | null; organization: string | null }>;
  trending: Array<{ slug: string; name: string; icon: string; activity: number }>;
  spotlight: { slug: string; title: string; excerpt: string; coverUrl: string | null } | null;
};

export type SearchHit = { id: string; title: string; subtitle: string; url: string };
export type SearchGroup = 'questions' | 'posts' | 'opportunities' | 'experiences' | 'teams' | 'people' | 'companies' | 'stories';
export type SearchResults = Record<SearchGroup, SearchHit[]>;

export type BookmarkList = {
  posts: PostCard[];
  experiences: Array<{ id: string; title: string; subtitle: string; url: string }>;
  roadmaps: Array<{ id: string; title: string; subtitle: string; url: string }>;
  stories: Array<{ id: string; title: string; subtitle: string; url: string }>;
};
