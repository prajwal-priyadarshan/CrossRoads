import { Fragment } from 'react';
import { cn } from '@/lib/utils';

const URL_RE = /(https?:\/\/[^\s<]+)/g;

/** Renders user text safely: paragraphs, line breaks and auto-linked URLs. Never uses innerHTML. */
export function PlainText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  return (
    <div className={cn('space-y-3 break-words text-sm leading-relaxed [overflow-wrap:anywhere]', className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p.split(URL_RE).map((part, j) =>
            /^https?:\/\//.test(part) ? (
              <a
                key={j}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {part}
              </a>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
