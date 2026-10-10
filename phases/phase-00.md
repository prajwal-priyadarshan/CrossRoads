# Phase 00 — Workspace, tooling, design system and app shell

| | |
|---|---|
| **Time box** | 0:50 (cumulative 0:50) |
| **Goal** | One repository with a React web app, an Express API and a shared package; the full design system; a polished app shell and landing page; both apps running locally and the API answering `/api/health` through the web app |
| **You need** | Node.js 22 LTS (check with `node -v`), npm 10+, Git, a GitHub account, VS Code (recommended extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma) |
| **PRD features** | F46 Polished UI (foundation) |
| **Reference** | `TRD.md` §1 (stack), §3 (folders), §13 (frontend architecture and tokens); `PRD.md` §12 (design) |

> ⚠️ Commands and generated files below reflect these tools as of 2026-10-10. If a command's prompts or output differ, follow the tool's current docs and keep the **result** described here (same folders, same aliases, same tokens).

---

## 1. What you will have at the end of this phase

- `bridgeup/` repository with npm workspaces: `apps/web`, `apps/api`, `packages/shared`.
- `npm run dev` at the root starts both apps; the web app shows the landing page at `http://localhost:5173` and the app shell at `/home` (temporary, no auth yet).
- `http://localhost:5173/api/health` returns `{"data":{"ok":true}}` (proving the Vite proxy works).
- Design tokens for light and dark mode, fonts, shadcn/ui components installed, toasts working, theme toggle working.
- Shared UI building blocks used by every later phase: `UserAvatar`, `RoleBadge`, `VerifiedBadge`, `ReasonChip`, `MatchRing`, `EmptyState`, `Skeletons`, `PageHeader`, `ComingNext`.

---

## 2. Why the setup looks like this

- **Monorepo with a shared package:** zod schemas and constants (topics, skills, goal tracks) are written once and imported by both the React forms and the API validators. A rule changes in one place.
- **Same-origin `/api`:** the web app always calls `/api/...`. Locally Vite proxies it to `localhost:4000`; in production Vercel rewrites it to Render. Cookies therefore stay first-party and you never fight CORS.
- **Design system first:** later phases are much faster when the card, chip, badge and page-header styles already exist. Polishing at the end is slower than building polished pieces from the start.

---

## 3. Files you will create in this phase

| File | Purpose |
|---|---|
| `package.json` (root) | Workspaces + scripts that run both apps |
| `.gitignore`, `.editorconfig`, `.prettierrc` | Repo hygiene |
| `packages/shared/package.json`, `tsconfig.json` | Shared package definition |
| `packages/shared/src/index.ts` | Re-exports |
| `packages/shared/src/constants.ts` | Topics, skills, interests, goal tracks, help vocabulary, departments, levels, badges, nav labels |
| `apps/api/package.json`, `tsconfig.json`, `tsup.config.ts`, `.env.example`, `.env` | API package |
| `apps/api/src/index.ts` | Starts the server |
| `apps/api/src/app.ts` | Express app with middleware and `/api/health` |
| `apps/api/src/config/env.ts` | Validated environment (minimal now; expanded in Phase 02) |
| `apps/api/src/lib/logger.ts` | pino logger |
| `apps/api/src/lib/errors.ts` | `AppError` and helpers |
| `apps/api/src/middleware/errorHandler.ts` | 404 + error JSON |
| `apps/api/src/types/express.d.ts` | `req.user`, `req.valid` typings |
| `apps/web/*` (Vite template) | React app |
| `apps/web/vite.config.ts` | React + Tailwind plugins, `@` alias, `/api` proxy |
| `apps/web/src/styles/globals.css` | Tailwind import + design tokens (copy `TRD.md` §13.5) |
| `apps/web/src/main.tsx` | Fonts, providers, router |
| `apps/web/src/router.tsx` | Routes (landing + temporary app shell routes) |
| `apps/web/src/providers/ThemeProvider.tsx` | Light / dark / system with class on `<html>` |
| `apps/web/src/providers/AppProviders.tsx` | QueryClientProvider, ThemeProvider, Toaster, TooltipProvider |
| `apps/web/src/lib/api.ts`, `queryClient.ts`, `queryKeys.ts`, `utils.ts`, `storage.ts` | Data and helpers (`TRD.md` §13.2) |
| `apps/web/src/stores/uiStore.ts` | Palette and sidebar state |
| `apps/web/src/components/layout/*` | `AppShell`, `Sidebar`, `Topbar`, `MobileNav`, `PageHeader`, `ThemeToggle`, `UserMenu`, `RightRail` |
| `apps/web/src/components/shared/*` | Building blocks listed in §1 |
| `apps/web/src/features/landing/LandingPage.tsx` | Landing page |
| `apps/web/src/features/home/HomePage.tsx` | Temporary placeholder |
| `apps/web/src/pages/NotFoundPage.tsx` | 404 |
| `apps/web/public/logo.svg`, `favicon.svg` | Brand |

