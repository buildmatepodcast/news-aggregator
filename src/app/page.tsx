"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Masthead } from "@/components/Masthead";
import { TabBar } from "@/components/TabBar";
import { Controls } from "@/components/Controls";
import { TrendingShelf } from "@/components/TrendingShelf";
import { ArticleCard } from "@/components/ArticleCard";
import { AuthModal } from "@/components/AuthModal";
import { TABS, type TabId } from "@/components/tabs";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";

const POLL_MS = 30000;

type ArticlesResponse = {
  articles: ArticleCardType[];
  nextCursor: string | null;
  lastUpdated: string | null;
};

function buildQuery(opts: {
  tab: TabId;
  sort: "newest" | "viral";
  query: string;
  mediaOnly: boolean;
  cursor?: string | null;
}) {
  const tabDef = TABS.find((t) => t.id === opts.tab)!;
  const params = new URLSearchParams();
  if (tabDef.params.region) params.set("region", tabDef.params.region);
  if (tabDef.params.category) params.set("category", tabDef.params.category);
  if (tabDef.params.viralOnly) params.set("viralOnly", "true");
  params.set("sort", opts.sort);
  if (opts.query) params.set("q", opts.query);
  if (opts.mediaOnly) params.set("mediaOnly", "true");
  if (opts.cursor) params.set("cursor", opts.cursor);
  return params.toString();
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("global");
  const [sort, setSort] = useState<"newest" | "viral">("newest");
  const [query, setQuery] = useState("");
  const [mediaOnly, setMediaOnly] = useState(false);

  const [articles, setArticles] = useState<ArticleCardType[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [trending, setTrending] = useState<ArticleCardType[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [healthy, setHealthy] = useState(true);

  const auth = useAuth();
  const [authModal, setAuthModal] = useState<"subscribe" | "login" | null>(null);

  const knownIds = useRef<Set<string>>(new Set());

  // After a magic-link redirect (?login=success), re-check the session once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("login")) {
      auth.refresh();
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    const qs = buildQuery({ tab, sort, query, mediaOnly });
    const res = await fetch(`/api/articles?${qs}`);
    const data: ArticlesResponse = await res.json();
    setArticles(data.articles);
    setNextCursor(data.nextCursor);
    setLastUpdated(data.lastUpdated);
    knownIds.current = new Set(data.articles.map((a) => a.id));
    setLoading(false);
  }, [tab, sort, query, mediaOnly]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    const qs = buildQuery({ tab, sort, query, mediaOnly, cursor: nextCursor });
    const res = await fetch(`/api/articles?${qs}`);
    const data: ArticlesResponse = await res.json();
    setArticles((prev) => [...prev, ...data.articles]);
    setNextCursor(data.nextCursor);
    for (const a of data.articles) knownIds.current.add(a.id);
    setLoadingMore(false);
  }, [tab, sort, query, mediaOnly, nextCursor]);

  // Reset + reload whenever the filters change.
  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, sort, query, mediaOnly]);

  // Trending shelf: independent of tab/filters, refreshed on the same poll cadence.
  const loadTrending = useCallback(async () => {
    const res = await fetch(`/api/articles?viralOnly=true&sort=viral&take=8`);
    const data: ArticlesResponse = await res.json();
    setTrending(data.articles);
  }, []);

  const loadHealth = useCallback(async () => {
    const res = await fetch(`/api/health`);
    const data = await res.json();
    setHealthy(Boolean(data.healthy));
    if (data.lastIngestionRun?.finishedAt) setLastUpdated(data.lastIngestionRun.finishedAt);
  }, []);

  useEffect(() => {
    loadTrending();
    loadHealth();
  }, [loadTrending, loadHealth]);

  // Silent poll: refetch the current first page and prepend any genuinely new items.
  useEffect(() => {
    const id = setInterval(async () => {
      const qs = buildQuery({ tab, sort, query, mediaOnly });
      const res = await fetch(`/api/articles?${qs}`);
      const data: ArticlesResponse = await res.json();
      const fresh = data.articles.filter((a) => !knownIds.current.has(a.id));
      if (fresh.length > 0) {
        for (const a of fresh) knownIds.current.add(a.id);
        setArticles((prev) => [...fresh, ...prev]);
      }
      setLastUpdated(data.lastUpdated);
      loadTrending();
      loadHealth();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [tab, sort, query, mediaOnly, loadTrending, loadHealth]);

  return (
    <div className="flex flex-1 flex-col">
      <Masthead
        lastUpdated={lastUpdated}
        healthy={healthy}
        hasAccess={auth.hasAccess}
        email={auth.email}
        onSubscribeClick={() => setAuthModal("subscribe")}
        onLoginClick={() => setAuthModal("login")}
        onLogoutClick={auth.logout}
      />
      <TabBar active={tab} onChange={setTab} />
      <TrendingShelf articles={trending} />
      <Controls
        sort={sort}
        onSortChange={setSort}
        mediaOnly={mediaOnly}
        onMediaOnlyChange={setMediaOnly}
        query={query}
        onQueryChange={setQuery}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
        {loading ? (
          <div className="py-16 text-center text-[var(--muted)]">Loading stories…</div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted)]">
            No stories yet in this view. Check back shortly — new items are ingested every few minutes.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  hasAccess={auth.hasAccess}
                  onLockedClick={() => setAuthModal("subscribe")}
                />
              ))}
            </div>
            {nextCursor && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--border)] disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
}
