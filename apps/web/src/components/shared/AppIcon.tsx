import type { ComponentType } from 'react';
import {
  Binary,
  BrainCircuit,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartCandlestick,
  CodeXml,
  Compass,
  FlaskConical,
  GraduationCap,
  Handshake,
  Hash,
  Monitor,
  Rocket,
  Send,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';

// Icons referenced by name from shared constants and the database. Add here as new names appear.
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  binary: Binary,
  'brain-circuit': BrainCircuit,
  briefcase: Briefcase,
  'briefcase-business': BriefcaseBusiness,
  'building-2': Building2,
  calendar: CalendarDays,
  'chart-candlestick': ChartCandlestick,
  'code-xml': CodeXml,
  compass: Compass,
  'flask-conical': FlaskConical,
  'graduation-cap': GraduationCap,
  handshake: Handshake,
  hash: Hash,
  'monitor-check': Monitor,
  rocket: Rocket,
  send: Send,
  trophy: Trophy,
  'user-check': UserCheck,
  users: Users,
};

export function AppIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Hash;
  return <Icon className={className} />;
}