---

## 4. Step-by-step

### Step 1 — Create the repository and workspaces (5 min)

```bash
mkdir bridgeup && cd bridgeup
git init
npm init -y
mkdir -p apps packages/shared/src docs/phases
```

Replace the root `package.json` with:

```json
{
  "name": "bridgeup",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently -n api,web -c blue,magenta \"npm run dev -w apps/api\" \"npm run dev -w apps/web\"",
    "build": "npm run build -w apps/api && npm run build -w apps/web",
    "typecheck": "npm run typecheck -w apps/api && npm run typecheck -w apps/web",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

> The version ranges here and below are examples. Let npm install the current versions (`npm i -D concurrently prettier`) rather than copying ranges blindly.

`.gitignore`:

```
node_modules
dist
.env
.env.*
!.env.example
.DS_Store
*.log
apps/api/src/generated
```

`.prettierrc`:

```json
{ "singleQuote": true, "semi": true, "printWidth": 120, "trailingComma": "all" }
```

Copy `PRD.md`, `TRD.md` and the `phases/` folder into `docs/`.

### Step 2 — Shared package (5 min)

`packages/shared/package.json`:

```json
{
  "name": "@bridgeup/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "zod": "^3.23.0" }
}
```

> ⚠️ zod v4 has been released with some API changes. Pick **one** major version and use it in every package (`npm i zod -w packages/shared -w apps/api -w apps/web`). The schemas in these docs use syntax common to v3 and v4 where possible; check the zod docs if a method name differs.

`packages/shared/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": false,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

`packages/shared/src/constants.ts` — every list the product uses. Keep values **lowercase** where they are stored; display them with `titleCase`.

