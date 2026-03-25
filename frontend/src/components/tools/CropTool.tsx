/**
 * Crop Tool — client-side via Canvas API with drag selection.
 * TODO: Port full crop drag/resize logic from v1 app.js. This is a scaffold.
 *
 * Key logic to port from v1 app.js:
 * - updateCropSelection() — clamp selection to image bounds
 * - getImageBounds() — get image position relative to crop area
 * - getCropScale() — map display pixels to natural pixels
 * - applyCropPreset() — set crop box to an aspect ratio
 * - Pointer event handlers for new selection, move, and 8-handle resize
 */
import { useState, useRef, useCallback } from "preact/hooks";
import Uploader from "./Uploader";
import { cropImage } from "../../lib/canvas";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

const PRESETS = [
  { label: "1:1", ratio: [1, 1] },
  { label: "4:3", ratio: [4, 3] },
  { label: "3:4", ratio: [3, 4] },
  { label: "16:9", ratio: [16, 9] },
  { label: "9:16", ratio: [9, 16] },
];

interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function CropTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>();
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const cropAreaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = (file: File) => {
    setSourceFile(file);
    setImageSrc(URL.createObjectURL(file));
    setResultBlob(null);
    setStatus("Drag to select the area you want to keep.");
    // TODO: Initialize default crop selection once image loads
  };

  const processCrop = async () => {
    if (!sourceFile || !cropRect || !imgRef.current) return;
    setLoading(true);
    setStatus("Cropping...");
    trackEvent("tool_used", { tool_name: "crop" });

    try {
      // Map display pixels to natural pixels
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;

      // Get image offset within crop area
      const areaRect = cropAreaRef.current!.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const offsetX = imgRect.left - areaRect.left;
      const offsetY = imgRect.top - areaRect.top;

      const x = (cropRect.left - offsetX) * scaleX;
      const y = (cropRect.top - offsetY) * scaleY;
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
    setActivePreset(null);
  };

  return (
    <div>
      <Uploader onFile={handleFile} allowHeic />

      <div class={`crop-area ${imageSrc ? "active" : ""}`} ref={cropAreaRef}>
        {imageSrc ? (
          <img ref={imgRef} src={imageSrc} alt="Crop preview" />
        ) : (
          <p class="placeholder">Upload a photo to start cropping.</p>
        )}
        {/* TODO: Render crop selection overlay with 8 handles */}
        {/* TODO: Add pointer event handlers for draw, move, resize */}
      </div>

      <div class="tool-options">
        <p class="label">Crop presets</p>
        <div class="preset-buttons">
          {PRESETS.map((preset, i) => (
            <button
              class={`preset-btn ${activePreset === i ? "active" : ""}`}
              type="button"
              onClick={() => {
                setActivePreset(i);
                // TODO: Apply crop preset ratio
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p class="helper">Presets set the crop box size. You can still resize freely.</p>
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
