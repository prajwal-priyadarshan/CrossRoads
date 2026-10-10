import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanyDetail, CompanyTile, ExperienceCard, ExperienceCreateInput, PersonCard } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useCompanies = () =>
  useQuery({ queryKey: qk.companies, queryFn: () => api<CompanyTile[]>('/companies'), staleTime: 5 * 60_000 });

export const useCompany = (slug: string) =>
  useQuery({ queryKey: qk.company(slug), queryFn: () => api<CompanyDetail>(`/companies/${slug}`) });

export const useCompanyExperiences = (slug: string, filters: Record<string, string>) =>
  useQuery({
    queryKey: [...qk.company(slug), 'experiences', filters] as const,
    queryFn: () => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) if (v) sp.set(k, v);
      return api<ExperienceCard[]>(`/companies/${slug}/experiences?${sp}`);
    },
  });

export const useCompanyAlumni = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: [...qk.company(slug), 'alumni'] as const,
    queryFn: () => api<PersonCard[]>(`/companies/${slug}/alumni`),
    enabled,
  });

export function useCreateExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ExperienceCreateInput) =>
      api<{ id: string; companySlug: string; pointsEarned: number }>('/experiences', { method: 'POST', json: b }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.companies });
      qc.invalidateQueries({ queryKey: qk.company(res.companySlug) });
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}
