import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShieldAlert, Phone, Info } from 'lucide-react';
import { Link } from 'react-router';

export function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" aria-label="Home" className="flex items-center">
            <img src="/brand/crossroads-mark.png" alt="" className="block h-7 w-auto dark:hidden" />
            <img src="/brand/crossroads-mark-dark.png" alt="" className="hidden h-7 w-auto dark:block" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/home">Go to App</Link>
          </Button>
        </div>
      </header>
      
      <main className="mx-auto max-w-4xl px-6 py-12">
        <PageHeader 
          title="Support & Wellbeing" 
          description="College is a lot. You don't have to figure it out alone." 
        />
        
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Emergency / Counseling */}
          <Card className="p-6 border-l-4 border-l-destructive bg-destructive/5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
              <Phone className="h-5 w-5" /> Talk to someone
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Contact your college's student wellbeing office.
            </p>
            <div className="mt-4 space-y-2 text-sm font-medium">
              <div className="flex justify-between">
                <span>Amrita Student Counsellor</span>
                <span className="text-primary">(Placeholder)</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency Campus Security</span>
                <span className="text-primary">(Placeholder)</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              If you're in immediate danger, contact local emergency services.
            </p>
          </Card>
          
          {/* What Crossroads is */}
          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Info className="h-5 w-5 text-primary" /> What this is (and isn't)
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              This space provides peer guidance from seniors and alumni. It is <strong>not</strong> a substitute for professional counselling, medical, or legal advice.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> Our promises: no rankings, no pressure.
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" /> Your contact details stay private unless shared.
              </li>
            </ul>
          </Card>
          
          {/* Community Guidelines */}
          <Card className="p-6 md:col-span-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert className="h-5 w-5 text-primary" /> Community Guidelines
            </h3>
            <div className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <strong className="text-foreground">Be kind and constructive.</strong>
                <p>No ragging, bullying, or harassment will be tolerated. This is a safe space.</p>
              </div>
              <div>
                <strong className="text-foreground">Respect confidentiality.</strong>
                <p>Do not share confidential interview questions or internal company documents.</p>
              </div>
              <div>
                <strong className="text-foreground">Label opinions clearly.</strong>
                <p>When giving advice, ensure opinions are stated as personal experiences, not absolute facts.</p>
              </div>
              <div>
                <strong className="text-foreground">Report harmful content.</strong>
                <p>Use the ⋯ menu → <em>Report</em> on any post, answer, profile, or listing. Admins review every report.</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
