export type GenreId = "ambient" | "jazz" | "electronic";

export interface GenreTheme {
  bg: string;
  ink: string;
  spine: string;
  phon: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  year: number;
  length: string;
  genre: GenreId;
  tags: string[];
  definition: string;
}
