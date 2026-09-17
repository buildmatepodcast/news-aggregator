/**
 * Some publishers (e.g. Business Standard) serve their public RSS feed to
 * ordinary browsers but 403 an honest bot-identifying User-Agent, even
 * though the feed itself is meant for syndication/automated consumption.
 * A standard browser UA was verified against every source in
 * prisma/sources.ts during vetting, so it's used here rather than a
 * self-identifying one that some sources silently reject.
 */
export const FEED_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
