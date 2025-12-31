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

export function extractUserIdFromSlug(slug: string): string | null {
  const match = slug.match(/[0-9a-fA-F-]{36}$/);
  return match ? match[0] : null;
}
