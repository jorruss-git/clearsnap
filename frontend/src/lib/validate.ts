/**
 * File validation for image uploads.
 * Replaces 6 identical validation blocks from v1.
 */

interface ValidateOptions {
  maxSizeMB?: number;
  allowHeic?: boolean;
}

/**
 * Validate an uploaded file. Returns an error message or null if valid.
 */
export function validateFile(file: File, options: ValidateOptions = {}): string | null {
  const { maxSizeMB = 50, allowHeic = false } = options;

  if (!file) return "No file selected.";

  const isImage = file.type.startsWith("image/");
  const isHeic =
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (!isImage && !(allowHeic && isHeic)) {
    return "Please choose an image file.";
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `That file is too large (max ${maxSizeMB} MB). Please choose a smaller image.`;
  }

  return null;
}
