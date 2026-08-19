import { GENRES, type Track } from "@/entities/track";
import "./readout.css";

interface Props {
  track: Track | null;
}

export function Readout({ track }: Props) {
  return (
    <div className={`readout${track ? " is-visible" : ""}`} aria-live="polite">
      {track && (
        <>
          <span className="readout__title">{track.title}</span>
          <span className="readout__phon">{GENRES[track.genre].phon}</span>
          <span className="readout__meta">
            {track.artist} · {track.year} · {track.length}
          </span>
        </>
      )}
    </div>
  );
}
