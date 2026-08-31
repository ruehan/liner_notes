import { supabase } from "@/shared/api/supabase";
import type { CatalogAlbumInput } from "../model/form";

export interface EditorTrack {
  id: string;
  title: string;
  durationSeconds: number;
  description: string;
  youtubeVideoId: string | null;
  youtubeStartSeconds: number | null;
  youtubeEndSeconds: number | null;
}

export interface EditorAlbum {
  id: string;
  artistName: string;
  title: string;
  label: string;
  year: number;
  description: string;
  coverPath: string | null;
  featured: boolean;
  sortOrder: number;
  tracks: EditorTrack[];
}

export interface EditorArtist {
  id: string;
  name: string;
  albumCount: number | null;
}

export interface UploadedCover {
  path: string;
  publicUrl: string;
}

const COVER_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const DUPLICATE_ALBUM_MESSAGE =
  "같은 아티스트·앨범명·발매 연도의 앨범이 이미 등록되어 있습니다. 기존 앨범을 불러와 수정해 주세요.";

function albumMutationError(error: { code?: string; message: string }): Error {
  return error.code === "23505" ? new Error(DUPLICATE_ALBUM_MESSAGE) : new Error(error.message);
}

export function validateCoverFile(file: File): string | null {
  if (!COVER_TYPES.has(file.type)) {
    return "JPG, PNG 또는 WebP 이미지만 업로드할 수 있습니다.";
  }
  if (file.size > MAX_COVER_SIZE) {
    return "커버 이미지는 5MB 이하여야 합니다.";
  }
  return null;
}

export function coverPreviewUrl(reference: string | null | undefined): string | null {
  const trimmed = reference?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!supabase) return null;
  return supabase.storage.from("album-covers").getPublicUrl(trimmed).data.publicUrl;
}

function uploadName(extension: string): string {
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `covers/${unique}.${extension}`;
}

export async function uploadAlbumCover(file: File): Promise<UploadedCover> {
  const validationError = validateCoverFile(file);
  if (validationError) throw new Error(validationError);
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");

  const path = uploadName(COVER_TYPES.get(file.type)!);
  const { data, error } = await supabase.storage.from("album-covers").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    path: data.path,
    publicUrl: supabase.storage.from("album-covers").getPublicUrl(data.path).data.publicUrl,
  };
}

export type SubmissionAccess =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "signed-out" }
  | { status: "editor"; email: string | null }
  | { status: "forbidden"; email: string | null }
  | { status: "error"; message: string };

export async function getSubmissionAccess(): Promise<SubmissionAccess> {
  if (!supabase) return { status: "unconfigured" };

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) return { status: "error", message: sessionError.message };
  if (!session) return { status: "signed-out" };

  const { data: isEditor, error } = await supabase.rpc("is_editor");
  if (error) return { status: "error", message: error.message };

  return isEditor
    ? { status: "editor", email: session.user.email ?? null }
    : { status: "forbidden", email: session.user.email ?? null };
}

export async function signInEditor(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOutEditor(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function submitCatalogAlbum(input: CatalogAlbumInput): Promise<string> {
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");

  const { data, error } = await supabase.rpc("create_catalog_album", {
    p_artist_name: input.artistName,
    p_title: input.title,
    p_label: input.label,
    p_year: input.year,
    p_description: input.description,
    p_cover_path: input.coverPath,
    p_featured: input.featured,
    p_sort_order: input.sortOrder,
    p_tracks: input.tracks,
  });
  if (error) throw albumMutationError(error);
  return data as string;
}

export async function updateCatalogAlbum(
  albumId: string,
  input: CatalogAlbumInput,
): Promise<string> {
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");

  const { data, error } = await supabase.rpc("update_catalog_album", {
    p_album_id: albumId,
    p_artist_name: input.artistName,
    p_title: input.title,
    p_label: input.label,
    p_year: input.year,
    p_description: input.description,
    p_cover_path: input.coverPath,
    p_featured: input.featured,
    p_sort_order: input.sortOrder,
    p_tracks: input.tracks,
  });
  if (error) throw albumMutationError(error);
  return data as string;
}

export async function fetchEditorAlbums(): Promise<EditorAlbum[]> {
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");
  const { data, error } = await supabase.rpc("list_catalog_albums");
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? (data as EditorAlbum[]) : [];
}

export async function fetchEditorArtists(): Promise<EditorArtist[]> {
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");
  const { data, error } = await supabase.rpc("list_catalog_artists");
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) return [];

  return data.map((value) => {
    const artist = value as Omit<EditorArtist, "albumCount"> & { albumCount?: unknown };
    return {
      ...artist,
      albumCount:
        typeof artist.albumCount === "number" && Number.isInteger(artist.albumCount)
          ? artist.albumCount
          : null,
    };
  });
}

export async function submitCatalogArtist(name: string): Promise<EditorArtist> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("아티스트 이름을 입력해 주세요.");
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");

  const { data, error } = await supabase.rpc("create_catalog_artist", {
    p_name: trimmedName,
  });
  if (error) throw new Error(error.message);
  return { id: data as string, name: trimmedName, albumCount: 0 };
}

export async function updateCatalogArtist(artistId: string, name: string): Promise<string> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("아티스트 이름을 입력해 주세요.");
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");

  const { data, error } = await supabase.rpc("update_catalog_artist", {
    p_artist_id: artistId,
    p_name: trimmedName,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function deleteCatalogArtist(artistId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 연결 정보가 없습니다.");

  const { error } = await supabase.rpc("delete_catalog_artist", {
    p_artist_id: artistId,
  });
  if (error) throw new Error(error.message);
}
