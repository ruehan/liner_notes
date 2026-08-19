import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRACKS, TrackCard } from "@/entities/track";
import {
  CELL_SIZE,
  generateSpots,
  type Point,
} from "@/shared/lib";
import { Wall, type WallHandle } from "@/widgets/wall";
import { Hud } from "@/widgets/hud";
import { Readout } from "@/widgets/readout";
import { DetailSheet } from "@/widgets/detail";
import { Boot } from "@/widgets/boot";
import {
  FilterTabs,
  filterCounts,
  isVisible,
  visibleIndices,
  type FilterId,
} from "@/features/track-filter";
import { ShuffleButton, pickShuffleIndex } from "@/features/shuffle";
import "./main-page.css";

const LAYOUT_SEED = 7;

export function MainPage() {
  const spots = useMemo(() => generateSpots(TRACKS.length, LAYOUT_SEED), []);
  const counts = useMemo(() => filterCounts(TRACKS), []);

  const [filter, setFilter] = useState<FilterId>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hotIndex, setHotIndex] = useState<number | null>(null);
  const [hintGone, setHintGone] = useState(false);

  const wallRef = useRef<WallHandle>(null);
  const hotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setHintGone(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const hideHint = useCallback(() => setHintGone(true), []);
  const bootDone = useCallback(() => {}, []);

  const shuffle = useCallback(() => {
    if (openIndex !== null) return;
    const pick = pickShuffleIndex(visibleIndices(TRACKS, filter));
    if (pick === null) return;
    const target: Point = {
      x: spots[pick].x + CELL_SIZE / 2,
      y: spots[pick].y + CELL_SIZE / 2,
    };
    wallRef.current?.jumpTo(target);
    setHoverIndex(pick);
    setHotIndex(pick);
    if (hotTimer.current) clearTimeout(hotTimer.current);
    hotTimer.current = setTimeout(() => setHotIndex(null), 1600);
  }, [filter, openIndex, spots]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "r" || e.key === "R") shuffle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shuffle]);

  const hoveredTrack =
    openIndex === null && hoverIndex !== null ? TRACKS[hoverIndex] : null;

  return (
    <div className="main-page">
      <Wall ref={wallRef} onInteract={hideHint}>
        {TRACKS.map((track, i) => (
          <TrackCard
            key={track.id}
            track={track}
            index={i}
            hidden={!isVisible(track, filter)}
            hot={hotIndex === i}
            style={{
              left: spots[i].x,
              top: spots[i].y,
              transform: `rotate(${spots[i].rot}deg)`,
            }}
            onOpen={setOpenIndex}
            onHover={setHoverIndex}
          />
        ))}
      </Wall>

      <Hud
        filters={
          <FilterTabs value={filter} counts={counts} onChange={setFilter} />
        }
        onAbout={() => window.alert("about — 선곡 기준과 소개가 들어가는 자리.")}
      />

      <Readout track={hoveredTrack} />
      <ShuffleButton onShuffle={shuffle} />

      <div className={`main-page__hint${hintGone ? " is-gone" : ""}`}>
        드래그해서 벽을 탐색하세요
      </div>
      <div className="main-page__vignette" aria-hidden="true" />

      <DetailSheet
        track={openIndex !== null ? TRACKS[openIndex] : null}
        entryNo={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
      <Boot onDone={bootDone} />
    </div>
  );
}
