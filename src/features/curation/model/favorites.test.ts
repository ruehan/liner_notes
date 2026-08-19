import { describe, expect, it, beforeEach } from "vitest";
import {
  favKey,
  favKeyFromTrackId,
  loadFavorites,
  parseFavKey,
  saveFavorites,
  toggleFavorite,
} from "./favorites";

beforeEach(() => {
  window.localStorage.clear();
});

describe("favKey / parseFavKey", () => {
  it("타일 좌표와 인덱스로 키를 만들고 되돌린다", () => {
    const key = favKey(3, -2, 5);
    expect(key).toBe("3,-2:5");
    expect(parseFavKey(key)).toEqual({ k: 3, m: -2, i: 5 });
  });

  it("홈 타일 키", () => {
    expect(favKey(0, 0, 0)).toBe("0,0:0");
    expect(parseFavKey("0,0:0")).toEqual({ k: 0, m: 0, i: 0 });
  });

  it("세션 시드를 포함한 키도 앨범을 다시 찾을 수 있다", () => {
    const key = favKey(0, 0, 4, 712_340);
    expect(key).toBe("0,0:4@712340");
    expect(parseFavKey(key)).toEqual({ k: 0, m: 0, i: 4, sessionSeed: 712_340 });
  });

  it("이상한 문자열은 null", () => {
    expect(parseFavKey("abc")).toBeNull();
    expect(parseFavKey("1,2")).toBeNull();
    expect(parseFavKey("")).toBeNull();
  });
});

describe("favKeyFromTrackId", () => {
  it("트랙 id(k:m:i)를 수집 키로 바꾼다", () => {
    expect(favKeyFromTrackId("3:-2:5")).toBe("3,-2:5");
    expect(favKeyFromTrackId("0:0:0")).toBe("0,0:0");
  });

  it("형식이 다르면 null", () => {
    expect(favKeyFromTrackId("abc")).toBeNull();
    expect(favKeyFromTrackId("1:2")).toBeNull();
  });
});

describe("toggleFavorite", () => {
  it("없으면 추가, 있으면 제거한다", () => {
    let list: string[] = [];
    list = toggleFavorite(list, "1,1:0");
    expect(list).toContain("1,1:0");
    list = toggleFavorite(list, "1,1:0");
    expect(list).not.toContain("1,1:0");
  });

  it("순서를 유지하며 중복 추가하지 않는다", () => {
    let list = ["a", "b"];
    list = toggleFavorite(list, "c");
    expect(list).toEqual(["a", "b", "c"]);
    list = toggleFavorite(list, "a");
    expect(list).toEqual(["b", "c"]);
  });
});

describe("saveFavorites / loadFavorites", () => {
  it("저장하고 불러온다", () => {
    saveFavorites(["0,0:1", "2,-1:3"]);
    expect(loadFavorites()).toEqual(["0,0:1", "2,-1:3"]);
  });

  it("비어 있으면 빈 배열", () => {
    expect(loadFavorites()).toEqual([]);
  });

  it("손상된 데이터는 빈 배열로 안전 처리", () => {
    window.localStorage.setItem("liner-notes:favorites", "{not-json");
    expect(loadFavorites()).toEqual([]);
  });

  it("배열이 아닌 값은 빈 배열로", () => {
    window.localStorage.setItem("liner-notes:favorites", '{"a":1}');
    expect(loadFavorites()).toEqual([]);
  });
});
