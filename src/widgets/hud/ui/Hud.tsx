import type { ReactNode } from "react";
import "./hud.css";

interface Props {
  filters: ReactNode;
  catalogCount: number;
  onCatalog: () => void;
  onAbout: () => void;
}

export function Hud({ filters, catalogCount, onCatalog, onAbout }: Props) {
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
      <div className="hud__pills">
        <button type="button" className="hud-pill" onClick={onCatalog}>
          index
          <sup>{String(catalogCount).padStart(2, "0")}</sup>
        </button>
        <button type="button" className="hud-pill" onClick={onAbout}>
          about
        </button>
      </div>
    </header>
  );
}
