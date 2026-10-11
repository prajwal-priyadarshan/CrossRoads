import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { ApiError } from '@/lib/api';
import { exampleEmail, useAppConfig } from '@/hooks/useAppConfig';
import { AuthLayout } from './AuthLayout';
import { useRegister } from './api';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [show, setShow] = useState(false);
  const { data: config } = useAppConfig();
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { consent: false as unknown as true } });

  const onSubmit = handleSubmit((values) =>
    register.mutate(values, {
      onSuccess: ({ email, verified }) => {
        if (verified) {
          toast.success('Account created. Log in to continue.');
          navigate('/login');
          return;
        }
        toast.success('We sent a 6-digit code to your email');
        navigate(`/verify?email=${encodeURIComponent(email)}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) {
          for (const [name, message] of Object.entries(e.fields)) {
            setError(name as keyof RegisterInput, { message });
          }
        } else toast.error(e.message);
      },
    }),
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Students: use your college email. Alumni: use your personal email."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <div className="relative">
            <User className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="fullName"
              autoComplete="name"
              className="pl-9"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-message' : undefined}
              {...field('fullName')}
            />
          </div>
        </FormField>
        <FormField
          label="College email"
          htmlFor="email"
          error={errors.email?.message}
          hint={`Use your college email, e.g. ${exampleEmail(config)}`}
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="pl-9"
              aria-invalid={!!errors.email}
              aria-describedby="email-message"
              {...field('email')}
            />
          </div>
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="8+ characters, a letter and a number"
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-10 pl-9"
              aria-invalid={!!errors.password}
              aria-describedby="password-message"
              {...field('password')}
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
        <label className="flex items-start gap-3 rounded-lg border border-transparent p-1 text-sm text-muted-foreground transition-colors hover:border-border">
          <input type="checkbox" className="mt-1 size-4 accent-primary" {...field('consent')} />
          <span>
            I have read{' '}
            <Link to="/data-notice" target="_blank" className="text-primary underline underline-offset-2">
              how my data is used
            </Link>
            . Profile details and messages are shared only with people I connect with, and I can export or delete my
            data at any time.
          </span>
        </label>
        {errors.consent && (
          <p className="text-sm text-destructive" role="alert">
            {errors.consent.message}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={register.isPending}>
          {register.isPending && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
