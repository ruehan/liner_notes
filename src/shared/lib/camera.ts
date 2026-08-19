export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export function clampCamera(cam: Point, viewport: Size, world: Size): Point {
  const minX = Math.min(0, viewport.width - world.width);
  const minY = Math.min(0, viewport.height - world.height);
  return {
    x: Math.min(0, Math.max(minX, cam.x)),
    y: Math.min(0, Math.max(minY, cam.y)),
  };
}

export function centerCameraOn(
  target: Point,
  viewport: Size,
  world: Size,
): Point {
  return clampCamera(
    {
      x: -target.x + viewport.width / 2,
      y: -target.y + viewport.height / 2,
    },
    viewport,
    world,
  );
}
