import type { ReactNode } from "react";
import "./hud.css";

interface Props {
  filters: ReactNode;
  onAbout: () => void;
}

export function Hud({ filters, onAbout }: Props) {
  return (
    <header className="hud">
      <a className="logo" href="/">
        <span className="logo__disc" aria-hidden="true" />
        <span className="logo__text">
          <span className="logo__mark">night lexicon</span>
          <span className="logo__sub">a personal dictionary of songs</span>
        </span>
      </a>
      <nav className="hud__filters" aria-label="장르 필터">
        {filters}
      </nav>
      <button type="button" className="about-btn" onClick={onAbout}>
        about
      </button>
    </header>
  );
}
