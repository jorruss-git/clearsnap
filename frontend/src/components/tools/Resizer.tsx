/**
 * Image Resizer tool — 100% client-side via Canvas API.
 * TODO: Implement full functionality. This is a scaffold.
 */
import { useState, useRef } from "preact/hooks";
import Uploader from "./Uploader";
import ImagePreview from "./ImagePreview";
import { resizeImage } from "../../lib/canvas";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

const PRESETS = [
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Portrait", width: 1080, height: 1350 },
  { label: "HD (1920x1080)", width: 1920, height: 1080 },
  { label: "Thumbnail (300x300)", width: 300, height: 300 },
];

export default function Resizer() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string>();
  const [resultSrc, setResultSrc] = useState<string>();
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [scale, setScale] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);

  const processResize = async (file: File) => {
    setStatus("Resizing...");
    trackEvent("tool_used", { tool_name: "resizer" });
    try {
      const blob = await resizeImage(file, {
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        scale: scale ? Number(scale) : undefined,
        keepAspect,
      });
      setResultBlob(blob);
      setResultSrc(URL.createObjectURL(blob));
      setStatus("Done! Your image is resized.");
    } catch {
      setStatus("Resize failed. Try a different image or settings.");
    }
  };

  const handleFile = (file: File) => {
    setSourceFile(file);
    setOriginalSrc(URL.createObjectURL(file));
    setResultSrc(undefined);
    setResultBlob(null);
    processResize(file);
  };

  const handlePreset = (index: number) => {
    setActivePreset(index);
    setWidth(String(PRESETS[index].width));
    setHeight(String(PRESETS[index].height));
    setScale("");
    if (sourceFile) processResize(sourceFile);
  };

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, "resized.png");
      trackEvent("file_downloaded", { tool_name: "resizer" });
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setOriginalSrc(undefined);
    setResultSrc(undefined);
    setResultBlob(null);
    setStatus("");
    setActivePreset(null);
    setWidth("");
    setHeight("");
    setScale("");
  };

  return (
    <div>
      <Uploader onFile={handleFile} />

      <div class="tool-options">
        <p class="label">Quick sizes</p>
        <div class="preset-buttons">
          {PRESETS.map((preset, i) => (
            <button
              class={`preset-btn ${activePreset === i ? "active" : ""}`}
              type="button"
              onClick={() => handlePreset(i)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div class="field-row">
          <label class="field">
            Width (px)
            <input
              type="number"
              min="1"
              max="10000"
              placeholder="e.g. 1200"
              value={width}
              onInput={(e) => { setWidth((e.target as HTMLInputElement).value); setScale(""); setActivePreset(null); }}
            />
          </label>
          <label class="field">
            Height (px)
            <input
              type="number"
              min="1"
              max="10000"
              placeholder="e.g. 800"
              value={height}
              onInput={(e) => { setHeight((e.target as HTMLInputElement).value); setScale(""); setActivePreset(null); }}
            />
          </label>
        </div>

        <label class="check">
          <input
            type="checkbox"
            checked={keepAspect}
            onChange={(e) => setKeepAspect((e.target as HTMLInputElement).checked)}
          />
          Keep aspect ratio
        </label>

        <label class="field">
          Scale (%)
          <input
            type="number"
            min="1"
            max="400"
            placeholder="e.g. 75"
            value={scale}
            onInput={(e) => { setScale((e.target as HTMLInputElement).value); setWidth(""); setHeight(""); setActivePreset(null); }}
          />
        </label>
        <p class="helper">Tip: enter a scale percent or width/height. Scale overrides width/height.</p>
      </div>

      {status && <p class="status" role="status">{status}</p>}

      <ImagePreview
        originalSrc={originalSrc}
        resultSrc={resultSrc}
        resultLabel="Resized"
      />

      <div class="actions">
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
