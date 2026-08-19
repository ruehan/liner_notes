import { useEffect, useRef, useState } from "react";
import { GENRES, catalogNo, CoverArt, type Track } from "@/entities/track";
import "./detail.css";

interface Props {
  track: Track | null;
  entryNo: number;
  onClose: () => void;
}

export function DetailSheet({ track, entryNo, onClose }: Props) {
  const [shown, setShown] = useState<Track | null>(null);
  const [entry, setEntry] = useState(0);
  const [open, setOpen] = useState(false);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (track) {
      if (closing.current) clearTimeout(closing.current);
      setShown(track);
      setEntry(entryNo);
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
  }, [track, entryNo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;

  const theme = GENRES[shown.genre];

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
          <span>{catalogNo(entry)}</span>
          <span>filed {shown.year}</span>
        </div>

        <section
          className="detail__card"
          role="dialog"
          aria-modal="true"
          aria-label={`${shown.title} 상세`}
        >
          <div className="detail__body">
            <p className="detail__head">
              entry no.{String(entry + 1).padStart(2, "0")}
              <span className="detail__head-tape" style={{ background: theme.bg, color: theme.ink }}>
                {shown.genre}
              </span>
            </p>
            <h1 className="detail__title">{shown.title}</h1>
            <p className="detail__artist">{shown.artist}</p>
            <p className="detail__phon">{theme.phon}</p>
            <p className="detail__def">
              <b>n.</b>
              <span>{shown.definition}</span>
            </p>
            <div className="detail__tags">
              {shown.tags.map((t, i) => (
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
                <dd>{shown.album}</dd>
              </div>
              <div>
                <dt>label</dt>
                <dd>{shown.label}</dd>
              </div>
              <div>
                <dt>year</dt>
                <dd>{shown.year}</dd>
              </div>
              <div>
                <dt>length</dt>
                <dd>{shown.length}</dd>
              </div>
            </dl>
            <button type="button" className="detail__play" title="곧 구현">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 1.5v9L10.5 6z" fill="currentColor" />
              </svg>
              미리듣기
            </button>
          </div>

          <div className="detail__art">
            <div className="detail__frame detail__frame--back" aria-hidden="true">
              <CoverArt track={shown} />
            </div>
            <div className="detail__frame">
              <CoverArt track={shown} />
            </div>
            <span className="detail__frame-no">{catalogNo(entry)}</span>
          </div>

          <div className="detail__entry-no" aria-hidden="true">
            {String(entry + 1).padStart(2, "0")}
          </div>
        </section>
      </div>
    </div>
  );
}
