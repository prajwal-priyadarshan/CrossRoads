import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { changePasswordSchema, type ChangePasswordInput } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { useChangePassword } from '@/features/auth/api';

/** Change the password while signed in. The API signs out every other device and keeps this one. */
export function ChangePasswordCard() {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit((values) =>
    change.mutate(values, {
      onSuccess: () => {
        reset();
        toast.success('Password changed. Other devices have been signed out.');
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Changing it signs you out on every other device.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              {...register('currentPassword')}
            />
          </FormField>
          <FormField
            label="New password"
            htmlFor="newPassword"
            error={errors.password?.message}
            hint="At least 8 characters, with a letter and a number."
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>
          <Button type="submit" variant="outline" disabled={change.isPending}>
            {change.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />} Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
