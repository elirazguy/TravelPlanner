// Best-effort caption extraction from shared social links (TikTok, Instagram)
// and generic URLs. There is no clean public API for arbitrary Reel/TikTok
// captions, so we try the supported lightweight paths (TikTok oEmbed, Open
// Graph meta tags) and degrade gracefully — returning null when a platform
// blocks us (e.g. an Instagram login wall), so the UI can ask the user to
// paste the caption text instead.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  // De-dupe, keep order.
  return Array.from(new Set(matches));
}

function isTikTok(url: string) {
  return /tiktok\.com/i.test(url);
}
function isInstagram(url: string) {
  return /instagram\.com/i.test(url);
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function ogDescription(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

async function tiktokCaption(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": UA } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const parts = [json?.title, json?.author_name].filter(Boolean);
    return parts.length ? parts.join(" — ") : null;
  } catch {
    return null;
  }
}

async function htmlCaption(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en,he;q=0.9" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return ogDescription(html);
  } catch {
    return null;
  }
}

// Returns the caption text for a URL, or null if it could not be retrieved.
export async function fetchSocialCaption(url: string): Promise<string | null> {
  if (isTikTok(url)) {
    return (await tiktokCaption(url)) ?? (await htmlCaption(url));
  }
  // Instagram and generic links both rely on Open Graph meta tags.
  if (isInstagram(url)) {
    return await htmlCaption(url);
  }
  return await htmlCaption(url);
}

export async function fetchCaptions(urls: string[]): Promise<{
  captions: string[];
  failed: string[];
}> {
  const captions: string[] = [];
  const failed: string[] = [];
  await Promise.all(
    urls.slice(0, 4).map(async (u) => {
      const cap = await fetchSocialCaption(u);
      if (cap && cap.trim()) captions.push(cap.trim());
      else failed.push(u);
    })
  );
  return { captions, failed };
}
