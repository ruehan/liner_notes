import { describe, expect, it } from "vitest";
import { validateCoverFile } from "./catalog-submission";

describe("validateCoverFile", () => {
  it("JPG, PNG, WebP의 5MB 이하 커버 이미지를 허용한다", () => {
    const file = new File(["cover"], "cover.webp", { type: "image/webp" });
    expect(validateCoverFile(file)).toBeNull();
  });

  it("허용되지 않은 타입과 큰 파일을 거절한다", () => {
    expect(validateCoverFile(new File(["cover"], "cover.gif", { type: "image/gif" }))).toBe(
      "JPG, PNG 또는 WebP 이미지만 업로드할 수 있습니다.",
    );
    expect(
      validateCoverFile(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "cover.png", { type: "image/png" }),
      ),
    ).toBe("커버 이미지는 5MB 이하여야 합니다.");
  });
});
