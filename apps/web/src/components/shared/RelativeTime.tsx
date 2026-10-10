import { fromNow } from '@/lib/utils';

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()}>
      {fromNow(iso)}
    </time>
  );
}
