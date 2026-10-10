import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { PublicOnly, RequireAdmin, RequireAuth, RequireOnboarded } from '@/components/guards/Guards';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { VerifyPage } from '@/features/auth/VerifyPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { MeRedirect } from '@/pages/MeRedirect';
import { PeoplePage } from '@/features/people/PeoplePage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProfileEditPage } from '@/features/profile/ProfileEditPage';
import { RequestsPage } from '@/features/requests/RequestsPage';
import { AskListPage } from '@/features/ask/AskListPage';
import { AskNewPage } from '@/features/ask/AskNewPage';
import { QuestionPage } from '@/features/ask/QuestionPage';
import { CommunityPage } from '@/features/community/CommunityPage';
import { TopicPage } from '@/features/community/TopicPage';
import { TagPage } from '@/features/community/TagPage';
import { PostPage } from '@/features/community/PostPage';
import { BookmarksPage } from '@/features/bookmarks/BookmarksPage';
import { SearchPage } from '@/features/search/SearchPage';
import { CompaniesPage } from '@/features/companies/CompaniesPage';
import { CompanyPage } from '@/features/companies/CompanyPage';
import { ExperienceNewPage } from '@/features/companies/ExperienceNewPage';
import { ClubsPage } from '@/features/clubs/ClubsPage';
import { ClubPage } from '@/features/clubs/ClubPage';
import { PathTwinsPage } from '@/features/twins/PathTwinsPage';
import { RoadmapsPage } from '@/features/roadmaps/RoadmapsPage';
import { RoadmapPage } from '@/features/roadmaps/RoadmapPage';
import { RoadmapNewPage } from '@/features/roadmaps/RoadmapNewPage';

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify', element: <VerifyPage /> },
    ],
  },
  // Phase 08 / 10: /stories, /stories/:slug, /support (public)
  {
    element: <RequireAuth />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <RequireOnboarded />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/home', element: <HomePage /> },
              { path: '/me', element: <MeRedirect /> },
              { path: '/people', element: <PeoplePage /> },
              { path: '/u/:handle', element: <ProfilePage /> },
              { path: '/settings/profile', element: <ProfileEditPage /> },
              { path: '/requests', element: <RequestsPage /> },
              { path: '/ask', element: <AskListPage /> },
              { path: '/ask/new', element: <AskNewPage /> },
              { path: '/ask/:id', element: <QuestionPage /> },
              { path: '/community', element: <CommunityPage /> },
              { path: '/community/tag/:tag', element: <TagPage /> },
              { path: '/community/:topic', element: <TopicPage /> },
              { path: '/post/:id', element: <PostPage /> },
              { path: '/bookmarks', element: <BookmarksPage /> },
              { path: '/search', element: <SearchPage /> },
              { path: '/companies', element: <CompaniesPage /> },
              { path: '/companies/:slug', element: <CompanyPage /> },
              { path: '/experiences/new', element: <ExperienceNewPage /> },
              { path: '/clubs', element: <ClubsPage /> },
              { path: '/clubs/:slug', element: <ClubPage /> },
              { path: '/path-twins', element: <PathTwinsPage /> },
              { path: '/roadmaps', element: <RoadmapsPage /> },
              { path: '/roadmaps/new', element: <RoadmapNewPage /> },
              { path: '/roadmaps/:id', element: <RoadmapPage /> },
              { element: <RequireAdmin />, children: [{ path: '/admin/*', element: <Navigate to="/home" replace /> }] },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
