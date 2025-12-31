export function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

export function buildMusicianSlug(name: string, userId: string): string {
  const safeName = slugifyName(name || "musico");
  return `${safeName}-${userId}`;
}

export function extractUserIdFromSlug(slug?: string | null): string | null {
  if (!slug || typeof slug !== "string") return null;
  const uuidMatch = slug.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
  );
  if (uuidMatch) return uuidMatch[0];

  const compactMatch = slug.match(/[0-9a-fA-F]{32}/);
  if (!compactMatch) return null;

  const value = compactMatch[0];
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
