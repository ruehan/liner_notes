import { useEffect, useRef, useState } from "react";
import {
  GENRES,
  CoverArt,
  normalizeYouTubeVideoId,
  type Album,
  type Track,
} from "@/entities/track";
import "./detail.css";

export interface OpenEntry {
  album: Album;
  catalog: string;
  favoriteKey: string;
}

interface Props {
  entry: OpenEntry | null;
  favorited?: boolean;
  navPos?: { index: number; total: number } | null;
  onClose: () => void;
  onToggleFavorite?: () => void;
  onOpenArtist?: (artist: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  playingTrackId?: string | null;
  onPlayTrack?: (track: Track) => void;
}

function isSangsaengGwangye(album: Album): boolean {
  return album.title.trim() === "상생관계" && album.artist.trim() === "윤마치";
}

function isJamongSalguClub(album: Album): boolean {
  return album.title.trim() === "자몽살구클럽" && album.artist.trim() === "한로로";
}

function isShining(album: Album): boolean {
  return album.title.trim() === "shining." && album.artist.trim() === "Tokai";
}

function isGhostBookstore(album: Album): boolean {
  return album.title.trim() === "유령서점" && album.artist.trim() === "유령서점";
}

export function DetailSheet({
  entry,
  favorited = false,
  navPos = null,
  onClose,
  onToggleFavorite,
  onOpenArtist,
  onPrev,
  onNext,
  playingTrackId = null,
  onPlayTrack,
}: Props) {
  const [shown, setShown] = useState<OpenEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (entry) {
      if (closing.current) clearTimeout(closing.current);
      setShown(entry);
      setExpandedTrackId(null);
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setOpen(true)),
      );
      return () => cancelAnimationFrame(raf);
    }
    if (shown) {
      setOpen(false);
      closing.current = setTimeout(() => setShown(null), 420);
      return () => {
        if (closing.current) clearTimeout(closing.current);
      };
    }
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;

  const { album } = shown;
  const theme = GENRES[album.genre];
  const sangsaengGwangye = isSangsaengGwangye(album);
  const jamongSalguClub = isJamongSalguClub(album);
  const shining = isShining(album);
  const ghostBookstore = isGhostBookstore(album);
  const firstPlayableTrack = album.tracks.find((track) =>
    normalizeYouTubeVideoId(track.youtubeVideoId),
  );

  const startPlayback = (track: Track) => {
    if (!normalizeYouTubeVideoId(track.youtubeVideoId)) return;
    onPlayTrack?.(track);
  };

  return (
    <div
      className={`detail${sangsaengGwangye ? " detail--sangsaeng" : ""}${jamongSalguClub ? " detail--jamong" : ""}${shining ? " detail--shining" : ""}${ghostBookstore ? " detail--ghost-bookstore" : ""}${open ? " is-open" : ""}`}
    >
      <div className="detail__scrim" onClick={onClose} />
      <div className="detail__ground">
        <button
          type="button"
          className="detail__close"
          aria-label="닫기 (Escape)"
          onClick={onClose}
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

        <section
          className="detail__card"
          role="dialog"
          aria-modal="true"
          aria-label={`${album.title} 앨범 상세`}
          {...(sangsaengGwangye
            ? { "data-album-design": "sangsaeng" }
            : jamongSalguClub
              ? { "data-album-design": "jamong" }
              : shining
                ? { "data-album-design": "shining" }
                : ghostBookstore
                  ? { "data-album-design": "ghost-bookstore" }
                : {})}
        >
          <div className="detail__body">
            {sangsaengGwangye && (
              <p className="detail__sangsaeng-kicker">five small scenes, one moving heart</p>
            )}
            {jamongSalguClub && (
              <p className="detail__jamong-kicker">a club for tomorrow</p>
            )}
            {shining && (
              <p className="detail__shining-kicker">youth trilogy / final chorus</p>
            )}
            {ghostBookstore && (
              <p className="detail__ghost-bookstore-kicker">after midnight / seven shelves</p>
            )}
            <h1
              className={`detail__title${sangsaengGwangye ? " detail__title--sangsaeng" : ""}${jamongSalguClub ? " detail__title--jamong" : ""}${shining ? " detail__title--shining" : ""}${ghostBookstore ? " detail__title--ghost-bookstore" : ""}`}
            >
              {sangsaengGwangye ? (
                <>
                  <span>상생</span>
                  <span>관계</span>
                </>
              ) : jamongSalguClub ? (
                <>
                  <span>자몽</span>
                  <span>살구</span>
                  <span>클럽</span>
                </>
              ) : shining ? (
                <>
                  <span>shining</span>
                  <span>.</span>
                </>
              ) : ghostBookstore ? (
                <>
                  <span>유령</span>
                  <span>서점</span>
                </>
              ) : (
                album.title
              )}
            </h1>
            <button
              type="button"
              className="detail__artist"
              onClick={() => onOpenArtist?.(album.artist)}
              disabled={!onOpenArtist}
              aria-label={`${album.artist}의 앨범 보기`}
            >
              {album.artist}
              {onOpenArtist && <span aria-hidden="true"> · 모든 앨범 보기</span>}
            </button>
            <p className="detail__phon">{theme.phon}</p>
            {sangsaengGwangye && (
              <section className="detail__sangsaeng-note" aria-label="앨범의 중심 생각">
                <p>
                  나를 작아지게 했던 마음이, 끝내 다음 문장을 쓰게 하는 힘이 되기도 한다.
                </p>
                <ol aria-label="감정의 흐름">
                  <li>비교</li>
                  <li>머뭇거림</li>
                  <li>다시 움직이기</li>
                </ol>
              </section>
            )}
            {jamongSalguClub && (
              <section className="detail__jamong-note" aria-label="앨범의 중심 생각">
                <p>오늘을 건너, 서로의 내일에 닿는 일.</p>
                <ol aria-label="이야기의 흐름">
                  <li>손 내밀기</li>
                  <li>곁에 있기</li>
                  <li>내일로 가기</li>
                </ol>
              </section>
            )}
            {shining && (
              <section className="detail__shining-note" aria-label="앨범의 중심 생각">
                <p>한 번 더, 함께 빛나기 위해 내는 합주.</p>
                <ol aria-label="앨범의 흐름">
                  <li>타오르기</li>
                  <li>흔들리기</li>
                  <li>함께 빛나기</li>
                </ol>
              </section>
            )}
            {ghostBookstore && (
              <section className="detail__ghost-bookstore-note" aria-label="앨범의 중심 생각">
                <p>잊힌 문장을 찾듯, 우리는 서로의 안쪽을 더듬는다.</p>
                <ol aria-label="앨범의 흐름">
                  <li>불빛</li>
                  <li>흔들림</li>
                  <li>항해</li>
                </ol>
              </section>
            )}
            {album.description && (
              <p className="detail__def">
                <b>n.</b>
                <span>{album.description}</span>
              </p>
            )}
            {album.tags.length > 0 && (
              <div className="detail__tags">
                {album.tags.map((t, i) => (
                  <span
                    key={t}
                    className="detail__tag"
                    style={{ transform: `rotate(${i % 2 ? 1.2 : -1.4}deg)` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <dl className="detail__meta">
              <div>
                <dt>tracks</dt>
                <dd>{album.tracks.length} tracks</dd>
              </div>
              <div>
                <dt>label</dt>
                <dd>{album.label}</dd>
              </div>
              <div>
                <dt>year</dt>
                <dd>{album.year}</dd>
              </div>
              <div>
                <dt>runtime</dt>
                <dd>{album.runtime}</dd>
              </div>
            </dl>
            <section className="detail__tracklist">
              <p className="detail__tracklist-head">
                <span>tracklist</span>
                <span>{String(album.tracks.length).padStart(2, "0")} tracks</span>
              </p>
              <ol className="detail__tracks" aria-label="수록곡">
                {album.tracks.map((track, index) => {
                  const videoId = normalizeYouTubeVideoId(track.youtubeVideoId);
                  const hasNote = Boolean(track.definition.trim());
                  const expanded = expandedTrackId === track.id;
                  const noteId = `track-note-${track.id}`;
                  const canInteract = Boolean(videoId) || hasNote;

                  const trackActionLabel = videoId
                    ? hasNote
                      ? `${track.title} 재생 및 곡 메모 ${expanded ? "닫기" : "열기"}`
                      : `${track.title} 재생`
                    : hasNote
                      ? `${track.title} 곡 메모 ${expanded ? "닫기" : "열기"}`
                      : `${track.title} — YouTube 영상과 곡 메모 미등록`;

                  return (
                    <li
                      key={track.id}
                      className={track.id === playingTrackId ? "is-playing" : undefined}
                    >
                      <button
                        type="button"
                        className="detail__track"
                        disabled={!canInteract}
                        onClick={() => {
                          if (hasNote) {
                            setExpandedTrackId((current) =>
                              current === track.id ? null : track.id,
                            );
                          }
                          if (videoId) startPlayback(track);
                        }}
                        aria-label={trackActionLabel}
                        aria-expanded={hasNote ? expanded : undefined}
                        aria-controls={hasNote ? noteId : undefined}
                      >
                        <span className="detail__track-no">{String(index + 1).padStart(2, "0")}</span>
                        <span className="detail__track-title">
                          {track.title}
                          {videoId && <span aria-hidden="true"> ▶</span>}
                        </span>
                        <span className="detail__track-length">{track.length}</span>
                      </button>
                      {hasNote && expanded && (
                        <p id={noteId} className="detail__track-note">
                          {track.definition}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
            <div className="detail__actions">
              <button
                type="button"
                className="detail__play"
                disabled={!firstPlayableTrack}
                onClick={() => firstPlayableTrack && startPlayback(firstPlayableTrack)}
                title={firstPlayableTrack ? "YouTube에서 첫 수록곡 재생" : "YouTube 영상 ID가 필요합니다"}
              >
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 1.5v9L10.5 6z" fill="currentColor" />
                </svg>
                {firstPlayableTrack ? "앨범 듣기" : "재생 정보 없음"}
              </button>
              {onToggleFavorite && (
                <button
                  type="button"
                  className={`detail__fav${favorited ? " is-on" : ""}`}
                  aria-pressed={favorited}
                  onClick={onToggleFavorite}
                >
                  {favorited ? "♥ 수집됨" : "♡ 수집"}
                </button>
              )}
            </div>
            {navPos && navPos.total > 1 && (
              <div className="detail__nav">
                <button
                  type="button"
                  disabled={navPos.index === 0}
                  onClick={onPrev}
                >
                  ← prev
                </button>
                <span>
                  {String(navPos.index + 1).padStart(2, "0")} /{" "}
                  {String(navPos.total).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  disabled={navPos.index === navPos.total - 1}
                  onClick={onNext}
                >
                  next →
                </button>
              </div>
            )}
          </div>

          <div className="detail__art">
            {jamongSalguClub && (
              <p className="detail__jamong-ticket" aria-hidden="true">
                ticket / tomorrow
              </p>
            )}
            {shining && (
              <p className="detail__shining-stamp" aria-hidden="true">
                we are the light
              </p>
            )}
            {ghostBookstore && (
              <p className="detail__ghost-bookstore-stamp" aria-hidden="true">
                return by dawn
              </p>
            )}
            <div className="detail__frame detail__frame--back" aria-hidden="true">
              <CoverArt track={album.cover} imageUrl={album.coverUrl} />
            </div>
            <div className="detail__frame">
              <CoverArt track={album.cover} imageUrl={album.coverUrl} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
