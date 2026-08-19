import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TRACKS } from "@/entities/track";
import { saveFavorites } from "@/features/curation";
import { MainPage } from "./MainPage";

function firstCard(title: string, artist: string) {
  return screen.getAllByLabelText(`${title} — ${artist}`)[0];
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("MainPage", () => {
  it("모든 트랙 카드와 필터 탭을 렌더한다", () => {
    render(<MainPage />);
    for (const t of TRACKS) {
      expect(firstCard(t.title, t.artist)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /^all/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("장르 필터는 해당 장르만 남기고 숨긴다", () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^jazz/ }));

    const jazzCard = firstCard("Blue in Green", "Bill Evans Trio");
    const otherCard = firstCard("Xtal", "Aphex Twin");
    expect(jazzCard.className).not.toContain("is-hidden");
    expect(otherCard.className).toContain("is-hidden");
  });

  it("카드를 클릭하면 상세 시트가 열리고 Escape로 닫힌다", async () => {
    render(<MainPage />);
    fireEvent.click(firstCard("Blue in Green", "Bill Evans Trio"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Blue in Green");
    expect(dialog).toHaveTextContent("Bill Evans Trio");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("수집 토글이 동작하고 홈 선곡은 이미 인덱스에 있다", () => {
    render(<MainPage />);
    const card = firstCard("An Ending", "Brian Eno");
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

    const slideTitle = screen
      .getAllByText("Blue in Green")
      .find((el) => el.className.includes("catalog__slide-title"));
    expect(slideTitle).toBeDefined();
    fireEvent.click(slideTitle!.closest("button")!);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Bill Evans Trio");
  });

  it("순서대로 듣기로 열어 next 버튼으로 이동한다", async () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^index/ }));
    fireEvent.click(screen.getByRole("button", { name: /순서대로 듣기/ }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("01 / ");

    fireEvent.click(screen.getByRole("button", { name: /^next/ }));
    await waitFor(() =>
      expect(dialog).toHaveTextContent("Blue in Green"),
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
