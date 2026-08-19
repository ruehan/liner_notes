import { createRng } from "./rng";

export interface WorldConfig {
  width: number;
  height: number;
}

export const WORLD: WorldConfig = { width: 3400, height: 2200 };
export const CELL_SIZE = 236;
export const CELL_GAP = 64;
export const MAX_ROTATION = 5;

export interface Spot {
  x: number;
  y: number;
  rot: number;
}

export function generateSpots(
  count: number,
  seed: number,
  world: WorldConfig = WORLD,
  cell: number = CELL_SIZE,
  gap: number = CELL_GAP,
): Spot[] {
  const rng = createRng(seed);
  const stride = cell + gap;
  const cols = Math.floor((world.width - cell - gap) / stride) + 1;
  const rows = Math.floor((world.height - cell - gap) / stride) + 1;
  const capacity = cols * rows;
  if (count > capacity) {
    throw new Error(
      `layout capacity exceeded: ${count} > ${capacity} (${cols}x${rows})`,
    );
  }

  const cells: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push([c * stride, r * stride]);
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return cells.slice(0, count).map(([cx, cy]) => ({
    x: cx + Math.floor(rng() * gap),
    y: cy + Math.floor(rng() * gap),
    rot: +(rng() * 2 * MAX_ROTATION - MAX_ROTATION).toFixed(1),
  }));
}
