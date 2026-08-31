import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { generateTileAlbums } from "@/entities/track";
import type { PlaybackItem } from "../model/playback";
import { PlayerDock } from "./PlayerDock";

const playerApi = vi.hoisted(() => ({
  getCurrentTime: vi.fn(() => 48.7),
  pauseVideo: vi.fn(),
  playVideo: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
}));

vi.mock("react-youtube", () => ({
  default: ({
    onReady,
    onStateChange,
  }: {
    onReady?: (event: { target: typeof playerApi }) => void;
    onStateChange?: (event: { data: number }) => void;
  }) => (
    <>
      <button type="button" aria-label="YouTube 준비" onClick={() => onReady?.({ target: playerApi })} />
      <button type="button" aria-label="YouTube 일시정지" onClick={() => onStateChange?.({ data: 2 })} />
    </>
  ),
}));

const album = generateTileAlbums(0, 0, 789)[0];
const track = {
  ...album.tracks[0],
  definition: "현재 재생 중인 곡에 남긴 감상 메모입니다.",
  youtubeVideoId: "M7lc1UVf-VE",
};
const item: PlaybackItem = {
  album: { ...album, tracks: [track, ...album.tracks.slice(1)] },
  track,
};

describe("PlayerDock", () => {
  it("저장된 위치와 볼륨으로 YouTube 플레이어를 시작한다", async () => {
    const onVolumeChange = vi.fn();
    const onProgress = vi.fn();
    render(
      <PlayerDock
        item={item}
        canPrev={false}
        canNext={false}
        volume={42}
        resumeSeconds={87}
        onClose={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onVolumeChange={onVolumeChange}
        onProgress={onProgress}
      />,
    );

    expect(screen.getByLabelText("현재 곡 메모")).toHaveTextContent(track.definition);

    const readyButton = document.querySelector('[aria-label="YouTube 준비"]');
    expect(readyButton).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(readyButton!);
    await waitFor(() => {
      expect(playerApi.setVolume).toHaveBeenCalledWith(42);
      expect(playerApi.seekTo).toHaveBeenCalledWith(87, true);
      expect(playerApi.playVideo).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByRole("slider", { name: "볼륨" }), {
      target: { value: "31" },
    });
    expect(onVolumeChange).toHaveBeenCalledWith(31);
    expect(playerApi.setVolume).toHaveBeenCalledWith(31);

    const pauseButton = document.querySelector('[aria-label="YouTube 일시정지"]');
    expect(pauseButton).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(pauseButton!);
    await waitFor(() =>
      expect(onProgress).toHaveBeenCalledWith(track.id, 48),
    );
  });
});
