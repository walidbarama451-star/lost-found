import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { buttonClasses } from '@/shared/ui/Button';
import { errorClass, hintClass } from '@/shared/ui/formStyles';
import { CameraCaptureModal } from './CameraCaptureModal';

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

export const ImageUploader = ({
  files,
  onFilesChange,
  existingCount = 0,
  maxImages = 5,
  disabled = false,
  error,
}: ImageUploaderProps): ReactNode => {
  const inputRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
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

  const handleCapturedPhoto = async (capturedFile: File) => {
    if (remaining <= 0) {
      setLocalError(`You can attach at most ${maxImages} images`);
      return;
    }

    setProcessing(true);
    try {
      const prepared = await prepareImage(capturedFile);
      if (prepared.size > MAX_FILE_SIZE) {
        setLocalError('Captured photo could not be compressed below 3 MB.');
        return;
      }
      setLocalError(null);
      onFilesChange([...files, prepared]);
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const message = error ?? localError;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink" id="image-uploader-label">
          Photos <span className="text-ink-faint">(1 required, up to {maxImages})</span>
        </span>
        <span className="text-xs text-ink-faint tabular">
          {existingCount + files.length}/{maxImages}
        </span>
      </div>

      <p className={hintClass}>
        JPEG, PNG or WebP · each up to 3 MB. Large photos are resized automatically.
      </p>

      {/* Hidden file input for upload */}
      <input
        ref={inputRef}
        className="sr-only"
        id="image-uploader-input"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleChange}
        disabled={disabled || processing || remaining <= 0}
        aria-labelledby="image-uploader-label"
      />

      {/* Hidden file input for native camera fallback */}
      <input
        ref={nativeCameraRef}
        className="sr-only"
        id="image-uploader-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={disabled || processing || remaining <= 0}
        aria-hidden="true"
      />

      <div className="rounded-xl border border-dashed border-line bg-surface p-4">
        {!pickerOpen ? (
          <button
            type="button"
            className={buttonClasses('secondary', 'sm')}
            onClick={() => setPickerOpen(true)}
            disabled={disabled || processing || remaining <= 0}
          >
            <ImagePlus size={15} aria-hidden />
            {processing ? 'Optimizing…' : 'Upload a photo'}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonClasses('primary', 'sm')}
              onClick={() => {
                setCameraOpen(true);
                setPickerOpen(false);
              }}
            >
              <Camera size={15} aria-hidden />
              Take photo
            </button>

            <button
              type="button"
              className={buttonClasses('secondary', 'sm')}
              onClick={() => {
                inputRef.current?.click();
                setPickerOpen(false);
              }}
            >
              <ImagePlus size={15} aria-hidden />
              Add from files
            </button>

            <button
              type="button"
              className={buttonClasses('ghost', 'sm')}
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <p className="mt-2 text-xs text-ink-faint">
          {remaining > 0
            ? `${remaining} more photo${remaining === 1 ? '' : 's'} allowed.`
            : 'Photo limit reached.'}
        </p>
      </div>

      {message ? (
        <p className={errorClass} role="alert">
          {message}
        </p>
      ) : null}

      {previews.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((preview, index) => (
            <li
              key={preview.url}
              className="relative aspect-square overflow-hidden rounded-lg border border-line bg-overlay"
            >
              <img
                className="size-full object-cover"
                src={preview.url}
                alt={`Selected ${preview.file.name}`}
              />
              <button
                type="button"
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-canvas/85 text-ink transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remove ${preview.file.name}`}
              >
                <X size={13} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Live in-app camera viewfinder modal */}
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapturedPhoto}
        onFallback={() => nativeCameraRef.current?.click()}
      />
    </div>
  );
};
