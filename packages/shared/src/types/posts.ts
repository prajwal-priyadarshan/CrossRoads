import type { OpportunityType, PostKind } from './enums';
import type { UserLite } from './users';

export type TopicWithFollow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  followers: number;
  posts: number;
  followed: boolean;
};

export type TopicRef = { id: number; slug: string; name: string; icon: string };

export type PostCard = {
  id: string;
  kind: PostKind;
  title: string;
  excerpt: string;
  topic: TopicRef | null;
  tags: string[];
  author: UserLite;
  score: number;
  commentCount: number;
  hasBestAnswer: boolean;
  hasSeniorAnswer: boolean;
  /** Set for official posts from a college office, e.g. 'Placement Cell' */
  officeName: string | null;
  opportunityType: OpportunityType | null;
  organization: string | null;
  deadline: string | null;
  externalUrl: string | null;
  createdAt: string;
  myVote: number;
  bookmarked: boolean;
};

export type CommentNode = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  score: number;
  createdAt: string;
  author: UserLite;
  myVote: number;
  isBest: boolean;
  replies: CommentNode[];
};

export type PostDetail = {
  post: PostCard & { body: string };
  comments: CommentNode[];
  canMarkBest: boolean;
  isAuthor: boolean;
};

export type SimilarQuestion = { id: string; title: string; commentCount: number; hasBest: boolean };
export type PostPage = { items: PostCard[]; nextCursor: string | null };
