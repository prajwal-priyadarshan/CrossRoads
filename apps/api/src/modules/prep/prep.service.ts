import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { readinessFor } from '../../services/readiness';

export async function getDashboard(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { prepItems: true } });
  const companies = await prisma.company.findMany({ where: { slug: { in: user.targetCompanies } } });
  
  const readiness = companies.map((c: any) => readinessFor(user, c, user.prepItems));
  
  return {
    targets: { companies, roles: user.targetRoles },
    readiness,
    tracks: readiness[0]?.tracks ?? [],
    nextActions: [{ label: 'Practice Aptitude', reason: 'Common round', kind: 'PRACTICE', href: '/prep/simulator' }],
    stageCopy: 'Prepare for placements'
  };
}
