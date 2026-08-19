import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

describe("createRng", () => {
  it("같은 시드는 같은 수열을 만든다", () => {
    const a = createRng(7);
    const b = createRng(7);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("다른 시드는 다른 수열을 만든다", () => {
    const a = createRng(7);
    const b = createRng(8);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("결과는 항상 0 이상 1 미만이다", () => {
    const rng = createRng(12345);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("0 이하 시드도 안전한 수열을 만든다", () => {
    const rng = createRng(0);
    for (let i = 0; i < 10; i++) {
      const v = rng();
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });
});
