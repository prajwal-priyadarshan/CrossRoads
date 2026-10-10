import { Home, MessageCircle, MessageCircleQuestion, MessagesSquare, Users, Building2, Sparkles, Route, Map, Briefcase, UsersRound, Handshake, Target, BookOpen, LifeBuoy, Shield } from 'lucide-react';

export const PRIMARY_NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/ask', label: 'Ask a Senior', icon: MessageCircleQuestion },
  { to: '/community', label: 'Community', icon: MessagesSquare },
  { to: '/people', label: 'People', icon: Users },
  { to: '/requests', label: 'Requests', icon: Handshake },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
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
