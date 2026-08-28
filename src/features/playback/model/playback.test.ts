import { describe, expect, it } from "vitest";
import { generateTileAlbums } from "@/entities/track";
import { playableTracks, stepTrack } from "./playback";

const album = generateTileAlbums(0, 0, 123)[0];
const tracks = album.tracks.map((track, index) =>
  index === 0 || index === 2
    ? { ...track, youtubeVideoId: index === 0 ? "dQw4w9WgXcQ" : "M7lc1UVf-VE" }
    : track,
);
const playbackAlbum = { ...album, tracks, cover: tracks[0] };

describe("playback navigation", () => {
  it("YouTube 정보가 있는 수록곡만 재생 목록에 넣는다", () => {
    expect(playableTracks(playbackAlbum).map((track) => track.id)).toEqual([
      tracks[0].id,
      tracks[2].id,
    ]);
  });

  it("같은 앨범 안에서 이전·다음 재생 가능한 수록곡을 찾는다", () => {
    const item = { album: playbackAlbum, track: tracks[0] };
    expect(stepTrack(item, 1)?.id).toBe(tracks[2].id);
    expect(stepTrack(item, -1)).toBeNull();
    expect(stepTrack({ ...item, track: tracks[2] }, 1)).toBeNull();
  });
});
