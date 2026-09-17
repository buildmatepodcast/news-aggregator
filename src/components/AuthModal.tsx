"use client";

import { useState } from "react";

export function AuthModal({
  mode,
  onClose,
}: {
  mode: "subscribe" | "login";
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setDevLink(data.devLink ?? null);
      setStatus("sent");
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-[var(--card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "sent" ? (
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Check your email</h2>
            <p className="text-sm text-[var(--muted)]">
              We sent a sign-in link to <strong>{email}</strong>. Click it to unlock full access.
            </p>
            {devLink && (
              <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
                <p className="mb-1 text-[var(--muted)]">
                  No email provider configured yet — use this link directly:
                </p>
                <a href={devLink} className="break-all text-[var(--accent)] underline">
                  {devLink}
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-md bg-[var(--foreground)] py-2 text-sm font-medium text-[var(--background)]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">
              {mode === "subscribe" ? "Subscribe to Built" : "Log in"}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {mode === "subscribe"
                ? "Get unlimited access to every story, every category, every region. Enter your email to get started — no payment collected yet."
                : "Enter the email you signed up with and we'll send a sign-in link."}
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            {error && <p className="text-sm text-[var(--red-fg)]">{error}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-[var(--foreground)] py-2 text-sm font-medium text-[var(--background)] disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : mode === "subscribe" ? "Subscribe now" : "Send link"}
            </button>
            <button type="button" onClick={onClose} className="w-full text-center text-xs text-[var(--muted)]">
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
