'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDurationSeconds } from '@/lib/format';

const POSITION_SAVE_INTERVAL_MS = 20_000;

interface LessonPlayerProps {
  /** Changes whenever the lesson changes - used to reset local player state. */
  lessonKey: string;
  videoUrl: string;
  initialPositionSeconds: number;
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
  destroy(): void;
}

interface YouTubePlayerEvent {
  data: number;
  target: YouTubePlayerInstance;
}

interface YouTubeIframeApi {
  Player: new (
    element: HTMLElement,
    options: {
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

/** Loads `https://www.youtube.com/iframe_api` at most once app-wide, chaining onto any previously-registered `onYouTubeIframeAPIReady` callback. */
function loadYouTubeIframeApi(): Promise<YouTubeIframeApi> {
  if (window.YT) return Promise.resolve(window.YT);
  youtubeApiPromise ??= new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

function YouTubeLessonPlayer({
  lessonKey,
  videoId,
  initialPositionSeconds,
  onProgress,
  onEnded,
}: {
  lessonKey: string;
  videoId: string;
  initialPositionSeconds: number;
  onProgress: (seconds: number) => void;
  onEnded: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setIsPlaying(false);
    setPlaybackError(false);

    // The YouTube IFrame API replaces whatever element it's given with its
    // own <iframe>, outside React's control. Handing it `mountRef.current`
    // directly would let it silently swap out a node React still thinks it
    // owns, causing DOM-reconciliation errors on the next render (and the
    // stray postMessage warnings seen under StrictMode's mount/unmount/
    // remount dev cycle). Instead give it a throwaway child div that React
    // never touches again after this effect creates it.
    const mount = mountRef.current;
    if (!mount) return;
    const target = document.createElement('div');
    target.className = 'size-full';
    mount.appendChild(target);

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(target, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          ...(initialPositionSeconds > 0 ? { start: Math.floor(initialPositionSeconds) } : {}),
        },
        events: {
          onReady: () => setReady(true),
          onError: () => setPlaybackError(true),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) setIsPlaying(true);
            if (event.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              onProgress(Math.floor(event.target.getCurrentTime()));
            }
            if (event.data === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnded();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      target.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-create the player when the lesson itself changes
  }, [lessonKey, videoId]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player) onProgress(Math.floor(player.getCurrentTime()));
    }, POSITION_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying, onProgress]);

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
        <Skeleton className="absolute inset-0 rounded-xl" aria-hidden="true" />
      )}
    </div>
  );
}

function NativeLessonPlayer({
  lessonKey,
  videoUrl,
  initialPositionSeconds,
  onProgress,
  onEnded,
}: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlaybackError(false);
  }, [lessonKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function handleLoadedMetadata() {
      if (!video) return;
      if (initialPositionSeconds > 0 && initialPositionSeconds < video.duration) {
        video.currentTime = initialPositionSeconds;
        setCurrentTime(initialPositionSeconds);
      }
      setDuration(video.duration);
    }
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-attach when the lesson itself changes
  }, [lessonKey]);

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
    const video = videoRef.current;
    const value = Number(event.target.value);
    if (video) video.currentTime = value;
    setCurrentTime(value);
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
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-sidebar-border bg-black shadow-2xl"
    >
      <video
        ref={videoRef}
        key={lessonKey}
        src={videoUrl}
        className="size-full"
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded();
        }}
        onError={() => {
          setIsPlaying(false);
          setPlaybackError(true);
        }}
        onClick={togglePlay}
      >
        <track kind="captions" />
      </video>

      {playbackError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-6 text-center">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm font-medium text-white">This video couldn&apos;t be played</p>
          <p className="text-xs text-white/70">
            The video source may be missing or in an unsupported format.
          </p>
        </div>
      ) : (
        !isPlaying && (
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
