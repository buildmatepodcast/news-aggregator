import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { ViralityBadge } from "./ViralityBadge";
import { TimeAgo } from "./TimeAgo";

export function TrendingShelf({ articles }: { articles: ArticleCardType[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Trending now
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {articles.map((a) => (
            <a
              key={a.id}
              href={a.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-64 shrink-0 flex-col gap-1 rounded-md border border-[var(--border)] p-3 hover:border-[var(--accent)]"
            >
              <div className="flex items-center justify-between">
                <ViralityBadge score={a.viralityScore} reason={a.viralityReason} size="sm" />
                <span className="text-[10px] text-[var(--muted)]">
                  <TimeAgo iso={a.publishedAt} />
                </span>
              </div>
              <p className="line-clamp-2 text-sm font-medium">{a.title}</p>
              <span className="text-[11px] text-[var(--muted)]">{a.sourceName}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