```ts
export const TOPICS = [
  { slug: 'dsa-leetcode', name: 'DSA and LeetCode', icon: 'binary', description: 'Problem solving, patterns, contests and practice plans.' },
  { slug: 'ai-ml', name: 'AI/ML and Generative AI', icon: 'brain-circuit', description: 'Machine learning, deep learning, LLMs and projects.' },
  { slug: 'placements', name: 'Placements and Interview Experiences', icon: 'briefcase', description: 'Company processes, rounds and preparation.' },
  { slug: 'internships', name: 'Internships and Referrals', icon: 'send', description: 'Finding internships, applying and referrals.' },
  { slug: 'hackathons-projects', name: 'Hackathons and Projects', icon: 'rocket', description: 'Teams, ideas, builds and showcases.' },
  { slug: 'campus-life', name: 'Campus Life and Academics', icon: 'graduation-cap', description: 'Clubs, courses, exams, hostel and life.' },
] as const;

export const SKILLS = [
  'python', 'java', 'c++', 'c', 'javascript', 'typescript', 'dsa', 'competitive programming', 'sql', 'react', 'node.js',
  'next.js', 'django', 'flask', 'spring boot', 'android', 'flutter', 'ios', 'machine learning', 'deep learning',
  'computer vision', 'nlp', 'generative ai', 'llms', 'data analysis', 'statistics', 'power bi', 'excel', 'cloud', 'aws',
  'docker', 'kubernetes', 'linux', 'git', 'system design', 'cybersecurity', 'blockchain', 'embedded systems', 'iot',
  'robotics', 'figma', 'ui/ux', 'product management', 'finance', 'quant', 'public speaking', 'writing', 'marketing',
  'business strategy', 'video editing',
] as const;

export const INTERESTS = [
  'ai/ml', 'web development', 'app development', 'data science', 'cybersecurity', 'cloud and devops', 'competitive programming',
  'quant/finance', 'product management', 'startups', 'research', 'higher studies', 'design', 'robotics', 'open source', 'content creation',
] as const;

export const GOAL_TRACKS = [
  { value: 'PRODUCT', label: 'Product company job', description: 'SDE and engineering roles at product companies', icon: 'code-xml' },
  { value: 'SERVICE', label: 'Service company job', description: 'Roles at IT services and consulting firms', icon: 'building-2' },
  { value: 'QUANT_FINANCE', label: 'Quant or finance', description: 'Quant, trading, fintech and finance roles', icon: 'chart-candlestick' },
  { value: 'RESEARCH', label: 'Research', description: 'Research internships, labs and publications', icon: 'flask-conical' },
  { value: 'STARTUP', label: 'Build a startup', description: 'Founding or joining an early-stage startup', icon: 'rocket' },
  { value: 'MS', label: 'MS / higher studies', description: 'Masters or PhD in India or abroad', icon: 'graduation-cap' },
  { value: 'MBA', label: 'MBA', description: 'Management studies after work experience', icon: 'briefcase-business' },
  { value: 'UNDECIDED', label: 'Still exploring', description: "That's completely fine — explore first", icon: 'compass' },
] as const;

export const HELP_VOCAB = [
  'mentorship', 'internships', 'interview prep', 'dsa', 'projects', 'research', 'higher studies', 'mba', 'startups',
  'resume review', 'teammates', 'club guidance', 'campus life', 'referrals', 'open source',
] as const;

export const TARGET_ROLES = [
  'software engineer', 'frontend developer', 'backend developer', 'full stack developer', 'ml engineer', 'data scientist',
  'data analyst', 'quant analyst', 'product manager', 'devops engineer', 'security engineer', 'research engineer',
  'ui/ux designer', 'consultant', 'founder',
] as const;

export const DEPARTMENTS = ['CSE', 'CSE-AI', 'AIE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'AERO', 'BIOTECH', 'MBA', 'Other'] as const; // ⚠️ replace with your college's real departments

export const ROLE_LABELS = { STUDENT: 'Student', SENIOR: 'Senior', ALUMNI: 'Alumni', ADMIN: 'Admin' } as const;

export const OPPORTUNITY_TYPES = [
  { value: 'INTERNSHIP', label: 'Internship', icon: 'briefcase' },
  { value: 'HACKATHON', label: 'Hackathon', icon: 'trophy' },
  { value: 'RESEARCH', label: 'Research', icon: 'flask-conical' },
  { value: 'EVENT', label: 'Event', icon: 'calendar' },
  { value: 'REFERRAL', label: 'Referral', icon: 'user-check' },
  { value: 'STUDY_GROUP', label: 'Study group', icon: 'users' },
  { value: 'COLLABORATION', label: 'Collaboration', icon: 'handshake' },
  { value: 'CAREER_GUIDANCE', label: 'Career guidance', icon: 'compass' },
] as const;

export const TEAM_KINDS = [
  { value: 'HACKATHON', label: 'Hackathon team' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'STARTUP', label: 'Startup (Founder track)' },
  { value: 'STUDY_CIRCLE', label: 'Study circle' },
] as const;

export const TEAM_ROLES = ['ml engineer', 'frontend', 'backend', 'full stack', 'designer', 'business / pitch', 'data', 'hardware', 'domain expert', 'content'] as const;

export const CLUB_CATEGORIES = ['TECH', 'CULTURAL', 'SPORTS', 'ENTREPRENEURSHIP', 'SOCIAL'] as const;

export const LEVELS = [
  { name: 'Newcomer', min: 0 },
  { name: 'Helper', min: 50 },
  { name: 'Guide', min: 150 },
  { name: 'Mentor', min: 400 },
  { name: 'Legend', min: 1000 },
] as const;

export const BADGES = [
  { slug: 'first-answer', name: 'First Answer', icon: 'message-circle-heart', description: 'Answered a question for the first time', howToEarn: 'Answer any question' },
  { slug: 'answer-machine', name: 'Answer Machine', icon: 'messages-square', description: 'Answered 10 questions', howToEarn: 'Answer 10 questions' },
  { slug: 'trusted-voice', name: 'Trusted Voice', icon: 'shield-check', description: '3 answers marked best', howToEarn: 'Have 3 answers marked best' },
  { slug: 'experience-sharer', name: 'Experience Sharer', icon: 'notebook-pen', description: 'Shared an interview experience', howToEarn: 'Share an interview experience' },
  { slug: 'club-reviewer', name: 'Club Reviewer', icon: 'star', description: 'Reviewed a club honestly', howToEarn: 'Review a club' },
  { slug: 'roadmap-author', name: 'Roadmap Author', icon: 'map', description: 'Published a career roadmap', howToEarn: 'Publish a roadmap' },
  { slug: 'mentor', name: 'Mentor', icon: 'hand-heart', description: 'Completed a mentorship session', howToEarn: 'Complete a mentorship session' },
  { slug: 'bridge-builder', name: 'Bridge Builder', icon: 'waypoints', description: '10 accepted connections', howToEarn: 'Have 10 accepted connections' },
  { slug: 'spotlight', name: 'Spotlight', icon: 'sparkles', description: 'Featured in a success story', howToEarn: 'Be featured in a success story' },
] as const;

export const PREP_CATEGORIES = [
  { value: 'OA', label: 'Online assessment', icon: 'monitor-check' },
  { value: 'APTITUDE', label: 'Aptitude', icon: 'calculator' },
  { value: 'TECHNICAL', label: 'Technical interview', icon: 'cpu' },
  { value: 'HR', label: 'HR interview', icon: 'smile' },
] as const;

export const SIM_ROUNDS = [
  { value: 'APTITUDE', label: 'Aptitude' },
  { value: 'CODING', label: 'Coding (approach)' },
  { value: 'CS_FUNDAMENTALS', label: 'CS fundamentals' },
  { value: 'TECHNICAL', label: 'Technical interview' },
  { value: 'HR', label: 'HR interview' },
] as const;
```

