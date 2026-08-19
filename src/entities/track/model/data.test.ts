import { describe, expect, it } from "vitest";
import { GENRES, GENRE_ORDER, TRACKS } from "./data";

describe("track 데이터 무결성", () => {
  it("모든 트랙은 정의된 장르를 가진다", () => {
    for (const t of TRACKS) {
      expect(GENRE_ORDER).toContain(t.genre);
      expect(GENRES[t.genre]).toBeDefined();
    }
  });

  it("id는 유일하다", () => {
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("연도는 정수, 길이는 m:ss / h:mm:ss 형태", () => {
    for (const t of TRACKS) {
      expect(Number.isInteger(t.year)).toBe(true);
      expect(t.length).toMatch(/^\d{1,2}(:\d{2}){1,2}$/);
    }
  });

  it("태그와 정의는 비어 있지 않다", () => {
    for (const t of TRACKS) {
      expect(t.tags.length).toBeGreaterThan(0);
      expect(t.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("장르 테마는 bg/ink/spine/phon을 모두 가진다", () => {
    for (const g of GENRE_ORDER) {
      const theme = GENRES[g];
      for (const v of Object.values(theme)) {
        expect(v.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
