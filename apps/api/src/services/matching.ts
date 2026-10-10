import { jaccard, titleCase } from '../lib/text';

// Whole-term match so the skill "c" does not match every word containing the letter c.
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text: string, term: string) =>
  new RegExp(`(^|[^a-z0-9+#])${escapeRe(term)}($|[^a-z0-9+#])`).test(text);

export type P = {
  id: string; role: string; department: string | null; currentYear: number | null; company: string | null; jobTitle: string | null;
  skills: string[]; interests: string[]; targetRoles: string[]; targetCompanies: string[]; canHelpWith: string[]; lookingFor: string[];
  projects: { title: string; description: string }[]; mentorAvailable: boolean;
};
export type Reason = { label: string; weight: number };

const WEIGHTS = { skills: 25, interests: 15, help: 20, role: 12, company: 13, seniority: 10, department: 5 } as const;

export function scoreMatch(v: P, c: P) {
  const reasons: Reason[] = [];
  let score = 0;

  // 1. Skills: candidate's skills (+ words in their project text) vs what the viewer knows and cares about
  const projectText = c.projects.map((p) => `${p.title} ${p.description}`.toLowerCase()).join(' ');
  const viewerFocus = [...new Set([...v.skills, ...v.interests])];
  const sharedSkills = viewerFocus.filter((s) => c.skills.includes(s) || mentions(projectText, s));
  const skillScore = viewerFocus.length ? Math.min(1, sharedSkills.length / Math.min(viewerFocus.length, 4)) : 0;
  if (skillScore) {
    score += WEIGHTS.skills * skillScore;
    const fromProjects = sharedSkills.filter((s) => !c.skills.includes(s));
    reasons.push({
      label: fromProjects.length ? `Built projects in ${titleCase(fromProjects[0])}` : `Shared skills: ${sharedSkills.slice(0, 2).map(titleCase).join(', ')}`,
      weight: WEIGHTS.skills * skillScore,
    });
  }

  // 2. Interests
  const interestScore = jaccard(v.interests, c.interests);
  if (interestScore) {
    score += WEIGHTS.interests * interestScore;
    const both = v.interests.filter((i) => c.interests.includes(i));
    reasons.push({ label: `Both interested in ${titleCase(both[0])}`, weight: WEIGHTS.interests * interestScore });
  }

  // 3. They can help with what I'm looking for
  const helps = v.lookingFor.filter((x) => c.canHelpWith.includes(x));
  if (helps.length) {
    const s = Math.min(1, helps.length / 2);
    score += WEIGHTS.help * s;
    reasons.push({ label: `Can help with ${helps.slice(0, 2).join(', ')}`, weight: WEIGHTS.help * s });
  }

  // 4. Target role
  const roleHit = v.targetRoles.find((r) => c.targetRoles.includes(r) || (c.jobTitle ?? '').toLowerCase().includes(r));
  if (roleHit) {
    score += WEIGHTS.role;
    reasons.push({ label: c.jobTitle ? `Works as ${c.jobTitle} — your target role` : `Same target role: ${titleCase(roleHit)}`, weight: WEIGHTS.role });
  }

  // 5. Target company (Find My Alumni Mentor)
  const companyHit = c.company && v.targetCompanies.some((slug) => c.company!.toLowerCase().includes(slug.replace(/-/g, ' ')));
  if (companyHit) {
    score += WEIGHTS.company;
    reasons.push({ label: `Works at ${c.company}, your target company`, weight: WEIGHTS.company });
  }

  // 6. Seniority (someone ahead of you)
  const ahead = c.role === 'ALUMNI' || c.role === 'SENIOR' || (c.currentYear ?? 0) > (v.currentYear ?? 0);
  if (ahead) {
    score += WEIGHTS.seniority;
    const yrs = c.currentYear && v.currentYear ? c.currentYear - v.currentYear : null;
    reasons.push({ label: c.role === 'ALUMNI' ? 'Alumni' : yrs && yrs > 0 ? `${yrs} year${yrs > 1 ? 's' : ''} ahead of you` : 'Senior', weight: WEIGHTS.seniority * 0.5 });
  }

  // 7. Same department
  if (v.department && v.department === c.department) {
    score += WEIGHTS.department;
    reasons.push({ label: 'Same department', weight: WEIGHTS.department * 0.5 });
  }

  // small boost for available mentors in mentor mode is applied by the caller
  reasons.sort((a, b) => b.weight - a.weight);
  return { score: Math.round(Math.min(100, score)), reasons: reasons.slice(0, 3).map((r) => r.label) };
}

export function rankPeople(viewer: P, candidates: P[], mentorMode = false) {
  return candidates
    .map((c) => {
      const m = scoreMatch(viewer, c);
      const boost = mentorMode && c.mentorAvailable ? 5 : 0;
      return { candidate: c, match: { ...m, score: Math.min(100, m.score + boost) } };
    })
    .sort((a, b) => b.match.score - a.match.score);
}
