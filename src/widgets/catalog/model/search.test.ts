import { describe, expect, it } from "vitest";
import { filterByQuery, matchesText } from "./search";

const entries = [
  { title: "Blue in Green", artist: "Bill Evans Trio", album: "Kind of Blue", catalog: "LNR-002" },
  { title: "Xtal", artist: "Aphex Twin", album: "Selected Ambient Works 85–92", catalog: "LNR-006" },
  { title: "Pale Harbor", artist: "Mona Okabe", album: "Pale Harbor Sessions", catalog: "LNR-1.0-01" },
];

const fieldsOf = (e: (typeof entries)[number]) => [
  e.title,
  e.artist,
  e.album,
  e.catalog,
];

describe("matchesText", () => {
  it("빈 쿼리는 전부 통과", () => {
    expect(matchesText(["Blue in Green"], "")).toBe(true);
    expect(matchesText(["Blue in Green"], "   ")).toBe(true);
  });

  it("모든 필드를 대소문자 구분 없이 검색", () => {
    expect(matchesText(fieldsOf(entries[0]), "blue")).toBe(true);
    expect(matchesText(fieldsOf(entries[0]), "EVANS")).toBe(true);
    expect(matchesText(fieldsOf(entries[0]), "kind")).toBe(true);
    expect(matchesText(fieldsOf(entries[0]), "lnr-002")).toBe(true);
    expect(matchesText(fieldsOf(entries[2]), "1.0")).toBe(true);
  });

  it("매치 없으면 false", () => {
    expect(matchesText(fieldsOf(entries[0]), "zzz")).toBe(false);
  });

  it("undefined 필드는 무시", () => {
    expect(matchesText([undefined, "abc"], "abc")).toBe(true);
    expect(matchesText([undefined], "abc")).toBe(false);
  });
});

describe("filterByQuery", () => {
  it("쿼리로 걸러낸다", () => {
    expect(filterByQuery(entries, "aphex", fieldsOf)).toHaveLength(1);
    expect(filterByQuery(entries, "", fieldsOf)).toHaveLength(3);
    expect(filterByQuery(entries, "nope", fieldsOf)).toHaveLength(0);
  });
});
