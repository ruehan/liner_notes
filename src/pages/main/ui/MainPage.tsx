import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlbumCard,
  fetchFeaturedAlbums,
  isHomeTile,
  tileCatalog,
  type Album,
  type Track,
} from "@/entities/track";
import {
  WORLD,
  generateMosaicSpots,
  type Point,
  type MosaicSpot,
} from "@/shared/lib";
import { Wall, type WallHandle } from "@/widgets/wall";
import { Hud } from "@/widgets/hud";
import { Readout } from "@/widgets/readout";
import { DetailSheet, type OpenEntry } from "@/widgets/detail";
import { Boot } from "@/widgets/boot";
import { Catalog, type CatalogEntry } from "@/widgets/catalog";
import { About } from "@/widgets/about";
import { ShuffleButton, pickShuffleIndex } from "@/features/shuffle";
import {
  DEFAULT_PLAYBACK_VOLUME,
  PlayerDock,
  clearPlaybackSession,
  loadPlaybackSession,
  restorePlaybackItem,
  savePlaybackSession,
  stepTrack,
  type PlaybackItem,
} from "@/features/playback";
import { SubmissionSheet } from "@/features/catalog-submission";
import {
  databaseFavKey,
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from "@/features/curation";
import "./main-page.css";

interface HoverEntry {
  album: Album;
  catalog: string;
}

const spotCache = new Map<string, MosaicSpot[]>();
function tileSpots(k: number, m: number, count: number): MosaicSpot[] {
  const key = `${k},${m}:${count}`;
  let spots = spotCache.get(key);
  if (!spots) {
    spots = generateMosaicSpots(count);
    spotCache.set(key, spots);
  }
  return spots;
}

export function MainPage() {
  const [featuredAlbums, setFeaturedAlbums] = useState<Album[] | null>(null);
  const [tiles, setTiles] = useState<Point[]>([{ x: 0, y: 0 }]);
  const [openEntry, setOpenEntry] = useState<OpenEntry | null>(null);
  const [navList, setNavList] = useState<OpenEntry[] | null>(null);
  const [hoverEntry, setHoverEntry] = useState<HoverEntry | null>(null);
  const [hotKey, setHotKey] = useState<string | null>(null);
  const [hintGone, setHintGone] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [playback, setPlayback] = useState<PlaybackItem | null>(null);
  const [initialPlaybackSession] = useState(() => loadPlaybackSession());
  const [playbackRestored, setPlaybackRestored] = useState(
    () => initialPlaybackSession === null,
  );
  const [playbackVolume, setPlaybackVolume] = useState(
    () => initialPlaybackSession?.volume ?? DEFAULT_PLAYBACK_VOLUME,
  );
  const [playbackPosition, setPlaybackPosition] = useState(
    () => initialPlaybackSession?.positionSeconds ?? 0,
  );

  const wallRef = useRef<WallHandle>(null);
  const hotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePlaybackTrackId = useRef<string | null>(null);
  activePlaybackTrackId.current = playback?.track.id ?? null;

  const requestFeaturedAlbums = useCallback(() => fetchFeaturedAlbums(), []);

  const refreshFeaturedAlbums = useCallback(async () => {
    const albums = await requestFeaturedAlbums();
    if (albums) setFeaturedAlbums(albums);
  }, [requestFeaturedAlbums]);

  useEffect(() => {
    let active = true;
    void requestFeaturedAlbums().then((albums) => {
      if (active && albums) setFeaturedAlbums(albums);
    });
    return () => {
      active = false;
    };
  }, [requestFeaturedAlbums]);

  useEffect(() => {
    if (playbackRestored || featuredAlbums === null) return;

    const restored = initialPlaybackSession
      ? restorePlaybackItem(featuredAlbums, initialPlaybackSession)
      : null;
    if (restored) {
      setPlayback(restored);
      setPlaybackPosition(initialPlaybackSession!.positionSeconds);
    } else {
      clearPlaybackSession();
    }
    setPlaybackRestored(true);
  }, [featuredAlbums, initialPlaybackSession, playbackRestored]);

  useEffect(() => {
    if (!playbackRestored) return;
    if (!playback) {
      clearPlaybackSession();
      return;
    }

    savePlaybackSession({
      albumId: playback.album.id,
      trackId: playback.track.id,
      positionSeconds: playbackPosition,
      volume: playbackVolume,
    });
  }, [playback, playbackPosition, playbackRestored, playbackVolume]);

  useEffect(() => {
    const t = setTimeout(() => setHintGone(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const hideHint = useCallback(() => setHintGone(true), []);
  const bootDone = useCallback(() => {}, []);
  const onTilesChange = useCallback((next: Point[]) => setTiles(next), []);

  const handleToggleFavorite = useCallback((key: string) => {
    setFavorites((prev) => {
      const next = toggleFavorite(prev, key);
      saveFavorites(next);
      return next;
    });
  }, []);

  const homeAlbums = useMemo(() => featuredAlbums ?? [], [featuredAlbums]);
  const albumsAt = useCallback(
    (k: number, m: number) => (isHomeTile(k, m) ? homeAlbums : []),
    [homeAlbums],
  );
  const favoriteKeyFor = useCallback((album: Album) => databaseFavKey(album.id), []);

  const catalogEntries = useMemo<CatalogEntry[]>(() => {
    const list: CatalogEntry[] = [];
    homeAlbums.forEach((album, i) => {
      const key = favoriteKeyFor(album);
      list.push({ album, catalog: tileCatalog(0, 0, i), k: 0, m: 0, i, favoriteKey: key });
    });
    return list;
  }, [favoriteKeyFor, homeAlbums]);

  const openFromCatalog = useCallback(
    (entry: CatalogEntry, list: CatalogEntry[]) => {
      const nav: OpenEntry[] = list.map((e) => ({
        album: e.album,
        catalog: e.catalog,
        favoriteKey: e.favoriteKey,
      }));
      setNavList(nav);
      setOpenEntry({
        album: entry.album,
        catalog: entry.catalog,
        favoriteKey: entry.favoriteKey,
      });
      setCatalogOpen(false);
    },
    [],
  );

  const stepNav = useCallback(
    (dir: -1 | 1) => {
      setOpenEntry((cur) => {
        if (!cur || !navList) return cur;
        const idx = navList.findIndex((e) => e.catalog === cur.catalog);
        if (idx < 0) return cur;
        const next = idx + dir;
        if (next < 0 || next >= navList.length) return cur;
        return navList[next];
      });
    },
    [navList],
  );

  const navPos = useMemo(() => {
    if (!openEntry || !navList || navList.length <= 1) return null;
    const idx = navList.findIndex((e) => e.catalog === openEntry.catalog);
    if (idx < 0) return null;
    return { index: idx, total: navList.length };
  }, [openEntry, navList]);

  const closeDetail = useCallback(() => {
    setOpenEntry(null);
    setNavList(null);
  }, []);

  const startPlayback = useCallback((album: Album, track: Track) => {
    setPlayback({ album, track });
    setPlaybackPosition(0);
  }, []);

  const stopPlayback = useCallback(() => {
    setPlayback(null);
    setPlaybackPosition(0);
  }, []);

  const recordPlaybackProgress = useCallback((trackId: string, seconds: number) => {
    if (activePlaybackTrackId.current === trackId) setPlaybackPosition(seconds);
  }, []);

  const playPreviousTrack = useCallback(() => {
    setPlaybackPosition(0);
    setPlayback((current) => {
      if (!current) return null;
      const track = stepTrack(current, -1);
      return track ? { ...current, track } : current;
    });
  }, []);

  const playNextTrack = useCallback(() => {
    setPlaybackPosition(0);
    setPlayback((current) => {
      if (!current) return null;
      const track = stepTrack(current, 1);
      return track ? { ...current, track } : current;
    });
  }, []);

  const canPlayPrevious = playback ? Boolean(stepTrack(playback, -1)) : false;
  const canPlayNext = playback ? Boolean(stepTrack(playback, 1)) : false;

  const shuffle = useCallback(() => {
    if (openEntry) return;
    const seen = new Set<string>();
    const candidates: Array<{ k: number; m: number; i: number }> = [];
    for (const o of tiles) {
      for (let dk = -1; dk <= 1; dk++) {
        for (let dm = -1; dm <= 1; dm++) {
          const k = o.x / WORLD.width + dk;
          const m = o.y / WORLD.height + dm;
          const key = `${k},${m}`;
          if (seen.has(key)) continue;
          seen.add(key);
          albumsAt(k, m).forEach((_album, i) => candidates.push({ k, m, i }));
        }
      }
    }
    const idx = pickShuffleIndex(candidates.map((_, j) => j));
    if (idx === null) return;
    const c = candidates[idx];
    const albums = albumsAt(c.k, c.m);
    const spots = tileSpots(c.k, c.m, albums.length);
    const album = albums[c.i];
    const key = `${c.k},${c.m},${c.i}`;

    setHotKey(key);
    if (hotTimer.current) clearTimeout(hotTimer.current);
    hotTimer.current = setTimeout(() => setHotKey(null), 1600);
    setHoverEntry({ album, catalog: tileCatalog(c.k, c.m, c.i) });
    wallRef.current?.jumpTo({
      x: c.k * WORLD.width + spots[c.i].x + spots[c.i].width / 2,
      y: c.m * WORLD.height + spots[c.i].y + spots[c.i].height / 2,
    });
  }, [tiles, openEntry, albumsAt]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "Escape") {
        if (submissionOpen) setSubmissionOpen(false);
        else if (catalogOpen) setCatalogOpen(false);
        else if (aboutOpen) setAboutOpen(false);
        else if (openEntry) closeDetail();
      }
      if ((e.key === "r" || e.key === "R") && !openEntry && !catalogOpen && !aboutOpen && !submissionOpen) {
        shuffle();
      }
      if ((e.key === "i" || e.key === "I") && !openEntry && !catalogOpen && !aboutOpen && !submissionOpen) {
        setCatalogOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shuffle, openEntry, catalogOpen, aboutOpen, submissionOpen, closeDetail]);

  const renderTile = useCallback(
    (k: number, m: number) => {
      const albums = albumsAt(k, m);
      const spots = tileSpots(k, m, albums.length);
      return albums.map((album, i) => {
        const catalog = tileCatalog(k, m, i);
        const key = `${k},${m},${i}`;
        const fvKey = favoriteKeyFor(album);
        return (
          <AlbumCard
            key={album.id}
            album={album}
            ordinal={i + 1}
            hot={hotKey === key}
            favorited={favorites.includes(fvKey)}
            style={{
              left: spots[i].x,
              top: spots[i].y,
              width: spots[i].width,
              height: spots[i].height,
            }}
            onOpen={() => {
              const nav: OpenEntry[] = albums.map((item, j) => ({
                album: item,
                catalog: tileCatalog(k, m, j),
                favoriteKey: favoriteKeyFor(item),
              }));
              setNavList(nav);
              setOpenEntry({
                album,
                catalog,
                favoriteKey: fvKey,
              });
            }}
            onEnter={() => setHoverEntry({ album, catalog })}
            onLeave={() => setHoverEntry(null)}
            onToggleFavorite={() => handleToggleFavorite(fvKey)}
          />
        );
      });
    },
    [albumsAt, favoriteKeyFor, hotKey, favorites, handleToggleFavorite],
  );

  return (
    <div className="main-page">
      <Wall
        ref={wallRef}
        renderTile={renderTile}
        onTilesChange={onTilesChange}
        onInteract={hideHint}
      />

      <Hud
        catalogCount={catalogEntries.length}
        onCatalog={() => setCatalogOpen(true)}
        onAbout={() => setAboutOpen(true)}
        onSubmit={() => setSubmissionOpen(true)}
      />

      <Readout
        album={openEntry ? null : hoverEntry?.album ?? null}
        catalog={openEntry ? null : hoverEntry?.catalog ?? null}
      />
      <ShuffleButton onShuffle={shuffle} />

      <div className={`main-page__hint${hintGone ? " is-gone" : ""}`}>
        드래그해서 벽을 탐색하세요 — 끝이 없습니다
      </div>
      <div className="main-page__vignette" aria-hidden="true" />

      <Catalog
        open={catalogOpen}
        entries={catalogEntries}
        onClose={() => setCatalogOpen(false)}
        onOpenEntry={openFromCatalog}
      />
      <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SubmissionSheet
        open={submissionOpen}
        onClose={() => setSubmissionOpen(false)}
        onSubmitted={refreshFeaturedAlbums}
      />
      <DetailSheet
        entry={openEntry}
        favorited={openEntry ? favorites.includes(openEntry.favoriteKey) : false}
        navPos={navPos}
        onClose={closeDetail}
        onToggleFavorite={
          openEntry ? () => handleToggleFavorite(openEntry.favoriteKey) : undefined
        }
        onPrev={() => stepNav(-1)}
        onNext={() => stepNav(1)}
        playingTrackId={
          playback && openEntry && playback.album.id === openEntry.album.id
            ? playback.track.id
            : null
        }
        onPlayTrack={
          openEntry
            ? (track) => startPlayback(openEntry.album, track)
            : undefined
        }
      />
      <PlayerDock
        item={playback}
        canPrev={canPlayPrevious}
        canNext={canPlayNext}
        volume={playbackVolume}
        resumeSeconds={playbackPosition}
        onClose={stopPlayback}
        onPrev={playPreviousTrack}
        onNext={playNextTrack}
        onVolumeChange={setPlaybackVolume}
        onProgress={recordPlaybackProgress}
      />
      <Boot onDone={bootDone} />
    </div>
  );
}
