export type GenreId = "ambient" | "jazz" | "electronic";

export interface GenreTheme {
  bg: string;
  ink: string;
  phon: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  label: string;
  year: number;
  length: string;
  genre: GenreId;
  tags: string[];
  definition: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  label: string;
  year: number;
  genre: GenreId;
  tags: string[];
  description: string;
  cover: Track;
  tracks: Track[];
  runtime: string;
}
