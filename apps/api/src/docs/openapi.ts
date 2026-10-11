import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi, type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z, type ZodTypeAny } from 'zod';
import * as S from '@crossroads/shared';
import { env } from '../config/env';

// Adds .openapi() to the zod prototype (also for the shared schemas, which use the same zod instance)
extendZodWithOpenApi(z);

/**
 * OpenAPI 3 document built from the same zod schemas the routes validate with,
 * so the docs cannot drift from the real request rules.
 * Add a row to ROUTES whenever you add an endpoint.
 */

type Auth = 'public' | 'auth' | 'onboarded' | 'admin';
type Row = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string; // Express style (:id); converted to {id}
  tag: string;
  summary: string;
  auth: Auth;
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  status?: number;
};

const ROUTES: Row[] = [
  // System
  { method: 'get', path: '/health', tag: 'System', summary: 'Liveness and database readiness', auth: 'public' },
  { method: 'get', path: '/config', tag: 'System', summary: 'Public app settings (email domains, demo accounts, flags)', auth: 'public' },

  // Auth
  { method: 'post', path: '/auth/register', tag: 'Auth', summary: 'Register with a college email (or a personal email for alumni); sends a 6-digit code unless AUTO_VERIFY_EMAIL is on', auth: 'public', body: S.registerSchema, status: 201 },
  { method: 'post', path: '/auth/verify', tag: 'Auth', summary: 'Verify the email code and start a session', auth: 'public', body: S.verifySchema },
  { method: 'post', path: '/auth/resend-code', tag: 'Auth', summary: 'Resend the verification code', auth: 'public', body: S.emailOnlySchema },
  { method: 'post', path: '/auth/login', tag: 'Auth', summary: 'Log in and set the session cookie', auth: 'public', body: S.loginSchema },
  { method: 'post', path: '/auth/logout', tag: 'Auth', summary: 'Clear the session cookie', auth: 'auth' },
  { method: 'get', path: '/auth/me', tag: 'Auth', summary: 'The signed-in user, or null', auth: 'public' },
  { method: 'post', path: '/auth/demo-login', tag: 'Auth', summary: 'Sign in as a demo account (DEMO_MODE only)', auth: 'public', body: S.demoLoginSchema },

  // Users and profiles
  { method: 'patch', path: '/me/onboarding', tag: 'Users', summary: 'Complete onboarding; the server assigns the role', auth: 'auth', body: S.onboardingSchema },
  { method: 'patch', path: '/me/profile', tag: 'Users', summary: 'Update any subset of profile fields', auth: 'onboarded', body: S.profileUpdateSchema },
  { method: 'get', path: '/users/:handle', tag: 'Users', summary: 'Public profile with match and connection status', auth: 'onboarded' },
  { method: 'post', path: '/me/milestones', tag: 'Users', summary: 'Add a journey milestone', auth: 'onboarded', body: S.milestoneSchema, status: 201 },
  { method: 'delete', path: '/me/milestones/:id', tag: 'Users', summary: 'Delete one of your milestones', auth: 'onboarded' },

  // People and requests
  { method: 'get', path: '/people', tag: 'People', summary: 'Discover people with filters and explained match scores', auth: 'onboarded', query: S.peopleQuerySchema },
  { method: 'get', path: '/people/suggested', tag: 'People', summary: 'Top 3 suggested people', auth: 'onboarded' },
  { method: 'post', path: '/people/search/ai', tag: 'People', summary: 'Natural-language people search (AI parses it into filters; falls back to keyword matching)', auth: 'onboarded', body: S.aiPeopleSearchSchema, status: 200 },
  { method: 'post', path: '/connections', tag: 'Requests', summary: 'Send a connect / mentorship / collab / peer request', auth: 'onboarded', body: S.connectionCreateSchema, status: 201 },
  { method: 'get', path: '/connections', tag: 'Requests', summary: 'Incoming, outgoing or completed requests', auth: 'onboarded', query: S.connectionsQuerySchema },
  { method: 'patch', path: '/connections/:id', tag: 'Requests', summary: 'Accept or decline (recipient only)', auth: 'onboarded', body: S.connectionRespondSchema },
  { method: 'post', path: '/connections/:id/complete', tag: 'Requests', summary: 'Mark a mentorship session completed (mentor only)', auth: 'onboarded', body: S.completeSchema },
  { method: 'put', path: '/connections/:id/follow-ups', tag: 'Requests', summary: 'Replace the follow-up checklist', auth: 'onboarded', body: S.followUpsSchema },

  // Community
  { method: 'get', path: '/topics', tag: 'Community', summary: 'Topics with follower counts and your follow state', auth: 'auth' },
  { method: 'post', path: '/topics/:id/follow', tag: 'Community', summary: 'Follow a topic', auth: 'onboarded' },
  { method: 'delete', path: '/topics/:id/follow', tag: 'Community', summary: 'Unfollow a topic', auth: 'onboarded' },
  { method: 'get', path: '/posts', tag: 'Community', summary: 'List posts (cursor paginated)', auth: 'onboarded', query: S.postListQuerySchema },
  { method: 'post', path: '/posts', tag: 'Community', summary: 'Create a question, discussion or opportunity', auth: 'onboarded', body: S.postCreateSchema, status: 201 },
  { method: 'get', path: '/posts/:id', tag: 'Community', summary: 'Post with its comment tree', auth: 'onboarded' },
  { method: 'delete', path: '/posts/:id', tag: 'Community', summary: 'Delete your post (or any, as admin)', auth: 'onboarded' },
  { method: 'post', path: '/posts/:id/comments', tag: 'Community', summary: 'Answer, comment or reply (one level)', auth: 'onboarded', body: S.commentCreateSchema, status: 201 },
  { method: 'post', path: '/posts/:id/best-answer', tag: 'Community', summary: 'Choose the best answer (asker only)', auth: 'onboarded', body: S.bestAnswerSchema },
  { method: 'get', path: '/questions/similar', tag: 'Community', summary: 'Similar answered questions (trigram)', auth: 'onboarded', query: z.object({ q: z.string() }) },
  { method: 'put', path: '/votes', tag: 'Community', summary: 'Set your vote (1, -1 or 0)', auth: 'onboarded', body: S.voteSchema },

  // Home, bookmarks, search
  { method: 'get', path: '/feed', tag: 'Home', summary: 'Ranked feed with a reason per item', auth: 'onboarded', query: S.feedQuerySchema },
  { method: 'get', path: '/home/rail', tag: 'Home', summary: 'Everything the home right rail needs', auth: 'onboarded', query: S.railQuerySchema },
  { method: 'get', path: '/chat/conversations', tag: 'Chat', summary: 'Your conversations with unread counts (connected people only)', auth: 'onboarded' },
  { method: 'post', path: '/chat/conversations', tag: 'Chat', summary: 'Open a conversation with a connected person', auth: 'onboarded', body: S.chatStartSchema, status: 201 },
  { method: 'get', path: '/chat/conversations/:id/messages', tag: 'Chat', summary: 'Messages in a conversation, newest first, cursor paged', auth: 'onboarded', query: S.chatMessagesQuerySchema },
  { method: 'post', path: '/chat/conversations/:id/messages', tag: 'Chat', summary: 'Send a message (connected people only)', auth: 'onboarded', body: S.chatSendSchema, status: 201 },
  { method: 'get', path: '/chat/stream', tag: 'Chat', summary: 'Server-sent events: chat.message when a message arrives or is sent from another tab', auth: 'onboarded' },
  { method: 'post', path: '/chat/conversations/:id/read', tag: 'Chat', summary: 'Mark a conversation as read', auth: 'onboarded' },
  { method: 'get', path: '/events', tag: 'Events', summary: 'Upcoming events with seats left and your RSVP', auth: 'onboarded' },
  { method: 'post', path: '/events/:id/rsvp', tag: 'Events', summary: 'RSVP to an event; paid events issue a ticket code (test mode)', auth: 'onboarded', status: 201 },
  { method: 'delete', path: '/events/:id/rsvp', tag: 'Events', summary: 'Cancel your RSVP', auth: 'onboarded' },
  { method: 'get', path: '/me/tickets', tag: 'Events', summary: 'Your upcoming tickets', auth: 'onboarded' },
  { method: 'get', path: '/giving/campaigns', tag: 'Giving', summary: 'Campaigns for infrastructure, research and scholarships', auth: 'onboarded' },
  { method: 'get', path: '/giving/campaigns/:slug', tag: 'Giving', summary: 'One campaign with its story and recent donations', auth: 'onboarded' },
  { method: 'post', path: '/giving/campaigns/:slug/donate', tag: 'Giving', summary: 'Donate; recorded in test mode with a receipt number', auth: 'onboarded', body: S.donateSchema, status: 201 },
  { method: 'get', path: '/admin/analytics', tag: 'Admin', summary: 'Institution overview: counts by role, department and batch (ADMIN)', auth: 'admin' },
  { method: 'post', path: '/admin/official-posts', tag: 'Admin', summary: 'Publish a post from a college office (ADMIN)', auth: 'admin', body: S.officialPostSchema, status: 201 },
  { method: 'get', path: '/me/export', tag: 'Account', summary: 'Download everything the platform holds about you as JSON', auth: 'auth' },
  { method: 'delete', path: '/me', tag: 'Account', summary: 'Delete your account after confirming your password', auth: 'auth', body: S.deleteAccountSchema },
  { method: 'post', path: '/guide/ask', tag: 'Guide', summary: 'Ask the project guide. Answers come from the project docs and cite them', auth: 'auth', body: S.guideQuestionSchema },
  { method: 'get', path: '/alumni/dashboard', tag: 'Home', summary: 'Alumni dashboard: mentees, requests, open questions, own answers (ALUMNI only)', auth: 'onboarded' },
  { method: 'get', path: '/events/week', tag: 'Home', summary: 'Events in the next 7 days for your year', auth: 'onboarded' },
  { method: 'put', path: '/bookmarks', tag: 'Home', summary: 'Toggle a bookmark', auth: 'onboarded', body: S.bookmarkSchema },
  { method: 'get', path: '/bookmarks', tag: 'Home', summary: 'Your bookmarks grouped by type', auth: 'onboarded', query: S.bookmarksQuerySchema },
  { method: 'get', path: '/search', tag: 'Home', summary: 'Unified search across people, posts, companies and more', auth: 'onboarded', query: S.searchQuerySchema },

  // Campus intelligence
  { method: 'get', path: '/companies', tag: 'Campus', summary: 'Companies with experience and alumni counts', auth: 'onboarded', query: S.companyListQuerySchema },
  { method: 'get', path: '/companies/:slug', tag: 'Campus', summary: 'Company detail with skills you have and stats', auth: 'onboarded' },
  { method: 'get', path: '/companies/:slug/experiences', tag: 'Campus', summary: 'Interview experiences with filters', auth: 'onboarded', query: S.experienceFilterSchema },
  { method: 'get', path: '/companies/:slug/alumni', tag: 'Campus', summary: 'People who work at this company', auth: 'onboarded' },
  { method: 'post', path: '/experiences', tag: 'Campus', summary: 'Share a structured interview experience', auth: 'onboarded', body: S.experienceCreateSchema, status: 201 },
  { method: 'get', path: '/experiences/:id', tag: 'Campus', summary: 'One interview experience', auth: 'onboarded' },
  { method: 'get', path: '/clubs', tag: 'Campus', summary: 'Clubs with average ratings', auth: 'onboarded', query: S.clubListQuerySchema },
  { method: 'get', path: '/clubs/:slug', tag: 'Campus', summary: 'Club detail with reviews and members', auth: 'onboarded' },
  { method: 'put', path: '/clubs/:slug/review', tag: 'Campus', summary: 'Create or update your club review', auth: 'onboarded', body: S.clubReviewSchema },
  { method: 'get', path: '/path-twins', tag: 'Campus', summary: 'Seniors and alumni whose journey started like yours', auth: 'onboarded' },
  { method: 'get', path: '/roadmaps', tag: 'Campus', summary: 'Roadmaps by goal, or yours', auth: 'onboarded', query: S.roadmapListQuerySchema },
  { method: 'post', path: '/roadmaps', tag: 'Campus', summary: 'Publish a roadmap', auth: 'onboarded', body: S.roadmapCreateSchema, status: 201 },
  { method: 'get', path: '/roadmaps/:id', tag: 'Campus', summary: 'Roadmap with your progress', auth: 'onboarded' },
  { method: 'put', path: '/roadmaps/:id/save', tag: 'Campus', summary: 'Toggle saving a roadmap', auth: 'onboarded' },
  { method: 'patch', path: '/roadmaps/:id/steps/:stepId', tag: 'Campus', summary: 'Tick or untick a step (auto-saves)', auth: 'onboarded', body: S.roadmapStepToggleSchema },

  // Opportunities and alerts
  { method: 'get', path: '/opportunities', tag: 'Opportunities', summary: 'Open opportunities with deadlines and a reason per item', auth: 'onboarded', query: S.opportunityListQuerySchema },
  { method: 'get', path: '/me/alerts', tag: 'Opportunities', summary: 'Your opportunity alert preferences', auth: 'onboarded' },
  { method: 'put', path: '/me/alerts', tag: 'Opportunities', summary: 'Replace your alert preferences (types, topics, keywords)', auth: 'onboarded', body: S.alertPrefsSchema },

  // Teams, founder track and study circles
  { method: 'get', path: '/teams', tag: 'Teams', summary: 'Open listings with your skill overlap', auth: 'onboarded', query: S.teamListQuerySchema },
  { method: 'get', path: '/teams/advisors', tag: 'Teams', summary: 'Alumni and seniors who can advise founders', auth: 'onboarded' },
  { method: 'post', path: '/teams', tag: 'Teams', summary: 'Create a hackathon team, project, startup or study circle', auth: 'onboarded', body: S.teamCreateSchema, status: 201 },
  { method: 'get', path: '/teams/:id', tag: 'Teams', summary: 'Listing with members; applications for the owner', auth: 'onboarded' },
  { method: 'post', path: '/teams/:id/apply', tag: 'Teams', summary: 'Apply once with a message', auth: 'onboarded', body: S.teamApplySchema, status: 201 },
  { method: 'post', path: '/teams/:id/join', tag: 'Teams', summary: 'Join an open study circle instantly', auth: 'onboarded', status: 201 },
  { method: 'patch', path: '/teams/:id/applications/:appId', tag: 'Teams', summary: 'Accept or reject an applicant (owner only)', auth: 'onboarded', body: S.applicationRespondSchema },
  { method: 'patch', path: '/teams/:id', tag: 'Teams', summary: 'Close or reopen your listing', auth: 'onboarded', body: S.teamUpdateSchema },

  // Notifications
  { method: 'get', path: '/notifications', tag: 'Notifications', summary: 'Your notifications (cursor paginated, filterable)', auth: 'auth', query: S.notificationListQuerySchema },
  { method: 'get', path: '/notifications/unread-count', tag: 'Notifications', summary: 'Unread count for the bell badge', auth: 'auth' },
  { method: 'post', path: '/notifications/read', tag: 'Notifications', summary: 'Mark some or all notifications read', auth: 'auth', body: S.markReadSchema },

  // Success stories (public)
  { method: 'get', path: '/stories', tag: 'Stories', summary: 'Published stories, newest first', auth: 'public' },
  { method: 'get', path: '/stories/:slug', tag: 'Stories', summary: 'One story with related stories', auth: 'public' },

  // Reporting and moderation
  { method: 'post', path: '/reports', tag: 'Moderation', summary: 'Report a post, comment, experience, profile, team, story or conversation. HARASSMENT reports route only to safeguarding coordinators', auth: 'auth', body: S.reportCreateSchema },

  // Gamification
  { method: 'get', path: '/mentor-wall', tag: 'Gamification', summary: 'Top mentors by points this month (opted-in seniors/alumni)', auth: 'auth' },
  { method: 'get', path: '/users/:handle/contributions', tag: 'Gamification', summary: 'Contribution counts, badges and recent points for a profile', auth: 'auth' },

  // Admin
  { method: 'get', path: '/admin/reports', tag: 'Admin', summary: 'Open reports. HARASSMENT reports and conversation content are withheld unless the viewer is a safeguarding coordinator', auth: 'admin' },
  { method: 'patch', path: '/admin/reports/:id', tag: 'Admin', summary: 'Resolve a report (remove the content or dismiss)', auth: 'admin', body: S.reportResolveSchema },
  { method: 'get', path: '/admin/users', tag: 'Admin', summary: 'Users for moderation', auth: 'admin' },
  { method: 'patch', path: '/admin/users/:id', tag: 'Admin', summary: 'Update a user\'s role or verification', auth: 'admin', body: S.adminUserUpdateSchema },
  { method: 'post', path: '/admin/allowlist', tag: 'Admin', summary: 'Invite an alumni email outside the college domain', auth: 'admin', body: S.allowlistSchema },
  { method: 'get', path: '/admin/events', tag: 'Admin', summary: 'All events for management', auth: 'admin' },
  { method: 'post', path: '/admin/events', tag: 'Admin', summary: 'Create an event', auth: 'admin', body: S.eventUpsertSchema, status: 201 },
  { method: 'patch', path: '/admin/events/:id', tag: 'Admin', summary: 'Update an event', auth: 'admin', body: S.eventUpsertSchema },
  { method: 'delete', path: '/admin/events/:id', tag: 'Admin', summary: 'Delete an event', auth: 'admin' },
  { method: 'get', path: '/admin/companies', tag: 'Admin', summary: 'All companies for management', auth: 'admin' },
  { method: 'post', path: '/admin/companies', tag: 'Admin', summary: 'Create a company', auth: 'admin', body: S.companyUpsertSchema, status: 201 },
  { method: 'patch', path: '/admin/companies/:id', tag: 'Admin', summary: 'Update a company', auth: 'admin', body: S.companyUpsertSchema },
  { method: 'get', path: '/admin/clubs', tag: 'Admin', summary: 'All clubs for management', auth: 'admin' },
  { method: 'post', path: '/admin/clubs', tag: 'Admin', summary: 'Create a club', auth: 'admin', body: S.clubUpsertSchema, status: 201 },
  { method: 'patch', path: '/admin/clubs/:id', tag: 'Admin', summary: 'Update a club', auth: 'admin', body: S.clubUpsertSchema },
  { method: 'get', path: '/admin/stories', tag: 'Admin', summary: 'All stories including drafts', auth: 'admin' },
  { method: 'post', path: '/admin/stories', tag: 'Admin', summary: 'Create a story', auth: 'admin', body: S.storyUpsertSchema, status: 201 },
  { method: 'patch', path: '/admin/stories/:id', tag: 'Admin', summary: 'Update a story', auth: 'admin', body: S.storyUpsertSchema },
  { method: 'get', path: '/admin/experiences', tag: 'Admin', summary: 'All interview experiences for verification', auth: 'admin' },
  { method: 'patch', path: '/admin/experiences/:id', tag: 'Admin', summary: 'Mark an experience verified', auth: 'admin' },

  // AI (Phase 09) — no-op without ANTHROPIC_API_KEY; see the non-AI fallback in each service
  { method: 'post', path: '/ai/answer', tag: 'AI', summary: 'AI answer to a question, grounded in past answers with citations', auth: 'onboarded' },
  { method: 'post', path: '/ai/summary', tag: 'AI', summary: 'AI summary of a thread or a company\'s interview experiences', auth: 'onboarded' },
  { method: 'post', path: '/assistant/ask', tag: 'AI', summary: 'Crossroads Assistant: routes a chat message to people search, platform search or a feature, with a deterministic fallback', auth: 'onboarded', body: S.assistantAskSchema, status: 200 },

  // Placement prep dashboard (Phase 09)
  { method: 'get', path: '/prep/dashboard', tag: 'Prep', summary: 'Readiness per target company and the four prep tracks', auth: 'onboarded' },
  { method: 'put', path: '/prep/targets', tag: 'Prep', summary: 'Set target companies and roles', auth: 'onboarded', body: S.targetsSchema },

  // OA / interview simulator (Phase 09)
  { method: 'post', path: '/sim/sessions', tag: 'Prep', summary: 'Start a simulator session and get the first question', auth: 'onboarded', body: S.simStartSchema },
  { method: 'get', path: '/sim/sessions', tag: 'Prep', summary: 'Your simulator sessions and scores', auth: 'onboarded' },
  { method: 'get', path: '/sim/sessions/:id', tag: 'Prep', summary: 'One simulator session with its questions and answers', auth: 'onboarded' },
  { method: 'post', path: '/sim/sessions/:id/answer', tag: 'Prep', summary: 'Answer the current question; MCQ is graded, others are graded against the rubric', auth: 'onboarded', body: S.simAnswerSchema },
  { method: 'post', path: '/sim/sessions/:id/finish', tag: 'Prep', summary: 'Finish a session and get topic accuracy and what to revise', auth: 'onboarded' },
  { method: 'post', path: '/prep/items', tag: 'Prep', summary: 'Add a custom prep item to a track', auth: 'onboarded', body: S.prepItemSchema, status: 201 },
  { method: 'post', path: '/prep/items/import', tag: 'Prep', summary: 'Import prep items from a company', auth: 'onboarded' },
  { method: 'patch', path: '/prep/items/:id', tag: 'Prep', summary: 'Tick or rename a prep item', auth: 'onboarded', body: S.prepItemUpdateSchema },
  { method: 'delete', path: '/prep/items/:id', tag: 'Prep', summary: 'Delete a prep item', auth: 'onboarded' },
  { method: 'post', path: '/roadmaps/generate', tag: 'Campus', summary: 'Generate a roadmap from alumni journeys and target companies (AI with a non-AI fallback)', auth: 'onboarded', body: S.roadmapGenerateSchema, status: 201 },
];

