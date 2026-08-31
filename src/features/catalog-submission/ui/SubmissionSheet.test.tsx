import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionSheet } from "./SubmissionSheet";

const api = vi.hoisted(() => ({
  coverPreviewUrl: vi.fn(),
  getSubmissionAccess: vi.fn(),
  fetchEditorAlbums: vi.fn(),
  fetchEditorArtists: vi.fn(),
  deleteCatalogArtist: vi.fn(),
  signInEditor: vi.fn(),
  signOutEditor: vi.fn(),
  submitCatalogAlbum: vi.fn(),
  submitCatalogArtist: vi.fn(),
  updateCatalogArtist: vi.fn(),
  uploadAlbumCover: vi.fn(),
  updateCatalogAlbum: vi.fn(),
  validateCoverFile: vi.fn(),
}));

vi.mock("../api/catalog-submission", () => api);

const storedAlbum = {
  id: "album-1",
  artistName: "Artist",
  title: "Original album",
  label: "Label",
  year: 2024,
  description: "Album note",
  coverPath: "covers/original.webp",
  featured: true,
  sortOrder: 2,
  tracks: [
    {
      id: "track-1",
      title: "Original track",
      durationSeconds: 222,
      description: "Track note",
      youtubeVideoId: "dQw4w9WgXcQ",
      youtubeStartSeconds: 12,
      youtubeEndSeconds: 180,
    },
  ],
};

