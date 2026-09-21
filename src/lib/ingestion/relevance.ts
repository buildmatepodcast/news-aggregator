/**
 * Rule-based relevance filter. Used as the fallback when no ANTHROPIC_API_KEY
 * is set (same fallback pattern as ruleBasedEnrichment.ts), and also as a
 * cheap pre-check the LLM path can lean on for the obvious cases.
 *
 * Two failure modes observed in real ingested data drove this:
 *  - "Design" outlets (Dezeen, Designboom, Wallpaper*) cover automotive,
 *    fashion, and beauty content alongside architecture - e.g. "Aston
 *    Martin and Brough Superior turn their track superbike into a road
 *    machine" or "the best shows of New York Fashion Week".
 *  - Indian business outlets (Business Standard, ET Realty) carry general
 *    market/economy news that mentions "construction" only incidentally
 *    (interest rates, GDP, indices) without being about a real building,
 *    project, material, or regulation.
 */

const VEHICLE_KEYWORDS = [
  "superbike",
  "motorcycle",
  "roadster",
  "supercar",
  "sports car",
  "sedan",
  "suv",
  "pickup truck",
  "electric vehicle",
  " ev ",
  "aston martin",
  "ferrari",
  "lamborghini",
  "porsche",
  "bugatti",
  "mclaren",
  "rolls-royce",
  "bentley",
  "test drive",
  "horsepower",
  "top speed",
  "0-60",
  "caravan salon",
  "motorhome",
];

const FASHION_BEAUTY_KEYWORDS = [
  "fashion week",
  "runway",
  "couture",
  "makeup",
  "cosmetics",
  "skincare",
  "perfume",
  "fragrance launch",
  "catwalk",
  "menswear",
  "womenswear collection",
];

// Pure financial/market news - only a red flag when NOT paired with a
// construction/real-estate/materials anchor term (see hasConstructionAnchor).
const FINANCIAL_KEYWORDS = [
  "stock market",
  "sensex",
  "nifty",
  "share price",
  "quarterly earnings",
  "quarterly results",
  "ipo ",
  "initial public offering",
  "mutual fund",
  "gdp growth",
  "repo rate",
  "interest rate",
  "inflation rate",
  "forex",
  "currency market",
];

const CONSTRUCTION_ANCHOR_KEYWORDS = [
  "construction",
  "building",
  "architect",
  "infrastructure",
  "real estate",
  "realty",
  "property developer",
  "housing project",
  "cement",
  "concrete",
  "steel",
  "material",
  "contractor",
  "developer",
  "zoning",
  "permit",
  "renovation",
  "interior design",
  "urban planning",
  "rera",
];

function hasAny(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  return keywords.find((k) => lower.includes(k)) ?? null;
}

// Some outlets (Wallpaper* confirmed; checked via real ingested URLs) sort
// content into topic verticals right in the URL path - a much more reliable
// signal than keyword-matching the title/summary text, since a piece like
// "Christopher Kane debuts his vision for Mulberry" carries no vehicle/
// fashion keyword at all but lives under /fashion-beauty/.
//
// Deliberately NOT included: /travel/, /transportation/, /watches-jewellery/,
// /jewellery/ - these verticals turned out to mix in real interior-design
// coverage (a Snøhetta-designed coffee bar, an airport lounge, a jewellery
// showroom's interior) alongside pure product/vehicle stories, so a blanket
// exclude by URL was cutting relevant content. Pure car/vehicle pieces under
// those paths are still caught by VEHICLE_KEYWORDS below.
const OFF_TOPIC_URL_SEGMENTS = [
  "/fashion-beauty/",
  "/fashion/",
  "/beauty/",
  "/entertaining/",
  "/food-drink/",
];

export function checkExclusion(
  text: string,
  sourceUrl?: string
): { excluded: boolean; reason: string | null } {
  if (sourceUrl) {
    const lowerUrl = sourceUrl.toLowerCase();
    const segmentHit = OFF_TOPIC_URL_SEGMENTS.find((s) => lowerUrl.includes(s));
    if (segmentHit) {
      return { excluded: true, reason: `URL is in an off-topic section (${segmentHit.replace(/\//g, "")})` };
    }
  }

  const vehicleHit = hasAny(text, VEHICLE_KEYWORDS);
  if (vehicleHit) {
    return { excluded: true, reason: `Automotive/vehicle content (matched "${vehicleHit}")` };
  }

  const fashionHit = hasAny(text, FASHION_BEAUTY_KEYWORDS);
  if (fashionHit) {
    return { excluded: true, reason: `Fashion/beauty content (matched "${fashionHit}")` };
  }

  const financialHit = hasAny(text, FINANCIAL_KEYWORDS);
  if (financialHit && !hasAny(text, CONSTRUCTION_ANCHOR_KEYWORDS)) {
    return {
      excluded: true,
      reason: `General financial/market news not tied to construction or real estate (matched "${financialHit}")`,
    };
  }

  return { excluded: false, reason: null };
}
