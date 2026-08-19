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
  const visibleX0 = -cam.x;
  const visibleY0 = -cam.y;
  const visibleX1 = visibleX0 + viewport.width;
  const visibleY1 = visibleY0 + viewport.height;
  const firstX = Math.floor(visibleX0 / world.width) * world.width;
  const firstY = Math.floor(visibleY0 / world.height) * world.height;
  const offsets: Point[] = [];
  for (let x = firstX; x < visibleX1; x += world.width) {
    for (let y = firstY; y < visibleY1; y += world.height) {
      offsets.push({ x, y });
    }
  }
  return offsets;
}

export function nearestCopy(base: number, target: number, period: number): number {
  const k = Math.round((target - base) / period);
  return base + k * period;
}
