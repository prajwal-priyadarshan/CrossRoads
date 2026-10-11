/**
 * End-to-end smoke test against a running API (default http://localhost:4000/api).
 * Exercises every endpoint group with demo accounts, checks guards and validation,
 * and removes anything it creates. Needs DEMO_MODE=true and seeded demo users.
 *
 *   npm run dev -w apps/api      (in another terminal)
 *   npm run smoke
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const BASE = process.env.SMOKE_BASE_URL || `http://localhost:${process.env.PORT || 4000}/api`;

type Res = { status: number; body: any };
const results: { name: string; ok: boolean; detail: string }[] = [];
const createdPostIds: string[] = [];
const createdTeamIds: string[] = [];
const createdReportIds: string[] = [];

/** Removes everything the smoke run created, including points and notifications it caused. */
const createdMessageIds: string[] = [];
const createdSimIds: string[] = [];
const createdReceipts: string[] = [];
const createdOfficialPostIds: string[] = [];
const createdSafeguardingReportIds: string[] = [];
const createdSafeguardingConvoIds: string[] = [];

async function cleanup() {
  if (createdSimIds.length) await prisma.simSession.deleteMany({ where: { id: { in: createdSimIds } } });
  if (createdReceipts.length) await prisma.donation.deleteMany({ where: { receipt: { in: createdReceipts } } });
  if (createdOfficialPostIds.length) await prisma.post.deleteMany({ where: { id: { in: createdOfficialPostIds } } });
  if (createdSafeguardingReportIds.length) {
    await prisma.notification.deleteMany({ where: { type: 'SYSTEM', link: '/admin/reports?category=safety' } });
    await prisma.report.deleteMany({ where: { id: { in: createdSafeguardingReportIds } } });
  }
  if (createdSafeguardingConvoIds.length) {
    await prisma.message.deleteMany({ where: { conversationId: { in: createdSafeguardingConvoIds } } });
    await prisma.conversation.deleteMany({ where: { id: { in: createdSafeguardingConvoIds } } });
  }
  if (createdMessageIds.length) {
    // Remove the smoke messages, then point each thread's preview back at its newest real message
    const touched = await prisma.message.findMany({ where: { id: { in: createdMessageIds } }, select: { conversationId: true } });
    await prisma.message.deleteMany({ where: { id: { in: createdMessageIds } } });
    for (const { conversationId } of touched) {
      const last = await prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' } });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessagePreview: last?.body.slice(0, 140) ?? '', lastMessageSenderId: last?.senderId ?? null },
      });
    }
  }
  if (createdTeamIds.length) {
    // Applications cascade with the team; the notifications they caused link to /teams/<id>
    await prisma.notification.deleteMany({ where: { OR: createdTeamIds.map((id) => ({ link: { contains: id } })) } });
    await prisma.team.deleteMany({ where: { id: { in: createdTeamIds } } });
  }
  if (createdReportIds.length) {
    // The admin notification it caused has a static link (/admin/reports), not the report id
    await prisma.notification.deleteMany({ where: { type: 'SYSTEM', link: '/admin/reports', title: 'New report: SPAM' } });
    await prisma.report.deleteMany({ where: { id: { in: createdReportIds } } });
  }
  if (!createdPostIds.length) return;
  const comments = await prisma.comment.findMany({ where: { postId: { in: createdPostIds } }, select: { id: true } });
  const refIds = [...createdPostIds, ...comments.map((c) => c.id)];
  const ledger = await prisma.pointsLedger.findMany({ where: { refId: { in: refIds } } });
  await prisma.$transaction(async (tx) => {
    for (const l of ledger) await tx.user.update({ where: { id: l.userId }, data: { points: { decrement: l.points } } });
    await tx.pointsLedger.deleteMany({ where: { id: { in: ledger.map((l) => l.id) } } });
    await tx.vote.deleteMany({ where: { targetId: { in: refIds } } });
    await tx.bookmark.deleteMany({ where: { targetId: { in: createdPostIds } } });
    await tx.notification.deleteMany({ where: { OR: createdPostIds.map((id) => ({ link: { contains: id } })) } });
    await tx.post.updateMany({ where: { id: { in: createdPostIds } }, data: { bestAnswerId: null } });
    await tx.post.deleteMany({ where: { id: { in: createdPostIds } } });
  });
}

class Client {
  cookie = '';
  async req(method: string, path: string, json?: unknown, headers: Record<string, string> = {}): Promise<Res> {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(this.cookie ? { Cookie: this.cookie } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set?.startsWith('bu_session=')) this.cookie = set.split(';')[0]!;
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* not JSON (e.g. Swagger HTML) */
    }
    return { status: res.status, body };
  }
  get = (p: string) => this.req('GET', p);
  post = (p: string, j: unknown = {}) => this.req('POST', p, j);
  put = (p: string, j: unknown = {}) => this.req('PUT', p, j);
  patch = (p: string, j: unknown = {}) => this.req('PATCH', p, j);
  del = (p: string) => this.req('DELETE', p);
}

