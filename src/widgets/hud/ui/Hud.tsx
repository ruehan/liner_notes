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
        <span className="logo__stamp" aria-hidden="true">
          ♪
        </span>
        <span className="logo__text">
          <span className="logo__mark">liner notes</span>
          <span className="logo__sub">a personal music archive</span>
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
