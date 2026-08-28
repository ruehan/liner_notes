import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
import { CoverArt, normalizeYouTubeVideoId } from "@/entities/track";
import type { PlaybackItem } from "../model/playback";
import "./player-dock.css";

interface PlayerApi {
  playVideo: () => void;
  pauseVideo: () => void;
}

interface Props {
  item: PlaybackItem | null;
  canPrev: boolean;
  canNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function playerOptions(item: PlaybackItem): YouTubeProps["opts"] {
  return {
    width: "1",
    height: "1",
    playerVars: {
      autoplay: 1,
      controls: 0,
      playsinline: 1,
      rel: 0,
      ...(item.track.youtubeStartSeconds !== undefined
        ? { start: item.track.youtubeStartSeconds }
        : {}),
      ...(item.track.youtubeEndSeconds !== undefined
        ? { end: item.track.youtubeEndSeconds }
        : {}),
    },
  };
}

function playerErrorMessage(code: number): string {
  if (code === 2) return "YouTube 영상 ID 형식이 올바르지 않습니다.";
  if (code === 5) return "현재 브라우저에서 이 영상을 재생할 수 없습니다.";
  if (code === 100) return "삭제되었거나 비공개 처리된 영상입니다.";
  if (code === 101 || code === 150) return "게시자가 외부 사이트 재생을 허용하지 않은 영상입니다.";
  return "YouTube 재생기를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function PlayerDock({ item, canPrev, canNext, onClose, onPrev, onNext }: Props) {
  const player = useRef<PlayerApi | null>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = item ? normalizeYouTubeVideoId(item.track.youtubeVideoId) : undefined;

  useEffect(() => {
    setReady(false);
    setIsPlaying(false);
    setError(null);
  }, [item?.track.id]);

  if (!item || !videoId) return null;

  const togglePlayback = () => {
    if (!player.current || !ready) return;
    if (isPlaying) player.current.pauseVideo();
    else player.current.playVideo();
  };

  return (
    <aside className="player-dock" aria-label="미니 플레이어">
      <div className="player-dock__embed" aria-hidden="true">
        <YouTube
          key={item.track.id}
          title={`${item.track.title} YouTube 재생`}
          videoId={videoId}
          opts={playerOptions(item)}
          onReady={(event) => {
            player.current = event.target as PlayerApi;
            setReady(true);
            event.target.playVideo();
          }}
          onStateChange={(event) => {
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);
            if (event.data === 0) {
              setIsPlaying(false);
              if (canNext) onNext();
            }
          }}
          onError={(event) => {
            setReady(false);
            setIsPlaying(false);
            setError(playerErrorMessage(event.data));
          }}
        />
      </div>

      <div className="player-dock__art" aria-hidden="true">
        <CoverArt track={item.album.cover} imageUrl={item.album.coverUrl} />
      </div>
      <div className="player-dock__meta">
        <span className="player-dock__eyebrow">now playing</span>
        <strong>{item.track.title}</strong>
        <span>{item.album.artist} · {item.album.title}</span>
      </div>
      <div className="player-dock__controls">
        <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="이전 수록곡">
          ↶
        </button>
        <button
          type="button"
          className="player-dock__toggle"
          onClick={togglePlayback}
          disabled={!ready || Boolean(error)}
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? "Ⅱ" : "▶"}
        </button>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label="다음 수록곡">
          ↷
        </button>
      </div>
      <button type="button" className="player-dock__close" onClick={onClose} aria-label="재생 종료">
        ×
      </button>
      {error && <p className="player-dock__error" role="alert">{error}</p>}
    </aside>
  );
}
