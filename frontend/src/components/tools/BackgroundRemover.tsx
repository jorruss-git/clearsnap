/**
 * Background Remover tool — the ONE tool that calls the server API.
 * TODO: Implement full functionality. This is a scaffold.
 */
import { useState } from "preact/hooks";
import Uploader from "./Uploader";
import ImagePreview from "./ImagePreview";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";

export default function BackgroundRemover() {
  const [originalSrc, setOriginalSrc] = useState<string>();
  const [resultSrc, setResultSrc] = useState<string>();
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setOriginalSrc(URL.createObjectURL(file));
    setResultSrc(undefined);
    setResultBlob(null);
    setStatus("Removing background... this can take a few seconds.");
    setLoading(true);
    trackEvent("tool_used", { tool_name: "background_remover" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/remove", { method: "POST", body: formData });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail || "Something went wrong. Please try again.");
      }

      const blob = await response.blob();
      setResultBlob(blob);
      setResultSrc(URL.createObjectURL(blob));
      setStatus("Done! Your background is removed.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, "background-removed.png");
      trackEvent("file_downloaded", { tool_name: "background_remover" });
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
      <Uploader onFile={handleFile} maxSizeMB={10} loading={loading} />
      {status && <p class="status" role="status">{status}</p>}
      {loading && (
        <div class="loading-bar-container active">
          <div class="loading-bar" />
        </div>
      )}
      <ImagePreview
        originalSrc={originalSrc}
        resultSrc={resultSrc}
        resultLabel="Background Removed"
      />
      <div class="actions">
        <button class="btn" disabled={!resultBlob} onClick={handleDownload}>
          Download PNG
        </button>
        <button class="btn ghost" disabled={!originalSrc} onClick={handleReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
