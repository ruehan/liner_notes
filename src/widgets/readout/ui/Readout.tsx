import type { Track } from "@/entities/track";
import "./readout.css";

interface Props {
  track: Track | null;
  catalog: string | null;
}

export function Readout({ track, catalog }: Props) {
  return (
    <div className={`readout${track ? " is-visible" : ""}`} aria-live="polite">
      {track && (
        <>
          <span className="readout__no">
            {catalog ?? ""} · {track.genre}
          </span>
          <span className="readout__title">{track.title}</span>
          <span className="readout__meta">
            {track.artist} · {track.album} · {track.year}
          </span>
        </>
      )}
    </div>
  );
}
