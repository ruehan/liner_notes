import { describe, expect, it } from "vitest";
import { centerCameraOn } from "./camera";

const viewport = { width: 1200, height: 800 };
const world = { width: 3400, height: 2200 };

describe("centerCameraOn", () => {
  it("대상을 뷰포트 중앙에 놓는다", () => {
    const p = centerCameraOn({ x: 1700, y: 1100 }, viewport, world);
    expect(p.x).toBe(-1100);
    expect(p.y).toBe(-700);
  });

  it("가장자리 대상은 클램프된다", () => {
    const p = centerCameraOn({ x: 0, y: 0 }, viewport, world);
    expect(p).toEqual({ x: 0, y: 0 });
  });
});
