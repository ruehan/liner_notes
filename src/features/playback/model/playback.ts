import { normalizeYouTubeVideoId, type Album, type Track } from "@/entities/track";

export interface PlaybackItem {
  album: Album;
  track: Track;
}

export function playableTracks(album: Album): Track[] {
  return album.tracks.filter((track) => normalizeYouTubeVideoId(track.youtubeVideoId));
}

export function stepTrack(
  item: PlaybackItem,
  direction: -1 | 1,
): Track | null {
  const tracks = playableTracks(item.album);
  const currentIndex = tracks.findIndex((track) => track.id === item.track.id);
  const nextIndex = currentIndex + direction;
  return tracks[nextIndex] ?? null;
}
