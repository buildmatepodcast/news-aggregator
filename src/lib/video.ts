/** Returns an embeddable iframe URL for known video hosts, or null if the link should just be opened directly. */
export function toEmbedUrl(videoUrl: string): string | null {
  const ytWatch = videoUrl.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  const ytShort = videoUrl.match(/youtu\.be\/([\w-]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;

  if (videoUrl.includes("youtube.com/embed/")) return videoUrl;

  const vimeo = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  if (videoUrl.includes("player.vimeo.com/")) return videoUrl;

  return null;
}
