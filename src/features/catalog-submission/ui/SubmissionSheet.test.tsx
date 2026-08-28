import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionSheet } from "./SubmissionSheet";

const api = vi.hoisted(() => ({
  coverPreviewUrl: vi.fn(),
  getSubmissionAccess: vi.fn(),
  fetchEditorAlbums: vi.fn(),
  fetchEditorArtists: vi.fn(),
  signInEditor: vi.fn(),
  signOutEditor: vi.fn(),
  submitCatalogAlbum: vi.fn(),
  submitCatalogArtist: vi.fn(),
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
      { id: "artist-1", name: "Artist" },
      { id: "artist-2", name: "Second Artist" },
    ]);
    api.updateCatalogAlbum.mockReset().mockResolvedValue("album-1");
    api.submitCatalogAlbum.mockReset().mockResolvedValue("album-2");
    api.submitCatalogArtist.mockReset().mockResolvedValue({ id: "artist-3", name: "New Artist" });
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

  it("아티스트를 등록하면 앨범 입력의 선택값으로 이어진다", async () => {
    api.fetchEditorArtists
      .mockReset()
      .mockResolvedValueOnce([{ id: "artist-1", name: "Artist" }])
      .mockResolvedValue([
        { id: "artist-1", name: "Artist" },
        { id: "artist-3", name: "New Artist" },
      ]);

    render(<SubmissionSheet open onClose={vi.fn()} onSubmitted={vi.fn()} />);

    fireEvent.click(await screen.findByRole("tab", { name: "아티스트 등록" }));
    fireEvent.change(screen.getByLabelText(/아티스트 이름/), {
      target: { value: "New Artist" },
    });
    fireEvent.click(screen.getByRole("button", { name: "아티스트 등록" }));

    await waitFor(() => expect(api.submitCatalogArtist).toHaveBeenCalledWith("New Artist"));
    const artistSelect = await screen.findByLabelText(/아티스트/);
    await waitFor(() => expect(artistSelect).toHaveValue("New Artist"));
  });
});
