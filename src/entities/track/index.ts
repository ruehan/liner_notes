import type { Album, GenreId, GenreTheme, Track } from "./model/types";
import { GENRES, GENRE_ORDER, TRACKS, catalogNo } from "./model/data";
import {
  generateTileTracks,
  generateTileAlbums,
  tileCatalog,
  isHomeTile,
} from "./model/generator";
import { fetchFeaturedAlbums } from "./api/featured-albums";
import { normalizeYouTubeVideoId } from "./lib/normalize-youtube-video-id";
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
  fetchFeaturedAlbums,
  normalizeYouTubeVideoId,
  AlbumCard,
  CoverArt,
};
