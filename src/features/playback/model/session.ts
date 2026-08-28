import { normalizeYouTubeVideoId, type Album } from "@/entities/track";
import type { PlaybackItem } from "./playback";

const STORAGE_KEY = "liner-notes:playback-session";
export const DEFAULT_PLAYBACK_VOLUME = 70;

export interface PlaybackSession {
  albumId: string;
  trackId: string;
  positionSeconds: number;
  volume: number;
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clampVolume(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_PLAYBACK_VOLUME;
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

function clampPosition(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function loadPlaybackSession(): PlaybackSession | null {
  const storage = safeStorage();
  if (!storage) return null;

  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (
      !value ||
      typeof value !== "object" ||
      !("albumId" in value) ||
      !("trackId" in value) ||
      typeof value.albumId !== "string" ||
      typeof value.trackId !== "string" ||
      !value.albumId ||
      !value.trackId
    ) {
      return null;
    }

    return {
      albumId: value.albumId,
      trackId: value.trackId,
      positionSeconds: clampPosition("positionSeconds" in value ? value.positionSeconds : 0),
      volume: clampVolume("volume" in value ? value.volume : DEFAULT_PLAYBACK_VOLUME),
    };
  } catch {
    return null;
  }
}

export function savePlaybackSession(session: PlaybackSession): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...session,
        positionSeconds: clampPosition(session.positionSeconds),
        volume: clampVolume(session.volume),
      }),
    );
  } catch {
    // 저장 공간을 사용할 수 없는 환경에서는 현재 세션만 유지한다.
  }
}

export function clearPlaybackSession(): void {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 저장 공간을 사용할 수 없는 환경에서는 현재 세션만 유지한다.
  }
}

export function restorePlaybackItem(
  albums: Album[],
  session: PlaybackSession,
): PlaybackItem | null {
  const album = albums.find((candidate) => candidate.id === session.albumId);
  const track = album?.tracks.find((candidate) => candidate.id === session.trackId);
  if (!album || !track || !normalizeYouTubeVideoId(track.youtubeVideoId)) return null;
  return { album, track };
}
