import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { forgotPasswordSchema } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { AuthLayout } from './AuthLayout';
import { useForgotPassword } from './api';

/** Step 1 of a password reset: ask for the email, then go to the code + new password step. */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(({ email }) =>
    forgot.mutate(email, {
      // The API answers the same whether or not the account exists, so the next step never confirms it either
      onSuccess: () => navigate(`/reset-password?email=${encodeURIComponent(email)}`),
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a 6-digit code."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </FormField>
        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending && <Loader2 className="animate-spin" />} Send code
        </Button>
      </form>
    </AuthLayout>
  );
}
