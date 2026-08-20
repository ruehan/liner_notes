import { describe, expect, it } from "vitest";
import {
  CELL_SIZE,
  MOSAIC_ASPECTS,
  MOSAIC_BLEED,
  MOSAIC_ROW_COUNT,
  WORLD,
  generateMosaicSpots,
  generateSpots,
} from "./layout";

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
    for (const s of generateSpots(12, 99)) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.x + CELL_SIZE).toBeLessThanOrEqual(WORLD.width);
      expect(s.y + CELL_SIZE).toBeLessThanOrEqual(WORLD.height);
    }
  });

  it("회전은 ±5도 사이다", () => {
    for (const s of generateSpots(12, 99)) {
      expect(s.rot).toBeGreaterThanOrEqual(-5);
      expect(s.rot).toBeLessThanOrEqual(5);
    }
  });

  it("스폿끼리 겹치지 않는다 (같은 셀은 하나)", () => {
    const spots = generateSpots(12, 5);
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

describe("generateMosaicSpots", () => {
  it("요청한 개수만큼 결정적인 모자이크 스폿을 만든다", () => {
    expect(generateMosaicSpots(12)).toHaveLength(12);
    expect(generateMosaicSpots(12)).toEqual(generateMosaicSpots(12));
  });

  it("카드가 월드를 가로지르는 서로 다른 크기의 행을 만든다", () => {
    const spots = generateMosaicSpots(12);
    for (let i = 0; i < spots.length; i++) {
      const a = spots[i];
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.y + a.height).toBeLessThanOrEqual(WORLD.height);
    }
    expect(new Set(spots.map((spot) => spot.width)).size).toBeGreaterThan(4);
    expect(spots.some((spot) => spot.height > spot.width)).toBe(true);
    expect(spots.some((spot) => spot.width > spot.height)).toBe(true);
  });

  it("각 행은 월드 폭을 정확히 채우고 카드 경계를 살짝 겹친다", () => {
    const spots = generateMosaicSpots(12);
    const rows = new Map<number, typeof spots>();
    for (const spot of spots) {
      const row = rows.get(spot.y) ?? [];
      row.push(spot);
      rows.set(spot.y, row);
    }

    expect(rows.size).toBe(MOSAIC_ROW_COUNT);
    for (const row of rows.values()) {
      const sorted = [...row].sort((a, b) => a.x - b.x);
      expect(sorted[0].x).toBe(0);
      expect(sorted.at(-1)!.x + sorted.at(-1)!.width).toBe(WORLD.width);
      for (let index = 1; index < sorted.length; index++) {
        expect(sorted[index - 1].x + sorted[index - 1].width - sorted[index].x).toBe(
          MOSAIC_BLEED * 2,
        );
      }
    }
    expect(MOSAIC_ASPECTS).toHaveLength(12);
  });

  it("DB 앨범이 일부만 있을 때도 가변 모자이크를 만든다", () => {
    for (const count of [0, 1, 4, 11]) {
      const spots = generateMosaicSpots(count);
      expect(spots).toHaveLength(count);
      for (const spot of spots) {
        expect(spot.x).toBeGreaterThanOrEqual(0);
        expect(spot.y).toBeGreaterThanOrEqual(0);
        expect(spot.x + spot.width).toBeLessThanOrEqual(WORLD.width + 0.001);
        expect(spot.y + spot.height).toBeLessThanOrEqual(WORLD.height + 0.001);
      }
    }
  });
});
