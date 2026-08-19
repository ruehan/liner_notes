import { useEffect, useState } from "react";
import "./boot.css";

const WORD = "liner notes";

interface Props {
  onDone: () => void;
}

export function Boot({ onDone }: Props) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      onDone();
    }, 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`boot${done ? " is-done" : ""}`} aria-hidden="true">
      <div className="boot__wrap">
        <div className="boot__stamp" aria-hidden="true">
          ♪
        </div>
        <div className="boot__mark">
          {WORD.split("").map((ch, i) => (
            <span key={i} style={{ animationDelay: `${i * 60}ms` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="boot__sub">a personal music archive</div>
        <div className="boot__bar">
          <span />
        </div>
      </div>
    </div>
  );
}
