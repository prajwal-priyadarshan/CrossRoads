import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CodeInput } from '@/components/shared/CodeInput';
import { AuthLayout } from './AuthLayout';
import { useResend, useVerify } from './api';

const COOLDOWN = 30;

export function VerifyPage() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const navigate = useNavigate();
  const verify = useVerify();
  const resend = useResend();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) return <Navigate to="/register" replace />;

  const submit = (value: string) => {
    setError('');
    verify.mutate(
      { email, code: value },
      {
        onSuccess: () => navigate('/onboarding', { replace: true }),
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
        setCooldown(COOLDOWN);
        setError('');
        setCode('');
        toast.success('A new code is on its way');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`Enter the 6-digit code sent to ${email}`}
      footer={
        <>
          Wrong email?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Start again
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={verify.isPending} invalid={!!error} />
        {error && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={code.length !== 6 || verify.isPending} onClick={() => submit(code)}>
          {verify.isPending && <Loader2 className="animate-spin" />} Verify
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          disabled={cooldown > 0 || resend.isPending}
          onClick={onResend}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </Button>
        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <p className="text-center text-xs text-muted-foreground">Demo mode: the code is printed in the API log.</p>
        )}
      </div>
    </AuthLayout>
  );
}
