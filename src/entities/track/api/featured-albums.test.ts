import { describe, expect, it } from "vitest";
import { mapFeaturedAlbums, resolveCoverUrl } from "./featured-albums";

const albums = Array.from({ length: 12 }, (_, index) => ({
  id: `album-${index}`,
  title: `Album ${index + 1}`,
  label: "Liner Notes",
  year: 2000 + index,
  description: `Album ${index + 1} description`,
  cover_path: index === 0 ? "covers/album-1.webp" : null,
  artists: { name: `Artist ${index + 1}` },
}));

const tracks = albums.flatMap((album) => [
  {
    id: `${album.id}-1`,
    album_id: album.id,
    title: "First track",
    duration_seconds: 185,
    description: "A distinct track note",
    youtube_video_id: "dQw4w9WgXcQ",
    youtube_start_seconds: 12,
    youtube_end_seconds: 180,
  },
  {
    id: `${album.id}-2`,
    album_id: album.id,
    title: "Second track",
    duration_seconds: 240,
    description: "",
    youtube_video_id: null,
    youtube_start_seconds: null,
    youtube_end_seconds: null,
  },
]);

describe("mapFeaturedAlbums", () => {
  it("DB 앨범과 수록곡을 카드가 쓰는 앨범 모델로 바꾼다", () => {
    const result = mapFeaturedAlbums(albums, tracks, (path) => `https://cdn.example/${path}`);

    expect(result).toHaveLength(12);
    expect(result?.[0]).toMatchObject({
      id: "album-0",
      coverUrl: "https://cdn.example/covers/album-1.webp",
      runtime: "7:05",
    });
    expect(result?.[0].tracks.map((track) => track.title)).toEqual([
      "First track",
      "Second track",
    ]);
    expect(result?.[0].cover.youtubeVideoId).toBe("dQw4w9WgXcQ");
    expect(result?.[0].tracks[1].definition).toBe("Album 1 description");
    expect(result?.[0].tags).toEqual([]);
  });

  it("부분 입력 중인 앨범도 수록곡 없이 표시할 수 있다", () => {
    const result = mapFeaturedAlbums(
      albums.slice(0, 1),
      tracks.filter((track) => track.album_id !== "album-0"),
    );

    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ runtime: "0:00", tracks: [] });
    expect(result?.[0].cover).toMatchObject({ title: "Album 1", length: "0:00" });
  });
});

describe("resolveCoverUrl", () => {
  it("외부 커버 URL은 Storage URL로 바꾸지 않는다", () => {
    expect(
      resolveCoverUrl("https://image.example/cover.jpg", (path) => `https://storage.example/${path}`),
    ).toBe("https://image.example/cover.jpg");
  });

  it("Storage 객체 경로는 public URL로 바꾼다", () => {
    expect(
      resolveCoverUrl("covers/album-1.webp", (path) => `https://storage.example/${path}`),
    ).toBe("https://storage.example/covers/album-1.webp");
  });
});
