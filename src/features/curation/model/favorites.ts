const STORAGE_KEY = "liner-notes:favorites";

export type FavKey = string;

export function favKey(k: number, m: number, i: number): FavKey {
  return `${k},${m}:${i}`;
}

export function favKeyFromTrackId(trackId: string): FavKey | null {
  const parts = trackId.split(":");
  if (parts.length !== 3) return null;
  const [k, m, i] = parts.map(Number);
  if ([k, m, i].some((n) => !Number.isInteger(n))) return null;
  return favKey(k, m, i);
}

export interface FavRef {
  k: number;
  m: number;
  i: number;
}

export function parseFavKey(key: string): FavRef | null {
  const m = /^(-?\d+),(-?\d+):(\d+)$/.exec(key);
  if (!m) return null;
  return { k: Number(m[1]), m: Number(m[2]), i: Number(m[3]) };
}

export function loadFavorites(storage: Storage = window.localStorage): FavKey[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveFavorites(
  keys: FavKey[],
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // storage unavailable — in-memory only
  }
}

export function toggleFavorite(keys: FavKey[], key: FavKey): FavKey[] {
  return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
}