`packages/shared/src/index.ts`:

```ts
export * from './constants';
// schemas are added phase by phase:
// export * from './schemas/auth'; …
```

### Step 3 — API skeleton (10 min)

```bash
mkdir -p apps/api/src/{config,lib,middleware,services,modules,types} apps/api/prisma apps/api/scripts
cd apps/api
npm init -y
npm i express cors helmet cookie-parser pino pino-http dotenv zod
npm i -D typescript tsx tsup @types/express @types/cors @types/cookie-parser @types/node pino-pretty
npm i @bridgeup/shared@* # links the workspace package (or add "@bridgeup/shared": "*" to dependencies and run npm i at the root)
cd ../..
```

> ⚠️ Confirm `npm i express` installs Express 5 (check `npm view express version`). The code in these docs relies on Express 5 handling rejected promises in async handlers automatically.

`apps/api/package.json` (merge with what npm created):

```json
{
  "name": "@bridgeup/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "prisma generate && tsup",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:search": "tsx scripts/apply-search-sql.ts",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "seed:users": "tsx scripts/seed-users.ts",
    "seed:content": "tsx scripts/seed-content.ts"
  }
}
```

> The `prisma` scripts work once Prisma is installed in Phase 01. Until then, `build` fails — that's expected.

`apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "outDir": "dist"
  },
  "include": ["src", "scripts", "prisma"]
}
```