describe("SubmissionSheet", () => {
  beforeEach(() => {
    api.coverPreviewUrl.mockReset().mockReturnValue(null);
    api.getSubmissionAccess.mockReset().mockResolvedValue({
      status: "editor",
      email: "editor@example.com",
    });
    api.fetchEditorAlbums.mockReset().mockResolvedValue([storedAlbum]);
    api.fetchEditorArtists.mockReset().mockResolvedValue([
      { id: "artist-1", name: "Artist", albumCount: 1 },
      { id: "artist-2", name: "Second Artist", albumCount: 0 },
    ]);
    api.updateCatalogAlbum.mockReset().mockResolvedValue("album-1");
    api.submitCatalogAlbum.mockReset().mockResolvedValue("album-2");
    api.submitCatalogArtist.mockReset().mockResolvedValue({ id: "artist-3", name: "New Artist" });
    api.updateCatalogArtist.mockReset().mockResolvedValue("artist-2");
    api.deleteCatalogArtist.mockReset().mockResolvedValue(undefined);
    api.uploadAlbumCover.mockReset();
    api.validateCoverFile.mockReset().mockReturnValue(null);
  });

  it("기존 앨범과 수록곡을 불러와 수정 저장한다", async () => {
    const onSubmitted = vi.fn().mockResolvedValue(undefined);
    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={onSubmitted} />);

    const selector = await screen.findByLabelText("기존 앨범 불러오기");
    await waitFor(() => expect(selector).toHaveTextContent("Original album"));
    fireEvent.change(selector, { target: { value: "album-1" } });

    const title = screen.getByLabelText(/앨범 제목/);
    expect(title).toHaveValue("Original album");
    expect(screen.getByLabelText(/곡 제목/)).toHaveValue("Original track");

    fireEvent.change(title, { target: { value: "Edited album" } });
    fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));

    await waitFor(() =>
      expect(api.updateCatalogAlbum).toHaveBeenCalledWith(
        "album-1",
        expect.objectContaining({
          title: "Edited album",
          tracks: [expect.objectContaining({ title: "Original track", duration_seconds: 222 })],
        }),
      ),
    );
    expect(onSubmitted).toHaveBeenCalledOnce();
  });

  it("등록된 아티스트를 앨범 입력의 선택 목록에 보여준다", async () => {
    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={vi.fn()} />);

    const artistSelect = await screen.findByLabelText(/아티스트/);
    await waitFor(() => expect(artistSelect).toHaveTextContent("Second Artist"));

    fireEvent.change(artistSelect, { target: { value: "Second Artist" } });
    expect(artistSelect).toHaveValue("Second Artist");
  });

  it("같은 아티스트, 앨범명, 발매 연도의 중복 등록을 막는다", async () => {
    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={vi.fn()} />);

    const artistSelect = await screen.findByLabelText(/아티스트/);
    await waitFor(() => expect(artistSelect).toHaveTextContent("Artist"));
    fireEvent.change(artistSelect, { target: { value: "Artist" } });
    fireEvent.change(screen.getByLabelText(/앨범 제목/), {
      target: { value: "Original album" },
    });
    fireEvent.change(screen.getByLabelText(/발매 연도/), { target: { value: "2024" } });
    fireEvent.change(screen.getByLabelText(/곡 제목/), { target: { value: "A new track" } });
    fireEvent.change(screen.getByLabelText(/길이/), { target: { value: "03:20" } });
    fireEvent.click(screen.getByRole("button", { name: "앨범 등록" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "같은 아티스트·앨범명·발매 연도의 앨범이 이미 등록되어 있습니다.",
    );
    expect(api.submitCatalogAlbum).not.toHaveBeenCalled();
  });

  it("아티스트를 등록하면 앨범 입력의 선택값으로 이어진다", async () => {
    api.fetchEditorArtists
      .mockReset()
      .mockResolvedValueOnce([{ id: "artist-1", name: "Artist", albumCount: 1 }])
      .mockResolvedValue([
        { id: "artist-1", name: "Artist", albumCount: 1 },
        { id: "artist-3", name: "New Artist", albumCount: 0 },
      ]);

    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={vi.fn()} />);

    fireEvent.click(await screen.findByRole("tab", { name: "아티스트 관리" }));
    fireEvent.change(screen.getByLabelText(/아티스트 이름/), {
      target: { value: "New Artist" },
    });
    fireEvent.click(screen.getByRole("button", { name: "아티스트 등록" }));

    await waitFor(() => expect(api.submitCatalogArtist).toHaveBeenCalledWith("New Artist"));
    const artistSelect = await screen.findByLabelText(/아티스트/);
    await waitFor(() => expect(artistSelect).toHaveValue("New Artist"));
  });

  it("아티스트 이름을 수정하고 앨범 선택 목록도 새 이름으로 갱신한다", async () => {
    api.fetchEditorArtists
      .mockReset()
      .mockResolvedValueOnce([
        { id: "artist-1", name: "Artist", albumCount: 1 },
        { id: "artist-2", name: "Second Artist", albumCount: 0 },
      ])
      .mockResolvedValue([
        { id: "artist-1", name: "Artist", albumCount: 1 },
        { id: "artist-2", name: "Renamed Artist", albumCount: 0 },
      ]);

    const onSubmitted = vi.fn().mockResolvedValue(undefined);
    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={onSubmitted} />);
    fireEvent.click(await screen.findByRole("tab", { name: "아티스트 관리" }));
    fireEvent.click(await screen.findByRole("button", { name: "Second Artist 수정" }));
    expect(screen.getByLabelText(/아티스트 이름/)).toHaveValue("Second Artist");

    fireEvent.change(screen.getByLabelText(/아티스트 이름/), {
      target: { value: "Renamed Artist" },
    });
    fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));

    await waitFor(() =>
      expect(api.updateCatalogArtist).toHaveBeenCalledWith("artist-2", "Renamed Artist"),
    );
    expect(onSubmitted).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByText("Renamed Artist")).toBeInTheDocument());
  });

  it("앨범이 없는 아티스트만 확인 후 삭제한다", async () => {
    api.fetchEditorArtists
      .mockReset()
      .mockResolvedValueOnce([
        { id: "artist-1", name: "Artist", albumCount: 1 },
        { id: "artist-2", name: "Second Artist", albumCount: 0 },
      ])
      .mockResolvedValue([{ id: "artist-1", name: "Artist", albumCount: 1 }]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={vi.fn()} />);
    fireEvent.click(await screen.findByRole("tab", { name: "아티스트 관리" }));
    expect(screen.getByRole("button", { name: "Artist 삭제" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Second Artist 삭제" }));

    await waitFor(() => expect(api.deleteCatalogArtist).toHaveBeenCalledWith("artist-2"));
    expect(confirmSpy).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("Second Artist")).not.toBeInTheDocument());
    confirmSpy.mockRestore();
  });
});
