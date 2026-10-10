import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { OnboardingDraft } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';
import { ApiError } from '@/lib/api';
import { useMe } from '@/hooks/useMe';
import { useOnboardingStore, type Draft } from '@/stores/onboardingStore';
import { useCompleteOnboarding } from './api';
import { StepAbout } from './steps/StepAbout';
import { StepSkills } from './steps/StepSkills';
import { StepGoals } from './steps/StepGoals';
import { StepConnect } from './steps/StepConnect';

const STEPS = [
  { title: 'Tell us where you are', subtitle: 'This helps us show the right people and advice' },
  { title: 'What do you know and what excites you?', subtitle: 'Pick a few. You can change these anytime' },
  { title: 'Where are you heading?', subtitle: "No pressure: 'Still exploring' is a great answer" },
  { title: 'How can people help you, and how can you help?', subtitle: 'Last step. Almost there' },
] as const;

const STEP_OF_KEY: Record<string, number> = { about: 0, skills: 1, goals: 2, connect: 3 };
const FORM_ID = 'onboarding-step';

export function OnboardingPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const { step, draft, setStep, saveStep, reset } = useOnboardingStore();
  const complete = useCompleteOnboarding();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);

  if (me?.onboarded) return <Navigate to="/home" replace />;

  const finish = (full: OnboardingDraft) =>
    complete.mutate(full, {
      onSuccess: (updated) => {
        reset();
        toast.success(`Welcome to Crossroads, ${updated.fullName.split(' ')[0]}! 🎉`);
        navigate('/home', { replace: true });
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) {
          setServerErrors(e.fields);
          const first = Object.keys(e.fields)[0]?.split('.')[0] ?? '';
          if (first in STEP_OF_KEY) setStep(STEP_OF_KEY[first]!);
        }
        toast.error(e.message);
      },
    });

  const advance = <K extends keyof Draft>(key: K) => (value: NonNullable<Draft[K]>) => {
    saveStep(key, value);
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      finish({ ...draft, [key]: value } as OnboardingDraft);
    }
  };

  const back = () => {
    setDirection(-1);
    setStep(Math.max(0, step - 1));
  };

  const meta = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)] px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Logo to="/" className="mb-6" />
        <div className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </p>
            <div className="mt-2 flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{ width: i <= step ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              ))}
            </div>
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">{meta.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 * direction }}
              transition={{ duration: 0.18 }}
            >
              {step === 0 && (
                <StepAbout formId={FORM_ID} draft={draft.about} onSubmit={advance('about')} serverErrors={serverErrors} />
              )}
              {step === 1 && <StepSkills formId={FORM_ID} draft={draft.skills} onSubmit={advance('skills')} />}
              {step === 2 && (
                <StepGoals
                  formId={FORM_ID}
                  draft={draft.goals}
                  onSubmit={advance('goals')}
                  interests={draft.skills?.interests ?? []}
                />
              )}
              {step === 3 && (
                <StepConnect
                  formId={FORM_ID}
                  draft={draft.connect}
                  onSubmit={advance('connect')}
                  isFirstYear={draft.about?.status === 'FIRST_YEAR'}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0 || complete.isPending}>
              Back
            </Button>
            <Button type="submit" form={FORM_ID} disabled={complete.isPending}>
              {complete.isPending && <Loader2 className="animate-spin" />}
              {isLast ? 'Finish' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
