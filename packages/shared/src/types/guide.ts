export type GuideSource = { n: number; file: string; heading: string; excerpt: string; score: number };

/** `ok`: an answer written from the sources. `fallback`: the matching passages, with no AI reply. `no_match`: nothing relevant. */
export type GuideAnswer = {
  status: 'ok' | 'fallback' | 'no_match';
  answer: string | null;
  citations?: number[];
  sources: GuideSource[];
};
