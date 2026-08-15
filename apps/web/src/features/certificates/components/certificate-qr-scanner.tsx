'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  CameraOff,
  FlipHorizontal,
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
  ZapOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CertificateQrScannerProps {
  onScan: (codeOrToken: string) => void;
  onSwitchToManual?: () => void;
  isVerifying?: boolean;
}

type ScannerStatus =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'permission-denied'
  | 'unavailable'
  | 'error';

/**
 * Extracts a certificate verification token or certificate code from raw QR contents.
 * Supports:
 * - Full verification URLs: `https://.../certificates/verify/<token>`
 * - Query URLs: `https://.../certificates/verify?token=<token>` or `?code=<code>`
 * - Direct token / certificate code: `JTA-2026-...` or high-entropy verification tokens
 */
export function extractVerificationIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Check if it is a full URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const queryToken = url.searchParams.get('token') || url.searchParams.get('code') || url.searchParams.get('q');
      if (queryToken) return queryToken.trim();

      const pathSegments = url.pathname.split('/').filter(Boolean);
      const verifyIdx = pathSegments.findIndex((s) => s.toLowerCase() === 'verify');
      const nextSegment = verifyIdx !== -1 ? pathSegments[verifyIdx + 1] : undefined;
      if (nextSegment) {
        return decodeURIComponent(nextSegment).trim();
      }
    } catch {
      // If URL parsing fails, fall through to raw string
    }
  }

  // If contains query string like `?token=XYZ`
  const queryMatch = trimmed.match(/[?&](?:token|code|q)=([^&#]+)/i);
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]).trim();
  }

  return trimmed;
}

export function CertificateQrScanner({
  onScan,
  onSwitchToManual,
  isVerifying = false,
}: CertificateQrScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isScanningActiveRef = useRef(false);

  const stopCamera = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (!isScanningActiveRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width === 0 || height === 0) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (qrCode && qrCode.data) {
      const extracted = extractVerificationIdentifier(qrCode.data);
      if (extracted) {
        // Found valid QR data! Stop camera and notify callback
        stopCamera();
        onScan(extracted);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setStatus('requesting');
    setErrorMessage(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      setErrorMessage('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      // Request media stream with preferred facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      isScanningActiveRef.current = true;

      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
      } catch {
        // Ignore device enumeration errors
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
        setHasTorch(Boolean(capabilities?.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setStatus('scanning');
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setStatus('permission-denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings, or enter the certificate code manually.');
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setErrorMessage('No camera was detected on this device. You can enter the certificate code manually or upload a photo of the QR code.');
      } else {
        setStatus('error');
        setErrorMessage(error?.message || 'Unable to access camera. Please check your camera permissions.');
      }
    }
  }, [facingMode, scanFrame, stopCamera]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      setHasTorch(false);
    }
  }, [torchOn]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  // Handle image file upload for QR scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (qrCode && qrCode.data) {
          const extracted = extractVerificationIdentifier(qrCode.data);
          if (extracted) {
            onScan(extracted);
            return;
          }
        }
        setErrorMessage('No valid certificate QR code could be read from this image. Please try another image or enter the certificate ID manually.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Scanner Viewport Container */}
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-black shadow-inner sm:max-w-md">
        {/* Hidden video & canvas for scanning */}
        <video
          ref={videoRef}
          className={cn(
            'size-full object-cover transition-opacity duration-300',
            status === 'scanning' ? 'opacity-100' : 'opacity-0',
          )}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder Target Graphic (Visible when scanning) */}
        {status === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
            <div className="relative aspect-square w-full max-w-[240px] rounded-2xl border-2 border-dashed border-white/40 shadow-2xl">
              {/* Corner Brackets */}
              <div className="absolute -left-1 -top-1 size-6 rounded-tl-lg border-l-4 border-t-4 border-brand" />
              <div className="absolute -right-1 -top-1 size-6 rounded-tr-lg border-r-4 border-t-4 border-brand" />
              <div className="absolute -bottom-1 -left-1 size-6 rounded-bl-lg border-b-4 border-l-4 border-brand" />
              <div className="absolute -bottom-1 -right-1 size-6 rounded-br-lg border-b-4 border-r-4 border-brand" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute inset-x-0 top-0 h-0.5 animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_12px_rgba(34,197,94,0.8)]" />

              <div className="absolute -bottom-10 inset-x-0 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                  <Sparkles className="size-3 text-brand" />
                  Align QR code in frame
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Requesting / Loading State */}
        {(status === 'requesting' || isVerifying) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center text-white backdrop-blur-sm">
            <Loader2 className="size-8 animate-spin text-brand" />
            <p className="text-sm font-medium">
              {isVerifying ? 'Verifying certificate...' : 'Initializing camera...'}
            </p>
          </div>
        )}

        {/* Permission Denied State */}
        {status === 'permission-denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/95 p-6 text-center text-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <CameraOff className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold">Camera Access Required</h3>
              <p className="max-w-xs text-xs text-muted-foreground">
                Camera access is required to scan certificate QR codes. Please allow permissions in your browser.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button size="sm" onClick={startCamera} className="w-full gap-2">
                <RefreshCw className="size-3.5" />
                Retry Camera
              </Button>
              {onSwitchToManual && (
                <Button size="sm" variant="outline" onClick={onSwitchToManual} className="w-full">
                  Enter Code Manually
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Unavailable or Error State */}
        {(status === 'unavailable' || status === 'error') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/95 p-6 text-center text-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning">
              <CameraOff className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold">
                {status === 'unavailable' ? 'Camera Unavailable' : 'Camera Error'}
              </h3>
              <p className="max-w-xs text-xs text-muted-foreground">
                {errorMessage || 'Unable to start camera stream on this device.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button size="sm" onClick={startCamera} className="w-full gap-2">
                <RefreshCw className="size-3.5" />
                Try Again
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <ImageIcon className="size-3.5" />
                Upload QR Image
              </Button>
            </div>
          </div>
        )}

        {/* In-view overlay controls (Switch camera, Torch) */}
        {status === 'scanning' && (
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80',
                  torchOn && 'bg-brand text-brand-foreground',
                )}
                aria-label="Toggle flashlight"
              >
                {torchOn ? <ZapOff className="size-4" /> : <Zap className="size-4" />}
              </button>
            )}
            {availableDevices.length > 1 && (
              <button
                type="button"
                onClick={toggleCamera}
                className="flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                aria-label="Switch camera"
              >
                <FlipHorizontal className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Helper & Fallback Options */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
        >
          <ImageIcon className="size-3.5 text-muted-foreground" />
          Upload certificate image / photo
        </button>
      </div>
    </div>
  );
}
