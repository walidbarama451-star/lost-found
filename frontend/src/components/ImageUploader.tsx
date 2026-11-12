import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import './ImageUploader.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB, matches backend

interface ImageUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Number of images already on the listing (edit mode). */
  existingCount?: number;
  /** Maximum number of images (lost-item searches allow 3). */
  maxImages?: number;
  disabled?: boolean;
  error?: string | null;
}

interface Preview {
  file: File;
  url: string;
}

/**
 * Multiple-image picker with client-side pre-checks (size/type) and
 * previews. The backend remains the authoritative validator.
 */
export default function ImageUploader({
  files,
  onFilesChange,
  existingCount = 0,
  maxImages = 5,
  disabled = false,
  error,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);

  // Build object URLs for the current selection; revoke on change/unmount.
  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => {
      for (const preview of next) URL.revokeObjectURL(preview.url);
    };
  }, [files]);

  const remaining = maxImages - existingCount - files.length;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = ''; // allow re-selecting the same file
    if (chosen.length === 0) return;

    const rejected: string[] = [];
    const accepted: File[] = [];
    for (const file of chosen) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: use JPEG, PNG or WebP`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: must be 5 MB or smaller`);
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length > remaining) {
      rejected.push(`You can attach at most ${maxImages} images`);
      accepted.length = Math.max(0, remaining);
    }

    setLocalError(rejected.length > 0 ? rejected.join(' · ') : null);
    if (accepted.length > 0) onFilesChange([...files, ...accepted]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const message = error ?? localError;

  return (
    <div className="image-uploader">
      <div className="image-uploader__head">
        <span className="form-label" id="image-uploader-label">
          Photos <span className="muted">(1 required, up to {maxImages})</span>
        </span>
        <span className="muted image-uploader__count">
          {existingCount + files.length}/{maxImages}
        </span>
      </div>

      <p className="form-hint">JPEG, PNG or WebP · each up to 5 MB.</p>

      <input
        ref={inputRef}
        className="visually-hidden"
        id="image-uploader-input"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleChange}
        disabled={disabled || remaining <= 0}
        aria-labelledby="image-uploader-label"
      />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || remaining <= 0}
      >
        Add photos
      </button>

      {message ? (
        <p className="form-error" role="alert">
          {message}
        </p>
      ) : null}

      {previews.length > 0 ? (
        <ul className="image-uploader__previews">
          {previews.map((preview, index) => (
            <li key={preview.url} className="image-uploader__preview">
              <img src={preview.url} alt={`Selected ${preview.file.name}`} />
              <button
                type="button"
                className="image-uploader__remove"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remove ${preview.file.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
