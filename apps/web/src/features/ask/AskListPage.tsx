import { useState } from 'react';
import { Link } from 'react-router';
import { Lightbulb, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMe } from '@/hooks/useMe';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { PostFeed } from '@/features/community/PostFeed';
import { SortToggle } from '@/features/community/SortToggle';
import { TopicTabsState } from './TopicChips';

type AskSort = 'unanswered' | 'latest' | 'top_all';

export function AskListPage() {
  const { data: me } = useMe();
  const isHelper = me?.role === 'SENIOR' || me?.role === 'ALUMNI';
  const [sort, setSort] = useState<AskSort>(isHelper ? 'unanswered' : 'latest');
  const [topic, setTopic] = useState('');
  const [tipHidden, setTipHidden] = useState(storage.get(STORAGE_KEYS.askTipDismissed) === '1');
  const firstYear = me?.currentYear === 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ask a Senior"
        description="Real answers from people who've been exactly where you are."
        actions={
          <Button asChild>
            <Link to="/ask/new">
              <Plus /> Ask a question
            </Link>
          </Button>
        }
      />

      {firstYear && !tipHidden && (
        <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4 text-sm text-primary">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">
            Not sure what to ask? Try: &ldquo;Which clubs helped you most in first year?&rdquo;
          </p>
          <button
            type="button"
            aria-label="Dismiss tip"
            onClick={() => {
              storage.set(STORAGE_KEYS.askTipDismissed, '1');
              setTipHidden(true);
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SortToggle<AskSort>
          value={sort}
          onChange={setSort}
          options={[
            { value: 'unanswered', label: 'Unanswered' },
            { value: 'latest', label: 'Newest' },
            { value: 'top_all', label: 'Top' },
          ]}
        />
      </div>
      <TopicTabsState value={topic} onChange={setTopic} />

      <PostFeed
        params={{ kind: 'QUESTION', sort, topic: topic || undefined }}
        emptyTitle={sort === 'unanswered' ? 'Every question has an answer' : 'No questions yet'}
        emptyDescription="Ask the first one. Seniors who know the topic will be notified."
        emptyAction={
          <Button asChild>
            <Link to="/ask/new">Ask a question</Link>
          </Button>
        }
      />
    </div>
  );
}
