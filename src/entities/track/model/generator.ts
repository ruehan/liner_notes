import { createRng } from "@/shared/lib";
import { GENRE_ORDER, TRACKS, catalogNo } from "./data";
import type { GenreId, Track } from "./types";

export function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % 2147483647;
  }
  return h || 7;
}

export function isHomeTile(k: number, m: number): boolean {
  return k === 0 && m === 0;
}

function code(n: number): string {
  return n >= 0 ? String(n) : `n${-n}`;
}

export function tileCatalog(k: number, m: number, index: number): string {
  if (isHomeTile(k, m)) return catalogNo(index);
  return `LNR-${code(k)}.${code(m)}-${String(index + 1).padStart(2, "0")}`;
}

const TITLE_WORDS: Record<GenreId, [string[], string[]]> = {
  ambient: [
    ["Pale", "Slow", "Quiet", "Hollow", "Silver", "Faint", "Amber", "Winter", "Distant", "Paper"],
    ["Harbor", "Signal", "Garden", "Corridor", "Horizon", "Archive", "Weather", "Reverie", "Current", "Station"],
  ],
  jazz: [
    ["Blue", "Golden", "Midnight", "Velvet", "Smoky", "Late", "Bitter", "Sweet", "Crooked", "Lazy"],
    ["Corner", "Waltz", "Sketch", "Ballad", "Stride", "Session", "Reflex", "Avenue", "Verdict", "Postcard"],
  ],
  electronic: [
    ["Circuit", "Vector", "Phase", "Neon", "Static", "Binary", "Chrome", "Pulse", "Isotope", "Modular"],
    ["Field", "Sequence", "Loop", "Window", "Engine", "Prism", "Memory", "Relay", "Cluster", "Drift"],
  ],
};

const ARTIST_FIRST = [
  "Iris", "Kael", "Mona", "Jun", "Elio", "Sable", "Ren", "Ada", "Vico",
  "Noor", "Halcy", "Otto", "Mire", "Suki", "Bram", "Yara", "Dex", "Linnea",
];

const ARTIST_LAST = [
  "Marrow", "Fields", "Okabe", "Lindqvist", "Duarte", "Ashline", "Vey",
  "Nakamura", "Soto", "Ilg", "Corvin", "Mbeki", "Halloran", "Petrov", "Quist",
];

const JAZZ_GROUPS = ["Trio", "Quartet", "Quintet", "Ensemble"];

const LABELS = [
  "Driftworks", "Blue Hour", "Cold Front", "Aperture", "Fonograf",
  "Tape Club", "Meridian", "Roomtone", "Night Soil", "Kiln",
];

const MOODS: Record<GenreId, string[]> = {
  ambient: ["새벽", "대기", "정적", "안개", "긴 복도", "먼 방"],
  jazz: ["빗소리", "막차 이후", "연기", "즉흥", "오래된 가죽", "골목"],
  electronic: ["글리치", "회로", "야간 주행", "신시", "지직거림", "반복"],
};

const TAG_EXTRAS = ["비밀 선곡", "첫 청취 기록", "재편집본", "라이브", "데모", "리마스터"];

const DEFINITIONS = [
  (a: string, _b: string) =>
    `처음 들은 순간의 공기가 그대로 보존된 기록. ${a}에 가까워지고 싶을 때 꺼내는 항목이다.`,
  (a: string, b: string) =>
    `${a}의 표준으로 삼아도 좋은 곡. 볼륨을 낮출수록 ${b}한 디테일이 더 들린다.`,
  (a: string, b: string) =>
    `장르의 경계에서 태어난 기록. ${a}에서 출발해 ${b} 쪽으로 천천히 기울어진다.`,
  (a: string, _b: string) =>
    `선곡 이유를 설명하는 것보다 재생하는 편이 빠르다. ${a}을 아카이브하는 가장 짧은 방법.`,
  (_a: string, b: string) =>
    `반복할수록 결이 드러나는 부류. ${b}한 순간을 위해 보관해 둔다.`,
  (a: string, b: string) =>
    `${a}의 시간대에만 제대로 들리는 곡이라는 개인적인 결론. ${b}함은 덤이다.`,
];

const ADJ_FILL = ["조용한", "느린", "차가운", "따뜻한", "거친", "투명한", "무게 없는", "낡은"];

export function generateTileTracks(k: number, m: number): Track[] {
  if (isHomeTile(k, m)) return TRACKS;

  const rng = createRng(hashKey(`tile:${k},${m}`));
  const count = TRACKS.length;
  const tracks: Track[] = [];

  for (let i = 0; i < count; i++) {
    const genre = GENRE_ORDER[Math.floor(rng() * GENRE_ORDER.length)];
    const [adj, noun] = TITLE_WORDS[genre];
    const title =
      genre === "electronic" && rng() < 0.35
        ? `${adj[Math.floor(rng() * adj.length)]} ${String(Math.floor(rng() * 89) + 10).padStart(2, "0")}`
        : `${adj[Math.floor(rng() * adj.length)]} ${noun[Math.floor(rng() * noun.length)]}`;

    const last = ARTIST_LAST[Math.floor(rng() * ARTIST_LAST.length)];
    const artist =
      genre === "jazz" && rng() < 0.5
        ? `${ARTIST_FIRST[Math.floor(rng() * ARTIST_FIRST.length)]} ${last} ${JAZZ_GROUPS[Math.floor(rng() * JAZZ_GROUPS.length)]}`
        : `${ARTIST_FIRST[Math.floor(rng() * ARTIST_FIRST.length)]} ${last}`;

    const yearBase: Record<GenreId, [number, number]> = {
      ambient: [1978, 2010],
      jazz: [1955, 1979],
      electronic: [1990, 2025],
    };
    const [y0, y1] = yearBase[genre];
    const year = y0 + Math.floor(rng() * (y1 - y0 + 1));

    const secs = 150 + Math.floor(rng() * 2100);
    const length = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

    const album =
      rng() < 0.5
        ? title
        : `${title} ${["Sessions", "Reprise", "Edition", "Vol. 1"][Math.floor(rng() * 4)]}`;

    const tags = [MOODS[genre][Math.floor(rng() * MOODS[genre].length)]];
    if (rng() < 0.5) tags.push(TAG_EXTRAS[Math.floor(rng() * TAG_EXTRAS.length)]);

    const definition = DEFINITIONS[Math.floor(rng() * DEFINITIONS.length)](
      MOODS[genre][Math.floor(rng() * MOODS[genre].length)],
      ADJ_FILL[Math.floor(rng() * ADJ_FILL.length)],
    );

    tracks.push({
      id: `${k}:${m}:${i}`,
      title,
      artist,
      album,
      label: LABELS[Math.floor(rng() * LABELS.length)],
      year,
      length,
      genre,
      tags,
      definition,
    });
  }
  return tracks;
}