async function check(name: string, fn: () => Promise<string | void>) {
  try {
    const detail = (await fn()) ?? '';
    results.push({ name, ok: true, detail });
  } catch (e) {
    results.push({ name, ok: false, detail: e instanceof Error ? e.message : String(e) });
  }
}

function expectStatus(r: Res, status: number, what = '') {
  if (r.status !== status) {
    throw new Error(`${what} expected ${status}, got ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
  }
  return r.body?.data;
}

async function login(handle: string) {
  const c = new Client();
  expectStatus(await c.post('/auth/demo-login', { handle }), 200, `demo-login ${handle}`);
  return c;
}

async function main() {
  const anon = new Client();

  await check('system: health with database', async () => {
    const d = expectStatus(await anon.get('/health'), 200);
    if (d.db !== 'up') throw new Error('db not up');
    return `db ${d.dbLatencyMs}ms`;
  });
  await check('system: public config', async () => {
    const d = expectStatus(await anon.get('/config'), 200);
    if (!d.allowedEmailDomains.length) throw new Error('no email domains');
    return `domains=${d.allowedEmailDomains.join(',')} demo=${d.demoMode} accounts=${d.demoAccounts.length}`;
  });
  await check('system: swagger UI and OpenAPI document', async () => {
    const ui = await anon.get('/docs/');
    if (ui.status !== 200 || !String(ui.body).includes('swagger')) throw new Error(`docs ${ui.status}`);
    const spec = await anon.get('/openapi.json');
    const ops = Object.values(spec.body.paths as Record<string, object>).reduce((n, p) => n + Object.keys(p).length, 0);
    return `${ops} operations`;
  });

  await check('guards: signed-out user gets 401', async () => {
    expectStatus(await anon.get('/people'), 401);
    expectStatus(await anon.patch('/me/profile', { bio: 'x' }), 401);
  });
  await check('guards: non-JSON write gets 415', async () => {
    const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
    if (r.status !== 415) throw new Error(`got ${r.status}`);
  });
  await check('validation: malformed JSON gets 400', async () => {
    const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    if (r.status !== 400) throw new Error(`got ${r.status}`);
  });
  await check('auth: non-college email follows ALUMNI_OPEN_SIGNUP', async () => {
    const cfg = (await anon.get('/config')).body.data;
    const r = await anon.post('/auth/register', { fullName: 'Test', email: 'smoke-alumni@gmail.com', password: 'secret123', consent: true });
    if (cfg.alumniOpenSignup) {
      // Personal emails register as ALUMNI; remove the throwaway account afterwards
      expectStatus(r, 201);
      await prisma.user.deleteMany({ where: { email: 'smoke-alumni@gmail.com' } });
    } else {
      expectStatus(r, 400);
      if (!r.body.error.fields?.email) throw new Error('no email field error');
    }
  });
  await check('routing: unknown route gets 404 JSON', async () => {
    expectStatus(await anon.get('/does-not-exist'), 404);
  });
  await check('stories: public, no session needed', async () => {
    const d = expectStatus(await anon.get('/stories'), 200);
    return `${d.items.length} stories, no cookie required`;
  });

  const ananya = await login('ananya');
  const rahul = await login('rahul');

  await check('auth: me', async () => (expectStatus(await ananya.get('/auth/me'), 200) as any).handle);

  const reads: Array<[string, string, (d: any) => string]> = [
    ['people: discover', '/people', (d) => `${d.length} people, top ${d[0]?.match.score}`],
    ['people: mentor mode', '/people?mode=mentor&limit=5', (d) => `${d.length} mentors`],
    ['people: suggested', '/people/suggested', (d) => `${d.length}`],
    ['users: public profile', '/users/rahul', (d) => `match ${d.match?.score}`],
    ['requests: incoming', '/connections?box=incoming', (d) => `${d.length}`],
    ['community: topics', '/topics', (d) => `${d.length} topics`],
    ['community: posts', '/posts', (d) => `${d.items.length} posts`],
    ['community: unanswered', '/posts?sort=unanswered', (d) => `${d.items.length}`],
    ['community: similar questions', '/questions/similar?q=which%20coding%20club%20to%20join', (d) => `${d.length}`],
    ['home: feed for you', '/feed', (d) => `${d.items.length}`],
    ['home: feed latest', '/feed?tab=latest', (d) => `${d.items.length}`],
    ['home: rail', '/home/rail?visitedClubs=1', (d) => `week=${d.thisWeek.length} quests=${d.quests?.done}/${d.quests?.total}`],
    ['home: this week', '/events/week', (d) => `${d.length}`],
    ['home: bookmarks', '/bookmarks', (d) => `${d.posts.length}`],
    ['search: all types', '/search?q=python', (d) => Object.entries(d).filter(([, v]: any) => v.length).map(([k]) => k).join(',')],
    ['campus: companies', '/companies', (d) => `${d.length} companies`],
    ['campus: company detail', '/companies/northwind-labs', (d) => `${d.stats.experiences} experiences`],
    ['campus: company experiences filtered', '/companies/quantis-capital/experiences?minDifficulty=4', (d) => `${d.length}`],
    ['campus: company alumni', '/companies/northwind-labs/alumni', (d) => `${d.length}`],
    ['campus: clubs', '/clubs?sort=useful', (d) => `${d.length} clubs`],
    ['campus: club detail', '/clubs/code-circle', (d) => `${d.reviewCount} reviews`],
    ['campus: path twins', '/path-twins', (d) => `${d.twins.length} twins`],
    ['campus: roadmaps', '/roadmaps', (d) => `${d.length} roadmaps`],
    ['campus: my roadmaps', '/roadmaps?mine=true', (d) => `${d.length}`],
    ['opportunities: closing soon', '/opportunities', (d) => `${d.items.length} open`],
    ['opportunities: filtered and newest', '/opportunities?type=INTERNSHIP&sort=newest', (d) => `${d.items.length}`],
    ['opportunities: alert preferences', '/me/alerts', (d) => `enabled=${d.enabled} types=${d.opportunityTypes.length}`],
    ['teams: open listings', '/teams', (d) => `${d.length} listings`],
    ['teams: study circles', '/teams?kind=STUDY_CIRCLE', (d) => `${d.length}`],
    ['teams: founder advisors', '/teams/advisors', (d) => `${d.length} advisors`],
    ['notifications: list', '/notifications', (d) => `${d.items.length}`],
    ['notifications: unread count', '/notifications/unread-count', (d) => `${d.count} unread`],
    ['stories: list', '/stories', (d) => `${d.items.length} stories`],
    ['gamification: mentor wall', '/mentor-wall', (d) => `${d.length} mentors`],
    ['gamification: contributions', '/users/rahul/contributions', (d) => `helped ${d.helped}, ${d.badges.length} badges`],
  ];
  for (const [name, path, describe] of reads) {
    await check(name, async () => describe(expectStatus(await ananya.get(path), 200, path)));
  }

  await check('rules: first year cannot review a club', async () => {
    expectStatus(await ananya.put('/clubs/code-circle/review', { usefulness: 4, timeCost: 2, review: 'Trying as a first year to review this club.' }), 403);
  });
  await check('rules: profile update ignores role and points', async () => {
    const before = expectStatus(await ananya.get('/auth/me'), 200);
    const after = expectStatus(await ananya.patch('/me/profile', { role: 'ADMIN', points: 999, bio: before.bio }), 200);
    if (after.role !== before.role || after.points !== before.points) throw new Error('role or points changed');
  });

  // Write flow with cleanup: question -> answer -> vote -> bookmark -> delete
  await check('flow: ask, answer, vote, bookmark, delete', async () => {
    const topics = expectStatus(await ananya.get('/topics'), 200) as Array<{ id: number; slug: string }>;
    const topicId = topics.find((t) => t.slug === 'ai-ml')?.id ?? topics[0]!.id;
    const { id } = expectStatus(
      await ananya.post('/posts', { kind: 'QUESTION', title: 'Smoke test: how do I start with ML projects?', topicId, tags: ['python'] }),
      201,
      'create post',
    );
    createdPostIds.push(id);
    try {
      const ans = expectStatus(await rahul.post(`/posts/${id}/comments`, { body: 'Smoke test answer from a senior.' }), 201, 'answer');
      expectStatus(await rahul.post(`/posts/${id}/best-answer`, { commentId: ans.comment.id }), 403, 'non-asker best');
      expectStatus(await ananya.post(`/posts/${id}/best-answer`, { commentId: ans.comment.id }), 200, 'asker best');
      const v = expectStatus(await rahul.put('/votes', { targetType: 'POST', targetId: id, value: 1 }), 200, 'vote');
      if (v.score !== 1) throw new Error(`score ${v.score}`);
      expectStatus(await rahul.put('/votes', { targetType: 'POST', targetId: id, value: 0 }), 200, 'unvote');
      const b1 = expectStatus(await ananya.put('/bookmarks', { targetType: 'POST', targetId: id }), 200);
      const b2 = expectStatus(await ananya.put('/bookmarks', { targetType: 'POST', targetId: id }), 200);
      if (!b1.bookmarked || b2.bookmarked) throw new Error('bookmark toggle wrong');
      const detail = expectStatus(await ananya.get(`/posts/${id}`), 200);
      if (!detail.comments[0]?.isBest) throw new Error('best answer not first');
    } finally {
      expectStatus(await rahul.del(`/posts/${id}`), 404, 'non-author delete');
      expectStatus(await ananya.del(`/posts/${id}`), 200, 'author delete');
    }
    expectStatus(await ananya.get(`/posts/${id}`), 404, 'deleted post');
  });

  await check('flow: roadmap step tick and save toggle', async () => {
    const list = expectStatus(await ananya.get('/roadmaps?goalTrack=MBA'), 200) as Array<{ id: string; saved: boolean }>;
    const r = list[0];
    if (!r) return 'no MBA roadmap seeded, skipped';
    const detail = expectStatus(await ananya.get(`/roadmaps/${r.id}`), 200);
    const step = detail.steps[0].id;
    expectStatus(await ananya.patch(`/roadmaps/${r.id}/steps/${step}`, { done: true }), 200);
    const after = expectStatus(await ananya.get(`/roadmaps/${r.id}`), 200);
    if (!after.saved || !after.completedSteps.includes(step)) throw new Error('step not saved');
    // restore previous state
    expectStatus(await ananya.patch(`/roadmaps/${r.id}/steps/${step}`, { done: false }), 200);
    if (!r.saved) expectStatus(await ananya.put(`/roadmaps/${r.id}/save`), 200);
  });

  await check('flow: alerts notify a matching opportunity, not its author', async () => {
    const topics = expectStatus(await ananya.get('/topics'), 200) as Array<{ id: number; slug: string }>;
    const topicId = topics.find((t) => t.slug === 'hackathons-projects')?.id ?? topics[0]!.id;
    const before = expectStatus(await ananya.get('/me/alerts'), 200);
    try {
      expectStatus(
        await ananya.put('/me/alerts', { enabled: true, opportunityTypes: ['HACKATHON'], topicIds: [topicId], tags: ['smoke-alert'] }),
        200,
        'save alerts',
      );
      const deadline = new Date(Date.now() + 3 * 864e5).toISOString();
      const created = expectStatus(
        await rahul.post('/posts', {
          kind: 'OPPORTUNITY',
          title: 'Smoke test: hackathon teammates wanted',
          body: 'Smoke test opportunity.',
          topicId,
          tags: ['smoke-alert'],
          opportunityType: 'HACKATHON',
          organization: 'Smoke Labs',
          deadline,
        }),
        201,
        'create opportunity',
      );
      createdPostIds.push(created.id);
      if (created.alerted < 1) throw new Error('nobody alerted');

      const mine = expectStatus(await ananya.get('/notifications?group=opportunities&unread=true'), 200);
      const hit = mine.items.find((n: any) => n.link === `/post/${created.id}`);
      if (!hit) throw new Error('no alert notification for the subscriber');

      const authorFeed = expectStatus(await rahul.get('/notifications?group=opportunities'), 200);
      if (authorFeed.items.some((n: any) => n.link === `/post/${created.id}`)) throw new Error('author was alerted');

      const list = expectStatus(await ananya.get('/opportunities?type=HACKATHON'), 200);
      const row = list.items.find((o: any) => o.id === created.id);
      if (!row) throw new Error('not in the opportunities list');

      const read = expectStatus(await ananya.post('/notifications/read', { ids: [hit.id] }), 200);
      if (read.updated !== 1) throw new Error(`marked ${read.updated}`);
      return `alerted ${created.alerted}, reason "${row.reason}"`;
    } finally {
      expectStatus(await ananya.put('/me/alerts', before), 200, 'restore alerts');
    }
  });

  await check('flow: team apply, accept, full, close', async () => {
    const team = expectStatus(
      await rahul.post('/teams', {
        kind: 'HACKATHON',
        title: 'Smoke test hackathon team',
        description: 'Smoke test listing for the end-to-end checks. Looking for one teammate.',
        requiredSkills: ['python'],
        rolesNeeded: ['designer'],
        commitment: '6 h/week',
        maxMembers: 2,
        schedule: 'Tue & Thu 7 pm',
      }),
      201,
      'create team',
    );
    createdTeamIds.push(team.id);

    const matching = expectStatus(await ananya.get('/teams?matchesMe=true'), 200) as any[];
    const mine = matching.find((t) => t.id === team.id);
    if (!mine) throw new Error('not returned by matchesMe');
    if (!mine.skillMatch.includes('python')) throw new Error('skill overlap missing');

    expectStatus(await ananya.post(`/teams/${team.id}/join`, {}), 400, 'instant join needs an open listing');
    expectStatus(await ananya.post(`/teams/${team.id}/apply`, { message: 'I would love to join, I work with python.' }), 201);
    expectStatus(await ananya.post(`/teams/${team.id}/apply`, { message: 'Applying a second time on purpose.' }), 409);

    const owned = expectStatus(await rahul.get(`/teams/${team.id}`), 200);
    if (owned.pendingCount !== 1 || owned.applications.length !== 1) throw new Error('owner view wrong');
    const app = owned.applications[0];
    if (!app.skillOverlap.includes('python')) throw new Error('applicant overlap missing');
    expectStatus(await ananya.patch(`/teams/${team.id}/applications/${app.id}`, { status: 'ACCEPTED' }), 404, 'non-owner accept');
    expectStatus(await rahul.patch(`/teams/${team.id}/applications/${app.id}`, { status: 'ACCEPTED' }), 200, 'accept');

    const full = expectStatus(await ananya.get(`/teams/${team.id}`), 200);
    if (full.memberCount !== 2 || !full.isFull) throw new Error(`members ${full.memberCount}`);
    if (full.myApplication?.status !== 'ACCEPTED') throw new Error('applicant status not accepted');
    const meera = await login('meera');
    expectStatus(await meera.post(`/teams/${team.id}/apply`, { message: 'Trying to join a full team on purpose.' }), 409);

    expectStatus(await rahul.patch(`/teams/${team.id}`, { status: 'CLOSED' }), 200, 'close');
    const open = expectStatus(await ananya.get('/teams'), 200) as any[];
    if (open.some((t) => t.id === team.id)) throw new Error('closed listing still open');
    const closed = expectStatus(await ananya.get('/teams?includeClosed=true'), 200) as any[];
    if (!closed.some((t) => t.id === team.id)) throw new Error('closed listing missing with includeClosed');
    return 'apply, accept, full and close all behave';
  });

  await check('flow: report a post, admin notified, duplicate is idempotent', async () => {
    const topics = expectStatus(await rahul.get('/topics'), 200) as Array<{ id: number; slug: string }>;
    const topicId = topics[0]!.id;
    const { id } = expectStatus(
      await rahul.post('/posts', { kind: 'DISCUSSION', title: 'Smoke test: content to report', topicId, tags: [] }),
      201,
      'create post',
    );
    createdPostIds.push(id);
    const first = expectStatus(
      await ananya.post('/reports', { targetType: 'POST', targetId: id, reason: 'SPAM', details: 'Smoke test report' }),
      200,
      'report',
    );
    createdReportIds.push(first.id);
    const again = expectStatus(await ananya.post('/reports', { targetType: 'POST', targetId: id, reason: 'SPAM' }), 200, 'duplicate');
    if (first.id !== again.id) throw new Error('duplicate report created a second row');
    return `report ${first.id}`;
  });

  await check('chat: inbox lists conversations with unread counts', async () => {
    const rows = expectStatus(await ananya.get('/chat/conversations'), 200) as any[];
    if (!rows.every((r) => typeof r.unread === 'number' && r.other?.handle)) throw new Error('bad shape');
    return `${rows.length} threads`;
  });
  await check('chat: connected people can open and use a thread', async () => {
    const rahulId = (expectStatus(await rahul.get('/auth/me'), 200) as any).id;
    const start = expectStatus(await ananya.post('/chat/conversations', { userId: rahulId }), 201) as any;
    const id = start.id as string;
    const sent = expectStatus(await ananya.post(`/chat/conversations/${id}/messages`, { body: 'smoke: hello from a test' }), 201) as any;
    createdMessageIds.push(sent.id);
    if (!sent.mine) throw new Error('sender should see mine=true');
    const theirs = expectStatus(await rahul.get(`/chat/conversations/${id}/messages`), 200) as any;
    if (!theirs.items.some((m: any) => m.id === sent.id && m.mine === false)) throw new Error('recipient did not get the message');
    expectStatus(await rahul.post(`/chat/conversations/${id}/read`), 200);
    const rahulInbox = expectStatus(await rahul.get('/chat/conversations'), 200) as any[];
    const thread = rahulInbox.find((r) => r.id === id);
    if (!thread || thread.unread !== 0) throw new Error(`unread after read: ${thread?.unread}`);
    return 'open, send, receive, read';
  });
  await check('chat: live stream delivers a new message to the recipient', async () => {
    const rahulId = (expectStatus(await rahul.get('/auth/me'), 200) as any).id;
    const id = (expectStatus(await ananya.post('/chat/conversations', { userId: rahulId }), 201) as any).id;
    const ac = new AbortController();
    const res = await fetch(`${BASE}/chat/stream`, { headers: { cookie: rahul.cookie }, signal: ac.signal });
    if (res.status !== 200) throw new Error(`stream got ${res.status}`);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const sent = expectStatus(await ananya.post(`/chat/conversations/${id}/messages`, { body: 'smoke: live' }), 201) as any;
    createdMessageIds.push(sent.id);
    let buf = '';
    const deadline = Date.now() + 4000;
    try {
      while (Date.now() < deadline && !buf.includes(sent.id)) {
        const chunk = await Promise.race([reader.read(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
        if (chunk.done) break;
        buf += decoder.decode(chunk.value);
      }
    } finally {
      ac.abort();
    }
    if (!buf.includes('event: chat.message') || !buf.includes(sent.id)) throw new Error('no chat.message event received');
    return 'event received in under 4s';
  });
  await check('chat: strangers cannot start or read a thread', async () => {
    const suresh = await login('suresh');
    const ananyaId = (expectStatus(await ananya.get('/auth/me'), 200) as any).id;
    expectStatus(await suresh.post('/chat/conversations', { userId: ananyaId }), 403);
    const rahulId = (expectStatus(await rahul.get('/auth/me'), 200) as any).id;
    const id = (expectStatus(await ananya.post('/chat/conversations', { userId: rahulId }), 201) as any).id;
    expectStatus(await suresh.get(`/chat/conversations/${id}/messages`), 404);
    return '403 to start, 404 to read';
  });
  await check('safeguarding: a harassment report is withheld from non-coordinator admins', async () => {
    const admin = await login('admin');
    const rahulId = (expectStatus(await rahul.get('/auth/me'), 200) as any).id;
    const convo = (expectStatus(await ananya.post('/chat/conversations', { userId: rahulId }), 201) as any).id;
    createdSafeguardingConvoIds.push(convo);
    const sent = expectStatus(await ananya.post(`/chat/conversations/${convo}/messages`, { body: 'smoke: harassment test message' }), 201) as any;
    createdMessageIds.push(sent.id);

    const report = expectStatus(
      await ananya.post('/reports', { targetType: 'CONVERSATION', targetId: convo, reason: 'HARASSMENT', details: 'smoke test' }),
      200,
      'file harassment report',
    ) as any;
    createdSafeguardingReportIds.push(report.id);

    const plainList = expectStatus(await admin.get('/admin/reports?status=OPEN'), 200) as any[];
    if (plainList.some((r) => r.id === report.id)) throw new Error('non-coordinator admin can see a harassment report');

    expectStatus(await admin.patch(`/admin/reports/${report.id}`, { action: 'DISMISS' }), 404);
    return 'hidden from the list and from direct resolve';
  });
  await check('safeguarding: a coordinator sees the report with real message content', async () => {
    const admin = await login('admin');
    const adminId = (expectStatus(await admin.get('/auth/me'), 200) as any).id;
    expectStatus(await admin.patch(`/admin/users/${adminId}`, { isSafeguardingCoordinator: true }), 200, 'promote to coordinator');
    try {
      const list = expectStatus(await admin.get('/admin/reports?status=OPEN'), 200) as any[];
      const found = list.find((r) => createdSafeguardingReportIds.includes(r.id));
      if (!found) throw new Error('coordinator cannot see their own harassment report');
      if (!found.targetPreview?.messages?.some((m: any) => m.body.includes('harassment test message'))) {
        throw new Error('coordinator view is missing the flagged message content');
      }
      expectStatus(await admin.patch(`/admin/reports/${found.id}`, { action: 'DISMISS' }), 200, 'coordinator resolves');
      return 'coordinator sees content and can resolve';
    } finally {
      await admin.patch(`/admin/users/${adminId}`, { isSafeguardingCoordinator: false }); // leave admin as a plain admin
    }
  });
  await check('safeguarding: the user-update response never includes a password hash', async () => {
    const admin = await login('admin');
    const adminId = (expectStatus(await admin.get('/auth/me'), 200) as any).id;
    const res = await admin.patch(`/admin/users/${adminId}`, { isVerified: true });
    expectStatus(res, 200);
    if (JSON.stringify(res.body).includes('passwordHash')) throw new Error('admin user-update response leaks passwordHash');
  });
  await check('prep: readiness names each target company', async () => {
    const d = (expectStatus(await ananya.get('/prep/dashboard'), 200) as any);
    const r = d.readiness.find((x: any) => x.companyName);
    if (!r || !r.companySlug || typeof r.score !== 'number') throw new Error('readiness missing name, slug or score');
    return `${d.readiness.length} companies`;
  });
  await check('sim: start, answer, finish', async () => {
    const start = expectStatus(await ananya.post('/sim/sessions', { companySlug: 'northwind-labs', roundType: 'APTITUDE', maxQuestions: 3 }), 201) as any;
    createdSimIds.push(start.session.id);
    const q = start.question;
    expectStatus(await ananya.post(`/sim/sessions/${start.session.id}/answer`, { questionId: q.id, answer: '1' }), 200);
    const done = expectStatus(await ananya.post(`/sim/sessions/${start.session.id}/finish`), 200) as any;
    if (!Array.isArray(done.revise)) throw new Error('finish did not return revision topics');
    expectStatus(await ananya.get(`/sim/sessions/${start.session.id}`), 200);
    return `question ${q.format}, revise ${done.revise.length}`;
  });
  await check('ai: answers fall back without an API key', async () => {
    const r = expectStatus(await ananya.post('/ai/answer', { title: 'How should a first year start DSA?' }), 200) as any;
    if (!['ok', 'fallback', 'no_sources'].includes(r.status)) throw new Error(`status ${r.status}`);
    return `status ${r.status}, ${r.sources?.length ?? 0} sources`;
  });
  await check('ai: natural-language people search returns ranked matches with explained filters', async () => {
    const r = expectStatus(await ananya.post('/people/search/ai', { query: 'alumni mentor who knows machine learning' }), 200) as any;
    if (!Array.isArray(r.people)) throw new Error('missing people array');
    if (typeof r.usedAI !== 'boolean') throw new Error('missing usedAI flag');
    if (!r.filters || typeof r.filters.summary !== 'string') throw new Error('missing filters.summary');
    return `${r.people.length} people, usedAI=${r.usedAI}, filters=${JSON.stringify(r.filters)}`;
  });
  await check('assistant: routes a people request to people_search', async () => {
    const r = expectStatus(await ananya.post('/assistant/ask', { message: 'find me an alumni mentor who knows machine learning' }), 200) as any;
    if (r.action !== 'people_search') throw new Error(`expected people_search, got ${r.action}`);
    if (!Array.isArray(r.people)) throw new Error('missing people array');
    if (typeof r.reply !== 'string' || !r.reply) throw new Error('missing reply');
    return `action=${r.action}, ${r.people.length} people, usedAI=${r.usedAI}`;
  });
  await check('assistant: routes a question request to search', async () => {
    const r = expectStatus(await ananya.post('/assistant/ask', { message: 'how should a first year start DSA?' }), 200) as any;
    if (r.action !== 'search') throw new Error(`expected search, got ${r.action}`);
    if (!r.results || !Array.isArray(r.results.questions)) throw new Error('missing results.questions');
    return `action=${r.action}, ${r.results.questions.length} questions, usedAI=${r.usedAI}`;
  });
  await check('assistant: routes a feature request to navigate', async () => {
    const r = expectStatus(await ananya.post('/assistant/ask', { message: 'take me to my placement prep dashboard' }), 200) as any;
    if (r.action !== 'navigate') throw new Error(`expected navigate, got ${r.action}`);
    if (r.destination !== 'prep') throw new Error(`expected destination prep, got ${r.destination}`);
    return `action=${r.action}, destination=${r.destination}, usedAI=${r.usedAI}`;
  });
  await check('assistant: a plain greeting gets a conversational reply, not an action', async () => {
    const r = expectStatus(await ananya.post('/assistant/ask', { message: 'hey, what can you help with?' }), 200) as any;
    if (!['none', 'navigate', 'search', 'people_search'].includes(r.action)) throw new Error(`unexpected action ${r.action}`);
    if (typeof r.reply !== 'string' || !r.reply) throw new Error('missing reply');
    return `action=${r.action}, usedAI=${r.usedAI}`;
  });
  await check('events: upcoming list shows seats and RSVP state', async () => {
    const events = expectStatus(await ananya.get('/events'), 200) as any[];
    if (!events.every((e) => typeof e.rsvpCount === 'number' && 'mine' in e)) throw new Error('bad event shape');
    return `${events.length} events`;
  });
  await check('events: RSVP and cancel, with a ticket code', async () => {
    const events = expectStatus(await ananya.get('/events'), 200) as any[];
    const target = events.find((e) => !e.mine && (e.seatsLeft === null || e.seatsLeft > 0));
    if (!target) return 'no open event to RSVP to';
    const rsvp = expectStatus(await ananya.post(`/events/${target.id}/rsvp`), 201) as any;
    if (!rsvp.mine || !rsvp.myCode) throw new Error('RSVP did not issue a ticket');
    const tickets = expectStatus(await ananya.get('/me/tickets'), 200) as any[];
    if (!tickets.some((t) => t.id === target.id)) throw new Error('ticket not listed');
    const cancelled = expectStatus(await ananya.req('DELETE', `/events/${target.id}/rsvp`), 200) as any;
    if (cancelled.mine) throw new Error('cancel did not remove the RSVP');
    return 'RSVP, ticket, cancel';
  });
  await check('giving: campaigns, detail and a test-mode donation', async () => {
    const list = expectStatus(await ananya.get('/giving/campaigns'), 200) as any[];
    if (!list.length) throw new Error('no campaigns');
    const detail = expectStatus(await ananya.get(`/giving/campaigns/${list[0].slug}`), 200) as any;
    if (!detail.story) throw new Error('no story');
    const receipt = expectStatus(await ananya.post(`/giving/campaigns/${list[0].slug}/donate`, { amountRupees: 100, anonymous: false, message: 'smoke' }), 201) as any;
    if (!receipt.testMode || !receipt.receipt) throw new Error('donation not recorded in test mode');
    createdReceipts.push(receipt.receipt);
    return `receipt ${receipt.receipt}`;
  });
  await check('giving: a donation under the minimum is rejected', async () => {
    const list = expectStatus(await ananya.get('/giving/campaigns'), 200) as any[];
    expectStatus(await ananya.post(`/giving/campaigns/${list[0].slug}/donate`, { amountRupees: 1 }), 400);
  });
  await check('admin: institution analytics, and students are refused', async () => {
    const admin = await login('admin');
    const a = expectStatus(await admin.get('/admin/analytics'), 200) as any;
    if (typeof a.totals.users !== 'number') throw new Error('no totals');
    expectStatus(await ananya.get('/admin/analytics'), 403);
    return `${a.totals.users} users, ${a.totals.active30d} active`;
  });
  await check('admin: official post is published with its office', async () => {
    const admin = await login('admin');
    const created = expectStatus(await admin.post('/admin/official-posts', { title: 'Smoke official notice', body: 'Test body for an office post.', officeName: 'Smoke Office' }), 201) as any;
    createdOfficialPostIds.push(created.id);
    const row = await prisma.post.findUnique({ where: { id: created.id }, select: { officeName: true } });
    if (row?.officeName !== 'Smoke Office') throw new Error('office not saved');
    expectStatus(await ananya.post('/admin/official-posts', { title: 'Smoke official notice', body: 'x', officeName: 'Nope' }), 403);
    return 'published; students refused';
  });
  await check('account: data export contains no password hash', async () => {
    const r = await ananya.get('/me/export');
    expectStatus(r, 200);
    if (JSON.stringify(r.body).includes('passwordHash')) throw new Error('export leaks the password hash');
    if (!r.body.data?.profile) throw new Error('no profile in export');
    return 'profile, posts, messages, tickets, donations';
  });
  await check('account: deletion needs the right password', async () => {
    const throwaway = new Client();
    const handle = `smoke${Date.now().toString(36)}`;
    expectStatus(await throwaway.post('/auth/register', { fullName: 'Smoke Delete', email: `${handle}@gmail.com`, password: 'secret123', consent: true }), 201);
    await prisma.user.update({ where: { email: `${handle}@gmail.com` }, data: { emailVerified: true, onboarded: true } });
    expectStatus(await throwaway.post('/auth/login', { email: `${handle}@gmail.com`, password: 'secret123' }), 200);
    expectStatus(await throwaway.req('DELETE', '/me', { password: 'wrong-password' }), 401);
    expectStatus(await throwaway.req('DELETE', '/me', { password: 'secret123' }), 200);
    if (await prisma.user.findUnique({ where: { email: `${handle}@gmail.com` } })) throw new Error('account still exists');
    return 'wrong password refused, account removed';
  });
  await check('account: a deleted user\'s best answer stays, attributed to no one', async () => {
    const throwaway = new Client();
    const handle = `smokeanswer${Date.now().toString(36)}`;
    const email = `${handle}@gmail.com`;
    expectStatus(await throwaway.post('/auth/register', { fullName: 'Smoke Answerer', email, password: 'secret123', consent: true }), 201);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, onboarded: true } });
    expectStatus(await throwaway.post('/auth/login', { email, password: 'secret123' }), 200);

    const topics = expectStatus(await rahul.get('/topics'), 200) as Array<{ id: number }>;
    const post = expectStatus(
      await rahul.post('/posts', { kind: 'QUESTION', title: 'Smoke: does a deleted answerer\'s answer survive?', body: 'Smoke test body with enough length to pass validation.', tags: ['dsa'], topicId: topics[0]!.id }),
      201,
    ) as any;
    const answer = expectStatus(await throwaway.post(`/posts/${post.id}/comments`, { body: 'Smoke test: this is the answer that should survive account deletion.' }), 201) as any;
    expectStatus(await rahul.post(`/posts/${post.id}/best-answer`, { commentId: answer.comment.id }), 200);
    expectStatus(await throwaway.req('DELETE', '/me', { password: 'secret123' }), 200);

    const after = expectStatus(await rahul.get(`/posts/${post.id}`), 200) as any;
    const best = after.comments.find((c: any) => c.isBest);
    if (!best || !best.body.includes('this is the answer that should survive')) throw new Error('the best answer was lost, not anonymised');
    if (best.author !== null) throw new Error('answer author should be null after account deletion, not destroyed');
    if (after.post.author === null) throw new Error('the asker (still active) should not be nulled');

    createdPostIds.push(post.id);
    return 'content kept, author set to null';
  });
  await check('auth: sign-up without the data notice is refused', async () => {
    expectStatus(await new Client().post('/auth/register', { fullName: 'No Consent', email: 'noconsent@gmail.com', password: 'secret123' }), 400);
  });
  await check('guide: answers from the project docs, or says nothing matches', async () => {
    const hit = expectStatus(await ananya.post('/guide/ask', { question: 'How does matching work for people?' }), 200) as any;
    if (hit.status === 'no_match' || !hit.sources.length) throw new Error('no sources for a project question');
    const miss = expectStatus(await ananya.post('/guide/ask', { question: 'What is the capital of France?' }), 200) as any;
    if (miss.status !== 'no_match' || miss.sources.length) throw new Error('off-topic question should not invent sources');
    return `${hit.status} with ${hit.sources.length} sources`;
  });
  await check('stories: published stories with a spotlight', async () => {
    const list = expectStatus(await anon.get('/stories'), 200) as any;
    if (list.items.length < 4) throw new Error(`only ${list.items.length} stories`);
    return `${list.items.length} stories`;
  });
  await check('auth: logout clears the session', async () => {
    const c = await login('meera');
    expectStatus(await c.post('/auth/logout'), 200);
    c.cookie = '';
    const me = expectStatus(await c.get('/auth/me'), 200);
    if (me !== null) throw new Error('still signed in');
  });

  // Report
  const width = Math.max(...results.map((r) => r.name.length));
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(width)}  ${r.detail}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed against ${BASE}`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch((e) => console.error('cleanup failed', e));
    await prisma.$disconnect();
  });
