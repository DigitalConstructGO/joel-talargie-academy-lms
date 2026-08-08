'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
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

export function LessonPlayer({
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

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
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
    if (video.paused) void video.play();
    else video.pause();
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
        onClick={togglePlay}
      >
        <track kind="captions" />
      </video>

      {!isPlaying && (
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
