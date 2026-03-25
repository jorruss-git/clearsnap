/**
 * Batch Resize & Convert tool — client-side via Canvas + JSZip.
 * TODO: Implement full functionality. This is a scaffold.
 */
import { useState } from "preact/hooks";
import Uploader from "./Uploader";
import { resizeImage, convertImage } from "../../lib/canvas";
import { isHeic, decodeHeic } from "../../lib/heic";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

const PRESETS = [
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Portrait", width: 1080, height: 1350 },
  { label: "HD (1920x1080)", width: 1920, height: 1080 },
  { label: "Thumbnail (300x300)", width: 300, height: 300 },
];

type OutputFormat = "jpeg" | "png" | "webp";

export default function BatchProcessor() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("Select up to 20 images to process.");
  const [loading, setLoading] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(85);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [scale, setScale] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handleFiles = (fileList: File[]) => {
    const selected = fileList.slice(0, 20);
    setFiles(selected);
    setResultBlob(null);
    setStatus(`${selected.length} file${selected.length === 1 ? "" : "s"} ready.`);
    if (fileList.length > 20) {
      setStatus("Only the first 20 files will be processed.");
    }
  };

  const processBatch = async () => {
    if (files.length === 0 || loading) return;
    setLoading(true);
    setResultBlob(null);
    trackEvent("tool_used", { tool_name: "batch_processor", file_count: files.length });

    try {
      // Lazy-load JSZip only when needed
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        setStatus(`Processing ${i + 1} of ${files.length}...`);

        let file = files[i];

        // Decode HEIC if needed
        if (isHeic(file)) {
          const decoded = await decodeHeic(file);
          file = new File([decoded], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
        }

        // Resize if dimensions/scale provided
        let blob: Blob;
        const hasResize = width || height || scale;
        if (hasResize) {
          blob = await resizeImage(file, {
            width: width ? Number(width) : undefined,
            height: height ? Number(height) : undefined,
            scale: scale ? Number(scale) : undefined,
            keepAspect,
          });
          // Convert to target format
          const tempFile = new File([blob], "temp.png", { type: "image/png" });
          blob = await convertImage(tempFile, format, quality);
        } else {
          blob = await convertImage(file, format, quality);
        }

        const ext = format === "jpeg" ? "jpg" : format;
        const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
        zip.file(`${baseName}.${ext}`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      setResultBlob(zipBlob);
      setStatus("Done! Your ZIP is ready.");
    } catch {
      setStatus("Batch processing failed. Try fewer or smaller images.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, "clearsnap_batch.zip");
      trackEvent("file_downloaded", { tool_name: "batch_processor" });
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBlob(null);
    setStatus("Select up to 20 images to process.");
    setLoading(false);
    setActivePreset(null);
    setWidth("");
    setHeight("");
    setScale("");
  };

  const isQualityFormat = format === "jpeg" || format === "webp";

  return (
    <div>
      <Uploader onFiles={handleFiles} multiple hint="Drop up to 20 photos" allowHeic />

      <div class="tool-options">
        <p class="label">Quick sizes</p>
        <div class="preset-buttons">
          {PRESETS.map((preset, i) => (
            <button
              class={`preset-btn ${activePreset === i ? "active" : ""}`}
              type="button"
              onClick={() => { setActivePreset(i); setWidth(String(preset.width)); setHeight(String(preset.height)); setScale(""); }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div class="field-row">
          <label class="field">Width (px) <input type="number" min="1" max="10000" placeholder="e.g. 1200" value={width} onInput={(e) => { setWidth((e.target as HTMLInputElement).value); setScale(""); setActivePreset(null); }} /></label>
          <label class="field">Height (px) <input type="number" min="1" max="10000" placeholder="e.g. 800" value={height} onInput={(e) => { setHeight((e.target as HTMLInputElement).value); setScale(""); setActivePreset(null); }} /></label>
        </div>

        <label class="check"><input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect((e.target as HTMLInputElement).checked)} /> Keep aspect ratio</label>

        <label class="field">Scale (%) <input type="number" min="1" max="400" placeholder="e.g. 75" value={scale} onInput={(e) => { setScale((e.target as HTMLInputElement).value); setWidth(""); setHeight(""); setActivePreset(null); }} /></label>
        <p class="helper">Tip: enter a scale percent or width/height. Scale overrides width/height.</p>

        <label class="field">Output format
          <select value={format} onChange={(e) => setFormat((e.target as HTMLSelectElement).value as OutputFormat)}>
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>

        <label class="field">Quality (JPG/WebP) <input type="range" min="1" max="100" value={quality} disabled={!isQualityFormat} onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))} /></label>
        <p class="helper">{isQualityFormat ? `Quality: ${quality}` : "Quality: n/a"}</p>
      </div>

      {status && <p class="status" role="status">{status}</p>}
      {loading && (
        <div class="loading-bar-container active">
          <div class="loading-bar" />
        </div>
      )}

      <div class="actions">
        <button class="btn" disabled={files.length === 0 || loading} onClick={processBatch}>
          Process Batch
        </button>
        <button class="btn" disabled={!resultBlob} onClick={handleDownload}>
          Download ZIP
        </button>
        <button class="btn ghost" disabled={files.length === 0} onClick={handleReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
