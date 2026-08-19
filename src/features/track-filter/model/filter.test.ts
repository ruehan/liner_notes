import { describe, expect, it } from "vitest";
import { TRACKS } from "@/entities/track";
import { filterCounts, isVisible, visibleIndices } from "./filter";

describe("track-filter 모델", () => {
  it("all 필터는 전부 보여준다", () => {
    expect(visibleIndices(TRACKS, "all")).toHaveLength(TRACKS.length);
  });

  it("장르 필터는 해당 장르만 남긴다", () => {
    const idx = visibleIndices(TRACKS, "jazz");
    expect(idx.length).toBeGreaterThan(0);
    for (const i of idx) expect(TRACKS[i].genre).toBe("jazz");
  });

  it("isVisible은 필터와 장르를 비교한다", () => {
    const jazz = TRACKS.find((t) => t.genre === "jazz")!;
    expect(isVisible(jazz, "all")).toBe(true);
    expect(isVisible(jazz, "jazz")).toBe(true);
    expect(isVisible(jazz, "ambient")).toBe(false);
  });

  it("카운트 합은 전체와 같다", () => {
    const counts = filterCounts(TRACKS);
    expect(counts.all).toBe(TRACKS.length);
    expect(counts.ambient + counts.jazz + counts.electronic).toBe(counts.all);
  });
});
