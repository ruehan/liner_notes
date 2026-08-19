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
  const ox = Math.round(cam.x / world.width) * world.width;
  const oy = Math.round(cam.y / world.height) * world.height;
  const offsets: Point[] = [];
  for (let k = -1; k <= 1; k++) {
    for (let m = -1; m <= 1; m++) {
      const x = ox + k * world.width;
      const y = oy + m * world.height;
      const intersects =
        x < cam.x + viewport.width &&
        x + world.width > cam.x &&
        y < cam.y + viewport.height &&
        y + world.height > cam.y;
      if (intersects) offsets.push({ x, y });
    }
  }
  return offsets;
}

export function nearestCopy(base: number, target: number, period: number): number {
  const k = Math.round((target - base) / period);
  return base + k * period;
}
