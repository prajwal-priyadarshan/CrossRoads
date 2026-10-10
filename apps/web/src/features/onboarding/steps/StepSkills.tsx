import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { INTERESTS, SKILLS, stepSkillsSchema } from '@crossroads/shared';
import { FormField } from '@/components/shared/FormField';
import { ChipPicker, ChipToggleGroup } from '@/components/shared/ChipPicker';
import type { StepProps } from './types';

type In = z.input<typeof stepSkillsSchema>;

export function StepSkills({ draft, onSubmit, formId }: StepProps<'skills'>) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<In>({
    resolver: zodResolver(stepSkillsSchema),
    defaultValues: draft ?? { skills: [], interests: [] },
  });

  return (
    <form id={formId} onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-6" noValidate>
      <FormField label="Skills" htmlFor="skills" error={errors.skills?.message ?? errors.skills?.root?.message}>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <ChipPicker
              id="skills"
              value={field.value}
              onChange={field.onChange}
              options={SKILLS}
              max={20}
              placeholder="Search or add a skill"
            />
          )}
        />
      </FormField>
      <FormField label="Interests" error={errors.interests?.message ?? errors.interests?.root?.message}>
        <Controller
          control={control}
          name="interests"
          render={({ field }) => (
            <ChipToggleGroup value={field.value} onChange={field.onChange} options={INTERESTS} max={12} />
          )}
        />
      </FormField>
    </form>
  );
}
