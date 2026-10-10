/** Tuning constants for algorithms and lists. Product behaviour, not deployment config. */
export const LIMITS = {
  /** Default and maximum page sizes for cursor lists */
  PAGE_SIZE: 20,
  /** Chat: messages per page (newest first) and conversations shown in the inbox */
  CHAT_PAGE_SIZE: 30,
  CHAT_LIST_MAX: 50,
  /** Candidates scored in memory for people matching and twins */
  MATCH_CANDIDATES: 300,
  TWIN_CANDIDATES: 200,
  /** Seniors notified when a question is posted */
  QUESTION_NOTIFY_MAX: 20,
  /** Posts ranked for the "For you" feed */
  FEED_CANDIDATES: 300,
  FEED_WINDOW_DAYS: 30,
  /** Fallback window when a fresh database has few recent posts */
  FEED_FALLBACK_WINDOW_DAYS: 180,
  FEED_MIN_RECENT: 10,
  /** Upcoming events shown in This Week */
  WEEK_EVENTS: 8,
  /** Users notified at most when an opportunity matches their alert preferences */
  ALERT_NOTIFY_MAX: 500,
  /** Teams listed in one request (the list is short and filtered client-side by tab) */
  TEAMS_MAX: 60,
  /** Alumni founders suggested on the founder track */
  TEAM_ADVISORS: 6,
  /** Notifications shown in the bell popover */
  BELL_NOTIFICATIONS: 8,
  /** Similar-question suggestions */
  SIMILAR_MIN_CHARS: 8,
  SIMILAR_MAX: 5,
  SIMILAR_THRESHOLD: 0.15,
} as const;

export const DAY_MS = 864e5;
