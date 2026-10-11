import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { PublicOnly, RequireAdmin, RequireAuth, RequireOnboarded } from '@/components/guards/Guards';
import { FullPageSpinner } from '@/components/shared/FullPageSpinner';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteErrorPage } from './pages/RouteErrorPage';

/**
 * Route pages are code-split: each one is loaded the first time it is visited.
 * `page(() => import(...), 'Name')` keeps named exports while still lazy-loading.
 */
const page = <M extends Record<string, unknown>>(loader: () => Promise<M>, name: keyof M & string): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await loader())[name] as ComponentType }),
});

const appRoutes: RouteObject[] = [
  { path: '/home', ...page(() => import('@/features/home/HomePage'), 'HomePage') },
  { path: '/me', ...page(() => import('./pages/MeRedirect'), 'MeRedirect') },

  // People and profiles
  { path: '/people', ...page(() => import('@/features/people/PeoplePage'), 'PeoplePage') },
  { path: '/u/:handle', ...page(() => import('@/features/profile/ProfilePage'), 'ProfilePage') },
  { path: '/settings/profile', ...page(() => import('@/features/profile/ProfileEditPage'), 'ProfileEditPage') },
  { path: '/requests', ...page(() => import('@/features/requests/RequestsPage'), 'RequestsPage') },
  { path: '/messages', ...page(() => import('@/features/chat/MessagesPage'), 'MessagesPage') },
  { path: '/events', ...page(() => import('@/features/events/EventsPage'), 'EventsPage') },
  { path: '/give', ...page(() => import('@/features/giving/GivingPage'), 'GivingPage') },
  { path: '/give/:slug', ...page(() => import('@/features/giving/CampaignPage'), 'CampaignPage') },
  { path: '/settings/data', ...page(() => import('@/features/account/DataPage'), 'DataPage') },
  { path: '/messages/:id', ...page(() => import('@/features/chat/MessagesPage'), 'MessagesPage') },

  // Ask a Senior and community
  { path: '/ask', ...page(() => import('@/features/ask/AskListPage'), 'AskListPage') },
  { path: '/ask/new', ...page(() => import('@/features/ask/AskNewPage'), 'AskNewPage') },
  { path: '/ask/:id', ...page(() => import('@/features/ask/QuestionPage'), 'QuestionPage') },
  { path: '/community', ...page(() => import('@/features/community/CommunityPage'), 'CommunityPage') },
  { path: '/community/tag/:tag', ...page(() => import('@/features/community/TagPage'), 'TagPage') },
  { path: '/community/:topic', ...page(() => import('@/features/community/TopicPage'), 'TopicPage') },
  { path: '/post/:id', ...page(() => import('@/features/community/PostPage'), 'PostPage') },

  // Home utilities
  { path: '/bookmarks', ...page(() => import('@/features/bookmarks/BookmarksPage'), 'BookmarksPage') },
  { path: '/search', ...page(() => import('@/features/search/SearchPage'), 'SearchPage') },

  // Campus intelligence
  { path: '/companies', ...page(() => import('@/features/companies/CompaniesPage'), 'CompaniesPage') },
  { path: '/companies/:slug', ...page(() => import('@/features/companies/CompanyPage'), 'CompanyPage') },
  { path: '/experiences/new', ...page(() => import('@/features/companies/ExperienceNewPage'), 'ExperienceNewPage') },
  { path: '/clubs', ...page(() => import('@/features/clubs/ClubsPage'), 'ClubsPage') },
  { path: '/clubs/:slug', ...page(() => import('@/features/clubs/ClubPage'), 'ClubPage') },
  { path: '/path-twins', ...page(() => import('@/features/twins/PathTwinsPage'), 'PathTwinsPage') },
  { path: '/roadmaps', ...page(() => import('@/features/roadmaps/RoadmapsPage'), 'RoadmapsPage') },
  { path: '/roadmaps/new', ...page(() => import('@/features/roadmaps/RoadmapNewPage'), 'RoadmapNewPage') },
  { path: '/roadmaps/:id', ...page(() => import('@/features/roadmaps/RoadmapPage'), 'RoadmapPage') },

  // Opportunities, teams and notifications
  { path: '/opportunities', ...page(() => import('@/features/opportunities/OpportunitiesPage'), 'OpportunitiesPage') },
  { path: '/opportunities/new', ...page(() => import('@/features/opportunities/OpportunityNewPage'), 'OpportunityNewPage') },
  { path: '/teams', ...page(() => import('@/features/teams/TeamsPage'), 'TeamsPage') },
  { path: '/teams/new', ...page(() => import('@/features/teams/TeamNewPage'), 'TeamNewPage') },
  { path: '/teams/:id', ...page(() => import('@/features/teams/TeamPage'), 'TeamPage') },
  { path: '/notifications', ...page(() => import('@/features/notifications/NotificationsPage'), 'NotificationsPage') },

  // Admin (Phase 08)
  { element: <RequireAdmin />, children: [{ path: '/admin', ...page(() => import('@/features/admin/AdminPage'), 'AdminPage') }] },
  
  // Prep (Phase 09)
  { path: '/prep', ...page(() => import('@/features/prep/PrepDashboardPage'), 'PrepDashboardPage') },
  { path: '/prep/simulator', ...page(() => import('@/features/prep/SimulatorSetupPage'), 'SimulatorSetupPage') },
  { path: '/prep/simulator/:id', ...page(() => import('@/features/prep/SimulatorSessionPage'), 'SimulatorSessionPage') },
  { path: '/roadmaps/generate', ...page(() => import('@/features/roadmaps/RoadmapGeneratePage'), 'RoadmapGeneratePage') },
];

export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <FullPageSpinner />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          { path: '/login', ...page(() => import('@/features/auth/LoginPage'), 'LoginPage') },
          { path: '/register', ...page(() => import('@/features/auth/RegisterPage'), 'RegisterPage') },
          { path: '/verify', ...page(() => import('@/features/auth/VerifyPage'), 'VerifyPage') },
        ],
      },
      // The landing page lists every feature; open to everyone, signed in or not
      { path: '/', ...page(() => import('@/features/landing/LandingPage'), 'LandingPage') },
      // Phase 10: /support (public)
      { path: '/support', ...page(() => import('@/features/support/SupportPage'), 'SupportPage') },
      // Success stories are public — no sign-in needed to read them
      { path: '/stories', ...page(() => import('@/features/stories/StoriesPage'), 'StoriesPage') },
      { path: '/stories/:slug', ...page(() => import('@/features/stories/StoryPage'), 'StoryPage') },
      // Phase 12: /data-notice (public, linked from the sign-up consent checkbox)
      { path: '/data-notice', ...page(() => import('@/features/legal/DataNoticePage'), 'DataNoticePage') },
      {
        element: <RequireAuth />,
        children: [
          { path: '/onboarding', ...page(() => import('@/features/onboarding/OnboardingPage'), 'OnboardingPage') },
          { element: <RequireOnboarded />, children: [{ element: <AppShell />, children: appRoutes }] },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
