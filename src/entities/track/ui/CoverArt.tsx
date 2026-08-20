import { createRng } from "@/shared/lib";
import { useState } from "react";
import type { GenreTheme, Track } from "../model/types";
import { GENRES } from "../model/data";

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 2147483647;
  }
  return h || 7;
}

interface Props {
  track: Track;
  className?: string;
  imageUrl?: string;
}

type Pattern = "rings" | "bars" | "waves" | "dots";
const PATTERNS: Pattern[] = ["rings", "bars", "waves", "dots"];

export function CoverArt({ track, className, imageUrl }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const theme = GENRES[track.genre];
  const seed = hashId(track.id);
  const pattern = PATTERNS[seed % PATTERNS.length];

  if (imageUrl && !imageFailed) {
    return (
      <img
        className={className}
        src={imageUrl}
        alt=""
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ background: theme.bg }}
    >
      {pattern === "rings" && <Rings seed={seed} theme={theme} />}
      {pattern === "bars" && <Bars seed={seed} theme={theme} />}
      {pattern === "waves" && <Waves seed={seed} theme={theme} />}
      {pattern === "dots" && <Dots seed={seed} theme={theme} />}
    </svg>
  );
}

function Rings({ seed, theme }: { seed: number; theme: GenreTheme }) {
  const rng = createRng(seed);
  const cx = 38 + Math.floor(rng() * 24);
  const cy = 38 + Math.floor(rng() * 24);
  const circles = [];
  for (let r = 6; r <= 62; r += 5 + Math.floor(rng() * 4)) {
    circles.push(
      <circle
        key={r}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={theme.ink}
        strokeWidth={0.8 + rng() * 1.6}
        opacity={0.5 + rng() * 0.4}
      />,
    );
  }
  return (
    <>
      {circles}
      <circle cx={cx} cy={cy} r={2.6} fill="#c8372d" />
    </>
  );
}

function Bars({ seed, theme }: { seed: number; theme: GenreTheme }) {
  const rng = createRng(seed + 11);
  const bars = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const h = 18 + rng() * 58;
    bars.push(
      <rect
        key={i}
        x={6 + i * 6.4}
        y={92 - h}
        width={3.4}
        height={h}
        fill={theme.ink}
        opacity={0.45 + rng() * 0.5}
      />,
    );
  }
  return (
    <>
      {bars}
      <line x1="4" y1="92" x2="96" y2="92" stroke={theme.ink} strokeWidth="1" opacity="0.8" />
    </>
  );
}

function Waves({ seed, theme }: { seed: number; theme: GenreTheme }) {
  const rng = createRng(seed + 23);
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const y = 16 + i * 13 + rng() * 4;
    const amp = 4 + rng() * 7;
    const phase = rng() * 20;
    let d = `M -5 ${y}`;
    for (let x = 0; x <= 105; x += 5) {
      const yy = y + Math.sin((x + phase) / (9 + rng() * 4)) * amp;
      d += ` L ${x} ${yy.toFixed(1)}`;
    }
    lines.push(
      <path
        key={i}
        d={d}
        fill="none"
        stroke={i === 2 ? "#c8372d" : theme.ink}
        strokeWidth={i === 2 ? 1.6 : 1 + rng()}
        opacity={0.5 + rng() * 0.45}
      />,
    );
  }
  return <>{lines}</>;
}

function Dots({ seed, theme }: { seed: number; theme: GenreTheme }) {
  const rng = createRng(seed + 37);
  const dots = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const big = rng() > 0.82;
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={12 + c * 15.2}
          cy={12 + r * 15.2}
          r={big ? 4.6 : 1.2 + rng() * 2.2}
          fill={big ? "#c8372d" : theme.ink}
          opacity={big ? 0.9 : 0.4 + rng() * 0.5}
        />,
      );
    }
  }
  return <>{dots}</>;
}
