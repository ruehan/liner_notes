import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
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
  onPrev?: () => void;
  onNext?: () => void;
}

function youtubeOptions(track: Track): YouTubeProps["opts"] {
  return {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      playsinline: 1,
      rel: 0,
      ...(track.youtubeStartSeconds !== undefined
        ? { start: track.youtubeStartSeconds }
        : {}),
      ...(track.youtubeEndSeconds !== undefined
        ? { end: track.youtubeEndSeconds }
        : {}),
    },
  };
}

function youtubeErrorMessage(code: number): string {
  if (code === 2) return "YouTube 영상 ID 형식이 올바르지 않습니다.";
  if (code === 5) return "현재 브라우저에서 이 영상을 재생할 수 없습니다.";
  if (code === 100) return "삭제되었거나 비공개 처리된 영상입니다.";
  if (code === 101 || code === 150) return "게시자가 외부 사이트 재생을 허용하지 않은 영상입니다.";
  return "YouTube 재생기를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function DetailSheet({
  entry,
  favorited = false,
  navPos = null,
  onClose,
  onToggleFavorite,
  onPrev,
  onNext,
}: Props) {
  const [shown, setShown] = useState<OpenEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (entry) {
      if (closing.current) clearTimeout(closing.current);
      setPlayingTrack(null);
      setPlayerError(null);
      setPlayerReady(false);
      setShown(entry);
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
  const firstPlayableTrack = album.tracks.find((track) =>
    normalizeYouTubeVideoId(track.youtubeVideoId),
  );
  const playingVideoId = playingTrack
    ? normalizeYouTubeVideoId(playingTrack.youtubeVideoId)
    : undefined;

  const startPlayback = (track: Track) => {
    if (!normalizeYouTubeVideoId(track.youtubeVideoId)) return;
    setPlayerError(null);
    setPlayerReady(false);
    setPlayingTrack(track);
  };

  return (
    <div className={`detail${open ? " is-open" : ""}`}>
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
        >
          <div className="detail__body">
            <h1 className="detail__title">{album.title}</h1>
            <p className="detail__artist">{album.artist}</p>
            <p className="detail__phon">{theme.phon}</p>
            <p className="detail__def">
              <b>n.</b>
              <span>{album.description}</span>
            </p>
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

                  return (
                    <li
                      key={track.id}
                      className={track.id === playingTrack?.id ? "is-playing" : undefined}
                    >
                      <button
                        type="button"
                        className="detail__track"
                        disabled={!videoId}
                        onClick={() => startPlayback(track)}
                        aria-label={
                          videoId
                            ? `${track.title} 재생`
                            : `${track.title} — YouTube 영상 미등록`
                        }
                      >
                        <span className="detail__track-no">{String(index + 1).padStart(2, "0")}</span>
                        <span className="detail__track-title">
                          {track.title}
                          {videoId && <span aria-hidden="true"> ▶</span>}
                        </span>
                        <span className="detail__track-length">{track.length}</span>
                      </button>
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
            {playingTrack && playingVideoId ? (
              <section className="detail__player" aria-label="YouTube 재생기">
                <YouTube
                  key={playingTrack.id}
                  title={`${playingTrack.title} YouTube 재생`}
                  videoId={playingVideoId}
                  className="detail__youtube"
                  iframeClassName="detail__youtube-frame"
                  opts={youtubeOptions(playingTrack)}
                  onReady={() => setPlayerReady(true)}
                  onError={(event) => {
                    setPlayerReady(false);
                    setPlayerError(youtubeErrorMessage(event.data));
                  }}
                />
                {!playerReady && !playerError && (
                  <p className="detail__player-loading">YouTube 재생기 불러오는 중…</p>
                )}
                {playerError && <p className="detail__player-error" role="alert">{playerError}</p>}
                <div className="detail__player-meta">
                  <span>now playing · {playingTrack.title}</span>
                  <button type="button" onClick={() => {
                    setPlayerReady(false);
                    setPlayerError(null);
                    setPlayingTrack(null);
                  }}>
                    재생 닫기
                  </button>
                </div>
              </section>
            ) : (
              <>
                <div className="detail__frame detail__frame--back" aria-hidden="true">
                  <CoverArt track={album.cover} imageUrl={album.coverUrl} />
                </div>
                <div className="detail__frame">
                  <CoverArt track={album.cover} imageUrl={album.coverUrl} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