`apps/api/tsup.config.ts`:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@bridgeup/shared'], // bundle the TS shared package into the API build
});
```

`apps/api/.env.example` (copy to `.env`):

```
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:5173
```

`apps/api/src/lib/logger.ts`:

```ts
import pino from 'pino';
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
```

`apps/api/src/lib/errors.ts` — copy from `TRD.md` §7.1.

`apps/api/src/middleware/errorHandler.ts` — copy from `TRD.md` §7.1, **but remove the Prisma import and the `P2002` branch for now** (Prisma is installed in Phase 01; add them back then).

`apps/api/src/types/express.d.ts`:

```ts
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN'; onboarded: boolean; currentYear: number | null };
      valid: { body?: any; query?: any; params?: any };
    }
  }
}
export {};
```

`apps/api/src/app.ts`:

```ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger } from './lib/logger';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Render/Vercel proxies: correct IPs for rate limits, secure cookies
  app.use(helmet());
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID() }));

  app.get('/api/health', (_req, res) => res.json({ data: { ok: true, time: new Date().toISOString() } }));

  // app.use('/api', routes);  ← added in Phase 02

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
```

> ⚠️ Check the current `pino-http` import style (named `pinoHttp` vs default export) for the version you install.

`apps/api/src/index.ts`:

```ts
import 'dotenv/config';
import { createApp } from './app';
import { logger } from './lib/logger';

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, () => logger.info(`API listening on http://localhost:${port}`));
```

Run `npm run dev -w apps/api` and open `http://localhost:4000/api/health`. You should see `{"data":{"ok":true,...}}`.

### Step 4 — Web app with Vite, Tailwind and shadcn/ui (15 min)

```bash
npm create vite@latest apps/web -- --template react-ts
cd apps/web
npm i
npm i react-router @tanstack/react-query zustand react-hook-form @hookform/resolvers zod sonner lucide-react motion date-fns recharts clsx tailwind-merge
npm i @fontsource-variable/inter @fontsource-variable/plus-jakarta-sans
npm i -D tailwindcss @tailwindcss/vite @types/node
npm i @bridgeup/shared@*   # or add "@bridgeup/shared": "*" and run npm i at the root
cd ../..
```

> ⚠️ Check the package names `@fontsource-variable/plus-jakarta-sans` and `motion` on npm before installing. If the variable font package doesn't exist, use `@fontsource/plus-jakarta-sans` and import weights 600 and 700.

`apps/web/vite.config.ts`:

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
});
```

Add the alias to **both** `apps/web/tsconfig.json` and `apps/web/tsconfig.app.json` (shadcn reads `tsconfig.json`):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Initialise shadcn/ui inside `apps/web` and add every component the build will use (one command now saves many later):

```bash
cd apps/web
npx shadcn@latest init
npx shadcn@latest add button card input textarea label badge avatar dropdown-menu dialog sheet tabs select checkbox switch tooltip separator skeleton progress command popover scroll-area toggle-group radio-group sonner form alert alert-dialog table accordion hover-card collapsible slider
cd ../..
```

> ⚠️ During `init`, choose the "New York"/default style and CSS variables. The CLI writes `src/index.css` (or similar) and `components.json`. Move its CSS into `src/styles/globals.css`, then **replace the colour values with the tokens in `TRD.md` §13.5** while keeping any structure the CLI requires.

Delete the Vite demo files (`App.css`, the counter in `App.tsx`, `assets/react.svg`).

### Step 5 — Global styles, fonts and providers (5 min)

1. Paste the token CSS from `TRD.md` §13.5 into `apps/web/src/styles/globals.css`.
2. `apps/web/src/providers/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { storage } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (storage.get('bu-theme') as Theme) ?? 'system');

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (t: Theme) => { storage.set('bu-theme', t); setThemeState(t); };
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
```

3. Prevent the white flash on dark-mode reloads — add this inline script to `apps/web/index.html` inside `<head>`:

```html
<script>
  try {
    var t = localStorage.getItem('bu-theme') || 'system';
    var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
</script>
```

Also set `<title>BridgeUp — learn from those who walked your path</title>`, a meta description, and `<link rel="icon" href="/favicon.svg">`.

4. `apps/web/src/lib/storage.ts`:

```ts
export const storage = {
  get(key: string) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  remove(key: string) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};
```

5. `apps/web/src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});
```

6. `apps/web/src/lib/api.ts` and `queryKeys.ts` — copy from `TRD.md` §13.2.

7. `apps/web/src/lib/utils.ts` (shadcn creates `cn`; add the rest):

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

export function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 60%), hsl(${(h + 40) % 360} 70% 50%))`;
}

export const titleCase = (s = '') =>
  s.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\bAi\b/g, 'AI').replace(/\bMl\b/g, 'ML').replace(/\bDsa\b/g, 'DSA').replace(/\bUi\/Ux\b/g, 'UI/UX');

