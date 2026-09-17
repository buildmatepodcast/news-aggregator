"use client";

export function Controls({
  sort,
  onSortChange,
  mediaOnly,
  onMediaOnlyChange,
  query,
  onQueryChange,
}: {
  sort: "newest" | "viral";
  onSortChange: (s: "newest" | "viral") => void;
  mediaOnly: boolean;
  onMediaOnlyChange: (v: boolean) => void;
  query: string;
  onQueryChange: (v: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search headlines & summaries…"
        className="w-full max-w-xs rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] sm:w-64"
      />

      <div className="flex items-center gap-1 rounded-md border border-[var(--border)] p-0.5 text-sm">
        {(["newest", "viral"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onSortChange(opt)}
            className={`rounded px-2.5 py-1 capitalize transition-colors ${
              sort === opt ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)]"
            }`}
          >
            {opt === "newest" ? "Newest" : "Most Viral"}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={mediaOnly}
          onChange={(e) => onMediaOnlyChange(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Media only
      </label>
    </div>
  );
}
