import type { UserLite } from './users';

/** Alumni dashboard: the mentoring and answering view for ALUMNI accounts (not the student home). */
export type AlumniDashboard = {
  stats: {
    mentees: number;
    pendingRequests: number;
    answersGiven: number;
    bestAnswers: number;
    helpfulVotes: number;
    points: number;
  };
  mentees: Array<{ id: string; kind: 'MENTORSHIP' | 'PEER_GUIDANCE'; topic: string | null; since: string; student: UserLite }>;
  pendingRequests: Array<{ id: string; kind: string; topic: string | null; message: string; createdAt: string; requester: UserLite }>;
  openQuestions: Array<{ id: string; title: string; tags: string[]; createdAt: string; author: UserLite }>;
  recentAnswers: Array<{ id: string; postId: string; postTitle: string; body: string; score: number; isBest: boolean; createdAt: string }>;
};
