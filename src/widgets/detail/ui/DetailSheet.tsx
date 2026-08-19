import { useEffect, useRef, useState } from "react";
import { GENRES, CoverArt, type Track } from "@/entities/track";
import "./detail.css";

export interface OpenEntry {
  track: Track;
  catalog: string;
  ordinal: number;
}

interface Props {
  entry: OpenEntry | null;
  favorited?: boolean;
  navPos?: { index: number; total: number } | null;
  onClose: () => void;
  onToggleFavorite?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function DetailSheet({
  entry,
  favorited = false,
  navPos = null,
  onClose,
  onToggleFavorite,
  onPrev,
  onNext,
}: Props) {
  const [shown, setShown] = useState<OpenEntry | null>(null);
  const [open, setOpen] = useState(false);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (entry) {
      if (closing.current) clearTimeout(closing.current);
      setShown(entry);
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setOpen(true)),
      );
      return () => cancelAnimationFrame(raf);
    }
    if (shown) {
      setOpen(false);
      closing.current = setTimeout(() => setShown(null), 420);
      return () => {
        if (closing.current) clearTimeout(closing.current);
      };
    }
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;

  const { track, catalog, ordinal } = shown;
  const theme = GENRES[track.genre];

  return (
    <div className={`detail${open ? " is-open" : ""}`}>
      <div className="detail__scrim" onClick={onClose} />
      <div className="detail__ground">
        <button
          type="button"
          className="detail__close"
          aria-label="닫기 (Escape)"
          onClick={onClose}
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

        <div className="detail__stamp" aria-hidden="true">
          <span>{catalog}</span>
          <span>filed {track.year}</span>
        </div>

        <section
          className="detail__card"
          role="dialog"
          aria-modal="true"
          aria-label={`${track.title} 상세`}
        >
          <div className="detail__body">
            <p className="detail__head">
              entry no.{String(ordinal).padStart(2, "0")}
              <span
                className="detail__head-tape"
                style={{ background: theme.bg, color: theme.ink }}
              >
                {track.genre}
              </span>
            </p>
            <h1 className="detail__title">{track.title}</h1>
            <p className="detail__artist">{track.artist}</p>
            <p className="detail__phon">{theme.phon}</p>
            <p className="detail__def">
              <b>n.</b>
              <span>{track.definition}</span>
            </p>
            <div className="detail__tags">
              {track.tags.map((t, i) => (
                <span
                  key={t}
                  className="detail__tag"
                  style={{ transform: `rotate(${i % 2 ? 1.2 : -1.4}deg)` }}
                >
                  {t}
                </span>
              ))}
            </div>
            <dl className="detail__meta">
              <div>
                <dt>album</dt>
                <dd>{track.album}</dd>
              </div>
              <div>
                <dt>label</dt>
                <dd>{track.label}</dd>
              </div>
              <div>
                <dt>year</dt>
                <dd>{track.year}</dd>
              </div>
              <div>
                <dt>length</dt>
                <dd>{track.length}</dd>
              </div>
            </dl>
            <div className="detail__actions">
              <button type="button" className="detail__play" title="곧 구현">
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 1.5v9L10.5 6z" fill="currentColor" />
                </svg>
                미리듣기
              </button>
              {onToggleFavorite && (
                <button
                  type="button"
                  className={`detail__fav${favorited ? " is-on" : ""}`}
                  aria-pressed={favorited}
                  onClick={onToggleFavorite}
                >
                  {favorited ? "♥ 수집됨" : "♡ 수집"}
                </button>
              )}
            </div>
            {navPos && navPos.total > 1 && (
              <div className="detail__nav">
                <button
                  type="button"
                  disabled={navPos.index === 0}
                  onClick={onPrev}
                >
                  ← prev
                </button>
                <span>
                  {String(navPos.index + 1).padStart(2, "0")} /{" "}
                  {String(navPos.total).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  disabled={navPos.index === navPos.total - 1}
                  onClick={onNext}
                >
                  next →
                </button>
              </div>
            )}
          </div>

          <div className="detail__art">
            <div className="detail__frame detail__frame--back" aria-hidden="true">
              <CoverArt track={track} />
            </div>
            <div className="detail__frame">
              <CoverArt track={track} />
            </div>
            <span className="detail__frame-no">{catalog}</span>
          </div>

          <div className="detail__entry-no" aria-hidden="true">
            {String(ordinal).padStart(2, "0")}
          </div>
        </section>
      </div>
    </div>
  );
}
