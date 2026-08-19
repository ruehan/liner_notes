import type { Track } from "../model/types";
import { GENRES } from "../model/data";
import "./track-card.css";

interface Props {
  track: Track;
  index: number;
  hidden: boolean;
  hot: boolean;
  style: React.CSSProperties;
  onOpen: (index: number) => void;
  onHover: (index: number | null) => void;
}

export function TrackCard({
  track,
  index,
  hidden,
  hot,
  style,
  onOpen,
  onHover,
}: Props) {
  const theme = GENRES[track.genre];
  return (
    <article
      className={[
        "track-card",
        hidden && "is-hidden",
        hot && "is-hot",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          ...style,
          background: theme.bg,
          "--spine": theme.spine,
        } as React.CSSProperties
      }
      role="button"
      tabIndex={hidden ? -1 : 0}
      aria-label={`${track.title} — ${track.artist}`}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(index);
        }
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="track-card__spine">
        <span>{track.genre}</span>
        <span>no.{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="track-card__art">
        <span className="track-card__mark" style={{ color: theme.spine }}>
          {track.title[0]}
        </span>
      </div>
      <div className="track-card__cap">
        <b>{track.title}</b>
        <span>
          {track.artist} · {track.year}
        </span>
      </div>
    </article>
  );
}
