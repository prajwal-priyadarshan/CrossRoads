export async function gatherContext(userId: string, input: any) {
  return { user: { currentYear: 3, skills: [], interests: [], targetCompanies: [] }, semester: 6, roadmaps: [], companies: [], twins: [], targetRole: input.targetRole };
}

export function deterministicRoadmap(ctx: any, goalTrack: string) {
  return {
    title: `My plan`,
    summary: 'Built from your target companies.',
    gaps: [{ skill: 'DSA', why: 'Tested by target companies', priority: 'high' }],
    steps: [{ id: '123', title: 'Learn DSA', detail: 'Important for OA', semester: 6, kind: 'SKILL', resources: [] }],
  };
}
