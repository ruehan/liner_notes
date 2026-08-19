import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TrackCard,
  generateTileTracks,
  tileCatalog,
  type Track,
} from "@/entities/track";
import { hashKey } from "@/entities/track/model/generator";
import {
  CELL_SIZE,
  WORLD,
  generateSpots,
  type Point,
  type Spot,
} from "@/shared/lib";
import { Wall, type WallHandle } from "@/widgets/wall";
import { Hud } from "@/widgets/hud";
import { Readout } from "@/widgets/readout";
import { DetailSheet, type OpenEntry } from "@/widgets/detail";
import { Boot } from "@/widgets/boot";
import {
  FilterTabs,
  isVisible,
  type FilterId,
} from "@/features/track-filter";
import { ShuffleButton, pickShuffleIndex } from "@/features/shuffle";
import "./main-page.css";

interface HoverEntry {
  track: Track;
  catalog: string;
}

const spotCache = new Map<string, Spot[]>();

function tileSpots(k: number, m: number): Spot[] {
  const key = `${k},${m}`;
  let spots = spotCache.get(key);
  if (!spots) {
    const tracks = generateTileTracks(k, m);
    spots = generateSpots(tracks.length, hashKey(`spots:${key}`));
    spotCache.set(key, spots);
  }
  return spots;
}

export function MainPage() {
  const [tiles, setTiles] = useState<Point[]>([{ x: 0, y: 0 }]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [openEntry, setOpenEntry] = useState<OpenEntry | null>(null);
  const [hoverEntry, setHoverEntry] = useState<HoverEntry | null>(null);
  const [hotKey, setHotKey] = useState<string | null>(null);
  const [hintGone, setHintGone] = useState(false);

  const wallRef = useRef<WallHandle>(null);
  const hotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setHintGone(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const hideHint = useCallback(() => setHintGone(true), []);
  const bootDone = useCallback(() => {}, []);
  const onTilesChange = useCallback((next: Point[]) => setTiles(next), []);

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
      for (const t of generateTileTracks(k, m)) {
        c.all += 1;
        c[t.genre] += 1;
      }
    }
    return c;
  }, [tiles]);

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
          generateTileTracks(k, m).forEach((t, i) => {
            if (isVisible(t, filter)) candidates.push({ k, m, i });
          });
        }
      }
    }
    const idx = pickShuffleIndex(candidates.map((_, j) => j));
    if (idx === null) return;
    const c = candidates[idx];
    const tracks = generateTileTracks(c.k, c.m);
    const spots = tileSpots(c.k, c.m);
    const track = tracks[c.i];
    const key = `${c.k},${c.m},${c.i}`;

    setHotKey(key);
    if (hotTimer.current) clearTimeout(hotTimer.current);
    hotTimer.current = setTimeout(() => setHotKey(null), 1600);
    setHoverEntry({ track, catalog: tileCatalog(c.k, c.m, c.i) });
    wallRef.current?.jumpTo({
      x: c.k * WORLD.width + spots[c.i].x + CELL_SIZE / 2,
      y: c.m * WORLD.height + spots[c.i].y + CELL_SIZE / 2,
    });
  }, [tiles, filter, openEntry]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenEntry(null);
      if (e.key === "r" || e.key === "R") shuffle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shuffle]);

  const renderTile = useCallback(
    (k: number, m: number) => {
      const tracks = generateTileTracks(k, m);
      const spots = tileSpots(k, m);
      return tracks.map((track, i) => {
        const catalog = tileCatalog(k, m, i);
        const key = `${k},${m},${i}`;
        return (
          <TrackCard
            key={track.id}
            track={track}
            catalog={catalog}
            ordinal={i + 1}
            hidden={!isVisible(track, filter)}
            hot={hotKey === key}
            style={{
              left: spots[i].x,
              top: spots[i].y,
              transform: `rotate(${spots[i].rot}deg)`,
            }}
            onOpen={() =>
              setOpenEntry({ track, catalog, ordinal: i + 1 })
            }
            onEnter={() => setHoverEntry({ track, catalog })}
            onLeave={() => setHoverEntry(null)}
          />
        );
      });
    },
    [filter, hotKey],
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
        onAbout={() => window.alert("about — 선곡 기준과 소개가 들어가는 자리.")}
      />

      <Readout
        track={openEntry ? null : hoverEntry?.track ?? null}
        catalog={openEntry ? null : hoverEntry?.catalog ?? null}
      />
      <ShuffleButton onShuffle={shuffle} />

      <div className={`main-page__hint${hintGone ? " is-gone" : ""}`}>
        드래그해서 벽을 탐색하세요 — 끝이 없습니다
      </div>
      <div className="main-page__vignette" aria-hidden="true" />

      <DetailSheet entry={openEntry} onClose={() => setOpenEntry(null)} />
      <Boot onDone={bootDone} />
    </div>
  );
}
