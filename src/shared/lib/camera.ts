export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export function centerCameraOn(target: Point, viewport: Size): Point {
  return {
    x: viewport.width / 2 - target.x,
    y: viewport.height / 2 - target.y,
  };
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function tileOffsets(cam: Point, viewport: Size, world: Size): Point[] {
  const ox = Math.round(-cam.x / world.width) * world.width;
  const oy = Math.round(-cam.y / world.height) * world.height;
  const offsets: Point[] = [];
  for (let k = -1; k <= 1; k++) {
    for (let m = -1; m <= 1; m++) {
      const x = ox + k * world.width;
      const y = oy + m * world.height;
      const visibleX0 = -cam.x;
      const visibleY0 = -cam.y;
      const intersects =
        x < visibleX0 + viewport.width &&
        x + world.width > visibleX0 &&
        y < visibleY0 + viewport.height &&
        y + world.height > visibleY0;
      if (intersects) offsets.push({ x, y });
    }
  }
  return offsets;
}

export function nearestCopy(base: number, target: number, period: number): number {
  const k = Math.round((target - base) / period);
  return base + k * period;
}
