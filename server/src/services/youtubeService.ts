const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const URL_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
];

export function extractVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  if (VIDEO_ID_REGEX.test(trimmed)) return trimmed;

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export interface OEmbedResult {
  title: string;
  artist: string;
  thumbnailUrl: string;
}

export async function fetchOEmbed(videoId: string): Promise<OEmbedResult> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(
    videoId
  )}&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`oEmbed failed: ${res.status}`);
  }
  const data = (await res.json()) as { title: string; author_name: string; thumbnail_url: string };

  return {
    title: data.title,
    artist: data.author_name,
    thumbnailUrl: data.thumbnail_url,
  };
}