const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), fields: z.record(z.string()).optional() }),
});

const AUTH_NOTE: Record<Auth, string> = {
  public: '',
  auth: 'Requires a session.',
  onboarded: 'Requires a session and a completed onboarding.',
  admin: 'Admins only.',
};

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();
  registry.registerComponent('securitySchemes', 'session', {
    type: 'apiKey',
    in: 'cookie',
    name: 'bu_session',
    description: 'httpOnly JWT cookie set by /auth/verify, /auth/login or /auth/demo-login',
  });

  for (const r of ROUTES) {
    const params = [...r.path.matchAll(/:(\w+)/g)].map((m) => m[1]!);
    const config: RouteConfig = {
      method: r.method,
      path: r.path.replace(/:(\w+)/g, '{$1}'),
      tags: [r.tag],
      summary: r.summary,
      description: AUTH_NOTE[r.auth] || undefined,
      security: r.auth === 'public' ? [] : [{ session: [] }],
      request: {
        ...(params.length ? { params: z.object(Object.fromEntries(params.map((p) => [p, z.string()]))) } : {}),
        ...(r.query ? { query: r.query as z.AnyZodObject } : {}),
        ...(r.body ? { body: { content: { 'application/json': { schema: r.body } } } } : {}),
      },
      responses: {
        [r.status ?? 200]: {
          description: 'Success. Lists return { data: { items, nextCursor } } where paginated.',
          content: { 'application/json': { schema: z.object({ data: z.any() }) } },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: errorSchema } } },
        ...(r.auth !== 'public'
          ? {
              401: { description: 'Not signed in', content: { 'application/json': { schema: errorSchema } } },
              403: { description: 'Not allowed', content: { 'application/json': { schema: errorSchema } } },
            }
          : {}),
      },
    };
    registry.registerPath(config);
  }

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: `${env.APP_NAME} API`,
      version: '1.0.0',
      description:
        'All endpoints live under /api. Responses use { data } on success and { error: { code, message, fields? } } on failure. ' +
        'Writes must be JSON. Sign in with POST /auth/demo-login (DEMO_MODE) to try authenticated endpoints from this page.',
    },
    servers: [{ url: '/api' }],
  });
}
