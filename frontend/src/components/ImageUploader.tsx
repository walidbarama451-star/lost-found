import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import './ImageUploader.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_SOURCE_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.82;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}

async function prepareImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const needsResize = longestSide > MAX_DIMENSION;
    const needsCompression = file.size > COMPRESS_THRESHOLD;

    if (!needsResize && !needsCompression) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(1, MAX_DIMENSION / longestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await canvasToBlob(canvas);
    if (!blob || blob.size >= file.size) return file;

    const name = `${file.name.replace(/\.[^.]+$/, '')}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

interface ImageUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingCount?: number;
  maxImages?: number;
  disabled?: boolean;
  error?: string | null;
}

interface Preview {
  file: File;
  url: string;
}

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
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => {
      for (const preview of next) URL.revokeObjectURL(preview.url);
    };
  }, [files]);

  const remaining = maxImages - existingCount - files.length;

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (chosen.length === 0) return;

    setProcessing(true);
    try {
      const rejected: string[] = [];
      const candidates: File[] = [];
      for (const file of chosen) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          rejected.push(`${file.name}: use JPEG, PNG or WebP`);
        } else if (file.size > MAX_SOURCE_FILE_SIZE) {
          rejected.push(`${file.name}: must be 20 MB or smaller`);
        } else {
          candidates.push(file);
        }
      }

      const prepared = await Promise.all(candidates.map(prepareImage));
      const accepted: File[] = [];
      for (const file of prepared) {
        if (file.size > MAX_FILE_SIZE) {
          rejected.push(`${file.name}: could not be reduced below 3 MB`);
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
    } finally {
      setProcessing(false);
    }
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

      <p className="form-hint">
        JPEG, PNG or WebP · each up to 3 MB. Large photos are resized automatically.
      </p>

      <input
        ref={inputRef}
        className="visually-hidden"
        id="image-uploader-input"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleChange}
        disabled={disabled || processing || remaining <= 0}
        aria-labelledby="image-uploader-label"
      />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing || remaining <= 0}
      >
        {processing ? 'Optimizing…' : 'Add photos'}
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