export const fromNow = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export const isSafeUrl = (u?: string | null) => !!u && /^https?:\/\//i.test(u);
```

8. `apps/web/src/providers/AppProviders.tsx`:

```tsx
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from './ThemeProvider';
import { queryClient } from '@/lib/queryClient';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

> ⚠️ shadcn's generated `sonner.tsx` may import `useTheme` from `next-themes`. Change that import to your own `useTheme` from `@/providers/ThemeProvider` and pass `theme={theme}`.

9. `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/globals.css';
import { AppProviders } from './providers/AppProviders';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
```

> ⚠️ In React Router v7 `RouterProvider` for the DOM may be imported from `react-router/dom`. Check the docs for your installed version.

### Step 6 — App shell (10 min)

**Navigation items** — `apps/web/src/components/layout/nav.ts`:

```ts
import { Home, MessageCircleQuestion, MessagesSquare, Users, Building2, Sparkles, Route, Map, Briefcase, UsersRound, Handshake, Target, BookOpen, LifeBuoy, Shield } from 'lucide-react';

export const PRIMARY_NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/ask', label: 'Ask a Senior', icon: MessageCircleQuestion },
  { to: '/community', label: 'Community', icon: MessagesSquare },
  { to: '/people', label: 'People', icon: Users },
  { to: '/requests', label: 'Requests', icon: Handshake },
];
export const CAREER_NAV = [
  { to: '/prep', label: 'My Prep', icon: Target },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/roadmaps', label: 'Roadmaps', icon: Map },
  { to: '/path-twins', label: 'Path Twins', icon: Route },
];
export const CAMPUS_NAV = [
  { to: '/clubs', label: 'Clubs', icon: Sparkles },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/teams', label: 'Teams', icon: UsersRound },
  { to: '/stories', label: 'Stories', icon: BookOpen },
];
export const FOOTER_NAV = [
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];
export const MOBILE_NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/ask', label: 'Ask', icon: MessageCircleQuestion },
  { to: '/people', label: 'People', icon: Users },
  { to: '/opportunities', label: 'Opps', icon: Briefcase },
  { to: '/me', label: 'Me', icon: UsersRound },
];
```

**Sidebar** — `components/layout/Sidebar.tsx` (desktop, `hidden lg:flex`):

- 248px wide, `fixed inset-y-0 left-0`, `border-r bg-card/60 backdrop-blur`, vertical flex.
- Top: logo (SVG mark + "BridgeUp" in `font-display font-bold text-lg`), links to `/home`.
- Three labelled groups (micro labels "Community", "Career", "Campus" in `text-xs uppercase tracking-wider text-muted-foreground px-3 mt-6 mb-1`).
- Each item is a `NavLink` with classes: base `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition`; active `bg-primary-soft text-primary` plus a 3px left indicator (`before:` pseudo-element or an absolutely positioned span).
- Bottom: footer links + the **user card** (avatar, name, role badge, level for seniors/alumni) — a placeholder in this phase; wired to `useMe` in Phase 02.

**Topbar** — `components/layout/Topbar.tsx`:

- `sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60`.
- Left (mobile only): logo. Centre/left (desktop): search button styled like an input: `w-full max-w-md justify-start text-muted-foreground` with a search icon, "Search questions, people, companies…", and a `kbd` "⌘K" on the right. Clicking sets `paletteOpen` (palette built in Phase 05).
- Right: notification bell (placeholder button with `aria-label="Notifications"`), `ThemeToggle` (dropdown: Light / Dark / System), `UserMenu` (avatar dropdown: My profile, Edit profile, Requests, Bookmarks, Sign out).

**MobileNav** — `components/layout/MobileNav.tsx` (`lg:hidden`):

- `fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]`.
- 5 items from `MOBILE_NAV`, each `flex flex-col items-center gap-1 text-[11px]`; active item in `text-primary`.

**AppShell** — `components/layout/AppShell.tsx`:

```tsx
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="lg:pl-[248px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-6 md:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
```

**PageHeader** — title (`font-display text-2xl md:text-[28px] font-semibold tracking-tight`), optional description (`text-muted-foreground mt-1`), optional actions on the right; stacks vertically on mobile; `mb-6`.

