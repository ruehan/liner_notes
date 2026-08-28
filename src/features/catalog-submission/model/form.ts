import { normalizeYouTubeVideoId } from "@/entities/track";

export interface TrackDraft {
  key: string;
  title: string;
  duration: string;
  description: string;
  youtubeReference: string;
  youtubeStart: string;
  youtubeEnd: string;
}

export interface AlbumDraft {
  artistName: string;
  title: string;
  label: string;
  year: string;
  description: string;
  coverPath: string;
  featured: boolean;
  sortOrder: string;
  tracks: TrackDraft[];
}

export interface CatalogTrackInput {
  title: string;
  duration_seconds: number;
  description: string;
  youtube_video_id: string | null;
  youtube_start_seconds: number | null;
  youtube_end_seconds: number | null;
}

export interface CatalogAlbumInput {
  artistName: string;
  title: string;
  label: string;
  year: number;
  description: string;
  coverPath: string | null;
  featured: boolean;
  sortOrder: number;
  tracks: CatalogTrackInput[];
}

export interface DraftValidation {
  value?: CatalogAlbumInput;
  errors: string[];
}

export function createTrackDraft(key: string): TrackDraft {
  return {
    key,
    title: "",
    duration: "",
    description: "",
    youtubeReference: "",
    youtubeStart: "",
    youtubeEnd: "",
  };
}

export function createAlbumDraft(): AlbumDraft {
  return {
    artistName: "",
    title: "",
    label: "",
    year: String(new Date().getFullYear()),
    description: "",
    coverPath: "",
    featured: true,
    sortOrder: "0",
    tracks: [createTrackDraft("track-1")],
  };
}

function parseDuration(value: string): number | undefined {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  if (!match) return undefined;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const total = minutes * 60 + seconds;
  return total > 0 ? total : undefined;
}

function parseOptionalSecond(value: string): number | null | undefined {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : undefined;
}

export function buildCatalogAlbumInput(draft: AlbumDraft): DraftValidation {
  const errors: string[] = [];
  const artistName = draft.artistName.trim();
  const title = draft.title.trim();
  const year = Number(draft.year);
  const sortOrder = Number(draft.sortOrder || "0");

  if (!artistName) errors.push("아티스트 이름을 입력해 주세요.");
  if (!title) errors.push("앨범 제목을 입력해 주세요.");
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    errors.push("발매 연도는 1900~2100 사이의 정수여야 합니다.");
  }
  if (!Number.isInteger(sortOrder)) {
    errors.push("홈 정렬 순서는 정수로 입력해 주세요.");
  }
  if (draft.tracks.length === 0) errors.push("수록곡을 한 곡 이상 입력해 주세요.");

  const tracks = draft.tracks.map<CatalogTrackInput | undefined>((track, index) => {
    const prefix = `${index + 1}번 수록곡`;
    const trackTitle = track.title.trim();
    const duration = parseDuration(track.duration);
    const rawVideoReference = track.youtubeReference.trim();
    const youtubeVideoId = normalizeYouTubeVideoId(rawVideoReference);
    const start = parseOptionalSecond(track.youtubeStart);
    const end = parseOptionalSecond(track.youtubeEnd);

    if (!trackTitle) errors.push(`${prefix} 제목을 입력해 주세요.`);
    if (duration === undefined) errors.push(`${prefix} 길이는 mm:ss 형식으로 입력해 주세요.`);
    if (rawVideoReference && !youtubeVideoId) {
      errors.push(`${prefix} YouTube 영상 ID 또는 URL을 확인해 주세요.`);
    }
    if (start === undefined) errors.push(`${prefix} 시작 초는 0 이상의 정수여야 합니다.`);
    if (end === undefined) errors.push(`${prefix} 종료 초는 0 이상의 정수여야 합니다.`);
    if (end !== null && start === null) {
      errors.push(`${prefix} 종료 초를 입력하려면 시작 초도 필요합니다.`);
    }
    if (typeof start === "number" && typeof end === "number" && end <= start) {
      errors.push(`${prefix} 종료 초는 시작 초보다 커야 합니다.`);
    }

    if (!trackTitle || duration === undefined || start === undefined || end === undefined) {
      return undefined;
    }

    return {
      title: trackTitle,
      duration_seconds: duration,
      description: track.description.trim(),
      youtube_video_id: youtubeVideoId ?? null,
      youtube_start_seconds: start,
      youtube_end_seconds: end,
    };
  });

  if (errors.length > 0 || tracks.some((track) => track === undefined)) return { errors };

  return {
    errors: [],
    value: {
      artistName,
      title,
      label: draft.label.trim(),
      year,
      description: draft.description.trim(),
      coverPath: draft.coverPath.trim() || null,
      featured: draft.featured,
      sortOrder,
      tracks: tracks as CatalogTrackInput[],
    },
  };
}
