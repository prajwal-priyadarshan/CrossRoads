import type { CommentNode, PostCard } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { userLiteSelect } from '../users/users.serializers';

export const postInclude = {
  author: { select: userLiteSelect },
  topic: { select: { id: true, slug: true, name: true, icon: true } },
} satisfies Prisma.PostInclude;

export type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export type ViewerState = {
  votes: Map<string, number>;
  bookmarks: Set<string>;
  seniorAnswered?: Set<string>;
};

export function toPostCard(p: PostRow, state: ViewerState): PostCard {
  return {
    id: p.id,
    kind: p.kind,
    title: p.title,
    excerpt: p.body.length > 220 ? `${p.body.slice(0, 220).trimEnd()}…` : p.body,
    topic: p.topic,
    tags: p.tags,
    author: p.author,
    score: p.score,
    commentCount: p.commentCount,
    hasBestAnswer: p.bestAnswerId !== null,
    hasSeniorAnswer: state.seniorAnswered?.has(p.id) ?? false,
    opportunityType: p.opportunityType,
    organization: p.organization,
    deadline: p.deadline ? p.deadline.toISOString() : null,
    externalUrl: p.externalUrl,
    createdAt: p.createdAt.toISOString(),
    myVote: state.votes.get(p.id) ?? 0,
    bookmarked: state.bookmarks.has(p.id),
  };
}

export const commentInclude = { author: { select: userLiteSelect } } satisfies Prisma.CommentInclude;
export type CommentRow = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

export function buildTree(comments: CommentRow[], myVotes: Map<string, number>, bestAnswerId: string | null) {
  const byId = new Map<string, CommentNode>();
  for (const c of comments) {
    byId.set(c.id, {
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      body: c.body,
      score: c.score,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      myVote: myVotes.get(c.id) ?? 0,
      isBest: c.id === bestAnswerId,
      replies: [],
    });
  }
  const roots: CommentNode[] = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.replies.push(c);
    else if (!c.parentId) roots.push(c);
  }
  // Best answer first, then by score, then oldest
  roots.sort(
    (a, b) => Number(b.isBest) - Number(a.isBest) || b.score - a.score || +new Date(a.createdAt) - +new Date(b.createdAt),
  );
  return roots;
}
