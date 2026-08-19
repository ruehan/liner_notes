import { describe, expect, it } from "vitest";
import { pickShuffleIndex } from "./shuffle";

describe("pickShuffleIndex", () => {
  it("후보가 없으면 null", () => {
    expect(pickShuffleIndex([], Math.random)).toBeNull();
  });

  it("주사위 값으로 후보를 고른다", () => {
    const candidates = [3, 7, 11];
    expect(pickShuffleIndex(candidates, () => 0)).toBe(3);
    expect(pickShuffleIndex(candidates, () => 0.5)).toBe(7);
    expect(pickShuffleIndex(candidates, () => 0.999)).toBe(11);
  });

  it("경계값에서도 후보 밖으로 나가지 않는다", () => {
    const candidates = [1, 2];
    for (const r of [0, 0.4999, 0.5, 0.9999999]) {
      const pick = pickShuffleIndex(candidates, () => r);
      expect(candidates).toContain(pick);
    }
  });
});
