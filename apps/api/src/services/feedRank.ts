import { titleCase } from '../lib/text';

export type FeedViewer = {
  role: string;
  currentYear: number | null;
  skills: string[];
  interests: string[];
  alertTypes: string[];
};

export type FeedPost = {
  id: string;
  kind: string;
  topicId: number | null;
  topic: { name: string } | null;
  tags: string[];
  opportunityType: string | null;
  author: { role: string; department: string | null };
  score: number;
  commentCount: number;
  bestAnswerId: string | null;
  createdAt: Date | string;
};

/** Hot score = (relevance + quality) / (ageHours + 2)^1.25, with the strongest relevance term as the reason. */
export function rankFeed<T extends FeedPost>(viewer: FeedViewer, followedTopicIds: Set<number>, posts: T[], now = Date.now()) {
  const mine = new Set([...viewer.interests, ...viewer.skills]);
  const helper = viewer.role === 'SENIOR' || viewer.role === 'ALUMNI';
  const scored = posts.map((p) => {
    const terms: Array<[number, string]> = [];
    if (p.topicId && followedTopicIds.has(p.topicId)) terms.push([3, `Because you follow ${p.topic?.name ?? 'this topic'}`]);
    const tagHits = p.tags.filter((t) => mine.has(t));
    if (tagHits.length) terms.push([2 * Math.min(1, tagHits.length / 2), `Matches your interest: ${titleCase(tagHits[0])}`]);
    if (p.kind === 'OPPORTUNITY' && ((p.opportunityType && viewer.alertTypes.includes(p.opportunityType)) || tagHits.length)) {
      terms.push([1.5, `Opportunity for ${titleCase(tagHits[0] ?? (p.opportunityType ?? '').toLowerCase().replace(/_/g, ' '))}`]);
    }
    if ((p.author.role === 'SENIOR' || p.author.role === 'ALUMNI') && (viewer.currentYear ?? 9) <= 2) {
      terms.push([1, p.author.role === 'ALUMNI' ? 'From an alumnus' : `From a senior in ${p.author.department ?? 'your college'}`]);
    }
    const helpTag = p.tags.find((t) => viewer.skills.includes(t));
    if (p.kind === 'QUESTION' && p.commentCount === 0 && helper && helpTag) terms.push([1, `You can help: ${titleCase(helpTag)}`]);

    const relevance = 0.5 + terms.reduce((s, [w]) => s + w, 0);
    const quality =
      Math.sign(p.score) * Math.log10(1 + Math.abs(p.score)) +
      (0.3 * Math.min(p.commentCount, 10)) / 10 +
      (p.bestAnswerId ? 0.5 : 0);
    const ageHours = Math.max(0, (now - new Date(p.createdAt).getTime()) / 36e5);
    const hot = (relevance + quality) / Math.pow(ageHours + 2, 1.25);
    terms.sort((a, b) => b[0] - a[0]);
    const reason = terms[0]?.[1] ?? (p.score >= 5 ? 'Popular this week' : null);
    return { ...p, hot, reason };
  });
  scored.sort((a, b) => b.hot - a.hot);
  return diversify(scored);
}

/** Avoid three posts in a row from the same topic by swapping in the next different-topic item. */
export function diversify<T extends { topicId: number | null }>(items: T[]) {
  const out = [...items];
  for (let i = 2; i < out.length; i++) {
    const t = out[i]!.topicId;
    if (t != null && t === out[i - 1]!.topicId && t === out[i - 2]!.topicId) {
      const j = out.findIndex((x, k) => k > i && x.topicId !== t);
      if (j > -1) [out[i], out[j]] = [out[j]!, out[i]!];
    }
  }
  return out;
}
