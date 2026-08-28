import { beforeEach, describe, expect, it } from "vitest";
import { generateTileAlbums } from "@/entities/track";
import {
  DEFAULT_PLAYBACK_VOLUME,
  clearPlaybackSession,
  loadPlaybackSession,
  restorePlaybackItem,
  savePlaybackSession,
} from "./session";

const album = generateTileAlbums(0, 0, 456)[0];
const track = { ...album.tracks[0], youtubeVideoId: "M7lc1UVf-VE" };
const playbackAlbum = { ...album, tracks: [track, ...album.tracks.slice(1)] };

beforeEach(() => {
  window.localStorage.clear();
});

describe("playback session", () => {
  it("재생 대상, 위치, 볼륨을 안전한 값으로 저장하고 읽는다", () => {
    savePlaybackSession({
      albumId: playbackAlbum.id,
      trackId: track.id,
      positionSeconds: 42.9,
      volume: 135,
    });

    expect(loadPlaybackSession()).toEqual({
      albumId: playbackAlbum.id,
      trackId: track.id,
      positionSeconds: 42,
      volume: 100,
    });
  });

  it("손상된 저장값은 무시하고, 현재 앨범 데이터에서만 재생 항목을 복원한다", () => {
    window.localStorage.setItem("liner-notes:playback-session", "not-json");
    expect(loadPlaybackSession()).toBeNull();

    const item = restorePlaybackItem(
      [playbackAlbum],
      {
        albumId: playbackAlbum.id,
        trackId: track.id,
        positionSeconds: 10,
        volume: DEFAULT_PLAYBACK_VOLUME,
      },
    );
    expect(item).toEqual({ album: playbackAlbum, track });

    clearPlaybackSession();
    expect(loadPlaybackSession()).toBeNull();
  });
});
