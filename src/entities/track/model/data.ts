import type { GenreId, GenreTheme, Track } from "./types";

export const GENRES: Record<GenreId, GenreTheme> = {
  ambient: { bg: "#3d5a80", ink: "#eef2f6", phon: "/ˈæm.bi.ənt/" },
  jazz: { bg: "#a8622d", ink: "#f9efe2", phon: "/dʒæz/" },
  electronic: { bg: "#5c7045", ink: "#eff3e6", phon: "/ɪˌlekˈtrɒn.ɪk/" },
};

export const GENRE_ORDER: GenreId[] = ["ambient", "jazz", "electronic"];

export function catalogNo(index: number): string {
  return `LNR-${String(index + 1).padStart(3, "0")}`;
}

export const TRACKS: Track[] = [
  {
    id: "an-ending",
    title: "An Ending",
    artist: "Brian Eno",
    album: "Apollo: Atmospheres and Soundtracks",
    label: "EG Records",
    year: 1983,
    length: "6:24",
    genre: "ambient",
    tags: ["drone", "새벽"],
    definition:
      "앰비언트란 가구처럼 존재하면서도 무시를 견딜 수 있어야 한다는 말의 증거. 끝이라는 단어가 붙었지만 실제로는 끝나지 않는다.",
  },
  {
    id: "blue-in-green",
    title: "Blue in Green",
    artist: "Bill Evans Trio",
    album: "Kind of Blue",
    label: "Columbia",
    year: 1959,
    length: "5:37",
    genre: "jazz",
    tags: ["ballad", "빗소리"],
    definition:
      "마일스의 앨범에 실렸지만 이 곡의 온도는 에반스의 것이다. 열려 있는 화음 위에 내리는 작은 빗방울들.",
  },
  {
    id: "music-for-18-musicians",
    title: "Music for 18 Musicians",
    artist: "Steve Reich",
    album: "Music for 18 Musicians",
    label: "ECM",
    year: 1976,
    length: "57:00",
    genre: "ambient",
    tags: ["minimal", "펄스"],
    definition:
      "반복이 지루해지는 지점을 지나면, 반복이 호흡이 된다. 열여덟 명이 만드는 하나의 거대한 숨.",
  },
  {
    id: "windowlicker",
    title: "Windowlicker",
    artist: "Aphex Twin",
    album: "Windowlicker EP",
    label: "Warp",
    year: 1999,
    length: "6:07",
    genre: "electronic",
    tags: ["idm", "글리치"],
    definition:
      "일그러진 얼굴 뒤에 숨은 정밀한 설계. 불편함과 쾌감이 동시에 오는 드문 순간.",
  },
  {
    id: "a-love-supreme",
    title: "A Love Supreme",
    artist: "John Coltrane",
    album: "A Love Supreme",
    label: "Impulse!",
    year: 1965,
    length: "32:50",
    genre: "jazz",
    tags: ["spiritual", "suite"],
    definition: "네 개의 악장이 하나의 기도다. 기술이 아니라 방향에 대한 이야기.",
  },
  {
    id: "xtal",
    title: "Xtal",
    artist: "Aphex Twin",
    album: "Selected Ambient Works 85–92",
    label: "Apollo",
    year: 1992,
    length: "4:53",
    genre: "electronic",
    tags: ["ambient techno"],
    definition:
      "전자음악이 이렇게 부드러울 수 있다는 것을 처음 안 곡. 흐릿한 보컬 샘플이 안개처럼 떠 있다.",
  },
  {
    id: "music-for-airports",
    title: "Music for Airports",
    artist: "Brian Eno",
    album: "Ambient 1: Music for Airports",
    label: "Polydor",
    year: 1978,
    length: "17:21",
    genre: "ambient",
    tags: ["installation", "대기"],
    definition:
      "공항을 위해 쓰였지만 결국 어떤 장소든 공항으로 만든다. 기다림을 위한 음악.",
  },
  {
    id: "naima",
    title: "Naima",
    artist: "John Coltrane",
    album: "Giant Steps",
    label: "Atlantic",
    year: 1959,
    length: "4:21",
    genre: "jazz",
    tags: ["ballad"],
    definition:
      "아내의 이름을 붙인 곡치고 이렇게 조용한 고백이 또 있을까. 색소폰이 말을 아끼는 법.",
  },
  {
    id: "window-cleaner",
    title: "Window Cleaner",
    artist: "Squarepusher",
    album: "Feed Me Weird Things",
    label: "Rephlex",
    year: 1996,
    length: "7:04",
    genre: "electronic",
    tags: ["drill'n'bass"],
    definition: "베이스가 계단을 뛰어내려간다. 계산된 카오스의 가장 즐거운 형태.",
  },
  {
    id: "thursday-afternoon",
    title: "Thursday Afternoon",
    artist: "Brian Eno",
    album: "Thursday Afternoon",
    label: "EG Records",
    year: 1985,
    length: "60:54",
    genre: "ambient",
    tags: ["페인팅", "원테이크"],
    definition: "60분짜리 하나의 붓질. 시간 개념이 달라지는 경험으로서의 음악.",
  },
  {
    id: "my-favorite-things",
    title: "My Favorite Things",
    artist: "John Coltrane",
    album: "My Favorite Things",
    label: "Atlantic",
    year: 1961,
    length: "13:41",
    genre: "jazz",
    tags: ["modal", "waltz"],
    definition:
      "뮤지컬 넘버를 13분 41초의 주술로 바꾸다. 소프라노 색소폰이 처음으로 말하기 시작한 순간.",
  },
  {
    id: "vordhosbn",
    title: "Vordhosbn",
    artist: "Aphex Twin",
    album: "Drukqs",
    label: "Warp",
    year: 2001,
    length: "4:53",
    genre: "electronic",
    tags: ["drum'n'bass", "piano"],
    definition:
      "난폭한 비트 위에 놓인 맑은 피아노. 두 세계가 같은 방에 있는 불편하고 아름다운 광경.",
  },
];
