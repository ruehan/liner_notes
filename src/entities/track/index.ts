import type { Album, GenreId, GenreTheme, Track } from "./model/types";
import { GENRES, GENRE_ORDER, TRACKS, catalogNo } from "./model/data";
import {
  generateTileTracks,
  generateTileAlbums,
  tileCatalog,
  isHomeTile,
} from "./model/generator";
import { AlbumCard } from "./ui/TrackCard";
import { CoverArt } from "./ui/CoverArt";

export type { Album, GenreId, GenreTheme, Track };
export {
  GENRES,
  GENRE_ORDER,
  TRACKS,
  catalogNo,
  generateTileTracks,
  generateTileAlbums,
  tileCatalog,
  isHomeTile,
  AlbumCard,
  CoverArt,
};
