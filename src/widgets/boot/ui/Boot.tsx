import { useEffect, useState } from "react";
import "./boot.css";

const WORD = "night lexicon";

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
        <div className="boot__disc" />
        <div className="boot__mark">
          {WORD.split("").map((ch, i) => (
            <span key={i} style={{ animationDelay: `${i * 45}ms` }}>
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </div>
        <div className="boot__sub">a personal dictionary of songs</div>
        <div className="boot__bar">
          <span />
        </div>
      </div>
    </div>
  );
}