**RightRail** — a layout helper: `grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]` with the rail `space-y-4 lg:sticky lg:top-24 self-start`.

### Step 7 — Shared building blocks (5 min)

Create in `apps/web/src/components/shared/`:

| Component | Props | Specification |
|---|---|---|
| `UserAvatar` | `user: { id, fullName, avatarUrl? }`, `size?: 'sm' \| 'md' \| 'lg' \| 'xl'` | shadcn `Avatar`; fallback shows `initials()` in white on `gradientFor(id)`; sizes 28/36/48/80px |
| `RoleBadge` | `role`, `currentYear?` | "First year" (year 1), "Junior" (2–3), "Senior", "Alumni"; indigo-soft pill `text-xs font-medium` |
| `VerifiedBadge` | — | Emerald `BadgeCheck` icon 14px with tooltip "Verified by BridgeUp admins" |
| `SelfReportedBadge` | — | Grey outline pill "Self-reported" with tooltip "Shared by the author; not independently verified" |
| `ReasonChip` | `children` | `inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary` with a 12px `Sparkles` icon |
| `MatchRing` | `score: number`, `size?: number` | SVG circle (radius 18, stroke 4), track `stroke-muted`, progress coloured: ≥ 70 `text-success`, 40–69 `text-primary`, else `text-muted-foreground`; centre text `text-[11px] font-semibold tabular`; `aria-label="Match score 82 out of 100"` |
| `EmptyState` | `icon`, `title`, `description?`, `action?` | Centred card `py-12`; icon in a 48px `bg-primary-soft text-primary rounded-2xl` square; title `font-semibold`; description muted; optional button |
| `Skeletons` | — | `CardSkeleton`, `ListSkeleton({ rows })`, `ProfileSkeleton`, `FeedSkeleton` using shadcn `Skeleton` shaped like the real content |
| `ComingNext` | `title`, `description`, `icon` | Dashed-border card with "Coming next" amber badge — used for anything you cut |
| `RelativeTime` | `iso` | `<time dateTime={iso} title={full date}>{fromNow(iso)}</time>` |

`MatchRing` implementation:

```tsx
export function MatchRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = 18, c = 2 * Math.PI * r;
  const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-primary' : 'text-muted-foreground';
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Match score ${score} out of 100`}>
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          className={`stroke-current ${color} transition-[stroke-dashoffset] duration-700`}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular">{score}</span>
    </div>
  );
}
```

### Step 8 — Landing page, router and logo (5 min)

**Logo** — `apps/web/public/logo.svg` (simple arch over two dots):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="9" fill="#4F46E5"/>
  <path d="M8 21c0-5 3.6-9 8-9s8 4 8 9" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="8" cy="22" r="2.2" fill="#fff"/>
  <circle cx="24" cy="22" r="2.2" fill="#F59E0B"/>
</svg>
```

Copy it as `favicon.svg`.

**Landing page** — `features/landing/LandingPage.tsx`. Sections:

1. **Nav bar:** logo, links "Stories", "Support", buttons "Log in" (ghost) and "Join with college email" (primary).
2. **Hero:** soft radial gradient background (`bg-[radial-gradient(ellipse_at_top,theme(colors.indigo.100),transparent_60%)]` in light, a deep indigo glow in dark). Eyebrow pill "Built for first years, powered by seniors". Headline (`font-display text-4xl md:text-6xl font-bold tracking-tight`): **"Your seniors have walked your path. Now they can light it."** Subline: "Ask questions, find mentors, see real interview experiences from your campus, and plan your four years — with people who've been exactly where you are." CTAs. A floating preview card cluster on the right (a sample question card, a person card with a match ring and reason chip, a This Week card) — static JSX, gently animated in with `motion`.
3. **Three value cards:** Ask a Senior · Find your people · Know every company (icon, title, 2-line description).
4. **How it works:** 3 numbered steps (Join with college email → Tell us your goals → Get answers, people and a plan).
5. **Wellbeing promise:** "No rankings. No pressure. Just people who want you to do well." with a link to Support.
6. **Footer:** © BridgeUp, Support, Stories.

**Router** — `apps/web/src/router.tsx` (temporary version; guards come in Phase 02):

