import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { passwordSchema } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CodeInput } from '@/components/shared/CodeInput';
import { FormField } from '@/components/shared/FormField';
import { useAppConfig } from '@/hooks/useAppConfig';
import { AuthLayout } from './AuthLayout';
import { useForgotPassword, useResetPassword } from './api';

/** Step 2 of a password reset: the emailed code plus a new password. Ends on the login page. */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const navigate = useNavigate();
  const reset = useResetPassword();
  const resend = useForgotPassword();
  const { data: config } = useAppConfig();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!email) return <Navigate to="/forgot-password" replace />;

  const submit = () => {
    const checked = passwordSchema.safeParse(password);
    setPasswordError(checked.success ? '' : (checked.error.issues[0]?.message ?? 'Choose a stronger password'));
    if (!checked.success) return;
    setError('');
    reset.mutate(
      { email, code, password },
      {
        onSuccess: () => {
          toast.success('Password changed. Log in with your new password.');
          navigate('/login', { replace: true });
        },
        onError: (e) => {
          setError(e.message);
          setCode('');
        },
      },
    );
  };

  const onResend = () =>
    resend.mutate(email, {
      onSuccess: () => {
        setError('');
        setCode('');
        toast.success('If that email has an account, a new code is on its way');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={`If ${email} has an account, we sent it a 6-digit code.`}
      footer={
        <>
          Wrong email?{' '}
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Start again
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <FormField label="Code from the email" error={error}>
          <CodeInput value={code} onChange={setCode} disabled={reset.isPending} invalid={!!error} />
        </FormField>
        <FormField
          label="New password"
          htmlFor="password"
          error={passwordError}
          hint="At least 8 characters, with a letter and a number."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!passwordError}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={code.length !== 6 || !password || reset.isPending}>
          {reset.isPending && <Loader2 className="animate-spin" />} Set new password
        </Button>
        <Button type="button" variant="ghost" className="w-full" disabled={resend.isPending} onClick={onResend}>
          Send a new code
        </Button>
        {config?.demoMode && (
          <p className="text-center text-xs text-muted-foreground">Demo mode: the code is printed in the API log.</p>
        )}
      </form>
    </AuthLayout>
  );
}
