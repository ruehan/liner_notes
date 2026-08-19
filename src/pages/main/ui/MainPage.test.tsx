import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TRACKS } from "@/entities/track";
import { MainPage } from "./MainPage";

describe("MainPage", () => {
  it("모든 트랙 카드와 필터 탭을 렌더한다", () => {
    render(<MainPage />);
    for (const t of TRACKS) {
      expect(screen.getByLabelText(`${t.title} — ${t.artist}`)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /^all/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("장르 필터는 해당 장르만 남기고 숨긴다", () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole("button", { name: /^jazz/ }));

    const jazzCard = screen.getByLabelText("Blue in Green — Bill Evans Trio");
    const otherCard = screen.getByLabelText("Xtal — Aphex Twin");
    expect(jazzCard.className).not.toContain("is-hidden");
    expect(otherCard.className).toContain("is-hidden");
  });

  it("카드를 클릭하면 상세 시트가 열리고 Escape로 닫힌다", async () => {
    render(<MainPage />);
    fireEvent.click(screen.getByLabelText("Blue in Green — Bill Evans Trio"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Blue in Green");
    expect(dialog).toHaveTextContent("Bill Evans Trio");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
