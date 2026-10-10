import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAnswerQuestion, useFinishSession, useSimSession } from './api';

type SimQuestion = {
  id: string; order: number; format: 'MCQ' | 'SHORT' | 'CODING_APPROACH'; topic: string;
  prompt: string; options?: string[]; rubric?: Array<{ point: string; weight: number }>;
  userAnswer?: string; isCorrect?: boolean; scorePct?: number; feedback?: string;
  explanation?: string; correctAnswer?: string;
  sourceYear?: number; sourceRole?: string; sourceExperienceId?: string;
  answeredAt?: string;
};

type AnswerResult = {
  graded: {
    isCorrect?: boolean; scorePct?: number; feedback: string;
    explanation?: string; correctAnswer?: string;
    rubric?: Array<{ point: string; weight: number }>;
    missing?: string[];
  };
  next?: SimQuestion;
  done: boolean;
};

// --- Score Ring ---
function ScoreRing({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg className="size-28" viewBox="0 0 112 112" aria-label={`Score ${value} of ${max}`}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
        <circle
          cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="10"
          className={pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          transform="rotate(-90 56 56)"
        />
        <text x="56" y="54" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700 }} className="fill-foreground">{value}</text>
        <text x="56" y="70" textAnchor="middle" style={{ fontSize: 11 }} className="fill-muted-foreground">of {max}</text>
      </svg>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

// --- Difficulty bars ---
function DifficultyBars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn('h-3 w-1.5 rounded-sm', i <= level ? 'bg-primary' : 'bg-muted')} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">Difficulty adapts</span>
    </div>
  );
}

