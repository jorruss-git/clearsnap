/**
 * HEIC to JPG/PNG Converter — client-side via heic2any + Canvas.
 * TODO: Implement full functionality. This is a scaffold.
 */
import { useState } from "preact/hooks";
import Uploader from "./Uploader";
import ImagePreview from "./ImagePreview";
import { decodeHeic } from "../../lib/heic";
import { convertImage } from "../../lib/canvas";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

type HeicOutputFormat = "jpeg" | "png";

export default function HeicConverter() {
  const [originalSrc, setOriginalSrc] = useState<string>();
  const [resultSrc, setResultSrc] = useState<string>();
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<HeicOutputFormat>("jpeg");

  const handleFile = async (file: File) => {
    setOriginalSrc(URL.createObjectURL(file));
    setResultSrc(undefined);
    setResultBlob(null);
    setStatus("Decoding HEIC... this may take a few seconds.");
    setLoading(true);
    trackEvent("tool_used", { tool_name: "heic_converter" });

    try {
      // Step 1: Decode HEIC to a standard image blob
      const decoded = await decodeHeic(file);

      // Step 2: Convert to target format via canvas
      const decodedFile = new File([decoded], "decoded.jpg", { type: decoded.type });
      const blob = await convertImage(decodedFile, format);

      setResultBlob(blob);
      setResultSrc(URL.createObjectURL(blob));
      setStatus("Done! Your image is converted.");
    } catch {
      setStatus("Conversion failed. Make sure this is a valid HEIC file.");
    } finally {
      setLoading(false);
    }
  };

  const ext = format === "jpeg" ? "jpg" : "png";

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, `converted.${ext}`);
      trackEvent("file_downloaded", { tool_name: "heic_converter" });
    }
  };

  const handleReset = () => {
    setOriginalSrc(undefined);
    setResultSrc(undefined);
    setResultBlob(null);
    setStatus("");
    setLoading(false);
  };

  return (
    <div>
      <Uploader onFile={handleFile} allowHeic accept=".heic,.heif,image/*" hint="Drop a HEIC photo here" loading={loading} />

      <div class="tool-options">
        <label class="field">
          Output format
          <select value={format} onChange={(e) => setFormat((e.target as HTMLSelectElement).value as HeicOutputFormat)}>
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </label>
      </div>

      {status && <p class="status" role="status">{status}</p>}
      {loading && (
        <div class="loading-bar-container active">
          <div class="loading-bar" />
        </div>
      )}

      <ImagePreview
        originalSrc={originalSrc}
        resultSrc={resultSrc}
        resultLabel="Converted"
      />

      <div class="actions">
        <button class="btn" disabled={!resultBlob} onClick={handleDownload}>
          Download {ext.toUpperCase()}
        </button>
        <button class="btn ghost" disabled={!originalSrc} onClick={handleReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
