import { Shield, MessageCircle, Star, Briefcase, Award, Map, Users, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const BADGE_DATA: Record<string, { name: string; icon: any; color: string; desc: string }> = {
  'first-answer': { name: 'First Answer', icon: MessageCircle, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30', desc: 'Answered a question' },
  'answer-machine': { name: 'Answer Machine', icon: Zap, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30', desc: 'Answered 10+ questions' },
  'trusted-voice': { name: 'Trusted Voice', icon: Shield, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30', desc: 'Earned 3+ best answers' },
  'experience-sharer': { name: 'Experience Sharer', icon: Briefcase, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', desc: 'Shared an interview experience' },
  'club-reviewer': { name: 'Club Reviewer', icon: Star, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30', desc: 'Reviewed a club' },
  'roadmap-author': { name: 'Roadmap Author', icon: Map, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30', desc: 'Created a roadmap' },
  'mentor': { name: 'Mentor', icon: Award, color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30', desc: 'Mentored someone' },
  'bridge-builder': { name: 'Bridge Builder', icon: Users, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30', desc: '10+ accepted connections' },
  'spotlight': { name: 'Spotlight', icon: Heart, color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30', desc: 'Featured in a success story' },
};

export function BadgeIcon({ slug, earned }: { slug: string; earned: boolean }) {
  const data = BADGE_DATA[slug];
  if (!data) return null;
  const Icon = data.icon;
  return (
    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", earned ? data.color : "bg-muted text-muted-foreground/50 opacity-50")}>
      <Icon className="h-6 w-6" />
    </div>
  );
}

export function BadgeGrid({ earnedSlugs }: { earnedSlugs: string[] }) {
  const earnedSet = new Set(earnedSlugs);
  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(BADGE_DATA).map(([slug, data]) => {
        const earned = earnedSet.has(slug);
        return (
          <div key={slug} className="flex flex-col items-center gap-2 text-center" title={earned ? 'Earned' : `How to earn: ${data.desc}`}>
            <BadgeIcon slug={slug} earned={earned} />
            <span className={cn("text-xs font-medium", !earned && "text-muted-foreground")}>{data.name}</span>
          </div>
        );
      })}
    </div>
  );
}
