import type { GenreId, Track } from "@/entities/track";

export type FilterId = "all" | GenreId;

export const FILTER_ORDER: FilterId[] = [
  "all",
  "ambient",
  "jazz",
  "electronic",
];

export function isVisible(track: Track, filter: FilterId): boolean {
  return filter === "all" || track.genre === filter;
}

export function visibleIndices(tracks: Track[], filter: FilterId): number[] {
  const out: number[] = [];
  tracks.forEach((t, i) => {
    if (isVisible(t, filter)) out.push(i);
  });
  return out;
}

export function filterCounts(tracks: Track[]): Record<FilterId, number> {
  const counts: Record<FilterId, number> = {
    all: tracks.length,
    ambient: 0,
    jazz: 0,
    electronic: 0,
  };
  for (const t of tracks) counts[t.genre] += 1;
  return counts;
}
