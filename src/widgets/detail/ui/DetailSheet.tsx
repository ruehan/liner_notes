import { useEffect, useRef, useState } from "react";
import { GENRES, type Track } from "@/entities/track";
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
  const phonArtist = `/${shown.artist.toLowerCase()}/ · genre ${theme.phon}`;

  return (
    <div className={`detail${open ? " is-open" : ""}`}>
      <div className="detail__scrim" onClick={onClose} />
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
      <div
        className="detail__ground"
        style={{ background: theme.bg, color: theme.ink }}
      >
        <section
          className="detail__card"
          role="dialog"
          aria-modal="true"
          aria-label={`${shown.title} 상세`}
        >
          <div className="detail__body">
            <p className="detail__head">
              entry no.{String(entry + 1).padStart(2, "0")} — {shown.genre}
            </p>
            <h1 className="detail__title">{shown.title}</h1>
            <p className="detail__artist">{shown.artist}</p>
            <p className="detail__phon">{phonArtist}</p>
            <p className="detail__def">
              <b>n.</b>
              <span>{shown.definition}</span>
            </p>
            <div className="detail__tags">
              {shown.tags.map((t) => (
                <span key={t} className="detail__tag">
                  {t}
                </span>
              ))}
            </div>
            <div className="detail__meta">
              <div>
                <span>year</span>
                {shown.year}
              </div>
              <div>
                <span>length</span>
                {shown.length}
              </div>
              <div>
                <span>genre</span>
                {shown.genre}
              </div>
            </div>
            <button type="button" className="detail__play" title="곧 구현">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 1.5v9L10.5 6z" fill="currentColor" />
              </svg>
              미리듣기
            </button>
          </div>
          <div className="detail__art">
            <div className="detail__stack">
              {[0, 1, 2].map((n) => (
                <div
                  key={n}
                  className="detail__stack-card"
                  style={{
                    background: n === 1 ? "#131826" : theme.bg,
                    transform: `translateZ(${-n * 64}px) rotate(${n * 5 - 5}deg)`,
                    opacity: 1 - n * 0.26,
                  }}
                >
                  <span
                    className="detail__stack-mark"
                    style={{ color: n === 1 ? "#eae6da" : theme.spine }}
                  >
                    {shown.title[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="detail__entry-no" aria-hidden="true">
            {String(entry + 1).padStart(2, "0")}
          </div>
        </section>
      </div>
    </div>
  );
}
