import { supabase } from "@/shared/api/supabase";
import { normalizeYouTubeVideoId } from "../lib/normalize-youtube-video-id";
import type { Album, GenreId, Track } from "../model/types";

interface DbArtist {
  name: string;
}

interface DbAlbum {
  id: string;
  title: string;
  label: string;
  year: number;
  description: string;
  cover_path: string | null;
  artists: DbArtist | DbArtist[] | null;
}

interface DbTrack {
  id: string;
  album_id: string;
  title: string;
  duration_seconds: number;
  description: string;
  youtube_video_id: string | null;
  youtube_start_seconds: number | null;
  youtube_end_seconds: number | null;
}

const FEATURED_ALBUM_COUNT = 12;
const DISPLAY_GENRES: readonly GenreId[] = ["ambient", "jazz", "electronic"];

/**
 * Genre is a presentation-only classification for database albums. It keeps
 * the wall's existing filter and colour system without requiring editors to
 * manage another database field.
 */
function displayGenreFor(id: string): GenreId {
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return DISPLAY_GENRES[hash % DISPLAY_GENRES.length];
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function artistName(artist: DbArtist | DbArtist[] | null): string | null {
  if (Array.isArray(artist)) return artist[0]?.name ?? null;
  return artist?.name ?? null;
}

export function resolveCoverUrl(
  reference: string,
  storageUrlFor: (path: string) => string,
): string {
  return /^https?:\/\//i.test(reference) ? reference : storageUrlFor(reference);
}

/** Converts public database rows into the UI's album-first model. */
export function mapFeaturedAlbums(
  albumRows: DbAlbum[],
  trackRows: DbTrack[],
  coverUrlFor: (reference: string) => string | undefined = () => undefined,
): Album[] | null {
  const tracksByAlbum = new Map<string, DbTrack[]>();
  for (const track of trackRows) {
    const tracks = tracksByAlbum.get(track.album_id) ?? [];
    tracks.push(track);
    tracksByAlbum.set(track.album_id, tracks);
  }

  const albums: Album[] = [];
  for (const albumRow of albumRows) {
    const artist = artistName(albumRow.artists);
    if (!artist) return null;
    const genre = displayGenreFor(albumRow.id);

    const sourceTracks = tracksByAlbum.get(albumRow.id) ?? [];

    const tracks = sourceTracks.map<Track>((track) => {
      const youtubeVideoId = normalizeYouTubeVideoId(track.youtube_video_id);

      return {
        id: track.id,
        title: track.title,
        artist,
        album: albumRow.title,
        label: albumRow.label,
        year: albumRow.year,
        length: formatDuration(track.duration_seconds),
        genre,
        tags: [],
        definition: track.description || albumRow.description,
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
        ...(track.youtube_start_seconds !== null
          ? { youtubeStartSeconds: track.youtube_start_seconds }
          : {}),
        ...(track.youtube_end_seconds !== null
          ? { youtubeEndSeconds: track.youtube_end_seconds }
          : {}),
      };
    });

    const cover: Track = tracks[0] ?? {
      id: `${albumRow.id}:cover`,
      title: albumRow.title,
      artist,
      album: albumRow.title,
      label: albumRow.label,
      year: albumRow.year,
      length: "0:00",
      genre,
      tags: [],
      definition: albumRow.description,
    };

    albums.push({
      id: albumRow.id,
      title: albumRow.title,
      artist,
      label: albumRow.label,
      year: albumRow.year,
      genre,
      tags: [],
      description: albumRow.description,
      cover,
      tracks,
      runtime: formatDuration(
        sourceTracks.reduce((total, track) => total + track.duration_seconds, 0),
      ),
      ...(albumRow.cover_path ? { coverUrl: coverUrlFor(albumRow.cover_path) } : {}),
    });
  }

  return albums;
}

/**
 * Loads the twelve hand-picked albums for the home tile.
 * Any incomplete configuration or public-read failure returns null so callers
 * can keep rendering their local fallback collection.
 */
export async function fetchFeaturedAlbums(): Promise<Album[] | null> {
  if (!supabase) return null;
  const client = supabase;

  try {
    const { data: albums, error: albumError } = await client
      .from("albums")
      .select("id, title, label, year, description, cover_path, artists(name)")
      .eq("featured", true)
      .order("sort_order", { ascending: true })
      .limit(FEATURED_ALBUM_COUNT);
    if (albumError || !albums) return null;

    const albumRows = albums as DbAlbum[];
    if (albumRows.length === 0) return [];

    const { data: tracks, error: trackError } = await client
      .from("tracks")
      .select(
        "id, album_id, title, duration_seconds, description, youtube_video_id, youtube_start_seconds, youtube_end_seconds",
      )
      .in("album_id", albumRows.map((album) => album.id))
      .order("created_at", { ascending: true });
    if (trackError || !tracks) return null;

    return mapFeaturedAlbums(albumRows, tracks as DbTrack[], (reference) =>
      resolveCoverUrl(reference, (path) =>
        client.storage.from("album-covers").getPublicUrl(path).data.publicUrl,
      ),
    );
  } catch {
    return null;
  }
}