```tsx
import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/features/landing/LandingPage';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { element: <AppShell />, children: [{ path: '/home', element: <HomePage /> }] },
  { path: '*', element: <NotFoundPage /> },
]);
```

**Temporary HomePage** shows `PageHeader` "Welcome to BridgeUp", one sample `ReasonChip`, a `MatchRing score={82}`, a "Ping API" button that calls `api('/health')` and shows a success toast with the time.

### Step 9 — Run everything (2 min)

From the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Commit:

```bash
git add -A && git commit -m "phase-00: workspace, design system, app shell" && git tag phase-00
```

Create a GitHub repository and push (`git remote add origin …`, `git push -u origin main --tags`). Deployment happens in Phase 10, but pushing now gives you a backup.

---

## 5. UI quality checklist for this phase

- [ ] Light and dark modes both look intentional: dark cards are `#14141F` on `#0B0B12`, never white; text never pure black on dark.
- [ ] Headings use Plus Jakarta Sans; body uses Inter (check in DevTools → Computed → font-family).
- [ ] Sidebar active state is obvious (indigo-soft background + left bar); all icons 18px.
- [ ] Top bar stays visible on scroll, with blur and a subtle border.
- [ ] Mobile (375px): sidebar hidden, bottom nav visible, content not hidden behind the bottom nav (`pb-24`).
- [ ] Focus rings visible on every interactive element when tabbing.
- [ ] Landing hero looks good at 360px, 768px and 1440px; no horizontal scroll.

---

## 6. Checkpoints during the phase

| After step | Check |
|---|---|
| 3 | `curl http://localhost:4000/api/health` returns JSON |
| 4 | `npm run dev -w apps/web` shows the Vite page with no errors; `@/` imports resolve |
| 5 | Toggling `document.documentElement.classList.toggle('dark')` in the console switches colours |
| 6 | `/home` shows sidebar, top bar and mobile nav correctly |
| 8 | "Ping API" toast shows the server time (proxy works) |

---

## 7. Completion criteria

- [ ] `npm run dev` at the root starts both apps without errors.
- [ ] `http://localhost:5173/api/health` returns `{ data: { ok: true } }`.
- [ ] `npm run typecheck -w apps/web` passes.
- [ ] Landing page, app shell and shared components render in both themes.
- [ ] All shadcn components from Step 4 exist in `src/components/ui`.
- [ ] `packages/shared/src/constants.ts` contains every list above and imports work from both apps.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 0.1 | Open `http://localhost:5173` | Landing page with hero, preview cards, value cards, footer |
| 0.2 | Click theme toggle → Dark, reload | Dark theme persists; no white flash |
| 0.3 | Open `/home` on a 1440px window | Sidebar (3 groups), top bar, placeholder content |
| 0.4 | Resize to 375px | Sidebar hidden; bottom tab bar visible; no horizontal scrollbar |
| 0.5 | Click "Ping API" | Green toast with the server time |
| 0.6 | Stop the API, click "Ping API" | Red toast "Something went wrong" (the app does not crash) |
| 0.7 | Visit `/nope` | Friendly 404 page with a link home |
| 0.8 | Tab through the landing page | Visible focus ring on every link and button |
| 0.9 | In a component, `import { TOPICS } from '@bridgeup/shared'` and render the names | Six topic names appear |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module '@/…'` in the editor but Vite works | Add the `paths` alias to `tsconfig.app.json` too and restart the TS server |
| shadcn `init` says no Tailwind config found | Make sure `@import "tailwindcss";` is in the CSS file referenced by `main.tsx`, and `@tailwindcss/vite` is in `vite.config.ts`; check shadcn's Vite guide |
| `/api/health` returns the Vite HTML page | The proxy isn't configured or the API isn't running on port 4000 |
| Import from `@bridgeup/shared` fails | Run `npm install` at the root so the workspace link exists; check the package `name` matches |
| Fonts don't change | Import the font packages in `main.tsx` and check the `--font-sans`/`--font-display` names match the package's font-family names |

---

## 10. If you're behind

Skip the landing page preview cards and "How it works" section (add them in Phase 10). **Do not skip** tokens, the app shell, the shared building blocks or the `/api` proxy — every later phase depends on them.
