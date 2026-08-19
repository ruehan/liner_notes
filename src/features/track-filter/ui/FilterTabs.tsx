import { useEffect, useLayoutEffect, useRef } from "react";
import { FILTER_ORDER, type FilterId } from "../model/filter";
import "./filter-tabs.css";

interface Props {
  value: FilterId;
  counts: Record<FilterId, number>;
  onChange: (filter: FilterId) => void;
}

export function FilterTabs({ value, counts, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const moveBar = () => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;
    const btn = root.querySelector<HTMLButtonElement>(".is-active");
    if (!btn) return;
    bar.style.left = `${btn.offsetLeft}px`;
    bar.style.width = `${btn.offsetWidth}px`;
  };

  useLayoutEffect(moveBar, [value]);

  useEffect(() => {
    window.addEventListener("resize", moveBar);
    return () => window.removeEventListener("resize", moveBar);
  }, []);

  return (
    <div className="filter-tabs" ref={rootRef}>
      {FILTER_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={`filter-tabs__btn${value === id ? " is-active" : ""}`}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {id}
          <sup>{counts[id]}</sup>
        </button>
      ))}
      <span className="filter-tabs__bar" ref={barRef} aria-hidden="true" />
    </div>
  );
}
