import { useState } from 'react';
import { useParams } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { PostFeed } from './PostFeed';
import { COMMUNITY_SORTS, SortToggle } from './SortToggle';

export function TagPage() {
  const { tag = '' } = useParams();
  const [sort, setSort] = useState<'latest' | 'top' | 'top_all'>('latest');
  return (
    <div className="space-y-4">
      <PageHeader title={`#${tag}`} description="Tags act as lightweight communities. Posts from every topic and kind show up here." />
      <SortToggle value={sort} onChange={setSort} options={COMMUNITY_SORTS} />
      <PostFeed params={{ tag, sort }} emptyTitle={`Nothing tagged #${tag} yet`} />
    </div>
  );
}
