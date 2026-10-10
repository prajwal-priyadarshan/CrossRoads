import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi, type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z, type ZodTypeAny } from 'zod';
import * as S from '@bridgeup/shared';
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
  { method: 'post', path: '/auth/register', tag: 'Auth', summary: 'Register with a college email; sends a 6-digit code', auth: 'public', body: S.registerSchema, status: 201 },
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
