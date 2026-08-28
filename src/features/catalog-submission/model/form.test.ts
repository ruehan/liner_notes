import { describe, expect, it } from "vitest";
import { buildCatalogAlbumInput, createAlbumDraft } from "./form";

describe("buildCatalogAlbumInput", () => {
  it("앨범과 수록곡 입력을 저장 가능한 형식으로 만들고 YouTube URL을 ID로 바꾼다", () => {
    const draft = createAlbumDraft();
    draft.artistName = "Artist";
    draft.title = "Album";
    draft.label = "Label";
    draft.year = "2026";
    draft.coverPath = "covers/album.webp";
    draft.sortOrder = "4";
    draft.tracks[0] = {
      ...draft.tracks[0],
      title: "First track",
      duration: "03:42",
      youtubeReference: "https://youtu.be/dQw4w9WgXcQ?si=share",
      youtubeStart: "12",
      youtubeEnd: "180",
    };

    expect(buildCatalogAlbumInput(draft)).toEqual({
      errors: [],
      value: {
        artistName: "Artist",
        title: "Album",
        label: "Label",
        year: 2026,
        description: "",
        coverPath: "covers/album.webp",
        featured: true,
        sortOrder: 4,
        tracks: [
          {
            title: "First track",
            duration_seconds: 222,
            description: "",
            youtube_video_id: "dQw4w9WgXcQ",
            youtube_start_seconds: 12,
            youtube_end_seconds: 180,
          },
        ],
      },
    });
  });

  it("길이와 YouTube 구간이 잘못되면 저장을 막는다", () => {
    const draft = createAlbumDraft();
    draft.artistName = "Artist";
    draft.title = "Album";
    draft.tracks[0] = {
      ...draft.tracks[0],
      title: "First track",
      duration: "180",
      youtubeStart: "30",
      youtubeEnd: "15",
    };

    const result = buildCatalogAlbumInput(draft);
    expect(result.value).toBeUndefined();
    expect(result.errors).toEqual([
      "1번 수록곡 길이는 mm:ss 형식으로 입력해 주세요.",
      "1번 수록곡 종료 초는 시작 초보다 커야 합니다.",
    ]);
  });
});
