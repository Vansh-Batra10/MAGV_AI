/** Parses YouTube / Spotify links into official embed URLs. We never download, re-host or proxy audio. */
export type SongEmbed = { provider: "youtube" | "spotify"; id: string; kind: string; embedUrl: string; openUrl: string };

export function parseSong(url: string | undefined | null): SongEmbed | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\.|^music\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? yt(id) : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v) return yt(v);
    const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
    return m ? yt(m[1]) : null;
  }
  if (host === "open.spotify.com") {
    const m = u.pathname.match(/^\/(?:intl-[\w-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return { provider: "spotify", kind: m[1], id: m[2], embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`, openUrl: `https://open.spotify.com/${m[1]}/${m[2]}` };
  }
  return null;
}

function yt(id: string): SongEmbed | null {
  if (!/^[\w-]{6,20}$/.test(id)) return null;
  return { provider: "youtube", kind: "video", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`, openUrl: `https://www.youtube.com/watch?v=${id}` };
}
