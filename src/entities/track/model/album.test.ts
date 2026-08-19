import { describe, expect, it } from "vitest";
import { TRACKS } from "./data";
import { albumsFromTracks } from "./album";
import { generateTileAlbums } from "./generator";

describe("albumFromTrack", () => {
  it("각 대표 트랙을 결정적인 앨범과 수록곡으로 만든다", () => {
    const albums = albumsFromTracks(TRACKS);

    expect(albums).toHaveLength(TRACKS.length);
    expect(albums).toEqual(albumsFromTracks(TRACKS));
    for (const album of albums) {
      expect(album.title).toBe(album.cover.album);
      expect(album.tracks.length).toBeGreaterThanOrEqual(4);
      expect(album.tracks.length).toBeLessThanOrEqual(7);
      expect(album.tracks[0]).toBe(album.cover);
      expect(album.runtime).toMatch(/^\d{1,3}:\d{2}$/);
    }
  });

  it("반복 타일도 같은 수의 앨범과 수록곡을 재현한다", () => {
    const first = generateTileAlbums(2, -1);
    expect(first).toEqual(generateTileAlbums(2, -1));
    expect(first).toHaveLength(TRACKS.length);
    expect(first.every((album) => album.tracks.length >= 4)).toBe(true);
  });

  it("다른 세션은 새 앨범 컬렉션을 만든다", () => {
    expect(generateTileAlbums(0, 0, 1234)).not.toEqual(generateTileAlbums(0, 0, 5678));
  });
});
