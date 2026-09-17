import { TimeAgo } from "./TimeAgo";

export function Masthead({
  lastUpdated,
  healthy,
  hasAccess,
  email,
  onSubscribeClick,
  onLoginClick,
  onLogoutClick,
}: {
  lastUpdated: string | null;
  healthy: boolean;
  hasAccess: boolean;
  email: string | null;
  onSubscribeClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-4 pt-3">
        {hasAccess ? (
          <>
            <span className="text-xs text-[var(--muted)]">{email}</span>
            <button
              onClick={onLogoutClick}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-[var(--border)]"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSubscribeClick}
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Subscribe now
            </button>
            <button
              onClick={onLoginClick}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--border)]"
            >
              Log in
            </button>
          </>
        )}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 pb-6 pt-2">
        <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">Built</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Construction · Architecture · Interior Design — worldwide, as it breaks
        </p>
        <LastUpdatedPill lastUpdated={lastUpdated} healthy={healthy} />
      </div>
    </header>
  );
}

function LastUpdatedPill({
  lastUpdated,
  healthy,
}: {
  lastUpdated: string | null;
  healthy: boolean;
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${healthy ? "bg-[var(--green-fg)]" : "bg-[var(--red-fg)]"}`}
        aria-hidden
      />
      {lastUpdated ? (
        <span suppressHydrationWarning>
          Last updated{" "}
          <TimeAgo iso={lastUpdated} />
        </span>
      ) : (
        <span>Awaiting first ingestion run…</span>
      )}
    </div>
  );
}
