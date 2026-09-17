// Seed list of credible sources, built by actually testing each candidate feed
// URL for reachability and valid RSS/Atom XML before including it here (see
// README "Source vetting" section for the testing methodology and the list
// of candidates that were tried and rejected).
//
// Region: which tab an item defaults into. OriginType is always PUBLICATION
// here — social-sourced items are a v2 addition (see brief), the seed list
// below is deliberately publication-only for v1.

export type SeedSource = {
  name: string;
  feedUrl: string;
  siteUrl: string;
  region: "GLOBAL" | "INDIA";
};

export const SEED_SOURCES: SeedSource[] = [
  // ---- Global, verified working RSS feeds ----
  {
    name: "Construction Dive",
    feedUrl: "https://www.constructiondive.com/feeds/news/",
    siteUrl: "https://www.constructiondive.com",
    region: "GLOBAL",
  },
  {
    name: "Global Construction Review",
    feedUrl: "https://www.globalconstructionreview.com/feed/",
    siteUrl: "https://www.globalconstructionreview.com",
    region: "GLOBAL",
  },
  {
    name: "ArchDaily",
    feedUrl: "https://www.archdaily.com/rss/",
    siteUrl: "https://www.archdaily.com",
    region: "GLOBAL",
  },
  {
    name: "Dezeen",
    feedUrl: "https://www.dezeen.com/feed/",
    siteUrl: "https://www.dezeen.com",
    region: "GLOBAL",
  },
  {
    name: "Designboom",
    feedUrl: "https://www.designboom.com/feed/",
    siteUrl: "https://www.designboom.com",
    region: "GLOBAL",
  },
  {
    name: "The Architect's Newspaper",
    feedUrl: "https://www.archpaper.com/feed",
    siteUrl: "https://www.archpaper.com",
    region: "GLOBAL",
  },
  {
    name: "Interior Design Magazine",
    feedUrl: "https://interiordesign.net/feed/",
    siteUrl: "https://interiordesign.net",
    region: "GLOBAL",
  },
  {
    name: "World Architecture Community",
    feedUrl: "https://worldarchitecture.org/rss",
    siteUrl: "https://worldarchitecture.org",
    region: "GLOBAL",
  },
  {
    name: "Construction Week (ME)",
    feedUrl: "https://www.constructionweekonline.com/feed",
    siteUrl: "https://www.constructionweekonline.com",
    region: "GLOBAL",
  },
  {
    name: "Wallpaper*",
    feedUrl: "https://www.wallpaper.com/feed/rss",
    siteUrl: "https://www.wallpaper.com",
    region: "GLOBAL",
  },

  // ---- India, verified working RSS feeds ----
  {
    name: "ConstructionWorld.in",
    feedUrl: "https://www.constructionworld.in/feed",
    siteUrl: "https://www.constructionworld.in",
    region: "INDIA",
  },
  {
    name: "Infrastructure Today",
    feedUrl: "https://infrastructuretoday.co.in/feed/",
    siteUrl: "https://infrastructuretoday.co.in",
    region: "INDIA",
  },
  {
    name: "Business Standard (Real Estate)",
    feedUrl: "https://www.business-standard.com/rss/companies/real-estate-10312.rss",
    siteUrl: "https://www.business-standard.com",
    region: "INDIA",
  },
  {
    name: "ET Realty",
    feedUrl: "https://realty.economictimes.indiatimes.com/rss/realestate",
    siteUrl: "https://realty.economictimes.indiatimes.com",
    region: "INDIA",
  },
];

// Candidates from the original brief that were tested and did NOT return a
// usable RSS/Atom feed as of 2026-09-17. Left here so we don't re-test them
// blindly later; revisit if the site adds/moves its feed, or add a scraper.
//   - ENR (enr.com)                 -> 403 on every RSS path tried (bot-blocked)
//   - Building Design+Construction  -> no working feed path found (404s)
//   - Architectural Record          -> rss.xml resolves to an HTML page, not XML
//   - Reuters / AP News             -> public RSS retired by both outlets
//   - PIB (pib.gov.in)              -> RSS endpoints return HTML, likely needs
//                                      session/referer handling; scrape candidate
//   - Realty+ (realtyplusmag.com)   -> 403 on /feed and /rss (bot-blocked)
