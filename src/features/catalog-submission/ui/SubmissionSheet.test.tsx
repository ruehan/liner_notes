import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionSheet } from "./SubmissionSheet";

const api = vi.hoisted(() => ({
  coverPreviewUrl: vi.fn(),
  getSubmissionAccess: vi.fn(),
  fetchEditorAlbums: vi.fn(),
  signInEditor: vi.fn(),
  signOutEditor: vi.fn(),
  submitCatalogAlbum: vi.fn(),
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
    api.updateCatalogAlbum.mockReset().mockResolvedValue("album-1");
    api.submitCatalogAlbum.mockReset().mockResolvedValue("album-2");
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
});
