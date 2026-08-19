import { useEffect, useMemo, useState } from "react";
import { CoverArt, type Album } from "@/entities/track";
import { filterByQuery } from "../model/search";
import "./catalog.css";

export interface CatalogEntry {
  album: Album;
  catalog: string;
  ordinal: number;
  k: number;
  m: number;
  i: number;
  favoriteKey: string;
}

interface Props {
  open: boolean;
  entries: CatalogEntry[];
  onClose: () => void;
  onOpenEntry: (entry: CatalogEntry, list: CatalogEntry[]) => void;
}

export function Catalog({ open, entries, onClose, onOpenEntry }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      filterByQuery(entries, query, (e) => [
        e.album.title,
        e.album.artist,
        ...e.album.tracks.map((track) => track.title),
        e.catalog,
      ]),
    [entries, query],
  );

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;

  const playAll = () => {
    if (filtered.length > 0) onOpenEntry(filtered[0], filtered);
  };

  return (
    <div className="catalog" role="dialog" aria-modal="true" aria-label="카탈로그 인덱스">
      <header className="catalog__bar">
        <span className="catalog__count">
          {String(filtered.length).padStart(2, "0")} records
        </span>
        <input
          className="catalog__search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="앨범 · 아티스트 · 수록곡 · 카탈로그 번호"
          aria-label="카탈로그 검색"
        />
        <button
          type="button"
          className="catalog__play"
          onClick={playAll}
          disabled={filtered.length === 0}
        >
          ▶ 순서대로 듣기
        </button>
        <button
          type="button"
          className="catalog__close"
          onClick={onClose}
          aria-label="닫기 (Escape)"
        >
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="M8 8L32 32M32 8L8 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className="catalog__scroll">
        {filtered.map((e, idx) => (
          <div className="catalog__slide" key={e.catalog}>
            <span className="catalog__slide-no" aria-hidden="true">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              className="catalog__slide-main"
              onClick={() => onOpenEntry(e, filtered)}
            >
              <span className="catalog__slide-cat">{e.catalog}</span>
              <span className="catalog__slide-title">{e.album.title}</span>
              <span className="catalog__slide-meta">
                {e.album.artist} · {e.album.tracks.length} tracks · {e.album.year}
              </span>
            </button>
            <span className="catalog__slide-art" aria-hidden="true">
              <CoverArt track={e.album.cover} />
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="catalog__empty">일치하는 기록이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
