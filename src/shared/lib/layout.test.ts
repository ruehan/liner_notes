import { describe, expect, it } from "vitest";
import { CELL_SIZE, WORLD, generateSpots } from "./layout";

describe("generateSpots", () => {
  it("요청한 개수만큼 스폿을 만든다", () => {
    expect(generateSpots(12, 7)).toHaveLength(12);
  });

  it("같은 시드는 같은 배치를 만든다", () => {
    expect(generateSpots(12, 7)).toEqual(generateSpots(12, 7));
  });

  it("다른 시드는 다른 배치를 만든다", () => {
    expect(generateSpots(12, 7)).not.toEqual(generateSpots(12, 8));
  });

  it("모든 스폿은 월드 경계 안에 있다", () => {
    for (const s of generateSpots(30, 99)) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.x + CELL_SIZE).toBeLessThanOrEqual(WORLD.width);
      expect(s.y + CELL_SIZE).toBeLessThanOrEqual(WORLD.height);
    }
  });

  it("회전은 ±5도 사이다", () => {
    for (const s of generateSpots(30, 99)) {
      expect(s.rot).toBeGreaterThanOrEqual(-5);
      expect(s.rot).toBeLessThanOrEqual(5);
    }
  });

  it("스폿끼리 겹치지 않는다 (같은 셀은 하나)", () => {
    const spots = generateSpots(40, 5);
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i];
        const b = spots[j];
        const separated =
          Math.abs(a.x - b.x) >= CELL_SIZE || Math.abs(a.y - b.y) >= CELL_SIZE;
        expect(separated).toBe(true);
      }
    }
  });

  it("수용량 초과 시 에러를 던진다", () => {
    expect(() => generateSpots(10_000, 1)).toThrow();
  });
});
