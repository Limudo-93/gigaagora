import { describe, expect, it } from "vitest";
import { buildMusicianSlug, extractUserIdFromSlug, slugifyName } from "../slug";

describe("slug utils", () => {
  it("slugifyName lowercases and normalizes spaces", () => {
    expect(slugifyName("Joao da Silva")).toBe("joao-da-silva");
  });

  it("buildMusicianSlug combines name and id", () => {
    expect(buildMusicianSlug("Joao", "user123")).toBe("joao-user123");
  });

  it("extractUserIdFromSlug handles full UUIDs", () => {
    const userId = "123e4567-e89b-12d3-a456-426614174000";
    expect(extractUserIdFromSlug(`john-${userId}`)).toBe(userId);
  });

  it("extractUserIdFromSlug handles compact UUIDs", () => {
    const compact = "123e4567e89b12d3a456426614174000";
    expect(extractUserIdFromSlug(`john-${compact}`)).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    );
  });

  it("extractUserIdFromSlug returns null for invalid input", () => {
    expect(extractUserIdFromSlug("john-doe")).toBeNull();
    expect(extractUserIdFromSlug(null)).toBeNull();
  });
});
