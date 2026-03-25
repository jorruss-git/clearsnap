/**
 * Client-side image processing via Canvas API.
 * Replaces all server-side resize/crop/convert endpoints.
 */

interface ResizeOptions {
  width?: number;
  height?: number;
  scale?: number;
  keepAspect?: boolean;
}

/**
 * Load a File as an ImageBitmap.
 * `createImageBitmap` handles EXIF orientation in modern browsers.
 */
export async function loadImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

/**
 * Create a canvas (OffscreenCanvas if available, fallback to HTMLCanvasElement).
 */
function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Convert a canvas to a Blob.
 */
async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string = "image/png",
  quality?: number,
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      type,
      quality,
    );
  });
}

/**
 * Resize an image file.
 * Port of server.py resize_if_needed() logic.
 */
export async function resizeImage(file: File, options: ResizeOptions): Promise<Blob> {
  const img = await loadImage(file);
  const { width: origW, height: origH } = img;

  let targetW: number;
  let targetH: number;

  if (options.scale != null) {
    const s = Math.max(1, Math.min(400, options.scale)) / 100;
    targetW = Math.max(1, Math.round(origW * s));
    targetH = Math.max(1, Math.round(origH * s));
  } else if (options.keepAspect !== false) {
    if (options.width != null && options.height != null) {
      const ratio = Math.min(options.width / origW, options.height / origH);
      targetW = Math.max(1, Math.round(origW * ratio));
      targetH = Math.max(1, Math.round(origH * ratio));
    } else if (options.width != null) {
      targetW = options.width;
      targetH = Math.max(1, Math.round(targetW * (origH / origW)));
    } else if (options.height != null) {
      targetH = options.height;
      targetW = Math.max(1, Math.round(targetH * (origW / origH)));
    } else {
      targetW = origW;
      targetH = origH;
    }
  } else {
    targetW = options.width ?? origW;
    targetH = options.height ?? origH;
  }

  const canvas = createCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d")!;
  (ctx as CanvasRenderingContext2D).drawImage(img, 0, 0, targetW, targetH);
  img.close();

  return canvasToBlob(canvas);
}

/**
 * Crop an image file to a specific rectangle (in natural pixels).
 */
export async function cropImage(
  file: File,
  rect: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = createCanvas(Math.round(rect.width), Math.round(rect.height));
  const ctx = canvas.getContext("2d")!;
  (ctx as CanvasRenderingContext2D).drawImage(
    img,
    rect.x, rect.y, rect.width, rect.height,
    0, 0, rect.width, rect.height,
  );
  img.close();

  return canvasToBlob(canvas);
}

/**
 * Convert an image file to a different format.
 */
export async function convertImage(
  file: File,
  format: "jpeg" | "png" | "webp",
  quality?: number,
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d")!;
  (ctx as CanvasRenderingContext2D).drawImage(img, 0, 0);
  img.close();

  const mimeType = `image/${format}`;
  const q = format === "png" ? undefined : (quality ?? 85) / 100;

  return canvasToBlob(canvas, mimeType, q);
}
