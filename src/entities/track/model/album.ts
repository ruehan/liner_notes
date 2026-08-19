import { createRng } from "@/shared/lib";
import type { Album, GenreId, Track } from "./types";

const TRACKLIST_TITLES: Record<GenreId, string[]> = {
  ambient: ["Arrival", "Still Air", "Passing Light", "Afterimage", "Night Window", "Return"],
  jazz: ["First Set", "Slow Turn", "Blue Room", "Interlude", "Last Call", "Encore"],
  electronic: ["Signal In", "Phase Shift", "Pattern Memory", "Drift Code", "Low Voltage", "Signal Out"],
};

function hashId(id: string): number {
  let hash = 7;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) % 2_147_483_647;
  }
  return hash;
}

function seconds(length: string): number {
  return length
    .split(":")
    .map(Number)
    .reduce((total, value) => total * 60 + value, 0);
}

function duration(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function companionTrack(lead: Track, index: number, rng: () => number): Track {
  const names = TRACKLIST_TITLES[lead.genre];
  const title = names[(index + Math.floor(rng() * names.length)) % names.length];
  const lengthSeconds = 150 + Math.floor(rng() * 420);

  return {
    ...lead,
    id: `${lead.id}:track:${index + 1}`,
    title,
    length: duration(lengthSeconds),
    tags: [...lead.tags],
    definition: `${lead.definition} 이 앨범의 ${index + 1}번 기록.`,
  };
}

export function albumFromTrack(lead: Track): Album {
  const rng = createRng(hashId(lead.id));
  const trackCount = 4 + Math.floor(rng() * 4);
  const tracks = [lead];
  for (let index = 1; index < trackCount; index++) {
    tracks.push(companionTrack(lead, index, rng));
  }

  return {
    id: `album:${lead.id}`,
    title: lead.album,
    artist: lead.artist,
    label: lead.label,
    year: lead.year,
    genre: lead.genre,
    tags: [...lead.tags],
    description: lead.definition,
    cover: lead,
    tracks,
    runtime: duration(tracks.reduce((total, track) => total + seconds(track.length), 0)),
  };
}

export function albumsFromTracks(tracks: Track[]): Album[] {
  return tracks.map(albumFromTrack);
}
