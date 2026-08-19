import { describe, expect, it } from "vitest";
import { TRACKS } from "./data";
import { GENRE_ORDER } from "./data";
import { generateTileTracks, isHomeTile, tileCatalog } from "./generator";

describe("generateTileTracks", () => {
  it("같은 타일은 항상 같은 트랙을 만든다", () => {
    expect(generateTileTracks(3, -2)).toEqual(generateTileTracks(3, -2));
  });

  it("다른 타일은 다른 트랙을 만든다", () => {
    expect(generateTileTracks(1, 0)).not.toEqual(generateTileTracks(0, 1));
  });

  it("홈 타일(0,0)은 기존 선곡 그대로다", () => {
    expect(isHomeTile(0, 0)).toBe(true);
    expect(generateTileTracks(0, 0)).toEqual(TRACKS);
  });

  it("모든 타일을 같은 12곡의 카드 그리드로 채운다", () => {
    for (const [k, m] of [[1, 1], [-3, 2], [5, -7]] as const) {
      const n = generateTileTracks(k, m).length;
      expect(n).toBe(TRACKS.length);
    }
  });

  it("생성 트랙의 모든 필드가 유효하다", () => {
    for (const t of generateTileTracks(7, 3)) {
      expect(GENRE_ORDER).toContain(t.genre);
      expect(Number.isInteger(t.year)).toBe(true);
      expect(t.length).toMatch(/^\d{1,2}(:\d{2}){1,2}$/);
      expect(t.title.trim().length).toBeGreaterThan(0);
      expect(t.artist.trim().length).toBeGreaterThan(0);
      expect(t.album.trim().length).toBeGreaterThan(0);
      expect(t.label.trim().length).toBeGreaterThan(0);
      expect(t.tags.length).toBeGreaterThan(0);
      expect(t.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("id는 타일 좌표를 포함해 유일하다", () => {
    const a = generateTileTracks(1, 2).map((t) => t.id);
    const b = generateTileTracks(2, 1).map((t) => t.id);
    expect(new Set(a).size).toBe(a.length);
    expect(a.every((id) => !b.includes(id))).toBe(true);
  });
});

describe("tileCatalog", () => {
  it("홈 타일은 LNR-001 형태", () => {
    expect(tileCatalog(0, 0, 0)).toBe("LNR-001");
    expect(tileCatalog(0, 0, 11)).toBe("LNR-012");
  });

  it("다른 타일은 좌표 형태", () => {
    expect(tileCatalog(1, 0, 6)).toBe("LNR-1.0-07");
    expect(tileCatalog(-1, 2, 0)).toBe("LNR-n1.2-01");
  });
});
