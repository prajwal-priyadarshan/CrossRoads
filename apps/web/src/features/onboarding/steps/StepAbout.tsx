import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Check, GraduationCap, Sprout, Sparkles, Trophy, Briefcase } from 'lucide-react';
import { DEPARTMENTS, stepAboutSchema } from '@crossroads/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/shared/FormField';
import { cn } from '@/lib/utils';
import type { StepProps } from './types';

type In = z.input<typeof stepAboutSchema>;
type Out = z.output<typeof stepAboutSchema>;

const STATUSES = [
  { value: 'FIRST_YEAR', label: 'First year', icon: Sprout },
  { value: 'SECOND_YEAR', label: 'Second year', icon: Sparkles },
  { value: 'THIRD_YEAR', label: 'Third year', icon: Trophy },
  { value: 'FINAL_YEAR', label: 'Final year', icon: GraduationCap },
  { value: 'ALUMNI', label: 'Alumni', icon: Briefcase },
] as const;

const YEARS_AHEAD: Record<string, number> = { FIRST_YEAR: 4, SECOND_YEAR: 3, THIRD_YEAR: 2, FINAL_YEAR: 1, ALUMNI: 0 };

export function StepAbout({ draft, onSubmit, formId, serverErrors }: StepProps<'about'>) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(stepAboutSchema),
    defaultValues: draft ?? { status: undefined, department: '', batchYear: undefined, bio: '' },
  });
  const status = watch('status');
  const bio = watch('bio') ?? '';

  return (
    <form id={formId} onSubmit={handleSubmit((v) => onSubmit(v as In))} className="space-y-6" noValidate>
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STATUSES.map(({ value, label, icon: Icon }) => {
            const selected = status === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setValue('status', value, { shouldValidate: true });
                  setValue('batchYear', new Date().getFullYear() + YEARS_AHEAD[value]!);
                }}
                className={cn(
                  'relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:border-primary/50',
                  selected && 'border-primary bg-primary-soft',
                )}
              >
                {selected && <Check className="absolute right-3 top-3 size-4 text-primary" />}
                <Icon className="size-5 text-primary" />
                <span className="text-sm font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
        {errors.status && <p className="mt-2 text-xs font-medium text-destructive">Choose where you are right now</p>}
        {serverErrors?.['about.status'] && (
          <p className="mt-2 text-xs font-medium text-destructive">{serverErrors['about.status']}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Department" error={errors.department?.message}>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.department}>
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Graduation year" htmlFor="batchYear" error={errors.batchYear?.message}>
          <Input id="batchYear" type="number" inputMode="numeric" {...register('batchYear')} />
        </FormField>
      </div>

      {status === 'ALUMNI' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Current company" htmlFor="company" error={errors.company?.message}>
            <Input id="company" {...register('company')} />
          </FormField>
          <FormField label="Current role" htmlFor="jobTitle" error={errors.jobTitle?.message}>
            <Input id="jobTitle" {...register('jobTitle')} />
          </FormField>
        </div>
      )}

      <FormField label="Short bio (optional)" htmlFor="bio" error={errors.bio?.message}>
        <Textarea id="bio" rows={3} maxLength={280} {...register('bio')} />
        <p className="tabular text-right text-xs text-muted-foreground">{bio.length}/280</p>
      </FormField>
    </form>
  );
}
