import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Me, RegisterInput, LoginInput, ResetPasswordInput, ChangePasswordInput } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useRegister = () =>
  useMutation({ mutationFn: (b: RegisterInput) => api<{ email: string; verified: boolean }>('/auth/register', { method: 'POST', json: b }) });

export const useResend = () =>
  useMutation({ mutationFn: (email: string) => api('/auth/resend-code', { method: 'POST', json: { email } }) });

export const useForgotPassword = () =>
  useMutation({ mutationFn: (email: string) => api('/auth/forgot-password', { method: 'POST', json: { email } }) });

/** Resetting signs out every session, so drop anything cached for a previous user. */
export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ResetPasswordInput) => api('/auth/reset-password', { method: 'POST', json: b }),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(qk.me, null);
    },
  });
}

export const useChangePassword = () =>
  useMutation({ mutationFn: (b: ChangePasswordInput) => api('/auth/change-password', { method: 'POST', json: b }) });

export function useVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { email: string; code: string }) => api<Me>('/auth/verify', { method: 'POST', json: b }),
    onSuccess: (me) => qc.setQueryData(qk.me, me),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: LoginInput) => api<Me>('/auth/login', { method: 'POST', json: b }),
    onSuccess: (me) => qc.setQueryData(qk.me, me),
  });
}

export function useDemoLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => api<Me>('/auth/demo-login', { method: 'POST', json: { handle } }),
    onSuccess: (me) => {
      qc.clear();
      qc.setQueryData(qk.me, me);
    },
  });
}
