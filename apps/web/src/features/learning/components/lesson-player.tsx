'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDurationSeconds } from '@/lib/format';

const POSITION_SAVE_INTERVAL_MS = 20_000;

interface LessonPlayerProps {
  /** Changes whenever the lesson changes - used to reset local player state. */
  lessonKey: string;
  videoUrl: string;
  initialPositionSeconds: number;
  isCompleted?: boolean;
  onProgress: (seconds: number) => void;
  onEnded: () => void;
}

/**
 * Matches youtube.com/watch?v=, youtu.be/, youtube.com/embed/ and
 * youtube.com/shorts/ (with or without www./m. and any extra query params),
 * including the -nocookie domain variant. YouTube video IDs are always
 * exactly 11 characters.
 */
const YOUTUBE_ID_PATTERN =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function getYouTubeVideoId(url: string): string | null {
  return url.match(YOUTUBE_ID_PATTERN)?.[1] ?? null;
}

/** Chooses the right player for the lesson's video source - a YouTube link renders YouTube's own embedded player, anything else is treated as a direct media file for the native `<video>` element. */
export function LessonPlayer(props: LessonPlayerProps) {
  const youtubeVideoId = getYouTubeVideoId(props.videoUrl);
  if (youtubeVideoId) {
    return <YouTubeLessonPlayer {...props} videoId={youtubeVideoId} />;
  }
  return <NativeLessonPlayer {...props} />;
}

interface YouTubePlayerInstance {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  destroy(): void;
  unMute(): void;
  setVolume(volume: number): void;
}

interface YouTubePlayerEvent {
  data: number;
  target: YouTubePlayerInstance;
}

