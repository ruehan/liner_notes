import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { generateTileAlbums } from "@/entities/track";
import { saveFavorites } from "@/features/curation";
import { MainPage } from "./MainPage";

const SESSION_SEED = Math.floor(0.5 * 2_147_483_647);
const HOME_ALBUMS = generateTileAlbums(0, 0, SESSION_SEED);

function firstCard(title: string, artist: string) {
  return screen.getAllByLabelText(`${title} — ${artist}`)[0];
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MainPage", () => {
  it("모든 앨범 카드와 필터 탭을 렌더한다", () => {
    render(<MainPage />);
    for (const album of HOME_ALBUMS) {
      expect(firstCard(album.title, album.artist)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /^all/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("장르 필터는 해당 장르만 남기고 숨긴다", () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^jazz/ }));

    const jazzAlbum = HOME_ALBUMS.find((album) => album.genre === "jazz")!;
    const otherAlbum = HOME_ALBUMS.find((album) => album.genre !== "jazz")!;
    const jazzCard = firstCard(jazzAlbum.title, jazzAlbum.artist);
    const otherCard = firstCard(otherAlbum.title, otherAlbum.artist);
    expect(jazzCard.className).not.toContain("is-hidden");
    expect(otherCard.className).toContain("is-hidden");
  });

  it("앨범 카드를 클릭하면 수록곡 모달이 열리고 Escape로 닫힌다", async () => {
    render(<MainPage />);
    const album = HOME_ALBUMS[0];
    fireEvent.click(firstCard(album.title, album.artist));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(album.title);
    expect(dialog).toHaveTextContent(album.artist);
    expect(within(dialog).getByRole("list", { name: "수록곡" })).toHaveTextContent(
      album.tracks[0].title,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("수집 토글이 동작하고 홈 선곡은 이미 인덱스에 있다", () => {
    render(<MainPage />);
    const album = HOME_ALBUMS[0];
    const card = firstCard(album.title, album.artist);
    fireEvent.click(within(card).getByRole("button", { name: "수집에 추가" }));
    expect(
      within(card).getByRole("button", { name: "수집에서 제거" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^index/ })).toHaveTextContent(
      "12",
    );
  });

  it("다른 타일의 수집 기록이 인덱스에 표시된다", () => {
    saveFavorites(["1,0:0"]);
    render(<MainPage />);
    expect(screen.getByRole("button", { name: /^index/ })).toHaveTextContent(
      "13",
    );
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));
    expect(screen.getByText("LNR-1.0-01")).toBeInTheDocument();
  });

  it("카탈로그에서 항목을 클릭하면 상세 모달이 열린다", async () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));

    const album = HOME_ALBUMS[1];
    const slideTitle = screen
      .getAllByText(album.title)
      .find((el) => el.className.includes("catalog__slide-title"));
    expect(slideTitle).toBeDefined();
    fireEvent.click(slideTitle!.closest("button")!);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(album.artist);
  });

  it("순서대로 듣기로 열어 next 버튼으로 이동한다", async () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));
    fireEvent.click(screen.getByRole("button", { name: /순서대로 듣기/ }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("01 / ");

    fireEvent.click(screen.getByRole("button", { name: /^next/ }));
    await waitFor(() =>
      expect(dialog).toHaveTextContent(HOME_ALBUMS[1].title),
    );
  });

  it("about 시트를 열고 닫는다", () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^about/ }));
    expect(screen.getByText("about this archive")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "← 벽으로 돌아가기" }));
    expect(screen.queryByText("about this archive")).not.toBeInTheDocument();
  });
});
