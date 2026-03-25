/**
 * Before/after image comparison component.
 * Replaces 6 duplicate preview sections from v1.
 */
import { useState } from "preact/hooks";

interface Props {
  originalSrc?: string;
  resultSrc?: string;
  originalLabel?: string;
  resultLabel?: string;
}

export default function ImagePreview({
  originalSrc,
  resultSrc,
  originalLabel = "Original",
  resultLabel = "Result",
}: Props) {
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;

  return (
    <>
      <div class="preview">
        <div>
          <p class="label">{originalLabel}</p>
          <div class={`frame ${originalSrc ? "active" : ""}`}>
            {originalSrc ? (
              <img src={originalSrc} alt={`${originalLabel} preview`} />
            ) : (
              <p class="placeholder">Your photo will appear here.</p>
            )}
          </div>
        </div>
        <div>
          <p class="label">{resultLabel}</p>
          <div class={`frame ${resultSrc ? "active" : ""}`}>
            {resultSrc ? (
              <img
                src={resultSrc}
                alt={`${resultLabel} preview`}
                onClick={() => isMobile && resultSrc && setModalSrc(resultSrc)}
                style={isMobile ? { cursor: "pointer" } : undefined}
              />
            ) : (
              <p class="placeholder">Result will appear here.</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile zoom modal */}
      {modalSrc && (
        <div class="modal open" onClick={() => setModalSrc(null)}>
          <div class="modal-backdrop" />
          <div class="modal-content" role="dialog" aria-modal="true" aria-label="Preview">
            <button class="modal-close" onClick={() => setModalSrc(null)} aria-label="Close preview">
              Close
            </button>
            <img src={modalSrc} alt="Full-size preview" />
          </div>
        </div>
      )}
    </>
  );
}
