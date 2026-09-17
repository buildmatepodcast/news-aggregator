import { createHash } from "crypto";

/**
 * v1 dedupe strategy: normalize the headline aggressively and hash it.
 * This reliably catches syndicated/wire stories that run under an identical
 * or near-identical title across outlets. It will NOT catch two outlets
 * covering the same event with genuinely different headlines — that needs
 * semantic (embedding) clustering, which is a good v2 upgrade once there's
 * enough volume to justify the cost of running it on every item.
 */
export function canonicalHash(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 80);
  return createHash("sha256").update(normalized).digest("hex");
}
