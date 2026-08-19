import type { Track } from "../model/types";
import { CoverArt } from "./CoverArt";
import "./track-card.css";

interface Props {
  track: Track;
  catalog: string;
  ordinal: number;
  hidden: boolean;
  hot: boolean;
  favorited: boolean;
  style: React.CSSProperties;
  onOpen: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onToggleFavorite: () => void;
}

export function TrackCard({
  track,
  catalog,
  ordinal,
  hidden,
  hot,
  favorited,
  style,
  onOpen,
  onEnter,
  onLeave,
  onToggleFavorite,
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
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onMouseEnter={onEnter}
      onMouseMove={(event) => {
        const card = event.currentTarget;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;

        card.style.setProperty("--tilt-x", `${(0.5 - y) * 3.5}deg`);
        card.style.setProperty("--tilt-y", `${(x - 0.5) * 4.5}deg`);
        card.style.setProperty("--shine-x", `${x * 100}%`);
        card.style.setProperty("--shine-y", `${y * 100}%`);
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.removeProperty("--tilt-x");
        event.currentTarget.style.removeProperty("--tilt-y");
        event.currentTarget.style.removeProperty("--shine-x");
        event.currentTarget.style.removeProperty("--shine-y");
        onLeave();
      }}
    >
      <div className="track-card__artwrap">
        <CoverArt track={track} className="track-card__art" />
        <span className="track-card__tape">{track.genre}</span>
        <button
          type="button"
          className={`track-card__fav${favorited ? " is-on" : ""}`}
          aria-label={favorited ? "수집에서 제거" : "수집에 추가"}
          aria-pressed={favorited}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {favorited ? "♥" : "♡"}
        </button>
        <span className="track-card__ordinal">{String(ordinal).padStart(2, "0")}</span>
      </div>
      <header className="track-card__head">
        <span className="track-card__no">{catalog}</span>
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
