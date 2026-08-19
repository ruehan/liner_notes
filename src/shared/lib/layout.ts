import { createRng } from "./rng";

export interface WorldConfig {
  width: number;
  height: number;
}

export const CELL_SIZE = 236;
export const CELL_GAP = 64;
export const MAX_ROTATION = 5;
export const MOSAIC_BLEED = 2;
export const MOSAIC_WORLD_WIDTH = 1320;
export const MOSAIC_ROW_COUNT = 4;
export const MOSAIC_ASPECTS = [
  1.6, 0.72, 1.24,
  2.05, 0.78, 1.12,
  1.42, 0.68, 1.38,
  2.18, 0.86, 1.16,
] as const;
export const MOSAIC_CARD_COUNT = MOSAIC_ASPECTS.length;

export interface Spot {
  x: number;
  y: number;
  rot: number;
}

export interface MosaicSpot extends Spot {
  width: number;
  height: number;
}

interface JustifiedRow {
  indices: number[];
  aspect: number;
}

function justifiedRows(
  aspects: readonly number[],
  rowCount: number,
): JustifiedRow[] {
  const target = aspects.reduce((sum, aspect) => sum + aspect, 0) / rowCount;
  const rows: JustifiedRow[] = [];
  let index = 0;

  for (let row = 0; row < rowCount; row++) {
    const indices: number[] = [];
    let aspect = 0;
    const remainingRows = rowCount - row - 1;
    while (index < aspects.length - remainingRows) {
      const next = aspects[index];
      if (
        indices.length > 0 &&
        Math.abs(aspect + next - target) > Math.abs(aspect - target)
      ) {
        break;
      }
      indices.push(index);
      aspect += next;
      index += 1;
    }
    rows.push({ indices, aspect });
  }

  return rows;
}

function justifiedHeight(
  aspects: readonly number[],
  width: number,
  rowCount: number,
): number {
  return justifiedRows(aspects, rowCount).reduce(
    (height, row) => height + width / row.aspect,
    0,
  );
}

export const WORLD: WorldConfig = {
  width: MOSAIC_WORLD_WIDTH,
  height: justifiedHeight(MOSAIC_ASPECTS, MOSAIC_WORLD_WIDTH, MOSAIC_ROW_COUNT),
};

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

/**
 * Builds a justified collage from portrait, square and landscape card ratios.
 * Every row reaches the full world width, so this finite layout can repeat in
 * every direction without the empty space that creates separate card clusters.
 */
export function generateMosaicSpots(
  count: number,
  world: WorldConfig = WORLD,
): MosaicSpot[] {
  if (count <= 0) return [];
  if (count !== MOSAIC_CARD_COUNT) {
    throw new Error(
      `mosaic layout requires ${MOSAIC_CARD_COUNT} cards, received ${count}`,
    );
  }

  const rows = justifiedRows(MOSAIC_ASPECTS, MOSAIC_ROW_COUNT);
  const spots: MosaicSpot[] = Array.from({ length: count });
  let y = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const height = world.width / row.aspect;
    let x = 0;

    row.indices.forEach((index, columnIndex) => {
      const isFirst = columnIndex === 0;
      const isLast = columnIndex === row.indices.length - 1;
      const isTop = rowIndex === 0;
      const isBottom = rowIndex === rows.length - 1;
      const width = isLast ? world.width - x : MOSAIC_ASPECTS[index] * height;
      spots[index] = {
        x: x - (isFirst ? 0 : MOSAIC_BLEED),
        y: y - (isTop ? 0 : MOSAIC_BLEED),
        width: width + (isFirst ? 0 : MOSAIC_BLEED) + (isLast ? 0 : MOSAIC_BLEED),
        height: height + (isTop ? 0 : MOSAIC_BLEED) + (isBottom ? 0 : MOSAIC_BLEED),
        rot: 0,
      };
      x += width;
    });
    y += height;
  }

  return spots;
}
