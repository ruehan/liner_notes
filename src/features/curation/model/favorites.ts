const STORAGE_KEY = "liner-notes:favorites";

export type FavKey = string;

export function favKey(k: number, m: number, i: number, sessionSeed?: number): FavKey {
  const position = `${k},${m}:${i}`;
  return sessionSeed === undefined ? position : `${position}@${sessionSeed}`;
}

/** Stable key for an album that comes from the database rather than a generated tile. */
export function databaseFavKey(albumId: string): FavKey {
  return `album:${albumId}`;
}

export function favKeyFromTrackId(trackId: string): FavKey | null {
  const parts = trackId.split(":");
  if (parts.length !== 3) return null;
  const [k, m, i] = parts.map(Number);
  if ([k, m, i].some((n) => !Number.isInteger(n))) return null;
  return favKey(k, m, i);
}

export interface TileFavRef {
  k: number;
  m: number;
  i: number;
  sessionSeed?: number;
}

export interface DatabaseFavRef {
  albumId: string;
}

export type FavRef = TileFavRef | DatabaseFavRef;

export function parseFavKey(key: string): FavRef | null {
  const databaseMatch = /^album:(.+)$/.exec(key);
  if (databaseMatch) return { albumId: databaseMatch[1] };

  const m = /^(-?\d+),(-?\d+):(\d+)(?:@(-?\d+))?$/.exec(key);
  if (!m) return null;
  const ref: TileFavRef = { k: Number(m[1]), m: Number(m[2]), i: Number(m[3]) };
  if (m[4] !== undefined) ref.sessionSeed = Number(m[4]);
  return ref;
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