interface YouTubeIframeApi {
  Player: new (
    element: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: YouTubePlayerEvent) => void;
        onStateChange?: (event: YouTubePlayerEvent) => void;
        onError?: () => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | null = null;

/** Loads `https://www.youtube.com/iframe_api` at most once app-wide, with timeout and error fallback. */
function loadYouTubeIframeApi(): Promise<YouTubeIframeApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      } else {
        youtubeApiPromise = null;
        reject(new Error('YouTube API load timed out'));
      }
    }, 4000);

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      previousCallback?.();
      if (window.YT) resolve(window.YT);
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      existing.addEventListener('error', () => {
        clearTimeout(timer);
        youtubeApiPromise = null;
        reject(new Error('YouTube API script error'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      youtubeApiPromise = null;
      reject(new Error('YouTube API network error'));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function YouTubeLessonPlayer({
  lessonKey,
  videoId,
  isCompleted,
  onProgress,
  onEnded,
}: {
  lessonKey: string;
  videoId: string;
  initialPositionSeconds: number;
  isCompleted?: boolean;
  onProgress: (seconds: number) => void;
  onEnded: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const maxWatchedRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  useEffect(() => {
    maxWatchedRef.current = 0;
  }, [lessonKey, isCompleted]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setIsPlaying(false);
    setPlaybackError(false);
    setUseIframeFallback(false);

    const mount = mountRef.current;
    if (!mount) return;
    const target = document.createElement('div');
    target.className = 'size-full';
    mount.appendChild(target);

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(target, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            ...(currentOrigin ? { origin: currentOrigin, widget_referrer: window.location.href } : {}),
            ...(!isCompleted ? { disablekb: 1 } : {}),
            start: 0,
          },
          events: {
            onReady: (event) => {
              event.target.unMute();
              event.target.setVolume(100);
              setReady(true);
            },
            onError: () => setPlaybackError(true),
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              }
              if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                const currentTime = event.target.getCurrentTime();
                if (!isCompleted && currentTime > maxWatchedRef.current + 3) {
                  event.target.seekTo(maxWatchedRef.current, true);
                } else {
                  maxWatchedRef.current = Math.max(maxWatchedRef.current, currentTime);
                  onProgress(Math.floor(currentTime));
                }
              }
              if (event.data === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                onEnded();
              }
            },
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to standard embed iframe if YouTube JavaScript API encounters network error
        setUseIframeFallback(true);
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      target.remove();
    };
  }, [lessonKey, videoId, isCompleted]);

  useEffect(() => {
    if (!isPlaying) return;
    // Check completion and update max watched smoothly
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const currentTime = player.getCurrentTime();
      const duration = typeof player.getDuration === 'function' ? player.getDuration() : 0;
      if (!isCompleted && currentTime > maxWatchedRef.current + 4) {
        player.seekTo(maxWatchedRef.current, true);
      } else {
        maxWatchedRef.current = Math.max(maxWatchedRef.current, currentTime);
        if (duration > 0 && currentTime >= duration * 0.95) {
          onEnded();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isCompleted, onEnded]);

  useEffect(() => {
    if (!isPlaying) return;
    // Periodic progress save every 20 seconds (not every second)
    const saveInterval = setInterval(() => {
      const player = playerRef.current;
      if (player) onProgress(Math.floor(player.getCurrentTime()));
    }, POSITION_SAVE_INTERVAL_MS);
    return () => clearInterval(saveInterval);
  }, [isPlaying, onProgress]);

  if (useIframeFallback) {
    const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-sidebar-border bg-black shadow-2xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&enablejsapi=1${originParam}&start=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full border-0"
          onLoad={() => {
            setReady(true);
            onEnded();
          }}
          onError={() => setPlaybackError(true)}
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-sidebar-border bg-black shadow-2xl">
      <div ref={mountRef} className="size-full" />
      {playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-6 text-center">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm font-medium text-white">This video couldn&apos;t be played</p>
          <p className="text-xs text-white/70">
            The YouTube video may be private, deleted, or unavailable.
          </p>
        </div>
      )}
      {!ready && !playbackError && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <Loader2 className="size-10 animate-spin text-sidebar-primary" />
          <span className="text-xs font-medium text-white/80">Loading video...</span>
        </div>
      )}
    </div>
  );
}

function NativeLessonPlayer({
  lessonKey,
  videoUrl,
  isCompleted,
  onProgress,
  onEnded,
}: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxWatchedRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoading(true);
    setPlaybackError(false);
    maxWatchedRef.current = 0;
  }, [lessonKey, isCompleted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function handleLoadedMetadata() {
      if (!video) return;
      setDuration(video.duration);
      video.currentTime = 0;
      setCurrentTime(0);
      maxWatchedRef.current = 0;
      setIsLoading(false);
    }
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [lessonKey, isCompleted]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video) onProgress(Math.floor(video.currentTime));
    }, POSITION_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying, onProgress]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setPlaybackError(false))
        .catch(() => setPlaybackError(true));
    } else {
      video.pause();
    }
  }

  function handlePause() {
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) onProgress(Math.floor(video.currentTime));
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    if (!isCompleted) return; // Completely blocked for uncompleted videos
    const video = videoRef.current;
    const requested = Number(event.target.value);
    if (video) video.currentTime = requested;
    setCurrentTime(requested);
  }

  function handleSeeking() {
    const video = videoRef.current;
    if (!video) return;
    // Block any attempt to seek ahead during uncompleted playback
    if (!isCompleted && video.currentTime > maxWatchedRef.current + 0.5) {
      video.currentTime = maxWatchedRef.current;
      setCurrentTime(maxWatchedRef.current);
    }
  }

  function handleTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    const time = video.currentTime;
    setCurrentTime(time);
    if (time > maxWatchedRef.current) {
      maxWatchedRef.current = time;
    }
    if (duration > 0 && time >= duration * 0.95) {
      onEnded();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Intercept seeking keys completely when not yet completed
    if (!isCompleted) {
      const seekKeys = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        'j',
        'J',
        'l',
        'L',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
      ];
      if (seekKeys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
      event.preventDefault();
      togglePlay();
    } else if (event.key === 'm' || event.key === 'M') {
      event.preventDefault();
      toggleMute();
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current.requestFullscreen();
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-sidebar-border bg-black shadow-2xl outline-hidden"
    >
      <video
        ref={videoRef}
        key={lessonKey}
        src={videoUrl}
        className="size-full"
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onSeeking={handleSeeking}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsLoading(false);
          setIsPlaying(false);
          onEnded();
        }}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
          setPlaybackError(true);
        }}
        onClick={togglePlay}
      >
        <track kind="captions" />
      </video>

      {isLoading && !playbackError && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-xs">
          <Loader2 className="size-10 animate-spin text-sidebar-primary" />
          <span className="text-xs font-medium text-white/80">Loading video...</span>
        </div>
      )}

      {playbackError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-6 text-center">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm font-medium text-white">This video couldn&apos;t be played</p>
          <p className="text-xs text-white/70">
            The video source may be missing or in an unsupported format.
          </p>
        </div>
      ) : (
        !isPlaying && !isLoading && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play lesson video"
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/20"
          >
            <span className="flex size-20 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md transition-transform hover:scale-110">
              <Play className="size-9 fill-white text-white" />
            </span>
          </button>
        )
      )}

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="mb-2 flex items-center gap-4">
          <span className="w-12 shrink-0 text-right text-xs font-medium text-white">
            {formatDurationSeconds(currentTime)}
          </span>
          {isCompleted ? (
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek"
              className="h-1 flex-1 cursor-pointer accent-sidebar-primary"
            />
          ) : (
            <div
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              title="Seeking is disabled until you complete the lesson"
            >
              <div
                className="h-full bg-sidebar-primary transition-[width] duration-150"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          )}
          <span className="w-12 shrink-0 text-xs font-medium text-white/70">
            {formatDurationSeconds(duration)}
          </span>
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlay}
              className="hover:text-sidebar-primary"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="hover:text-sidebar-primary"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hover:text-sidebar-primary"
            aria-label="Fullscreen"
          >
            <Maximize className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
