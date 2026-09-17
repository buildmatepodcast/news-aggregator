import { viralityTier } from "@/lib/types";

const TIER_STYLES = {
  low: "bg-[var(--green-bg)] text-[var(--green-fg)]",
  mid: "bg-[var(--amber-bg)] text-[var(--amber-fg)]",
  high: "bg-[var(--red-bg)] text-[var(--red-fg)]",
} as const;

export function ViralityBadge({
  score,
  reason,
  size = "md",
}: {
  score: number | null;
  reason?: string | null;
  size?: "sm" | "md";
}) {
  const tier = viralityTier(score);
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} ${TIER_STYLES[tier]}`}
      title={reason ?? undefined}
    >
      <span aria-hidden>🔥</span>
      {score ?? "–"}/10
    </span>
  );
}
