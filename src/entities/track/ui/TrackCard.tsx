import type { Album } from "../model/types";
import { CoverArt } from "./CoverArt";
import "./track-card.css";

interface Props {
  album: Album;
  ordinal: number;
  hot: boolean;
  favorited: boolean;
  style: React.CSSProperties;
  onOpen: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onOpenArtist: (artist: string) => void;
  onToggleFavorite: () => void;
}

export function AlbumCard({
  album,
  ordinal,
  hot,
  favorited,
  style,
  onOpen,
  onEnter,
  onLeave,
  onOpenArtist,
  onToggleFavorite,
}: Props) {
  return (
    <article
      className={["track-card", hot && "is-hot"]
        .filter(Boolean)
        .join(" ")}
      style={style}
      role="group"
      aria-label={`${album.title} — ${album.artist}`}
      onClick={onOpen}
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
      <button
        type="button"
        className="track-card__open"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        aria-label={`${album.title} 앨범 상세 열기`}
      />
      <div className="track-card__artwrap">
        <CoverArt track={album.cover} imageUrl={album.coverUrl} className="track-card__art" />
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
        <h3 className="track-card__title">{album.title}</h3>
        <p className="track-card__byline">
          <button
            type="button"
            className="track-card__artist"
            onClick={(event) => {
              event.stopPropagation();
              onOpenArtist(album.artist);
            }}
            aria-label={`${album.artist}의 앨범 보기`}
          >
            {album.artist}
          </button>
          <span className="track-card__year">{album.year}</span>
        </p>
      </header>
      <footer className="track-card__foot">
        <span>{album.label}</span>
        <span className="track-card__len">{album.tracks.length} tracks</span>
      </footer>
    </article>
  );
}
