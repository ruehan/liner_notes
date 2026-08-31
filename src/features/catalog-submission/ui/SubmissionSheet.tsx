import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  coverPreviewUrl,
  deleteCatalogArtist,
  fetchEditorAlbums,
  fetchEditorArtists,
  getSubmissionAccess,
  signInEditor,
  signOutEditor,
  submitCatalogAlbum,
  submitCatalogArtist,
  updateCatalogArtist,
  uploadAlbumCover,
  updateCatalogAlbum,
  validateCoverFile,
  type EditorAlbum,
  type EditorArtist,
  type SubmissionAccess,
} from "../api/catalog-submission";
import {
  buildCatalogAlbumInput,
  createAlbumDraft,
  createTrackDraft,
  type AlbumDraft,
  type TrackDraft,
} from "../model/form";
import "./submission.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void | Promise<void>;
}

type TrackField = Exclude<keyof TrackDraft, "key">;
type EditorDesk = "album" | "artist";
const DUPLICATE_ALBUM_MESSAGE =
  "같은 아티스트·앨범명·발매 연도의 앨범이 이미 등록되어 있습니다. 기존 앨범을 불러와 수정해 주세요.";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "등록 중 문제가 발생했습니다.";
}

function durationInput(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function normalizedIdentity(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function draftFromEditorAlbum(album: EditorAlbum): AlbumDraft {
  return {
    artistName: album.artistName,
    title: album.title,
    label: album.label,
    year: String(album.year),
    description: album.description,
    coverPath: album.coverPath ?? "",
    featured: album.featured,
    sortOrder: String(album.sortOrder),
    tracks: album.tracks.map((track) => ({
      key: track.id,
      title: track.title,
      duration: durationInput(track.durationSeconds),
      description: track.description,
      youtubeReference: track.youtubeVideoId ?? "",
      youtubeStart: track.youtubeStartSeconds === null ? "" : String(track.youtubeStartSeconds),
      youtubeEnd: track.youtubeEndSeconds === null ? "" : String(track.youtubeEndSeconds),
    })),
  };
}

export function SubmissionSheet({ open, onClose, onSubmitted }: Props) {
  const [access, setAccess] = useState<SubmissionAccess>({ status: "loading" });
  const [draft, setDraft] = useState<AlbumDraft>(() => createAlbumDraft());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [coverDropActive, setCoverDropActive] = useState(false);
  const [editorAlbums, setEditorAlbums] = useState<EditorAlbum[]>([]);
  const [editorArtists, setEditorArtists] = useState<EditorArtist[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState<string | null>(null);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistsError, setArtistsError] = useState<string | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editorDesk, setEditorDesk] = useState<EditorDesk>("album");
  const [editingArtist, setEditingArtist] = useState<EditorArtist | null>(null);
  const [artistName, setArtistName] = useState("");
  const [artistError, setArtistError] = useState<string | null>(null);
  const [savingArtist, setSavingArtist] = useState(false);
  const [deletingArtistId, setDeletingArtistId] = useState<string | null>(null);
  const trackKey = useRef(1);

  const refreshAccess = useCallback(async () => {
    setAccess({ status: "loading" });
    setAccess(await getSubmissionAccess());
  }, []);

  const loadEditorAlbums = useCallback(async () => {
    setAlbumsLoading(true);
    setAlbumsError(null);
    try {
      setEditorAlbums(await fetchEditorAlbums());
    } catch (error) {
      setAlbumsError(messageFrom(error));
    } finally {
      setAlbumsLoading(false);
    }
  }, []);

  const loadEditorArtists = useCallback(async () => {
    setArtistsLoading(true);
    setArtistsError(null);
    try {
      setEditorArtists(await fetchEditorArtists());
    } catch (error) {
      setArtistsError(messageFrom(error));
    } finally {
      setArtistsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setLocalCoverPreview(null);
      return;
    }

    trackKey.current = 1;
    setDraft(createAlbumDraft());
    setFormErrors([]);
    setNotice(null);
    setLoginError(null);
    setEditorAlbums([]);
    setEditorArtists([]);
    setAlbumsError(null);
    setArtistsError(null);
    setEditingAlbumId(null);
    setEditorDesk("album");
    setEditingArtist(null);
    setArtistName("");
    setArtistError(null);
    setDeletingArtistId(null);
    setCoverUploadError(null);
    void refreshAccess();
  }, [open, refreshAccess]);

  useEffect(() => {
    if (!localCoverPreview) return;
    return () => URL.revokeObjectURL(localCoverPreview);
  }, [localCoverPreview]);

  useEffect(() => {
    if (!open || access.status !== "editor") return;
    void loadEditorAlbums();
    void loadEditorArtists();
  }, [open, access.status, loadEditorAlbums, loadEditorArtists]);

  if (!open) return null;

  const updateTrack = (key: string, field: TrackField, value: string) => {
    setDraft((current) => ({
      ...current,
      tracks: current.tracks.map((track) =>
        track.key === key ? { ...track, [field]: value } : track,
      ),
    }));
  };

  const addTrack = () => {
    trackKey.current += 1;
    setDraft((current) => ({
      ...current,
      tracks: [...current.tracks, createTrackDraft(`track-${trackKey.current}`)],
    }));
  };

  const removeTrack = (key: string) => {
    setDraft((current) =>
      current.tracks.length <= 1
        ? current
        : { ...current, tracks: current.tracks.filter((track) => track.key !== key) },
    );
  };

  const resetToNewAlbum = () => {
    trackKey.current = 1;
    setEditingAlbumId(null);
    setDraft(createAlbumDraft());
    setFormErrors([]);
    setNotice(null);
    setCoverUploadError(null);
    setLocalCoverPreview(null);
  };

  const selectEditorAlbum = (albumId: string) => {
    if (!albumId) {
      resetToNewAlbum();
      return;
    }

    const album = editorAlbums.find((item) => item.id === albumId);
    if (!album) return;

    trackKey.current = Math.max(1, album.tracks.length);
    setEditingAlbumId(album.id);
    setDraft(draftFromEditorAlbum(album));
    setFormErrors([]);
    setCoverUploadError(null);
    setLocalCoverPreview(null);
    setNotice(`“${album.title}”을(를) 수정하는 중입니다.`);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setLoginError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoggingIn(true);
    setLoginError(null);
    try {
      await signInEditor(email.trim(), password);
      setPassword("");
      await refreshAccess();
    } catch (error) {
      setLoginError(messageFrom(error));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleArtistSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = artistName.trim();
    if (!name) {
      setArtistError("아티스트 이름을 입력해 주세요.");
      return;
    }

    setSavingArtist(true);
    setArtistError(null);
    try {
      if (editingArtist) {
        const previousName = editingArtist.name;
        await updateCatalogArtist(editingArtist.id, name);
        await onSubmitted();
        await Promise.all([loadEditorArtists(), loadEditorAlbums()]);
        setDraft((current) => (
          current.artistName === previousName ? { ...current, artistName: name } : current
        ));
        setEditingArtist(null);
        setArtistName("");
        setNotice(`아티스트 이름을 “${name}”(으)로 수정했습니다.`);
      } else {
        const artist = await submitCatalogArtist(name);
        await loadEditorArtists();
        setDraft((current) => ({ ...current, artistName: artist.name }));
        setArtistName("");
        setEditorDesk("album");
        setNotice(`“${artist.name}” 아티스트를 등록하고 앨범 입력에 선택했습니다.`);
      }
    } catch (error) {
      setArtistError(messageFrom(error));
    } finally {
      setSavingArtist(false);
    }
  };

  const startArtistEdit = (artist: EditorArtist) => {
    setEditingArtist(artist);
    setArtistName(artist.name);
    setArtistError(null);
    setNotice(null);
  };

  const cancelArtistEdit = () => {
    setEditingArtist(null);
    setArtistName("");
    setArtistError(null);
  };

  const deleteArtist = async (artist: EditorArtist) => {
    if (artist.albumCount !== 0) {
      setArtistError(
        artist.albumCount === null
          ? "앨범 수를 확인할 수 없어 삭제할 수 없습니다. 최신 마이그레이션을 적용해 주세요."
          : "앨범이 연결된 아티스트는 삭제할 수 없습니다.",
      );
      return;
    }
    if (!window.confirm(`“${artist.name}” 아티스트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeletingArtistId(artist.id);
    setArtistError(null);
    try {
      await deleteCatalogArtist(artist.id);
      await loadEditorArtists();
      if (editingArtist?.id === artist.id) cancelArtistEdit();
      setDraft((current) => (
        current.artistName === artist.name ? { ...current, artistName: "" } : current
      ));
      setNotice(`“${artist.name}” 아티스트를 삭제했습니다.`);
    } catch (error) {
      setArtistError(messageFrom(error));
    } finally {
      setDeletingArtistId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutEditor();
      await refreshAccess();
    } catch (error) {
      setLoginError(messageFrom(error));
    }
  };

  const handleCoverFile = async (file: File | undefined) => {
    if (!file || uploadingCover) return;
    const validationError = validateCoverFile(file);
    if (validationError) {
      setCoverUploadError(validationError);
      return;
    }

    setCoverUploadError(null);
    setLocalCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const uploaded = await uploadAlbumCover(file);
      setDraft((current) => ({ ...current, coverPath: uploaded.path }));
      setNotice("커버 이미지를 업로드했습니다. 앨범 저장을 눌러 반영하세요.");
    } catch (error) {
      setLocalCoverPreview(null);
      setCoverUploadError(messageFrom(error));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = buildCatalogAlbumInput(draft);
    if (!result.value) {
      setFormErrors(result.errors);
      setNotice(null);
      return;
    }
    const input = result.value;

    const duplicate = editorAlbums.find(
      (album) =>
        album.id !== editingAlbumId &&
        normalizedIdentity(album.artistName) === normalizedIdentity(input.artistName) &&
        normalizedIdentity(album.title) === normalizedIdentity(input.title) &&
        album.year === input.year,
    );
    if (duplicate) {
      setFormErrors([DUPLICATE_ALBUM_MESSAGE]);
      setNotice(null);
      return;
    }

    setSaving(true);
    setFormErrors([]);
    setNotice(null);
    try {
      if (editingAlbumId) {
        await updateCatalogAlbum(editingAlbumId, input);
      } else {
        await submitCatalogAlbum(input);
      }
      await onSubmitted();
      await loadEditorAlbums();
      if (editingAlbumId) {
        setNotice("앨범 정보와 수록곡을 수정했습니다. 홈 벽을 새로 반영했어요.");
      } else {
        trackKey.current = 1;
        setDraft(createAlbumDraft());
        setLocalCoverPreview(null);
        setNotice("앨범과 수록곡을 등록했습니다. 홈 벽을 새로 반영했어요.");
      }
    } catch (error) {
      setFormErrors([messageFrom(error)]);
    } finally {
      setSaving(false);
    }
  };

  const coverPreview = localCoverPreview ?? coverPreviewUrl(draft.coverPath);

  return (
    <div
      className="submission"
      role="dialog"
      aria-modal="true"
      aria-label={editorDesk === "artist" ? "아티스트 관리" : "앨범 등록"}
    >
      <div className="submission__scrim" onClick={onClose} />
      <section className="submission__sheet">
        <button
          type="button"
          className="submission__close"
          onClick={onClose}
          aria-label="닫기 (Escape)"
        >
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="M8 8L32 32M32 8L8 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <p className="submission__head">editor desk</p>
        <h1 className="submission__title">
          {editorDesk === "artist"
            ? editingArtist
              ? "아티스트 수정"
              : "아티스트 등록"
            : editingAlbumId
              ? "앨범 수정"
              : "앨범 등록"}
        </h1>
        <p className="submission__lead">
          {editorDesk === "artist"
            ? "아티스트를 등록·수정하고, 앨범이 없는 기록은 안전하게 정리할 수 있습니다."
            : "등록된 아티스트를 선택해 새 기록을 남기거나 기존 앨범을 불러와 수정할 수 있습니다."}
        </p>

        {access.status === "loading" && (
          <p className="submission__notice">편집 권한을 확인하는 중…</p>
        )}

        {access.status === "unconfigured" && (
          <p className="submission__notice" role="alert">
            Supabase 공개 연결 정보가 없어 등록 화면을 사용할 수 없습니다. `.env.local`을 확인해 주세요.
          </p>
        )}

        {access.status === "error" && (
          <div className="submission__notice" role="alert">
            <p>편집 권한을 확인하지 못했습니다: {access.message}</p>
            <button type="button" className="submission__text-button" onClick={() => void refreshAccess()}>
              다시 확인
            </button>
          </div>
        )}

        {access.status === "signed-out" && (
          <form className="submission__login" onSubmit={handleLogin}>
            <p>등록하려면 편집자 계정으로 로그인해 주세요.</p>
            <label>
              이메일
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {loginError && <p className="submission__error" role="alert">{loginError}</p>}
            <button type="submit" className="submission__primary" disabled={loggingIn}>
              {loggingIn ? "로그인 중…" : "편집자 로그인"}
            </button>
          </form>
        )}

        {access.status === "forbidden" && (
          <section className="submission__notice" role="alert">
            <p>
              {access.email ?? "현재 계정"}은(는) 편집자로 등록되어 있지 않습니다. Supabase의
              `public.editors`에 이 계정의 사용자 ID를 추가해 주세요.
            </p>
            <button type="button" className="submission__text-button" onClick={() => void handleSignOut()}>
              다른 계정으로 로그인
            </button>
          </section>
        )}

        {access.status === "editor" && (
          <section className="submission__form">
            <div className="submission__account">
              <span>{access.email ?? "편집자"}로 로그인됨</span>
              <button type="button" onClick={() => void handleSignOut()}>로그아웃</button>
            </div>

            <div className="submission__tabs" role="tablist" aria-label="등록 종류">
              <button
                type="button"
                role="tab"
                aria-selected={editorDesk === "album"}
                className={editorDesk === "album" ? "is-active" : undefined}
                onClick={() => setEditorDesk("album")}
              >
                앨범 등록
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editorDesk === "artist"}
                className={editorDesk === "artist" ? "is-active" : undefined}
                onClick={() => setEditorDesk("artist")}
              >
                아티스트 관리
              </button>
            </div>

            {editorDesk === "artist" ? (
              <form className="submission__artist-form" onSubmit={handleArtistSubmit}>
                <fieldset>
                  <legend>{editingArtist ? "아티스트 수정" : "아티스트 등록"}</legend>
                  <label>
                    아티스트 이름 <b>*</b>
                    <input
                      value={artistName}
                      onChange={(event) => setArtistName(event.target.value)}
                      placeholder="예: 김사월"
                      autoFocus
                      required
                    />
                  </label>
                  {artistError && (
                    <p className="submission__error" role="alert">
                      {artistError}
                    </p>
                  )}
                  <div className="submission__actions">
                    <button
                      type="button"
                      className="submission__cancel"
                      onClick={editingArtist ? cancelArtistEdit : () => setEditorDesk("album")}
                    >
                      {editingArtist ? "수정 취소" : "앨범 등록으로"}
                    </button>
                    <button type="submit" className="submission__primary" disabled={savingArtist}>
                      {savingArtist ? "저장 중…" : editingArtist ? "수정 저장" : "아티스트 등록"}
                    </button>
                  </div>
                </fieldset>

                <section className="submission__artist-list" aria-label="등록된 아티스트">
                  <div>
                    <strong>등록된 아티스트</strong>
                    <button
                      type="button"
                      className="submission__text-button"
                      onClick={() => void loadEditorArtists()}
                      disabled={artistsLoading}
                    >
                      {artistsLoading ? "불러오는 중…" : "목록 새로고침"}
                    </button>
                  </div>
                  {artistsError && (
                    <p className="submission__error" role="alert">
                      아티스트를 불러오지 못했습니다: {artistsError}
                    </p>
                  )}
                  {!artistsError && (
                    <ul>
                      {editorArtists.map((artist) => (
                        <li key={artist.id}>
                          <div className="submission__artist-summary">
                            <strong>{artist.name}</strong>
                            <span>
                              {artist.albumCount === null
                                ? "앨범 수 확인 필요"
                                : `앨범 ${artist.albumCount}장`}
                            </span>
                          </div>
                          <div className="submission__artist-actions">
                            <button
                              type="button"
                              onClick={() => startArtistEdit(artist)}
                              disabled={deletingArtistId === artist.id}
                              aria-label={`${artist.name} 수정`}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteArtist(artist)}
                              disabled={artist.albumCount !== 0 || deletingArtistId === artist.id}
                              title={
                                artist.albumCount === null
                                  ? "앨범 수를 확인할 수 없습니다. 최신 마이그레이션을 적용해 주세요."
                                  : artist.albumCount > 0
                                    ? "앨범이 연결된 아티스트는 삭제할 수 없습니다."
                                    : undefined
                              }
                              aria-label={`${artist.name} 삭제`}
                            >
                              {deletingArtistId === artist.id ? "삭제 중…" : "삭제"}
                            </button>
                          </div>
                        </li>
                      ))}
                      {!artistsLoading && editorArtists.length === 0 && (
                        <li>아직 등록된 아티스트가 없습니다.</li>
                      )}
                    </ul>
                  )}
                </section>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="submission__workspace">
              <label>
                기존 앨범 불러오기
                <select
                  value={editingAlbumId ?? ""}
                  onChange={(event) => selectEditorAlbum(event.target.value)}
                  disabled={albumsLoading}
                >
                  <option value="">새 앨범 등록</option>
                  {editorAlbums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.artistName} — {album.title} ({album.year})
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="submission__text-button" onClick={() => void loadEditorAlbums()} disabled={albumsLoading}>
                {albumsLoading ? "불러오는 중…" : "목록 새로고침"}
              </button>
              {editingAlbumId && (
                <button type="button" className="submission__text-button" onClick={resetToNewAlbum}>
                  새 앨범으로 전환
                </button>
              )}
            </div>
            {albumsError && <p className="submission__error" role="alert">기존 앨범을 불러오지 못했습니다: {albumsError}</p>}

            <fieldset>
              <legend>앨범 정보</legend>
              <div className="submission__grid">
                <label>
                  아티스트 <b>*</b>
                  <select
                    value={draft.artistName}
                    onChange={(event) => setDraft((current) => ({ ...current, artistName: event.target.value }))}
                    required
                    disabled={artistsLoading}
                  >
                    <option value="">{artistsLoading ? "아티스트 불러오는 중…" : "등록된 아티스트 선택"}</option>
                    {editorArtists.map((artist) => (
                      <option key={artist.id} value={artist.name}>{artist.name}</option>
                    ))}
                  </select>
                  {artistsError && <small className="submission__field-error">아티스트 목록을 불러오지 못했습니다.</small>}
                </label>
                <label>
                  앨범 제목 <b>*</b>
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="예: Romance"
                    required
                  />
                </label>
                <label>
                  레이블
                  <input
                    value={draft.label}
                    onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                    placeholder="예: Universal Music"
                  />
                </label>
                <label>
                  발매 연도 <b>*</b>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={draft.year}
                    onChange={(event) => setDraft((current) => ({ ...current, year: event.target.value }))}
                    required
                  />
                </label>
                <div className="submission__wide submission__cover">
                  <label
                    className={`submission__cover-drop${coverDropActive ? " is-active" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (!uploadingCover) setCoverDropActive(true);
                    }}
                    onDragLeave={() => setCoverDropActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setCoverDropActive(false);
                      void handleCoverFile(event.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void handleCoverFile(file);
                      }}
                      disabled={uploadingCover}
                    />
                    <span>{uploadingCover ? "커버 업로드 중…" : "커버 파일을 끌어놓거나 선택"}</span>
                    <small>JPG · PNG · WebP / 최대 5MB</small>
                  </label>
                  <div className="submission__cover-preview">
                    {coverPreview ? (
                      <img src={coverPreview} alt="커버 미리보기" />
                    ) : (
                      <span>cover preview</span>
                    )}
                  </div>
                  <label className="submission__cover-path">
                    커버 URL 또는 Storage 경로
                    <input
                      value={draft.coverPath}
                      onChange={(event) => {
                        setLocalCoverPreview(null);
                        setDraft((current) => ({ ...current, coverPath: event.target.value }));
                      }}
                      placeholder="https://… 또는 covers/album.webp"
                    />
                  </label>
                  {coverUploadError && <p className="submission__cover-error" role="alert">{coverUploadError}</p>}
                </div>
                <label className="submission__wide">
                  앨범 소개
                  <textarea
                    rows={3}
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="앨범을 짧게 소개해 주세요."
                  />
                </label>
              </div>
              <div className="submission__options">
                <label className="submission__check">
                  <input
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))}
                  />
                  홈 벽에 표시
                </label>
                <label className="submission__sort">
                  홈 정렬 순서
                  <input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                  />
                </label>
                <span>홈 벽은 정렬 순서가 앞선 최대 12개 앨범을 보여줍니다.</span>
              </div>
            </fieldset>

            <fieldset>
              <legend>수록곡</legend>
              <div className="submission__tracks">
                {draft.tracks.map((track, index) => (
                  <section className="submission__track" key={track.key}>
                    <div className="submission__track-head">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <button
                        type="button"
                        onClick={() => removeTrack(track.key)}
                        disabled={draft.tracks.length === 1}
                        aria-label={`${index + 1}번 수록곡 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                    <div className="submission__grid">
                      <label>
                        곡 제목 <b>*</b>
                        <input
                          value={track.title}
                          onChange={(event) => updateTrack(track.key, "title", event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        길이 <b>*</b>
                        <input
                          value={track.duration}
                          onChange={(event) => updateTrack(track.key, "duration", event.target.value)}
                          placeholder="03:42"
                          inputMode="numeric"
                          required
                        />
                      </label>
                      <label className="submission__wide">
                        YouTube 영상 ID 또는 URL
                        <input
                          value={track.youtubeReference}
                          onChange={(event) => updateTrack(track.key, "youtubeReference", event.target.value)}
                          placeholder="https://youtu.be/…"
                        />
                      </label>
                      <label>
                        시작 초
                        <input
                          type="number"
                          min="0"
                          value={track.youtubeStart}
                          onChange={(event) => updateTrack(track.key, "youtubeStart", event.target.value)}
                        />
                      </label>
                      <label>
                        종료 초
                        <input
                          type="number"
                          min="0"
                          value={track.youtubeEnd}
                          onChange={(event) => updateTrack(track.key, "youtubeEnd", event.target.value)}
                        />
                      </label>
                      <label className="submission__wide">
                        곡 메모
                        <textarea
                          rows={2}
                          value={track.description}
                          onChange={(event) => updateTrack(track.key, "description", event.target.value)}
                        />
                      </label>
                    </div>
                  </section>
                ))}
              </div>
              <button type="button" className="submission__add-track" onClick={addTrack}>
                + 수록곡 추가
              </button>
            </fieldset>

            {formErrors.length > 0 && (
              <ul className="submission__errors" role="alert">
                {formErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
            {notice && <p className="submission__success" role="status">{notice}</p>}
            <div className="submission__actions">
              <button type="button" className="submission__cancel" onClick={onClose}>취소</button>
              <button type="submit" className="submission__primary" disabled={saving}>
                {saving ? "저장 중…" : editingAlbumId ? "수정 저장" : "앨범 등록"}
              </button>
            </div>
              </form>
            )}
          </section>
        )}
      </section>
    </div>
  );
}
