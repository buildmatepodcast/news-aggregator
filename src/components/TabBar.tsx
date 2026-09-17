"use client";

import { TABS, type TabId } from "./tabs";

export function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active === tab.id
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:bg-[var(--border)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
