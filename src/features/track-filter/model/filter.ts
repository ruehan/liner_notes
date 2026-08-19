import type { GenreId } from "@/entities/track";

export type FilterId = "all" | GenreId;

export const FILTER_ORDER: FilterId[] = [
  "all",
  "ambient",
  "jazz",
  "electronic",
];

interface GenreItem {
  genre: GenreId;
}

export function isVisible(item: GenreItem, filter: FilterId): boolean {
  return filter === "all" || item.genre === filter;
}

export function visibleIndices<T extends GenreItem>(items: T[], filter: FilterId): number[] {
  const out: number[] = [];
  items.forEach((item, index) => {
    if (isVisible(item, filter)) out.push(index);
  });
  return out;
}

export function filterCounts<T extends GenreItem>(items: T[]): Record<FilterId, number> {
  const counts: Record<FilterId, number> = {
    all: items.length,
    ambient: 0,
    jazz: 0,
    electronic: 0,
  };
  for (const item of items) counts[item.genre] += 1;
  return counts;
}
