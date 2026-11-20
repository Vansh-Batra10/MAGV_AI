import { describe, it, expect } from "vitest";
import { parseSong } from "@/lib/song";

describe("song embeds", () => {
  it("parses YouTube variants", () => {
    expect(parseSong("https://youtu.be/dQw4w9WgXcQ")?.id).toBe("dQw4w9WgXcQ");
    expect(parseSong("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")?.embedUrl).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(parseSong("https://youtube.com/shorts/abcdefghijk")?.id).toBe("abcdefghijk");
  });
  it("parses Spotify tracks", () => {
    const s = parseSong("https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC?si=x");
    expect(s?.provider).toBe("spotify");
    expect(s?.embedUrl).toBe("https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?utm_source=generator&theme=0");
  });
  it("rejects other hosts", () => {
    expect(parseSong("https://example.com/song.mp3")).toBeNull();
    expect(parseSong("not a url")).toBeNull();
  });
});
