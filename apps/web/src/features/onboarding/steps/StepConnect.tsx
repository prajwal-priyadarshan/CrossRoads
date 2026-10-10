import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { HELP_VOCAB, stepConnectSchema } from '@bridgeup/shared';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/shared/FormField';
import { ChipToggleGroup } from '@/components/shared/ChipPicker';
import type { StepProps } from './types';

type In = z.input<typeof stepConnectSchema>;
type Out = z.output<typeof stepConnectSchema>;

export function StepConnect({ draft, onSubmit, formId, isFirstYear }: StepProps<'connect'> & { isFirstYear: boolean }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(stepConnectSchema),
    defaultValues: draft ?? {
      canHelpWith: [],
      lookingFor: [],
      linkedinUrl: '',
      githubUrl: '',
      showEmail: false,
      showLinkedin: true,
      showGithub: true,
    },
  });

  return (
    <form id={formId} onSubmit={handleSubmit((v) => onSubmit(v as In))} className="space-y-6" noValidate>
      <FormField label="I'm looking for">
        <Controller
          control={control}
          name="lookingFor"
          render={({ field }) => (
            <ChipToggleGroup value={field.value ?? []} onChange={field.onChange} options={HELP_VOCAB} tone="warm" />
          )}
        />
      </FormField>
      <FormField
        label="I can help with"
        hint={isFirstYear ? 'Even first years can help with campus life!' : undefined}
      >
        <Controller
          control={control}
          name="canHelpWith"
          render={({ field }) => (
            <ChipToggleGroup value={field.value ?? []} onChange={field.onChange} options={HELP_VOCAB} />
          )}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="LinkedIn URL (optional)" htmlFor="linkedinUrl" error={errors.linkedinUrl?.message}>
          <Input id="linkedinUrl" placeholder="https://linkedin.com/in/…" {...register('linkedinUrl')} />
        </FormField>
        <FormField label="GitHub URL (optional)" htmlFor="githubUrl" error={errors.githubUrl?.message}>
          <Input id="githubUrl" placeholder="https://github.com/…" {...register('githubUrl')} />
        </FormField>
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <p className="text-sm font-medium">What others can see</p>
        {(
          [
            ['showEmail', 'Show my email'],
            ['showLinkedin', 'Show my LinkedIn'],
            ['showGithub', 'Show my GitHub'],
          ] as const
        ).map(([name, label]) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor={name} className="font-normal">
                  {label}
                </Label>
                <Switch id={name} checked={!!field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        ))}
      </div>

      <div>
        <Controller
          control={control}
          name="consent"
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={field.value === true}
                onCheckedChange={(c) => field.onChange(c === true ? true : undefined)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                I agree to share my profile with students and alumni of my college. I can edit or delete it anytime.
              </Label>
            </div>
          )}
        />
        {errors.consent && <p className="mt-2 text-xs font-medium text-destructive">Please accept to continue</p>}
      </div>
    </form>
  );
}
