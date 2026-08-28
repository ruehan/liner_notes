import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { generateTileAlbums } from "@/entities/track";
import { saveFavorites } from "@/features/curation";
import { MainPage } from "./MainPage";

const featuredAlbumsMock = vi.hoisted(() => vi.fn());

vi.mock("@/entities/track/api/featured-albums", () => ({
  fetchFeaturedAlbums: featuredAlbumsMock,
}));

vi.mock("react-youtube", () => ({
  default: ({ videoId, title, opts, onError }: {
    videoId?: string;
    title?: string;
    opts?: { playerVars?: Record<string, number> };
    onError?: (event: { data: number }) => void;
  }) => (
    <>
      <iframe
        title={title}
        data-video-id={videoId}
        data-start={opts?.playerVars?.start}
        data-end={opts?.playerVars?.end}
      />
      <button type="button" aria-label="YouTube 오류 시뮬레이션" onClick={() => onError?.({ data: 150 })} />
    </>
  ),
}));

const SESSION_SEED = Math.floor(0.5 * 2_147_483_647);
const HOME_ALBUMS = generateTileAlbums(0, 0, SESSION_SEED);
const DATABASE_ALBUMS = HOME_ALBUMS.map((album, index) => {
  const tracks = album.tracks.map((track, trackIndex) =>
    index === 0 && trackIndex === 0
      ? {
          ...track,
          youtubeVideoId: "M7lc1UVf-VE",
          youtubeStartSeconds: 12,
          youtubeEndSeconds: 180,
        }
      : track,
  );
  return { ...album, id: `database-${index}`, tracks, cover: tracks[0] };
});

function firstCard(title: string, artist: string) {
  return screen.getAllByLabelText(`${title} — ${artist}`)[0];
}

async function renderLoadedPage() {
  render(<MainPage />);
  await screen.findByLabelText(`${DATABASE_ALBUMS[0].title} — ${DATABASE_ALBUMS[0].artist}`);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  featuredAlbumsMock.mockReset().mockResolvedValue(DATABASE_ALBUMS);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MainPage", () => {
  it("Supabase의 featured 앨범 12개를 홈 타일에 반영한다", async () => {
    featuredAlbumsMock.mockResolvedValue(DATABASE_ALBUMS);
    render(<MainPage />);

    await waitFor(() =>
      expect(
        screen.getByLabelText(`${DATABASE_ALBUMS[0].title} — ${DATABASE_ALBUMS[0].artist}`),
      ).toBeInTheDocument(),
    );
  });

  it("DB 앨범이 일부만 있으면 해당 앨범만 홈에 표시한다", async () => {
    featuredAlbumsMock.mockResolvedValue([DATABASE_ALBUMS[0]]);
    render(<MainPage />);

    await waitFor(() =>
      expect(
        screen.getByLabelText(`${DATABASE_ALBUMS[0].title} — ${DATABASE_ALBUMS[0].artist}`),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /^index/ })).toHaveTextContent("1");
    expect(
      screen.queryByLabelText(`${DATABASE_ALBUMS[1].title} — ${DATABASE_ALBUMS[1].artist}`),
    ).not.toBeInTheDocument();
  });

  it("DB 앨범 카드만 렌더하고 장르 필터는 표시하지 않는다", async () => {
    await renderLoadedPage();
    for (const album of DATABASE_ALBUMS) {
      expect(firstCard(album.title, album.artist)).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /^all/ })).not.toBeInTheDocument();
    expect(screen.queryByText("LNR-001")).not.toBeInTheDocument();
    expect(screen.queryByText("ambient")).not.toBeInTheDocument();
  });

  it("앨범 카드를 클릭하면 수록곡 모달이 열리고 Escape로 닫힌다", async () => {
    await renderLoadedPage();
    const album = DATABASE_ALBUMS[0];
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(album.title);
    expect(dialog).toHaveTextContent(album.artist);
    expect(within(dialog).getByRole("list", { name: "수록곡" })).toHaveTextContent(
      album.tracks[0].title,
    );
    expect(dialog).not.toHaveTextContent(/album no\./i);
    expect(dialog).not.toHaveTextContent("LNR-001");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("YouTube 정보가 있는 수록곡을 모달에서 재생한다", async () => {
    await renderLoadedPage();
    const album = DATABASE_ALBUMS[0];
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "앨범 듣기" }));

    const player = await within(dialog).findByTitle(
      `${album.tracks[0].title} YouTube 재생`,
    );
    expect(player).toHaveAttribute("data-video-id", "M7lc1UVf-VE");
    expect(player).toHaveAttribute("data-start", "12");
    expect(player).toHaveAttribute("data-end", "180");

    fireEvent.click(within(dialog).getByRole("button", { name: "재생 닫기" }));
    expect(
      within(dialog).queryByTitle(`${album.tracks[0].title} YouTube 재생`),
    ).not.toBeInTheDocument();
  });

  it("YouTube 임베드가 차단되면 원인을 안내한다", async () => {
    await renderLoadedPage();
    const album = DATABASE_ALBUMS[0];
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "앨범 듣기" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "YouTube 오류 시뮬레이션" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "게시자가 외부 사이트 재생을 허용하지 않은 영상입니다.",
    );
  });

  it("수집 토글이 동작하고 DB 앨범은 이미 인덱스에 있다", async () => {
    await renderLoadedPage();
    const album = DATABASE_ALBUMS[0];
    const card = firstCard(album.title, album.artist);
    fireEvent.click(within(card).getByRole("button", { name: "수집에 추가" }));
    expect(
      within(card).getByRole("button", { name: "수집에서 제거" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^index/ })).toHaveTextContent(
      "12",
    );
  });

  it("DB에 없는 타일 수집 기록은 인덱스에 표시하지 않는다", async () => {
    saveFavorites(["1,0:0"]);
    await renderLoadedPage();
    expect(screen.getByRole("button", { name: /^index/ })).toHaveTextContent(
      "12",
    );
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));
    expect(screen.queryByText("LNR-1.0-01")).not.toBeInTheDocument();
  });

  it("카탈로그에서 항목을 클릭하면 상세 모달이 열린다", async () => {
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));

    const album = DATABASE_ALBUMS[1];
    const slideTitle = screen
      .getAllByText(album.title)
      .find((el) => el.className.includes("catalog__slide-title"));
    expect(slideTitle).toBeDefined();
    fireEvent.click(slideTitle!.closest("button")!);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(album.artist);
  });

  it("순서대로 듣기로 열어 next 버튼으로 이동한다", async () => {
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));
    fireEvent.click(screen.getByRole("button", { name: /순서대로 듣기/ }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("01 / ");

    fireEvent.click(screen.getByRole("button", { name: /^next/ }));
    await waitFor(() =>
      expect(dialog).toHaveTextContent(DATABASE_ALBUMS[1].title),
    );
  });

  it("about 시트를 열고 닫는다", async () => {
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: /^about/ }));
    expect(screen.getByText("about this archive")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "← 벽으로 돌아가기" }));
    expect(screen.queryByText("about this archive")).not.toBeInTheDocument();
  });

  it("상단 add 버튼으로 앨범 등록 화면을 연다", async () => {
    await renderLoadedPage();
    fireEvent.click(screen.getByRole("button", { name: /^add/ }));

    expect(screen.getByRole("dialog", { name: "앨범 등록" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "앨범 등록" })).not.toBeInTheDocument();
  });
});
