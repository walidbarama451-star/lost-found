import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Camera, Check, RefreshCw, SwitchCamera, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallback?: () => void;
}

export const CameraCaptureModal = ({
  open,
  onClose,
  onCapture,
  onFallback,
}: CameraCaptureModalProps): ReactNode => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Check if multiple camera devices exist
  useEffect(() => {
    if (!open) return;
    const checkDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }
    };
    void checkDevices();
  }, [open]);

  // Start or restart video stream
  useEffect(() => {
    if (!open || capturedBlob) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const startCamera = async () => {
      stopStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setError('Camera access is not supported by your current browser.');
          setLoading(false);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (caught) {
        if (cancelled) return;
        const message =
          caught instanceof Error && caught.name === 'NotAllowedError'
            ? 'Camera permission was denied. Please allow camera access in your browser settings.'
            : 'Unable to start camera. Make sure no other application is using it.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facingMode, capturedBlob]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handleClose = () => {
    stopStream();
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setCapturedBlob(null);
    setError(null);
    onClose();
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return;

    // If using user-facing camera, mirror the canvas horizontally for natural selfie orientation
    if (facingMode === 'user') {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(url);
      },
      'image/jpeg',
      0.92,
    );
  };

  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setCapturedBlob(null);
  };

  const handleUsePhoto = () => {
    if (!capturedBlob) return;
    const filename = `camera-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    onCapture(file);
    handleClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Camera photo capture"
    >
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2 text-ink">
            <Camera size={18} className="text-accent-600" aria-hidden />
            <h2 className="text-base font-semibold">Take a photo</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-overlay hover:text-ink"
            aria-label="Close camera"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Viewfinder / Preview screen */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
          {capturedUrl ? (
            <img
              src={capturedUrl}
              alt="Captured item snapshot"
              className="size-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`size-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
                  <RefreshCw size={24} className="animate-spin text-accent-400" />
                  <p className="text-xs">Starting camera…</p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center text-white">
              <p className="text-sm leading-relaxed text-red-300">{error}</p>
              {onFallback && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleClose();
                    onFallback();
                  }}
                >
                  Use device file picker
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          {capturedBlob ? (
            <>
              <Button variant="secondary" onClick={handleRetake}>
                <RefreshCw size={15} aria-hidden />
                Retake
              </Button>
              <Button onClick={handleUsePhoto}>
                <Check size={16} aria-hidden />
                Use photo
              </Button>
            </>
          ) : (
            <>
              <div className="w-20">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-overlay"
                    title="Flip camera"
                  >
                    <SwitchCamera size={14} aria-hidden />
                    Flip
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={loading || Boolean(error)}
                className="group relative flex size-14 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Capture photo"
              >
                <span className="size-11 rounded-full border-2 border-white/60 transition-transform group-hover:scale-105" />
                <Camera size={20} className="absolute text-white" aria-hidden />
              </button>

              <div className="flex w-20 justify-end">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
