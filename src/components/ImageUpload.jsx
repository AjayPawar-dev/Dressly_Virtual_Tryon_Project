import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function validate(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Please upload a JPG, PNG, or WebP image.';
  if (file.size > 10 * 1024 * 1024) return 'File size must be under 10MB.';
  return null;
}

function getCameraErrorMessage(error) {
  if (!error?.name) {
    return 'We could not open your camera. Please try again or use Browse Files.';
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Camera permission was denied. Please allow access and try again.';
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No camera was found on this device.';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'Your camera is already in use by another app.';
  }

  if (error.name === 'OverconstrainedError') {
    return 'This camera mode is not available on your device.';
  }

  return 'We could not start the camera. Please try again.';
}

export function ImageUpload({
  title,
  subtitle,
  existingImage = null,
  onImageSelect,
  guidelines = [],
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState('user');
  const [capturedFile, setCapturedFile] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!existingImage && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [existingImage]);

  useEffect(() => {
    return () => {
      if (capturedPreview) {
        URL.revokeObjectURL(capturedPreview);
      }
    };
  }, [capturedPreview]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isCameraOpen || capturedFile) {
      return undefined;
    }

    let cancelled = false;
    const videoElement = videoRef.current;

    const startCamera = async () => {
      if (
        typeof window !== 'undefined' &&
        !window.isSecureContext &&
        window.location.hostname !== 'localhost'
      ) {
        setCameraError('Camera access requires HTTPS or localhost.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser does not support direct camera capture.');
        return;
      }

      setIsCameraStarting(true);
      setCameraError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: cameraFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play().catch(() => {});
        }
      } catch (cameraStartError) {
        if (!cancelled) {
          setCameraError(getCameraErrorMessage(cameraStartError));
        }
      } finally {
        if (!cancelled) {
          setIsCameraStarting(false);
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [cameraFacingMode, capturedFile, isCameraOpen]);

  const preview = existingImage;

  const clearCapturedState = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview(null);
    setCapturedFile(null);
  };

  const processFile = (file) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return false;
    }

    setError(null);
    onImageSelect(file);
    return true;
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileInput = (event) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const clear = () => {
    setError(null);
    onImageSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openCamera = () => {
    clearCapturedState();
    setCameraError(null);
    setCameraFacingMode('user');
    setIsCameraOpen(true);
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    setIsCameraStarting(false);
    setCameraError(null);
    clearCapturedState();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError('Camera preview is not ready yet.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera preview is still loading. Please try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Could not capture a photo on this device.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Could not capture the photo. Please try again.');
          return;
        }

        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        clearCapturedState();
        setCapturedPreview(URL.createObjectURL(blob));
        setCapturedFile(file);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const useCapturedPhoto = () => {
    if (!capturedFile) {
      return;
    }

    if (processFile(capturedFile)) {
      closeCamera();
    }
  };

  const retakePhoto = () => {
    clearCapturedState();
    setCameraError(null);
  };

  const switchCamera = () => {
    clearCapturedState();
    setCameraError(null);
    setCameraFacingMode((current) =>
      current === 'user' ? 'environment' : 'user'
    );
  };

  const browseFromCamera = () => {
    closeCamera();
    inputRef.current?.click();
  };

  return (
    <>
      <div className="max-w-xl mx-auto px-4 py-6 sm:py-8">
      {/* Title with gradient */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl text-gradient-primary mb-2 tracking-tight font-display">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground font-sans">{subtitle}</p>
      </div>

      {!preview ? (
        /* Upload zone with gradient border */
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center gap-5 px-6 py-10 sm:py-14',
            'border-2 border-dashed rounded-2xl cursor-pointer',
            'transition-all duration-300',
            isDragging
              ? 'border-primary-purple bg-gradient-accent-soft scale-[1.01] glow-purple'
              : 'border-white/20 bg-gradient-card hover:border-primary-purple/50 hover:bg-gradient-accent-soft',
          )}
        >
          {/* Floating icon with gradient bg */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-accent/20 flex items-center justify-center animate-float">
            <Upload className="w-7 h-7 text-primary-purple" strokeWidth={1.5} />
          </div>

          <div className="text-center">
            <p className="text-base font-medium font-sans text-white mb-1">
              {isDragging ? 'Drop to upload' : 'Drag & drop your image here'}
            </p>
            <p className="text-sm text-white/70 font-sans">or use the buttons below</p>
          </div>

          {/* Gradient buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg w-full sm:w-auto',
                'bg-gradient-primary text-white text-sm font-semibold font-sans',
                'hover:bg-gradient-primary-hover glow-purple-hover',
                'active:scale-[0.98] transition-all duration-300 shadow-lg',
              )}
            >
              <ImageIcon className="w-4 h-4" /> Browse Files
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openCamera();
              }}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg w-full sm:w-auto',
                'border border-white/20 bg-white/5 text-white text-sm font-medium font-sans',
                'hover:bg-white/10 active:scale-[0.98] transition-all duration-200',
              )}
            >
              <Camera className="w-4 h-4" /> Use Camera
            </button>
          </div>

          <p className="text-xs text-muted-foreground font-sans">JPG · PNG · WebP · Max 10 MB</p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileInput}
            className="sr-only"
          />
        </div>
      ) : (
        /* Preview with gradient accents */
        <div className="flex flex-col items-center gap-0">
          <div className="relative inline-block">
            {/* Cancel button with gradient */}
            <button
              onClick={clear}
              aria-label="Remove image"
              className={cn(
                'absolute -top-3 -right-3 z-10',
                'w-8 h-8 rounded-full',
                'bg-gradient-to-br from-brand-error to-red-700',
                'text-white border-[3px] border-background',
                'flex items-center justify-center',
                'shadow-lg hover:shadow-xl',
                'hover:scale-110 active:scale-95',
                'transition-all duration-200',
              )}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            <img
              src={preview}
              alt="Selected"
              loading="eager"
              decoding="async"
              className="max-h-[400px] max-w-full rounded-2xl shadow-2xl object-contain block border border-white/20"
            />

            {/* Success badge with gradient */}
            <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gradient-success flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Change button with gradient */}
          <button
            onClick={clear}
            className={cn(
              'mt-5 px-8 py-2.5 rounded-lg',
              'bg-gradient-card border border-white/20',
              'text-white font-sans text-sm font-semibold',
              'hover:bg-gradient-card-hover hover:border-primary-purple/50',
              'active:scale-[0.98]',
              'transition-all duration-300 shadow-md hover:shadow-lg',
            )}
          >
            Change Image
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-brand-error/10 border border-brand-error/30">
          <X className="w-4 h-4 text-brand-error mt-0.5 flex-shrink-0" />
          <p className="text-sm text-brand-error font-sans">{error}</p>
        </div>
      )}

      {/* Guidelines card with gradient */}
      {guidelines.length > 0 && !preview && (
        <div className="mt-6 bg-gradient-card border border-white/10 rounded-xl p-4">
          <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-3">
            Tips for best results
          </p>
          <ul className="space-y-2">
            {guidelines.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground font-sans"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-primary mt-[7px] flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close camera"
            onClick={closeCamera}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          <div className="relative z-[91] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <h3 className="font-display text-xl text-white">Take a photo</h3>
                <p className="text-sm text-white/65 font-sans">
                  Allow camera access, then capture a clear image in real time.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCamera}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75">
                {capturedPreview ? (
                  <img
                    src={capturedPreview}
                    alt="Captured preview"
                    className="h-[280px] w-full object-cover sm:h-[420px]"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-[280px] w-full object-cover sm:h-[420px]"
                  />
                )}

                {isCameraStarting && !capturedPreview && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/65 text-white">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-purple" />
                    <p className="text-sm font-sans text-white/80">
                      Starting camera...
                    </p>
                  </div>
                )}

                {cameraError && !capturedPreview && !isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/75 px-6 text-center">
                    <CameraOff className="h-10 w-10 text-brand-error" />
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white">
                        Camera unavailable
                      </p>
                      <p className="text-sm font-sans text-white/75">
                        {cameraError}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          setCameraFacingMode((current) =>
                            current === 'user' ? 'environment' : 'user'
                          )
                        }
                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={browseFromCamera}
                        className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-gradient-primary-hover"
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-sans text-white/70">
                  {capturedPreview
                    ? 'Review your capture. Retake it or use this photo.'
                    : 'Center yourself in frame and capture when ready.'}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {capturedPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Retake
                      </button>
                      <button
                        type="button"
                        onClick={useCapturedPhoto}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gradient-primary-hover"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Use This Photo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={switchCamera}
                        disabled={isCameraStarting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Switch Camera
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={isCameraStarting || Boolean(cameraError)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gradient-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Camera className="h-4 w-4" />
                        Capture Photo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}
