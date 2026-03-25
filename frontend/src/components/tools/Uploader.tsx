/**
 * Generic drag-and-drop file uploader component.
 * Replaces 6 separate dropzone implementations from v1.
 */
import { useState, useRef } from "preact/hooks";
import { validateFile } from "../../lib/validate";

interface Props {
  onFile?: (file: File) => void;
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSizeMB?: number;
  allowHeic?: boolean;
  hint?: string;
  loading?: boolean;
}

export default function Uploader({
  onFile,
  onFiles,
  multiple = false,
  accept = "image/*",
  maxSizeMB = 50,
  allowHeic = false,
  hint = "Drop a photo here",
  loading = false,
}: Props) {
  const [dragover, setDragover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    if (multiple && onFiles) {
      const files = Array.from(fileList).slice(0, 20);
      onFiles(files);
    } else if (onFile) {
      const file = fileList[0];
      const err = validateFile(file, { maxSizeMB, allowHeic });
      if (err) {
        setError(err);
        return;
      }
      onFile(file);
    }
  };

  const acceptAttr = allowHeic ? `${accept},.heic,.heif` : accept;

  return (
    <div>
      <div
        class={`uploader ${dragover ? "dragover" : ""} ${loading ? "loading" : ""}`}
        onDragEnter={(e) => { e.preventDefault(); setDragover(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragover(false);
          handleFiles(e.dataTransfer?.files ?? null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          aria-label="Upload an image"
          onChange={(e) => handleFiles((e.target as HTMLInputElement).files)}
        />
        <div class="uploader-body">
          <div class="uploader-icon" aria-hidden="true">+</div>
          <div class="uploader-spinner" aria-hidden="true" />
          <p class="uploader-title">{hint}</p>
          <p class="uploader-meta">
            or click to choose {multiple ? "files" : "a file"} (max {maxSizeMB} MB{multiple ? " each" : ""})
          </p>
        </div>
      </div>
      {error && <p class="status" role="alert">{error}</p>}
    </div>
  );
}
