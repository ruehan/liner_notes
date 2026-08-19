import { describe, expect, it } from "vitest";
import { clampCamera } from "./camera";

const viewport = { width: 1200, height: 800 };
const world = { width: 3400, height: 2200 };

describe("clampCamera", () => {
  it("카메라는 월드 안에 머무른다", () => {
    const p = clampCamera({ x: 9999, y: 9999 }, viewport, world);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);

    const n = clampCamera({ x: -99999, y: -99999 }, viewport, world);
    expect(n.x).toBe(viewport.width - world.width);
    expect(n.y).toBe(viewport.height - world.height);
  });

  it("범위 안의 값은 그대로 둔다", () => {
    const p = clampCamera({ x: -400, y: -300 }, viewport, world);
    expect(p).toEqual({ x: -400, y: -300 });
  });

  it("월드보다 큰 뷰포트에서는 0에 고정된다", () => {
    const big = { width: 5000, height: 3000 };
    const p = clampCamera({ x: -120, y: 80 }, big, world);
    expect(p).toEqual({ x: 0, y: 0 });
  });
});
