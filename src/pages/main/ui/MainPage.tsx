import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlbumCard,
  generateTileAlbums,
  tileCatalog,
  type Album,
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
import {
  FilterTabs,
  isVisible,
  type FilterId,
} from "@/features/track-filter";
import { ShuffleButton, pickShuffleIndex } from "@/features/shuffle";
import { favKey, loadFavorites, parseFavKey, saveFavorites, toggleFavorite } from "@/features/curation";
import "./main-page.css";

interface HoverEntry {
  album: Album;
  catalog: string;
}

const spotCache = new Map<string, MosaicSpot[]>();
const SESSION_SEED_MAX = 2_147_483_647;

function createSessionSeed(): number {
  return Math.floor(Math.random() * SESSION_SEED_MAX);
}

function tileSpots(k: number, m: number, sessionSeed: number): MosaicSpot[] {
  const key = `${sessionSeed}:${k},${m}`;
  let spots = spotCache.get(key);
  if (!spots) {
    const albums = generateTileAlbums(k, m, sessionSeed);
    spots = generateMosaicSpots(albums.length);
    spotCache.set(key, spots);
  }
  return spots;
}

export function MainPage() {
  const [sessionSeed] = useState(createSessionSeed);
  const [tiles, setTiles] = useState<Point[]>([{ x: 0, y: 0 }]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [openEntry, setOpenEntry] = useState<OpenEntry | null>(null);
  const [navList, setNavList] = useState<OpenEntry[] | null>(null);
  const [hoverEntry, setHoverEntry] = useState<HoverEntry | null>(null);
  const [hotKey, setHotKey] = useState<string | null>(null);
  const [hintGone, setHintGone] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());

  const wallRef = useRef<WallHandle>(null);
  const hotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const counts = useMemo(() => {
    const c: Record<FilterId, number> = {
      all: 0,
      ambient: 0,
      jazz: 0,
      electronic: 0,
    };
    for (const o of tiles) {
      const k = o.x / WORLD.width;
      const m = o.y / WORLD.height;
      for (const album of generateTileAlbums(k, m, sessionSeed)) {
        c.all += 1;
        c[album.genre] += 1;
      }
    }
    return c;
  }, [tiles, sessionSeed]);

  const catalogEntries = useMemo<CatalogEntry[]>(() => {
    const list: CatalogEntry[] = [];
    const seen = new Set<string>();
    generateTileAlbums(0, 0, sessionSeed).forEach((album, i) => {
      const key = favKey(0, 0, i, sessionSeed);
      list.push({ album, catalog: tileCatalog(0, 0, i), ordinal: i + 1, k: 0, m: 0, i, favoriteKey: key });
      seen.add(key);
    });
    for (const raw of favorites) {
      if (seen.has(raw)) continue;
      const ref = parseFavKey(raw);
      if (!ref) continue;
      const albums = generateTileAlbums(ref.k, ref.m, ref.sessionSeed);
      if (ref.i < 0 || ref.i >= albums.length) continue;
      list.push({
        album: albums[ref.i],
        catalog: tileCatalog(ref.k, ref.m, ref.i),
        ordinal: ref.i + 1,
        k: ref.k,
        m: ref.m,
        i: ref.i,
        favoriteKey: raw,
      });
      seen.add(raw);
    }
    return list;
  }, [favorites, sessionSeed]);

  const openFromCatalog = useCallback(
    (entry: CatalogEntry, list: CatalogEntry[]) => {
      const nav: OpenEntry[] = list.map((e) => ({
        album: e.album,
        catalog: e.catalog,
        ordinal: e.ordinal,
        favoriteKey: e.favoriteKey,
      }));
      setNavList(nav);
      setOpenEntry({
        album: entry.album,
        catalog: entry.catalog,
        ordinal: entry.ordinal,
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
          generateTileAlbums(k, m, sessionSeed).forEach((album, i) => {
            if (isVisible(album, filter)) candidates.push({ k, m, i });
          });
        }
      }
    }
    const idx = pickShuffleIndex(candidates.map((_, j) => j));
    if (idx === null) return;
    const c = candidates[idx];
    const albums = generateTileAlbums(c.k, c.m, sessionSeed);
    const spots = tileSpots(c.k, c.m, sessionSeed);
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
  }, [tiles, filter, openEntry, sessionSeed]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "Escape") {
        if (catalogOpen) setCatalogOpen(false);
        else if (aboutOpen) setAboutOpen(false);
        else if (openEntry) closeDetail();
      }
      if ((e.key === "r" || e.key === "R") && !openEntry && !catalogOpen && !aboutOpen) {
        shuffle();
      }
      if ((e.key === "i" || e.key === "I") && !openEntry && !catalogOpen && !aboutOpen) {
        setCatalogOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shuffle, openEntry, catalogOpen, aboutOpen, closeDetail]);

  const renderTile = useCallback(
    (k: number, m: number) => {
      const albums = generateTileAlbums(k, m, sessionSeed);
      const spots = tileSpots(k, m, sessionSeed);
      return albums.map((album, i) => {
        const catalog = tileCatalog(k, m, i);
        const key = `${k},${m},${i}`;
        const fvKey = favKey(k, m, i, sessionSeed);
        return (
          <AlbumCard
            key={album.id}
            album={album}
            catalog={catalog}
            ordinal={i + 1}
            hidden={!isVisible(album, filter)}
            hot={hotKey === key}
            favorited={favorites.includes(fvKey)}
            style={{
              left: spots[i].x,
              top: spots[i].y,
              width: spots[i].width,
              height: spots[i].height,
            }}
            onOpen={() => {
              const nav: OpenEntry[] = albums
                .map((item, j) => ({
                  album: item,
                  catalog: tileCatalog(k, m, j),
                  ordinal: j + 1,
                  favoriteKey: favKey(k, m, j, sessionSeed),
                }))
                .filter((entry) => isVisible(entry.album, filter));
              setNavList(nav);
              setOpenEntry({
                album,
                catalog,
                ordinal: i + 1,
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
    [filter, hotKey, favorites, handleToggleFavorite, sessionSeed],
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
        filters={
          <FilterTabs value={filter} counts={counts} onChange={setFilter} />
        }
        catalogCount={catalogEntries.length}
        onCatalog={() => setCatalogOpen(true)}
        onAbout={() => setAboutOpen(true)}
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
      />
      <Boot onDone={bootDone} />
    </div>
  );
}
