import { catalogNo, type Track } from "@/entities/track";
import "./readout.css";

interface Props {
  track: Track | null;
  entryNo: number | null;
}

export function Readout({ track, entryNo }: Props) {
  return (
    <div className={`readout${track ? " is-visible" : ""}`} aria-live="polite">
      {track && (
        <>
          <span className="readout__no">
            {entryNo !== null ? catalogNo(entryNo) : ""} · {track.genre}
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
