import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { ApiError } from '@/lib/api';
import { roleLabel } from '@/components/shared/RoleBadge';
import { useAppConfig } from '@/hooks/useAppConfig';
import { AuthLayout } from './AuthLayout';
import { useDemoLogin, useLogin, useResend } from './api';


export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
  const login = useLogin();
  const demo = useDemoLogin();
  const resend = useResend();
  const [show, setShow] = useState(false);
  const { data: config } = useAppConfig();
  const demoAccounts = config?.demoMode ? config.demoAccounts : [];
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: (me) => navigate(me.onboarded ? target : '/onboarding', { replace: true }),
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'EMAIL_NOT_VERIFIED') {
          resend.mutate(values.email);
          toast.info('Please verify your email first. We sent you a new code.');
          navigate(`/verify?email=${encodeURIComponent(values.email)}`);
        } else toast.error(e.message);
      },
    }),
  );

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="College email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" />} Log in
        </Button>
      </form>

      {demoAccounts.length > 0 && (
        <div className="mt-8">
          <div className="relative mb-4 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-background px-2">Demo accounts</span>
            <div className="absolute inset-x-0 top-1/2 border-t" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <Button
                key={a.handle}
                variant="outline"
                size="sm"
                disabled={demo.isPending}
                onClick={() =>
                  demo.mutate(a.handle, {
                    onSuccess: (me) => navigate(me.onboarded ? target : '/onboarding', { replace: true }),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                {a.fullName.split(' ')[0]} ({roleLabel(a.role, a.currentYear).toLowerCase()})
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
