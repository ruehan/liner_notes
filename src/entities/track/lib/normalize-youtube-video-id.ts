const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function validVideoId(value: string | null | undefined): string | undefined {
  return value && VIDEO_ID_PATTERN.test(value) ? value : undefined;
}

/**
 * Accepts an 11-character YouTube video ID as well as common YouTube share
 * URLs, and returns the ID required by the IFrame player.
 */
export function normalizeYouTubeVideoId(
  reference: string | null | undefined,
): string | undefined {
  const trimmed = reference?.trim();
  const directId = validVideoId(trimmed);
  if (directId) return directId;
  if (!trimmed) return undefined;

  const urlReference = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(urlReference);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const isYoutube =
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com");

    let candidate: string | null = null;
    if (hostname === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (isYoutube) {
      candidate = url.searchParams.get("v");
      if (!candidate) {
        const [kind, id] = url.pathname.split("/").filter(Boolean);
        if (kind === "embed" || kind === "shorts" || kind === "live") {
          candidate = id ?? null;
        }
      }
    }

    return validVideoId(candidate);
  } catch {
    return undefined;
  }
}
