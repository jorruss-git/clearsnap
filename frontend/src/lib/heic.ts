/**
 * HEIC decoding via heic2any.
 * Lazy-loaded — the ~2.7MB library is only downloaded when a HEIC file is actually uploaded.
 */

/**
 * Check if a file is a HEIC/HEIF image.
 */
export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

/**
 * Decode a HEIC file to a standard image Blob (JPEG).
 * Returns the original file unchanged if it's not HEIC.
 */
export async function decodeHeic(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;

  // Lazy import — only loads heic2any when actually needed
  const heic2any = (await import("heic2any")).default;

  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  // heic2any can return an array for multi-image HEIC — take the first
  if (Array.isArray(result)) return result[0];
  return result;
}
