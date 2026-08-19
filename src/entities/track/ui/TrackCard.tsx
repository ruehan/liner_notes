import type { Track } from "../model/types";
import { catalogNo } from "../model/data";
import { CoverArt } from "./CoverArt";
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
  return (
    <article
      className={["track-card", hidden && "is-hidden", hot && "is-hot"]
        .filter(Boolean)
        .join(" ")}
      style={style}
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
      <div className="track-card__artwrap">
        <CoverArt track={track} className="track-card__art" />
        <span className="track-card__tape">{track.genre}</span>
      </div>
      <header className="track-card__head">
        <span className="track-card__no">{catalogNo(index)}</span>
        <h3 className="track-card__title">{track.title}</h3>
        <p className="track-card__byline">
          {track.artist}
          <span className="track-card__year">{track.year}</span>
        </p>
      </header>
      <footer className="track-card__foot">
        <span>{track.album}</span>
        <span className="track-card__len">{track.length}</span>
      </footer>
    </article>
  );
}
