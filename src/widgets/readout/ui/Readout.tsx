import type { Album } from "@/entities/track";
import "./readout.css";

interface Props {
  album: Album | null;
  catalog: string | null;
}

export function Readout({ album, catalog }: Props) {
  return (
    <div className={`readout${album ? " is-visible" : ""}`} aria-live="polite">
      {album && (
        <>
          <span className="readout__no">
            {catalog ?? ""} · {album.genre}
          </span>
          <span className="readout__title">{album.title}</span>
          <span className="readout__meta">
            {album.artist} · {album.tracks.length} tracks · {album.year}
          </span>
        </>
      )}
    </div>
  );
}
