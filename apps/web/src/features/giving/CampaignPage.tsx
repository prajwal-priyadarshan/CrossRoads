import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { ApiError } from '@/lib/api';
import { formatRupees } from '@/lib/money';
import { CATEGORY_NAME, daysLeft } from './GivingPage';
import { useCampaign, useDonate } from './api';

const PRESETS = [250, 500, 1000, 5000];

export function CampaignPage() {
  const { slug = '' } = useParams();
  const { data: c, isLoading } = useCampaign(slug);
  const donate = useDonate(slug);
  const [amount, setAmount] = useState(500);
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);

  if (isLoading) return <ListSkeleton rows={3} />;
  if (!c) return <p className="text-muted-foreground">This campaign could not be found. <Link to="/give" className="text-primary underline">Back to giving</Link></p>;

  const pct = c.goalPaise ? Math.min(100, Math.round((c.raisedPaise / c.goalPaise) * 100)) : 0;
  const left = daysLeft(c.endsAt);

  const submit = () =>
    donate.mutate(
      { amountRupees: amount, anonymous, message },
      {
        onSuccess: (r) => {
          setReceipt(r.receipt);
          setMessage('');
          toast.success('Thank you. Your donation is recorded (test mode).');
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Donation not recorded. Try again.'),
      },
    );

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="space-y-3">
          <Link to="/give" className="text-sm text-muted-foreground hover:text-foreground">← Giving</Link>
          <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {CATEGORY_NAME[c.category] ?? c.category}
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{c.title}</h1>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{c.story}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent donations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.recent.length === 0 && <p className="text-sm text-muted-foreground">Be the first to donate.</p>}
            {c.recent.map((d) => (
              <div key={d.id} className="flex items-start gap-3">
                {d.donor ? <UserAvatar user={d.donor} size="sm" /> : <div className="size-7 rounded-full bg-muted" />}
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <span className="font-medium">{d.donor?.fullName ?? 'Anonymous'}</span>{' '}
                    <span className="text-muted-foreground">gave {formatRupees(d.amountPaise)}</span>
                  </p>
                  {d.message && <p className="text-muted-foreground">“{d.message}”</p>}
                  <p className="text-xs text-muted-foreground"><RelativeTime iso={d.createdAt} /></p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 md:sticky md:top-24 md:self-start">
        <Card>
          <CardContent className="space-y-4 p-5">
            <Progress value={pct} aria-label={`${pct}% of goal raised`} />
            <p className="text-sm">
              <span className="font-semibold">{formatRupees(c.raisedPaise)}</span> raised of {formatRupees(c.goalPaise)}
            </p>
            <p className="text-xs text-muted-foreground">
              {c.donorCount} donors{left !== null ? ` · ${left} days left` : ''}
            </p>

            {receipt ? (
              <div className="space-y-2 rounded-lg bg-accent p-4 text-sm text-accent-foreground">
                <p className="font-medium">Donation recorded</p>
                <p className="font-mono text-xs">Receipt {receipt}</p>
                <Button variant="outline" size="sm" onClick={() => setReceipt(null)}>Donate again</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((p) => (
                    <Button key={p} size="sm" variant={amount === p ? 'default' : 'outline'} onClick={() => setAmount(p)}>
                      ₹{p}
                    </Button>
                  ))}
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">Or enter an amount (₹)</span>
                  <Input type="number" min={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="A note with your donation (optional)"
                  aria-label="Message with your donation"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="size-4 accent-primary" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                  Donate anonymously
                </label>
                <Button className="w-full" onClick={submit} disabled={donate.isPending || amount < 10}>
                  Donate {formatRupees(amount * 100)} (test mode)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
