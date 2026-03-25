/**
 * Crop Tool — client-side via Canvas API with drag selection,
 * move, 8-handle resize, and aspect ratio presets.
 */
import { useState, useRef, useEffect } from "preact/hooks";
import Uploader from "./Uploader";
import { cropImage } from "../../lib/canvas";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

const PRESETS = [
  { label: "Free", ratio: null },
  { label: "1:1", ratio: [1, 1] },
  { label: "4:3", ratio: [4, 3] },
  { label: "3:4", ratio: [3, 4] },
  { label: "16:9", ratio: [16, 9] },
  { label: "9:16", ratio: [9, 16] },
] as const;

interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

type DragMode =
  | { type: "none" }
  | { type: "new"; startX: number; startY: number }
  | { type: "move"; offsetX: number; offsetY: number }
  | { type: "resize"; handle: string; startRect: CropRect };

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

export default function CropTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>();
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [activePreset, setActivePreset] = useState(0); // 0 = Free

  const cropAreaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragMode>({ type: "none" });

  /** Get the image's bounding rect relative to the crop area container */
  function getImageBounds(): { x: number; y: number; w: number; h: number } | null {
    const area = cropAreaRef.current;
    const img = imgRef.current;
    if (!area || !img) return null;
    const areaRect = area.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    return {
      x: imgRect.left - areaRect.left,
      y: imgRect.top - areaRect.top,
      w: imgRect.width,
      h: imgRect.height,
    };
  }

  /** Clamp a crop rect to stay within image bounds, enforce min size */
  function clampRect(rect: CropRect, bounds: { x: number; y: number; w: number; h: number }): CropRect {
    const minSize = 20;
    let { left, top, width, height } = rect;
    width = Math.max(minSize, Math.min(width, bounds.w));
    height = Math.max(minSize, Math.min(height, bounds.h));
    left = Math.max(bounds.x, Math.min(left, bounds.x + bounds.w - width));
    top = Math.max(bounds.y, Math.min(top, bounds.y + bounds.h - height));
    return { left, top, width, height };
  }

  /** Apply aspect ratio constraint to a rect (shrink to fit) */
  function applyRatio(rect: CropRect, ratio: readonly [number, number] | null, bounds: { x: number; y: number; w: number; h: number }): CropRect {
    if (!ratio) return rect;
    const [rw, rh] = ratio;
    const targetRatio = rw / rh;
    let { left, top, width, height } = rect;
    // Fit within current dimensions
    if (width / height > targetRatio) {
      width = height * targetRatio;
    } else {
      height = width / targetRatio;
    }
    return clampRect({ left, top, width, height }, bounds);
  }

  /** Initialize default crop selection when image loads */
  function initCropSelection() {
    const bounds = getImageBounds();
    if (!bounds) return;
    const preset = PRESETS[activePreset];
    const ratio = preset.ratio;

    let w: number, h: number;
    if (ratio) {
      const [rw, rh] = ratio;
      const targetRatio = rw / rh;
      if (bounds.w / bounds.h > targetRatio) {
        h = bounds.h * 0.8;
        w = h * targetRatio;
      } else {
        w = bounds.w * 0.8;
        h = w / targetRatio;
      }
    } else {
      w = bounds.w * 0.8;
      h = bounds.h * 0.8;
    }

    const left = bounds.x + (bounds.w - w) / 2;
    const top = bounds.y + (bounds.h - h) / 2;
    setCropRect(clampRect({ left, top, width: w, height: h }, bounds));
  }

  /** Get pointer position relative to the crop area container */
  function getPointerPos(e: PointerEvent): { px: number; py: number } {
    const area = cropAreaRef.current!;
    const areaRect = area.getBoundingClientRect();
    return {
      px: e.clientX - areaRect.left,
      py: e.clientY - areaRect.top,
    };
  }

  function onPointerDown(e: PointerEvent) {
    if (!imageSrc || !imgRef.current) return;
    e.preventDefault();
    const target = e.target as HTMLElement;
    const { px, py } = getPointerPos(e);

    // Handle resize
    const handleAttr = target.getAttribute("data-handle");
    if (handleAttr && cropRect) {
      dragRef.current = { type: "resize", handle: handleAttr, startRect: { ...cropRect } };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Handle move (clicking inside the selection)
    if (cropRect && target.classList.contains("crop-selection")) {
      dragRef.current = {
        type: "move",
        offsetX: px - cropRect.left,
        offsetY: py - cropRect.top,
      };
      target.setPointerCapture(e.pointerId);
      return;
    }

    // New selection (clicking on the image or crop area background)
    const bounds = getImageBounds();
    if (bounds && px >= bounds.x && px <= bounds.x + bounds.w && py >= bounds.y && py <= bounds.y + bounds.h) {
      dragRef.current = { type: "new", startX: px, startY: py };
      cropAreaRef.current!.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    if (drag.type === "none") return;
    e.preventDefault();

    const bounds = getImageBounds();
    if (!bounds) return;
    const { px, py } = getPointerPos(e);
    const preset = PRESETS[activePreset];
    const ratio = preset.ratio;

    if (drag.type === "new") {
      const x1 = Math.max(bounds.x, Math.min(drag.startX, bounds.x + bounds.w));
      const y1 = Math.max(bounds.y, Math.min(drag.startY, bounds.y + bounds.h));
      const x2 = Math.max(bounds.x, Math.min(px, bounds.x + bounds.w));
      const y2 = Math.max(bounds.y, Math.min(py, bounds.y + bounds.h));

      let rect: CropRect = {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };
      rect = applyRatio(rect, ratio ?? null, bounds);
      setCropRect(clampRect(rect, bounds));
    }

    if (drag.type === "move" && cropRect) {
      const newLeft = px - drag.offsetX;
      const newTop = py - drag.offsetY;
      setCropRect(clampRect({ left: newLeft, top: newTop, width: cropRect.width, height: cropRect.height }, bounds));
    }

    if (drag.type === "resize" && cropRect) {
      const sr = drag.startRect;
      let { left, top, width, height } = { ...cropRect };
      const handle = drag.handle;

      // Calculate new dimensions based on handle
      if (handle.includes("e")) {
        width = Math.max(20, px - left);
      }
      if (handle.includes("w")) {
        const right = left + width;
        left = Math.min(px, right - 20);
        width = right - left;
      }
      if (handle.includes("s")) {
        height = Math.max(20, py - top);
      }
      if (handle.includes("n")) {
        const bottom = top + height;
        top = Math.min(py, bottom - 20);
        height = bottom - top;
      }

      let rect: CropRect = { left, top, width, height };
      if (ratio) {
        // Enforce ratio: use the dominant axis
        const [rw, rh] = ratio;
        const targetRatio = rw / rh;
        if (handle === "n" || handle === "s") {
          width = height * targetRatio;
        } else if (handle === "e" || handle === "w") {
          height = width / targetRatio;
        } else {
          // Corner: use whichever dimension changed more
          if (width / height > targetRatio) {
            width = height * targetRatio;
          } else {
            height = width / targetRatio;
          }
        }
        rect = { left, top, width, height };
      }
      setCropRect(clampRect(rect, bounds));
    }
  }

  function onPointerUp() {
    dragRef.current = { type: "none" };
  }

  const handleFile = (file: File) => {
    setSourceFile(file);
    setImageSrc(URL.createObjectURL(file));
    setResultBlob(null);
    setCropRect(null);
    setStatus("Drag to select the area you want to keep, or use a preset.");
  };

  // Initialize crop selection when image loads
  const onImageLoad = () => {
    initCropSelection();
  };

  // Re-apply preset when it changes (if image is loaded)
  useEffect(() => {
    if (imageSrc && imgRef.current) {
      initCropSelection();
    }
  }, [activePreset]);

  const processCrop = async () => {
    if (!sourceFile || !cropRect || !imgRef.current) return;
    setLoading(true);
    setStatus("Cropping...");
    trackEvent("tool_used", { tool_name: "crop" });

    try {
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;

      const bounds = getImageBounds()!;
      const x = (cropRect.left - bounds.x) * scaleX;
      const y = (cropRect.top - bounds.y) * scaleY;
      const w = cropRect.width * scaleX;
      const h = cropRect.height * scaleY;

      const blob = await cropImage(sourceFile, { x, y, width: w, height: h });
      setResultBlob(blob);
      setStatus("Done! Your image is cropped.");
    } catch {
      setStatus("Crop failed. Try selecting a different area.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, "cropped.png");
      trackEvent("file_downloaded", { tool_name: "crop" });
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setImageSrc(undefined);
    setResultBlob(null);
    setCropRect(null);
    setStatus("");
    setLoading(false);
    setActivePreset(0);
  };

  return (
    <div>
      <Uploader onFile={handleFile} allowHeic />

      <div
        class={`crop-area ${imageSrc ? "active" : ""}`}
        ref={cropAreaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style="touch-action: none;"
      >
        {imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={onImageLoad}
            draggable={false}
          />
        ) : (
          <p class="placeholder">Upload a photo to start cropping.</p>
        )}

        {cropRect && (
          <div
            class="crop-selection active"
            style={{
              left: `${cropRect.left}px`,
              top: `${cropRect.top}px`,
              width: `${cropRect.width}px`,
              height: `${cropRect.height}px`,
              cursor: "move",
            }}
          >
            {HANDLES.map((h) => (
              <div class="crop-handle" data-handle={h} key={h} />
            ))}
          </div>
        )}
      </div>

      <div class="tool-options">
        <p class="label">Aspect ratio</p>
        <div class="preset-buttons">
          {PRESETS.map((preset, i) => (
            <button
              class={`preset-btn ${activePreset === i ? "active" : ""}`}
              type="button"
              onClick={() => setActivePreset(i)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {status && <p class="status" role="status">{status}</p>}
      {loading && (
        <div class="loading-bar-container active">
          <div class="loading-bar" />
        </div>
      )}

      <div class="actions">
        <button class="btn" disabled={!cropRect || loading} onClick={processCrop}>
          Crop
        </button>
        <button class="btn" disabled={!resultBlob} onClick={handleDownload}>
          Download PNG
        </button>
        <button class="btn ghost" disabled={!sourceFile} onClick={handleReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
