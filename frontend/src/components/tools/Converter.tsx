/**
 * Format Converter tool — 100% client-side via Canvas API.
 * TODO: Implement full functionality. This is a scaffold.
 */
import { useState } from "preact/hooks";
import Uploader from "./Uploader";
import ImagePreview from "./ImagePreview";
import { convertImage } from "../../lib/canvas";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

type OutputFormat = "jpeg" | "png" | "webp";

export default function Converter() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string>();
  const [resultSrc, setResultSrc] = useState<string>();
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(85);

  const processConvert = async (file: File, fmt: OutputFormat, q: number) => {
    setStatus("Converting...");
    trackEvent("tool_used", { tool_name: "converter", format: fmt });
    try {
      const blob = await convertImage(file, fmt, q);
      setResultBlob(blob);
      setResultSrc(URL.createObjectURL(blob));
      setStatus("Done! Your image is converted.");
    } catch {
      setStatus("Conversion failed. Try a different image.");
    }
  };

  const handleFile = (file: File) => {
    setSourceFile(file);
    setOriginalSrc(URL.createObjectURL(file));
    processConvert(file, format, quality);
  };

  const handleFormatChange = (fmt: OutputFormat) => {
    setFormat(fmt);
    if (sourceFile) processConvert(sourceFile, fmt, quality);
  };

  const handleQualityChange = (q: number) => {
    setQuality(q);
    if (sourceFile) processConvert(sourceFile, format, q);
  };

  const ext = format === "jpeg" ? "jpg" : format;
  const isQualityFormat = format === "jpeg" || format === "webp";

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, `converted.${ext}`);
      trackEvent("file_downloaded", { tool_name: "converter" });
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setOriginalSrc(undefined);
    setResultSrc(undefined);
    setResultBlob(null);
    setStatus("");
  };

  return (
    <div>
      <Uploader onFile={handleFile} allowHeic />

      <div class="tool-options">
        <label class="field">
          Output format
          <select value={format} onChange={(e) => handleFormatChange((e.target as HTMLSelectElement).value as OutputFormat)}>
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>

        <label class="field">
          Quality (JPG/WebP)
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            disabled={!isQualityFormat}
            onInput={(e) => handleQualityChange(Number((e.target as HTMLInputElement).value))}
          />
        </label>
        <p class="helper">
          {isQualityFormat ? `Quality: ${quality}` : "Quality: n/a (PNG is lossless)"}
        </p>
      </div>

      {status && <p class="status" role="status">{status}</p>}

      <ImagePreview
        originalSrc={originalSrc}
        resultSrc={resultSrc}
        resultLabel="Converted"
      />

      <div class="actions">
        <button class="btn" disabled={!resultBlob} onClick={handleDownload}>
          Download {ext.toUpperCase()}
        </button>
        <button class="btn ghost" disabled={!sourceFile} onClick={handleReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
