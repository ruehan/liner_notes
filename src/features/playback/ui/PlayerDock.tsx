import { useCallback, useEffect, useRef, useState } from "react";
import YouTube, { type YouTubePlayer, type YouTubeProps } from "react-youtube";
import { CoverArt, normalizeYouTubeVideoId } from "@/entities/track";
import type { PlaybackItem } from "../model/playback";
import "./player-dock.css";

interface Props {
  item: PlaybackItem | null;
  canPrev: boolean;
  canNext: boolean;
  volume: number;
  resumeSeconds: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (volume: number) => void;
  onProgress: (trackId: string, seconds: number) => void;
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

function safePlayerCall<T>(call: () => T | Promise<T>): Promise<T | undefined> {
  try {
    return Promise.resolve(call()).catch(() => undefined);
  } catch {
    return Promise.resolve(undefined);
  }
}

export function PlayerDock({
  item,
  canPrev,
  canNext,
  volume,
  resumeSeconds,
  onClose,
  onPrev,
  onNext,
  onVolumeChange,
  onProgress,
}: Props) {
  const player = useRef<YouTubePlayer | null>(null);
  const playerTrackId = useRef<string | null>(null);
  const activeTrackId = useRef<string>("");
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = item ? normalizeYouTubeVideoId(item.track.youtubeVideoId) : undefined;
  const trackId = item?.track.id ?? "";
  activeTrackId.current = trackId;

  useEffect(() => {
    player.current = null;
    playerTrackId.current = null;
    setReady(false);
    setIsPlaying(false);
    setError(null);
    return () => {
      player.current = null;
      playerTrackId.current = null;
      if (activeTrackId.current === trackId) activeTrackId.current = "";
    };
  }, [trackId]);

  const reportProgress = useCallback(() => {
    const api = player.current;
    if (!api || playerTrackId.current !== trackId) return;
    void safePlayerCall(() => api.getCurrentTime()).then((seconds) => {
      if (typeof seconds === "number" && Number.isFinite(seconds)) {
        onProgress(trackId, Math.max(0, Math.floor(seconds)));
      }
    });
  }, [onProgress, trackId]);

  const togglePlayback = () => {
    if (!player.current || playerTrackId.current !== trackId || !ready) return;
    if (isPlaying) {
      void safePlayerCall(() => player.current!.pauseVideo());
    } else {
      void safePlayerCall(() => player.current!.playVideo());
    }
  };

  useEffect(() => {
    if (!ready || !isPlaying) return;
    const interval = window.setInterval(reportProgress, 5000);
    return () => window.clearInterval(interval);
  }, [isPlaying, ready, reportProgress]);

  if (!item || !videoId) return null;

  return (
    <aside className="player-dock" aria-label="미니 플레이어">
      <div className="player-dock__embed" aria-hidden="true">
        <YouTube
          title={`${item.track.title} YouTube 재생`}
          videoId={videoId}
          opts={playerOptions(item)}
          onReady={(event) => {
            if (activeTrackId.current !== item.track.id) return;
            const api = event.target;
            player.current = api;
            playerTrackId.current = item.track.id;
            const minimumStart = item.track.youtubeStartSeconds ?? 0;
            setReady(true);
            void (async () => {
              await safePlayerCall(() => api.setVolume(volume));
              if (player.current !== api || playerTrackId.current !== item.track.id) return;
              if (resumeSeconds > 0) {
                await safePlayerCall(() => api.seekTo(Math.max(resumeSeconds, minimumStart), true));
              }
              if (player.current !== api || playerTrackId.current !== item.track.id) return;
              await safePlayerCall(() => api.playVideo());
            })();
          }}
          onStateChange={(event) => {
            if (playerTrackId.current !== item.track.id) return;
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) {
              setIsPlaying(false);
              reportProgress();
            }
            if (event.data === 0) {
              setIsPlaying(false);
              if (canNext) onNext();
              else onProgress(item.track.id, 0);
            }
          }}
          onError={(event) => {
            if (activeTrackId.current !== item.track.id) return;
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
      <label className="player-dock__volume">
        <span aria-hidden="true">vol</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => {
            const nextVolume = Number(event.target.value);
            onVolumeChange(nextVolume);
            if (ready && player.current && playerTrackId.current === trackId) {
              void safePlayerCall(() => player.current!.setVolume(nextVolume));
            }
          }}
          aria-label="볼륨"
        />
      </label>
      <button type="button" className="player-dock__close" onClick={onClose} aria-label="재생 종료">
        ×
      </button>
      {item.track.definition.trim() && (
        <p className="player-dock__note" aria-label="현재 곡 메모">
          <span>track note</span>
          {item.track.definition}
        </p>
      )}
      {error && <p className="player-dock__error" role="alert">{error}</p>}
    </aside>
  );
}
