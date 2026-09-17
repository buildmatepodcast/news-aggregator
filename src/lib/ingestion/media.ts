import * as cheerio from "cheerio";
import { FEED_USER_AGENT } from "./userAgent";

const VIDEO_HOST_PATTERNS = [
  /youtube\.com\/watch\?v=/i,
  /youtube\.com\/embed\//i,
  /youtu\.be\//i,
  /player\.vimeo\.com\//i,
  /vimeo\.com\/\d+/i,
];

type FeedItemLike = {
  link?: string;
  enclosure?: { url?: string; type?: string };
  "media:content"?: { $?: { url?: string; medium?: string; type?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  content?: string;
  "content:encoded"?: string;
  itunes?: { image?: string };
};

/** Pull the best image/video URL directly out of the RSS item, no network call. */
export function extractMediaFromFeedItem(item: FeedItemLike): {
  imageUrl: string | null;
  videoUrl: string | null;
} {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;

  const enclosure = item.enclosure;
  if (enclosure?.url) {
    if (enclosure.type?.startsWith("image/")) imageUrl = enclosure.url;
    else if (enclosure.type?.startsWith("video/")) videoUrl = enclosure.url;
  }

  const mediaContent = item["media:content"]?.$;
  if (!imageUrl && !videoUrl && mediaContent?.url) {
    if (mediaContent.medium === "image" || mediaContent.type?.startsWith("image/")) {
      imageUrl = mediaContent.url;
    } else if (mediaContent.medium === "video" || mediaContent.type?.startsWith("video/")) {
      videoUrl = mediaContent.url;
    }
  }

  if (!imageUrl) {
    const thumb = item["media:thumbnail"]?.$?.url;
    if (thumb) imageUrl = thumb;
  }

  if (!imageUrl && item.itunes?.image) {
    imageUrl = item.itunes.image;
  }

  const html = item["content:encoded"] ?? item.content ?? "";
  if (html) {
    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    if (!videoUrl) {
      const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (iframeMatch && VIDEO_HOST_PATTERNS.some((re) => re.test(iframeMatch[1]))) {
        videoUrl = iframeMatch[1];
      }
    }
    if (!videoUrl) {
      const linkMatch = html.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
      const videoLink = linkMatch.find((url) => VIDEO_HOST_PATTERNS.some((re) => re.test(url)));
      if (videoLink) videoUrl = videoLink;
    }
  }

  return { imageUrl, videoUrl };
}

/**
 * Fallback for feeds that don't embed media: fetch the article page and read
 * its OpenGraph tags. Used sparingly (only when the feed gave us nothing) to
 * keep ingestion fast and avoid hammering source sites.
 */
export async function fetchOgMedia(
  articleUrl: string,
  timeoutMs = 8000
): Promise<{ imageUrl: string | null; videoUrl: string | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": FEED_USER_AGENT,
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { imageUrl: null, videoUrl: null };
    const html = await res.text();
    const $ = cheerio.load(html);
    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;
    let videoUrl =
      $('meta[property="og:video"]').attr("content") ||
      $('meta[property="og:video:url"]').attr("content") ||
      null;
    if (!videoUrl) {
      const iframeSrc = $("iframe").attr("src");
      if (iframeSrc && VIDEO_HOST_PATTERNS.some((re) => re.test(iframeSrc))) {
        videoUrl = iframeSrc;
      }
    }
    return { imageUrl, videoUrl };
  } catch {
    return { imageUrl: null, videoUrl: null };
  }
}
