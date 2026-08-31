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
const ARTIST_ALBUMS = DATABASE_ALBUMS.slice(0, 3).map((album, index) => ({
  ...album,
  artist: index < 2 ? "Shared Artist" : "Other Artist",
}));

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

  it("수록곡을 누르면 재생과 함께 곡 메모를 펼치고 다시 누르면 닫는다", async () => {
    const memo = "곡을 들은 뒤 남겨 둔 개인적인 감상 메모입니다.";
    const album = {
      ...DATABASE_ALBUMS[0],
      tracks: DATABASE_ALBUMS[0].tracks.map((track, index) =>
        index === 0 ? { ...track, definition: memo } : track,
      ),
    };
    featuredAlbumsMock.mockResolvedValue([album]);

    render(<MainPage />);
    await screen.findByLabelText(`${album.title} — ${album.artist}`);
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    const trackButton = within(dialog).getByRole("button", {
      name: `${album.tracks[0].title} 재생 및 곡 메모 열기`,
    });
    fireEvent.click(trackButton);

    expect(trackButton).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getByText(memo)).toBeInTheDocument();
    expect(await screen.findByTitle(`${album.tracks[0].title} YouTube 재생`)).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: `${album.tracks[0].title} 재생 및 곡 메모 닫기`,
      }),
    );
    expect(within(dialog).queryByText(memo)).not.toBeInTheDocument();
  });

  it("YouTube 정보가 없는 수록곡도 곡 메모는 열어볼 수 있다", async () => {
    const memo = "재생 정보 없이도 읽을 수 있는 곡 메모입니다.";
    const album = {
      ...DATABASE_ALBUMS[0],
      tracks: DATABASE_ALBUMS[0].tracks.map((track, index) =>
        index === 0
          ? { ...track, definition: memo, youtubeVideoId: undefined }
          : track,
      ),
    };
    featuredAlbumsMock.mockResolvedValue([album]);

    render(<MainPage />);
    await screen.findByLabelText(`${album.title} — ${album.artist}`);
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    const trackButton = within(dialog).getByRole("button", {
      name: `${album.tracks[0].title} 곡 메모 열기`,
    });
    expect(trackButton).toBeEnabled();
    fireEvent.click(trackButton);

    expect(trackButton).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getByText(memo)).toBeInTheDocument();
    expect(screen.queryByLabelText("미니 플레이어")).not.toBeInTheDocument();
  });

  it("윤마치의 상생관계에는 조사 기반의 전용 상세 디자인을 적용한다", async () => {
    const sangsaeng = {
      ...DATABASE_ALBUMS[0],
      title: "상생관계",
      artist: "윤마치",
      description: "",
    };
    featuredAlbumsMock.mockResolvedValue([sangsaeng]);

    render(<MainPage />);
    await screen.findByLabelText("상생관계 — 윤마치");
    fireEvent.click(firstCard("상생관계", "윤마치"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-album-design", "sangsaeng");
    expect(dialog).toHaveTextContent("나를 작아지게 했던 마음이");
    expect(dialog).toHaveTextContent("비교");
    expect(dialog).toHaveTextContent("다시 움직이기");
  });

  it("한로로의 자몽살구클럽에는 조사 기반의 전용 상세 디자인을 적용한다", async () => {
    const jamong = {
      ...DATABASE_ALBUMS[1],
      title: "자몽살구클럽",
      artist: "한로로",
      description: "",
    };
    featuredAlbumsMock.mockResolvedValue([jamong]);

    render(<MainPage />);
    await screen.findByLabelText("자몽살구클럽 — 한로로");
    fireEvent.click(firstCard("자몽살구클럽", "한로로"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-album-design", "jamong");
    expect(dialog).toHaveTextContent("오늘을 건너");
    expect(dialog).toHaveTextContent("손 내밀기");
    expect(dialog).toHaveTextContent("내일로 가기");
  });

  it("Tokai의 shining.에는 조사 기반의 전용 상세 디자인을 적용한다", async () => {
    const shining = {
      ...DATABASE_ALBUMS[2],
      title: "shining.",
      artist: "Tokai",
      description: "",
    };
    featuredAlbumsMock.mockResolvedValue([shining]);

    render(<MainPage />);
    await screen.findByLabelText("shining. — Tokai");
    fireEvent.click(firstCard("shining.", "Tokai"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-album-design", "shining");
    expect(dialog).toHaveTextContent("한 번 더, 함께 빛나기");
    expect(dialog).toHaveTextContent("타오르기");
    expect(dialog).toHaveTextContent("함께 빛나기");
  });

  it("유령서점의 유령서점에는 조사 기반의 전용 상세 디자인을 적용한다", async () => {
    const ghostBookstore = {
      ...DATABASE_ALBUMS[3],
      title: "유령서점",
      artist: "유령서점",
      description: "",
    };
    featuredAlbumsMock.mockResolvedValue([ghostBookstore]);

    render(<MainPage />);
    await screen.findByLabelText("유령서점 — 유령서점");
    fireEvent.click(firstCard("유령서점", "유령서점"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-album-design", "ghost-bookstore");
    expect(dialog).toHaveTextContent("잊힌 문장을 찾듯");
    expect(dialog).toHaveTextContent("불빛");
    expect(dialog).toHaveTextContent("항해");
  });

  it("전용 앨범은 홈 카드에서도 각자 다른 시각 언어를 사용한다", async () => {
    const sangsaeng = {
      ...DATABASE_ALBUMS[0],
      title: "상생관계",
      artist: "윤마치",
    };
    const jamong = {
      ...DATABASE_ALBUMS[1],
      title: "자몽살구클럽",
      artist: "한로로",
    };
    const shining = {
      ...DATABASE_ALBUMS[2],
      title: "shining.",
      artist: "Tokai",
    };
    const ghostBookstore = {
      ...DATABASE_ALBUMS[3],
      title: "유령서점",
      artist: "유령서점",
    };
    featuredAlbumsMock.mockResolvedValue([sangsaeng, jamong, shining, ghostBookstore]);

    render(<MainPage />);

    expect(await screen.findByLabelText("상생관계 — 윤마치")).toHaveAttribute(
      "data-album-design",
      "sangsaeng",
    );
    expect(await screen.findByLabelText("자몽살구클럽 — 한로로")).toHaveAttribute(
      "data-album-design",
      "jamong",
    );
    expect(await screen.findByLabelText("shining. — Tokai")).toHaveAttribute(
      "data-album-design",
      "shining",
    );
    expect(await screen.findByLabelText("유령서점 — 유령서점")).toHaveAttribute(
      "data-album-design",
      "ghost-bookstore",
    );
  });

  it("모달을 닫아도 YouTube 재생은 미니 플레이어에서 계속된다", async () => {
    await renderLoadedPage();
    const album = DATABASE_ALBUMS[0];
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "앨범 듣기" }));

    const player = await screen.findByTitle(
      `${album.tracks[0].title} YouTube 재생`,
    );
    expect(player).toHaveAttribute("data-video-id", "M7lc1UVf-VE");
    expect(player).toHaveAttribute("data-start", "12");
    expect(player).toHaveAttribute("data-end", "180");

    expect(screen.getByLabelText("미니 플레이어")).toHaveTextContent(album.tracks[0].title);

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByTitle(`${album.tracks[0].title} YouTube 재생`),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "재생 종료" }));
    expect(
      screen.queryByTitle(`${album.tracks[0].title} YouTube 재생`),
    ).not.toBeInTheDocument();
  });

  it("재생 대상과 볼륨을 새로고침 뒤에 복원한다", async () => {
    const firstPage = render(<MainPage />);
    const album = DATABASE_ALBUMS[0];
    await screen.findByLabelText(`${album.title} — ${album.artist}`);
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "앨범 듣기" }));
    await screen.findByTitle(`${album.tracks[0].title} YouTube 재생`);
    fireEvent.change(screen.getByRole("slider", { name: "볼륨" }), {
      target: { value: "38" },
    });

    await waitFor(() =>
      expect(window.localStorage.getItem("liner-notes:playback-session")).toContain('"volume":38'),
    );
    firstPage.unmount();

    render(<MainPage />);
    await screen.findByLabelText(`${album.title} — ${album.artist}`);
    expect(
      await screen.findByTitle(`${album.tracks[0].title} YouTube 재생`),
    ).toHaveAttribute("data-video-id", "M7lc1UVf-VE");
    expect(screen.getByRole("slider", { name: "볼륨" })).toHaveValue("38");
  });

  it("YouTube 임베드가 차단되면 원인을 안내한다", async () => {
    await renderLoadedPage();
    const album = DATABASE_ALBUMS[0];
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "앨범 듣기" }));
    const errorButton = document.querySelector(
      '[aria-label="YouTube 오류 시뮬레이션"]',
    );
    expect(errorButton).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(errorButton!);

    expect(screen.getByRole("alert")).toHaveTextContent(
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

  it("카드의 아티스트를 누르면 같은 아티스트 앨범만 인덱스로 연다", async () => {
    featuredAlbumsMock.mockResolvedValue(ARTIST_ALBUMS);
    render(<MainPage />);
    await screen.findByLabelText(`${ARTIST_ALBUMS[0].title} — Shared Artist`);

    const card = screen.getByLabelText(`${ARTIST_ALBUMS[0].title} — Shared Artist`);
    fireEvent.click(
      within(card).getByRole("button", { name: "Shared Artist의 앨범 보기" }),
    );

    const catalog = await screen.findByRole("dialog", { name: "카탈로그 인덱스" });
    expect(catalog).toHaveTextContent("02 records");
    expect(catalog).toHaveTextContent(ARTIST_ALBUMS[0].title);
    expect(catalog).toHaveTextContent(ARTIST_ALBUMS[1].title);
    expect(catalog).not.toHaveTextContent(ARTIST_ALBUMS[2].title);

    fireEvent.click(screen.getByRole("button", { name: "아티스트 필터 해제" }));
    expect(catalog).toHaveTextContent("03 records");
    expect(catalog).toHaveTextContent(ARTIST_ALBUMS[2].title);
  });

  it("앨범 상세의 아티스트를 누르면 같은 아티스트의 인덱스로 이동한다", async () => {
    featuredAlbumsMock.mockResolvedValue(ARTIST_ALBUMS);
    render(<MainPage />);
    await screen.findByLabelText(`${ARTIST_ALBUMS[0].title} — Shared Artist`);
    fireEvent.click(screen.getByLabelText(`${ARTIST_ALBUMS[0].title} — Shared Artist`));

    const detail = await screen.findByRole("dialog", {
      name: `${ARTIST_ALBUMS[0].title} 앨범 상세`,
    });
    fireEvent.click(
      within(detail).getByRole("button", { name: "Shared Artist의 앨범 보기" }),
    );

    const catalog = await screen.findByRole("dialog", { name: "카탈로그 인덱스" });
    expect(catalog).toHaveTextContent("02 records");
    expect(catalog).not.toHaveTextContent(ARTIST_ALBUMS[2].title);
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
    expect(screen.getByText("발견")).toBeInTheDocument();
    expect(screen.getAllByText(/곡 메모/)).toHaveLength(2);

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
