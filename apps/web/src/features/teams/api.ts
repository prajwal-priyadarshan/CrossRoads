import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Advisor, ApplicationStatus, TeamCard, TeamCreateInput, TeamDetail } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export type TeamParams = { kind?: string; matchesMe?: boolean; role?: string; includeClosed?: boolean };

const toQuery = (params: TeamParams) => {
  const sp = new URLSearchParams();
  if (params.kind) sp.set('kind', params.kind);
  if (params.matchesMe) sp.set('matchesMe', 'true');
  if (params.role) sp.set('role', params.role);
  if (params.includeClosed) sp.set('includeClosed', 'true');
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const useTeams = (params: TeamParams) =>
  useQuery({ queryKey: qk.teams(params), queryFn: () => api<TeamCard[]>(`/teams${toQuery(params)}`) });

export const useAdvisors = () =>
  useQuery({ queryKey: ['teams', 'advisors'], queryFn: () => api<Advisor[]>('/teams/advisors') });

export const useTeam = (id: string) =>
  useQuery({ queryKey: qk.team(id), queryFn: () => api<TeamDetail>(`/teams/${id}`) });

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: TeamCreateInput) => api<{ id: string }>('/teams', { method: 'POST', json: b }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
    onError: (e) => toast.error(e.message),
  });
}

export function useApplyToTeam(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api(`/teams/${teamId}/apply`, { method: 'POST', json: { message } }),
    onSuccess: () => {
      toast.success('Application sent');
      qc.invalidateQueries({ queryKey: qk.team(teamId) });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useJoinTeam(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/teams/${teamId}/join`, { method: 'POST', json: {} }),
    onSuccess: () => {
      toast.success('Joined! Say hi to the team.');
      qc.invalidateQueries({ queryKey: qk.team(teamId) });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRespondApplication(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { appId: string; status: ApplicationStatus }) =>
      api(`/teams/${teamId}/applications/${v.appId}`, { method: 'PATCH', json: { status: v.status } }),
    onSuccess: (_d, v) => {
      toast.success(v.status === 'ACCEPTED' ? 'Accepted — welcome them in!' : 'Applicant notified');
      qc.invalidateQueries({ queryKey: qk.team(teamId) });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCloseTeam(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: 'OPEN' | 'CLOSED') => api(`/teams/${teamId}`, { method: 'PATCH', json: { status } }),
    onSuccess: (_d, status) => {
      toast.success(status === 'CLOSED' ? 'Listing closed' : 'Listing reopened');
      qc.invalidateQueries({ queryKey: qk.team(teamId) });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e) => toast.error(e.message),
  });
}
