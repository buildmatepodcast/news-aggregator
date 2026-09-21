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

  // ---- Building materials, verified working RSS feeds (added 2026-09-21) ----
  {
    name: "For Construction Pros",
    feedUrl: "https://www.forconstructionpros.com/rss",
    siteUrl: "https://www.forconstructionpros.com",
    region: "GLOBAL",
  },
  {
    name: "Glass Magazine",
    feedUrl: "https://www.glassmagazine.com/rss.xml",
    siteUrl: "https://www.glassmagazine.com",
    region: "GLOBAL",
  },
  {
    name: "Wood Central",
    feedUrl: "https://woodcentral.com.au/feed/",
    siteUrl: "https://woodcentral.com.au",
    region: "GLOBAL",
  },
  {
    name: "Green Building Advisor",
    feedUrl: "https://www.greenbuildingadvisor.com/feed",
    siteUrl: "https://www.greenbuildingadvisor.com",
    region: "GLOBAL",
  },
  {
    name: "Kitchen & Bath Business",
    feedUrl: "https://kbbonline.com/feed/",
    siteUrl: "https://kbbonline.com",
    region: "GLOBAL",
  },
  {
    name: "Hardware Retailing",
    feedUrl: "https://www.hardwareretailing.com/feed/",
    siteUrl: "https://www.hardwareretailing.com",
    region: "GLOBAL",
  },
  {
    name: "Floor Covering News",
    feedUrl: "https://www.fcnews.net/feed/",
    siteUrl: "https://www.fcnews.net",
    region: "GLOBAL",
  },
  {
    name: "JLC Online",
    feedUrl: "https://www.jlconline.com/feed/",
    siteUrl: "https://www.jlconline.com",
    region: "GLOBAL",
  },

  // ---- How-to / instructional, verified working RSS feeds (added 2026-09-21) ----
  {
    name: "Family Handyman",
    feedUrl: "https://www.familyhandyman.com/feed/",
    siteUrl: "https://www.familyhandyman.com",
    region: "GLOBAL",
  },
  {
    name: "Fine Homebuilding",
    feedUrl: "https://www.finehomebuilding.com/feed",
    siteUrl: "https://www.finehomebuilding.com",
    region: "GLOBAL",
  },
  {
    name: "Ask the Builder",
    feedUrl: "https://www.askthebuilder.com/feed/",
    siteUrl: "https://www.askthebuilder.com",
    region: "GLOBAL",
  },
  {
    name: "Bob Vila",
    feedUrl: "https://www.bobvila.com/feed/",
    siteUrl: "https://www.bobvila.com",
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
//
// Building-materials candidates tested 2026-09-21 that did NOT pan out:
//   - Global Cement, World Cement, Concrete Products, The Construction Index,
//     Roads and Bridges, Steel Times International, Fastener+Fixing, MBI    -> 404 on every path tried
//   - CompositesWorld                                                       -> 405 (feed path rejects GET)
//   - Materials Today                                                      -> connection failed
//   - Fastmarkets RISI, Recycling Product News                             -> 200 but not real RSS/XML
//   - Aggregates Manager (aggman.com)                                      -> 200 but empty channel, no items
//
// Building-materials sub-vertical candidates tested 2026-09-21 (kitchens/bath,
// paints, equipment, safety, glass, hardware) that did NOT pan out:
//   - Kitchen & Bath Design News, Paint & Coatings Industry, ISHN (safety),
//     Door and Window Market, USGlass, Equipment World                      -> 403 (bot-blocked)
//   - Construction Equipment magazine, For Construction Pros equipment tag -> 404
//
// How-to/instructional candidates tested 2026-09-21 that did NOT pan out:
//   - This Old House                                   -> 200 but not real RSS/XML
//   - The Spruce, DIY Network, HGTV, Houzz             -> 403/404 (bot-blocked or no feed)
//   - Construction Junkie                              -> 404
//   - Popular Mechanics (Home), Engineering.com         -> valid feeds, but skipped: mostly
//     product-review/general-industry content rather than instructional guides