// --- Question View ---
function QuestionView({
  question,
  onSubmit,
  isPending,
}: {
  question: SimQuestion;
  onSubmit: (answer: string, selfCheck?: number[]) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [selfCheckMode, setSelfCheckMode] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (question.format === 'MCQ') {
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < 4) setSelected(idx);
      if (e.key === 'Enter' && selected !== null) onSubmit(String(selected));
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleWrittenSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.format, selected, textAnswer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWrittenSubmit = () => {
    if (selfCheckMode) {
      onSubmit(textAnswer, checked);
    } else {
      onSubmit(textAnswer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Source */}
      <p className="text-xs text-muted-foreground">
        {question.sourceYear && question.sourceRole
          ? `Based on a ${question.sourceYear} ${question.sourceRole} experience`
          : 'General practice question'}
      </p>

      {/* Prompt */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{question.prompt}</p>
      </div>

      {/* MCQ */}
      {question.format === 'MCQ' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition',
                selected === i ? 'border-primary bg-primary-soft font-medium' : 'bg-card hover:bg-muted',
              )}
            >
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold', selected === i ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground')}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
          <Button onClick={() => selected !== null && onSubmit(String(selected))} disabled={selected === null || isPending} className="w-full mt-2">
            Submit answer
          </Button>
          <p className="text-xs text-muted-foreground text-center">Press 1–4 to select, Enter to submit</p>
        </div>
      )}

      {/* Written */}
      {(question.format === 'SHORT' || question.format === 'CODING_APPROACH') && (
        <div className="space-y-3">
          <textarea
            className="w-full min-h-40 rounded-xl border bg-card p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={question.format === 'CODING_APPROACH' ? 'Explain your approach, data structures and time complexity' : 'Write your answer'}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
          />
          {question.format === 'CODING_APPROACH' && (
            <p className="text-xs text-muted-foreground">Explain your approach — code execution is coming later.</p>
          )}

          {selfCheckMode && question.rubric && (
            <div className="rounded-xl border p-4 space-y-2">
              <p className="text-sm font-medium">Which of these did you cover?</p>
              {question.rubric.map((pt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked.includes(i)}
                    onChange={(e) => setChecked(e.target.checked ? [...checked, i] : checked.filter((c) => c !== i))}
                    className="rounded"
                  />
                  {pt.point}
                </label>
              ))}
              <Button onClick={() => onSubmit(textAnswer, checked)} disabled={isPending} className="w-full">Submit self-assessment</Button>
            </div>
          )}

          {!selfCheckMode && (
            <div className="flex gap-2">
              <Button onClick={handleWrittenSubmit} disabled={!textAnswer.trim() || isPending} className="flex-1">
                Submit answer
              </Button>
              {question.rubric?.length && (
                <Button variant="outline" onClick={() => setSelfCheckMode(true)} className="shrink-0">Self-check</Button>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Ctrl+Enter to submit</p>
        </div>
      )}
    </div>
  );
}

// --- Feedback View ---
function FeedbackView({
  question,
  graded,
  onNext,
  done,
}: {
  question: SimQuestion;
  graded: AnswerResult['graded'];
  onNext: () => void;
  done: boolean;
}) {
  const isCorrect = graded.isCorrect ?? (graded.scorePct != null ? graded.scorePct >= 70 : false);

  return (
    <div className="space-y-4">
      {/* MCQ banner */}
      {question.format === 'MCQ' && (
        <div className={cn('flex items-center gap-3 rounded-xl p-4', isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30')}>
          {isCorrect ? <CheckCircle2 className="size-6 text-emerald-600 shrink-0" /> : <XCircle className="size-6 text-rose-600 shrink-0" />}
          <div>
            <p className={cn('font-semibold', isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            {!isCorrect && graded.correctAnswer && (
              <p className="text-sm text-muted-foreground">Correct answer: {String.fromCharCode(65 + parseInt(graded.correctAnswer))}. {question.options?.[parseInt(graded.correctAnswer)]}</p>
            )}
          </div>
        </div>
      )}

      {/* Written score */}
      {question.format !== 'MCQ' && graded.scorePct != null && (
        <div className="flex justify-center">
          <ScoreRing value={graded.scorePct} max={100} label="Score" />
        </div>
      )}

      {/* Feedback */}
      {graded.feedback && <p className="text-sm text-muted-foreground">{graded.feedback}</p>}

      {/* Explanation */}
      {graded.explanation && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-semibold mb-1 text-muted-foreground">Explanation</p>
          <p className="text-sm whitespace-pre-wrap">{graded.explanation}</p>
        </div>
      )}

      {/* Rubric */}
      {graded.rubric && graded.rubric.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Rubric</p>
          {graded.rubric.map((pt, i) => {
            const covered = !graded.missing?.includes(pt.point);
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                {covered ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> : <XCircle className="size-4 text-rose-400 shrink-0" />}
                <span className={cn(covered ? '' : 'text-muted-foreground')}>{pt.point}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Missing */}
      {graded.missing && graded.missing.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">What to revise</p>
          <ul className="list-disc list-inside text-sm space-y-0.5">
            {graded.missing.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}

      {/* Source experience link */}
      {question.sourceExperienceId && (
        <Link to={`/companies?experience=${question.sourceExperienceId}`} className="text-xs text-primary hover:underline">
          View source experience ({question.sourceYear} {question.sourceRole}) →
        </Link>
      )}

      <Button onClick={onNext} className="w-full">
        {done ? 'See summary' : 'Next question'}
      </Button>
    </div>
  );
}

// --- Session Summary ---
function SessionSummary({ session, questions, company }: { session: any; questions: SimQuestion[]; company: any }) {
  const summary = session.summary ?? {};
  const strengths: string[] = summary.strengths ?? [];
  const revise: string[] = summary.revise ?? [];
  const expIds: string[] = summary.experienceIds ?? [];

  const topicData = questions
    .filter((q) => q.answeredAt)
    .reduce<Record<string, { total: number; correct: number }>>((acc, q) => {
      if (!acc[q.topic]) acc[q.topic] = { total: 0, correct: 0 };
      acc[q.topic].total++;
      if (q.isCorrect || (q.scorePct != null && q.scorePct >= 70)) acc[q.topic].correct++;
      return acc;
    }, {});

  const chartData = Object.entries(topicData).map(([name, { total, correct }]) => ({
    name,
    accuracy: Math.round((correct / total) * 100),
  }));

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-center">
        <ScoreRing value={session.score} max={session.total || session.maxQuestions} label="Questions correct" />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Accuracy by topic</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 30)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" fill="var(--primary)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {(strengths.length > 0 || revise.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Strengths</p>
              <div className="flex flex-wrap gap-1">
                {strengths.map((s) => <Badge key={s} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs">{s}</Badge>)}
              </div>
            </div>
          )}
          {revise.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">Revise these</p>
              <div className="flex flex-wrap gap-1">
                {revise.map((s) => <Badge key={s} className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs">{s}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}

      {expIds.length > 0 && (
        <div className="text-sm">
          <p className="font-medium mb-1">Source experiences</p>
          <div className="flex flex-wrap gap-2">
            {expIds.map((id) => (
              <Link key={id} to={`/companies?experience=${id}`} className="text-primary hover:underline text-xs">View experience →</Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/prep/simulator?company=${company?.slug}`}>Practice again</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link to="/prep">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

// --- Main page ---
export function SimulatorSessionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSimSession(id);
  const answerMut = useAnswerQuestion();
  const finishMut = useFinishSession();
  const [lastGraded, setLastGraded] = useState<AnswerResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <p className="text-muted-foreground">Session not found.</p>
        <Button asChild variant="link"><Link to="/prep/simulator">Start new session</Link></Button>
      </div>
    );
  }

  const { session, questions = [], company } = data;

  // FINISHED
  if (session.status === 'FINISHED') {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="font-display text-2xl font-semibold mb-6">Session complete</h1>
        <SessionSummary session={session} questions={questions} company={company} />
      </div>
    );
  }

  const currentQuestion: SimQuestion | undefined = questions.find((q: SimQuestion) => !q.answeredAt);
  const lastAnswered: SimQuestion | undefined = questions.filter((q: SimQuestion) => q.answeredAt).at(-1);

  const handleSubmit = (answer: string, selfCheck?: number[]) => {
    if (!currentQuestion) return;
    answerMut.mutate(
      { sessionId: id, questionId: currentQuestion.id, answer, selfCheck },
      {
        onSuccess: (res) => {
          setLastGraded(res);
          setShowFeedback(true);
        },
      },
    );
  };

  const handleEnd = () => {
    finishMut.mutate(id, { onSuccess: () => navigate(`/prep/simulator/${id}`) });
  };

  const handleNext = () => {
    setShowFeedback(false);
    setLastGraded(null);
    if (lastGraded?.done) {
      finishMut.mutate(id);
    }
  };

  const progress = questions.filter((q: SimQuestion) => q.answeredAt).length;
  const questionToShow = showFeedback ? (lastAnswered ?? currentQuestion) : currentQuestion;

  return (
    <div className="mx-auto max-w-2xl py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{company?.name}</p>
          <p className="text-xs text-muted-foreground">{session.roundType.replace('_', ' ').toLowerCase()}</p>
        </div>
        <p className="text-xs text-muted-foreground shrink-0">Question {progress + (showFeedback ? 0 : 1)} of {session.maxQuestions}</p>
        <DifficultyBars level={session.difficulty} />
        <Button variant="outline" size="sm" onClick={handleEnd} disabled={finishMut.isPending} className="shrink-0">
          End session
        </Button>
      </div>

      {/* Question or feedback */}
      {questionToShow && (
        <div>
          {showFeedback && lastGraded ? (
            <FeedbackView
              question={questionToShow}
              graded={lastGraded.graded}
              onNext={handleNext}
              done={lastGraded.done}
            />
          ) : (
            <QuestionView question={questionToShow} onSubmit={handleSubmit} isPending={answerMut.isPending} />
          )}
        </div>
      )}

      {!questionToShow && !showFeedback && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">All questions answered.</p>
          <Button onClick={handleEnd} disabled={finishMut.isPending}>See summary</Button>
        </div>
      )}
    </div>
  );
}
