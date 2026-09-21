"use client";

import { useState } from "react";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { CATEGORY_LABELS, REGION_LABELS } from "@/lib/types";
import { ViralityBadge } from "./ViralityBadge";
import { relativeTime } from "@/lib/time";
import { toEmbedUrl } from "@/lib/video";
import { TOP_STORY_THRESHOLD } from "./tabs";

export function ArticleCard({
  article,
  hasAccess,
  onLockedClick,
}: {
  article: ArticleCardType;
  hasAccess: boolean;
  onLockedClick: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = article.videoUrl ? toEmbedUrl(article.videoUrl) : null;
  const extraSources = article.mergedSourceNames?.length ?? 0;

  const isTopStory = (article.viralityScore ?? 0) >= TOP_STORY_THRESHOLD;
  const locked = !hasAccess && !isTopStory;

  return (
    <article className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[16/10] bg-[var(--border)]">
        {playing && embedUrl && !locked ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : article.imageUrl ? (
          <button
            type="button"
            onClick={() => (locked ? onLockedClick() : article.videoUrl && embedUrl && setPlaying(true))}
            className="absolute inset-0 h-full w-full cursor-pointer disabled:cursor-default"
            disabled={!locked && !article.videoUrl}
            aria-label={article.videoUrl ? "Play video" : article.title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {article.videoUrl && !locked && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black text-xl">
                  ▶
                </span>
              </span>
            )}
          </button>
        ) : article.videoUrl && embedUrl ? (
          <button
            type="button"
            onClick={() => (locked ? onLockedClick() : setPlaying(true))}
            className="absolute inset-0 flex h-full w-full items-center justify-center bg-[var(--foreground)]/90 text-[var(--background)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black text-xl">
              ▶
            </span>
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] text-sm">
            No media available
          </div>
        )}
        <div className="absolute left-2 top-2">
          <ViralityBadge score={article.viralityScore} reason={article.viralityReason} />
        </div>
        {isTopStory && (
          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-black">
            Free to read
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">{article.sourceName}</span>
          {article.originType === "SOCIAL" && (
            <span className="rounded bg-[var(--border)] px-1.5 py-0.5">
              via {article.originHandle ?? "social"}
            </span>
          )}
          <span>·</span>
          <span title={new Date(article.publishedAt).toLocaleString()}>
            {relativeTime(article.publishedAt)}
          </span>
        </div>

        {locked ? (
          <span className="font-serif text-lg font-semibold leading-snug">{article.title}</span>
        ) : (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-lg font-semibold leading-snug hover:underline"
          >
            {article.title}
          </a>
        )}

        {locked ? (
          <p className="text-sm italic text-[var(--muted)]">
            Subscribe to read the summary and full story.
          </p>
        ) : (
          article.summary && <p className="line-clamp-3 text-sm text-[var(--muted)]">{article.summary}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {article.category && (
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
              {CATEGORY_LABELS[article.category]}
            </span>
          )}
          <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
            {REGION_LABELS[article.region]}
          </span>
          {extraSources > 0 && (
            <span className="text-[11px] text-[var(--muted)]">
              +{extraSources} more source{extraSources > 1 ? "s" : ""}
            </span>
          )}
          {locked ? (
            <button
              onClick={onLockedClick}
              className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
            >
              🔒 Subscribe to read →
            </button>
          ) : (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[11px] font-medium text-[var(--accent)] hover:underline"
            >
              Read full article →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
