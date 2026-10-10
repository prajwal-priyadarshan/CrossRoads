import type { PrepItem } from '../generated/prisma/client';

export function readinessFor(user: { skills: string[] }, company: { id: string; skillsTested: string[] }, items: PrepItem[], simAvg?: number) {
  const tested = company.skillsTested;
  const skill = tested.length ? tested.filter((s) => user.skills.includes(s)).length / tested.length : 0;
  const tracks = (['OA', 'APTITUDE', 'TECHNICAL', 'HR'] as const).map((cat) => {
    const its = items.filter((i) => i.category === cat && (!i.companyId || i.companyId === company.id));
    return { category: cat, total: its.length, done: its.filter((i) => i.done).length };
  });
  const withItems = tracks.filter((t) => t.total > 0);
  const trackAvg = withItems.length ? withItems.reduce((s, t) => s + t.done / t.total, 0) / withItems.length : 0;
  let score = 100 * (0.6 * skill + 0.4 * trackAvg);
  if (simAvg != null) score += Math.min(10, simAvg / 10);
  return { score: Math.round(Math.min(100, score)), skill: Math.round(skill * 100), tracks };
}
