"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/time";

export function TimeAgo({ iso }: { iso: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  return <span>{relativeTime(iso)}</span>;
}
