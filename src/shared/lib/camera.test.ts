import { describe, expect, it } from "vitest";
import {
  centerCameraOn,
  mod,
  nearestCopy,
  tileOffsets,
  type Point,
} from "./camera";

const viewport = { width: 1200, height: 800 };
const world = { width: 3400, height: 2200 };

describe("centerCameraOn", () => {
  it("대상을 뷰포트 중앙에 놓는 카메라 좌표를 만든다", () => {
    const p = centerCameraOn({ x: 1700, y: 1100 }, viewport);
    expect(p).toEqual({ x: viewport.width / 2 - 1700, y: viewport.height / 2 - 1100 });
  });

  it("카메라는 제한 없이 자유롭게 움직인다 (무한 스크롤)", () => {
    expect(centerCameraOn({ x: 1_000_000, y: -50_000 }, viewport).x).toBe(
      viewport.width / 2 - 1_000_000,
    );
  });
});

describe("mod", () => {
  it("음수도 양의 나머지로 만든다", () => {
    expect(mod(-1, 10)).toBe(9);
    expect(mod(-11, 10)).toBe(9);
    expect(mod(11, 10)).toBe(1);
    expect(mod(0, 10)).toBe(0);
  });
});

describe("tileOffsets", () => {
  const visible = (cam: Point, o: Point) =>
    o.x < -cam.x + viewport.width &&
    o.x + world.width > -cam.x &&
    o.y < -cam.y + viewport.height &&
    o.y + world.height > -cam.y;

  it("뷰포트에 보이는 월드 영역과 겹치는 타일만 반환한다", () => {
    const cam = { x: -1188, y: -716 };
    const offs = tileOffsets(cam, viewport, world);
    expect(offs.length).toBeGreaterThan(0);
    for (const o of offs) expect(visible(cam, o)).toBe(true);
  });

  it("카메라가 멀리가도 항상 보이는 타일이 있다", () => {
    for (const cam of [
      { x: 12_345, y: -77_777 },
      { x: -123_456, y: 8_000 },
      { x: 3 * world.width, y: 5 * world.height },
    ]) {
      const offs = tileOffsets(cam, viewport, world);
      expect(offs.some((o) => visible(cam, o))).toBe(true);
    }
  });

  it("한 방향으로 계속 이동해도 타일 개수가 폭발하지 않는다", () => {
    let cam = { x: 0, y: 0 };
    for (let i = 0; i < 50; i++) {
      cam = { x: cam.x - 900, y: cam.y - 400 };
      const offs = tileOffsets(cam, viewport, world);
      expect(offs.length).toBeLessThanOrEqual(4);
      expect(offs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("타일이 화면보다 작아도 뷰포트 전체를 빈틈없이 덮는다", () => {
    const compactWorld = { width: 1320, height: 900 };
    const wideViewport = { width: 2048, height: 1200 };
    const cam = { x: -826, y: -450 };
    const offs = tileOffsets(cam, wideViewport, compactWorld);
    const xs = [...new Set(offs.map((offset) => offset.x))].sort((a, b) => a - b);
    const ys = [...new Set(offs.map((offset) => offset.y))].sort((a, b) => a - b);

    expect(xs).toEqual([0, 1320, 2640]);
    expect(ys).toEqual([0, 900]);
    expect(xs[0]).toBeLessThanOrEqual(-cam.x);
    expect(xs.at(-1)! + compactWorld.width).toBeGreaterThanOrEqual(
      -cam.x + wideViewport.width,
    );
    expect(ys[0]).toBeLessThanOrEqual(-cam.y);
    expect(ys.at(-1)! + compactWorld.height).toBeGreaterThanOrEqual(
      -cam.y + wideViewport.height,
    );
  });
});

describe("nearestCopy", () => {
  it("대상에서 가장 가까운 복사본 좌표를 돌려준다", () => {
    expect(nearestCopy(100, 120, 3400)).toBe(100);
    expect(nearestCopy(100, 3000, 3400)).toBe(3500);
    expect(nearestCopy(100, -3000, 3400)).toBe(-3300);
  });
});
