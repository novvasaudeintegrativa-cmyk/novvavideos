"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoStatus, VideoEventMilestone } from "@/types/database";
import { sendVideoEvent, type TrackingContext } from "@/lib/video-tracking";

const MILESTONES: VideoEventMilestone[] = [25, 50, 75, 100];

// Avisa a pagina que hospeda o embed (via postMessage, ja que o player
// roda num iframe cross-origin) pra ela poder integrar com o proprio
// rastreamento (Meta Pixel, Supabase, etc.) sem depender do nosso banco.
function postToParent(videoId: string, type: "play" | "progress" | "complete", percent?: VideoEventMilestone) {
  if (typeof window === "undefined" || window.parent === window) return;
  try {
    window.parent.postMessage({ source: "novva-video", type, videoId, percent }, "*");
  } catch {
    // pagina host pode bloquear postMessage — ignora
  }
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  );
}
function VolumeHighIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}
function VolumeMuteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4l-1.88 1.88L12 7.76V4z" />
    </svg>
  );
}
function FullscreenEnterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}
function FullscreenExitIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  );
}

type Stage = "loading" | "error" | "ready";

export function VideoPlayer({
  videoId,
  status,
  thumbnailUrl,
  autoplay = false,
  startMuted = false,
  tracking,
}: {
  videoId: string;
  status: VideoStatus | null;
  thumbnailUrl: string | null;
  autoplay?: boolean;
  startMuted?: boolean;
  tracking: TrackingContext;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFiredPlay = useRef(false);
  const firedMilestones = useRef<Set<VideoEventMilestone>>(new Set());

  const [stage, setStage] = useState<Stage>(status === "ready" ? "loading" : "error");
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isMuted, setIsMuted] = useState(autoplay || startMuted);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls((prev) => (isPlaying ? false : prev));
    }, 2800);
  }, [isPlaying]);

  function handleActivity() {
    setShowControls(true);
    scheduleHideControls();
  }

  useEffect(() => {
    if (!autoplay || status !== "ready") return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().then(() => setHasStarted(true)).catch(() => {});
  }, [autoplay, status, attempt]);

  useEffect(() => {
    if (status !== "ready") return;
    sendVideoEvent(videoId, tracking, "view");
    // Dispara só uma vez por montagem do player — sessionId/videoId não mudam em runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  if (!status) {
    return <PlayerMessage title="Vídeo não encontrado" detail="Verifique se o link está correto." />;
  }
  if (status !== "ready") {
    return (
      <PlayerMessage
        title="Este vídeo ainda não está disponível"
        detail="O upload ainda não foi concluído ou validado."
      />
    );
  }
  if (stage === "error") {
    return (
      <PlayerMessage title="Não foi possível carregar o vídeo" detail="Verifique sua conexão e tente novamente.">
        <button
          type="button"
          onClick={() => {
            setStage("loading");
            setAttempt((n) => n + 1);
          }}
          className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
        >
          Tentar novamente
        </button>
      </PlayerMessage>
    );
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setStage("error"));
    } else {
      video.pause();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted && video.volume === 0) {
      video.volume = 1;
      setVolume(1);
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setIsMuted(value === 0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.currentTime = value;
    setCurrentTime(value);
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (container.requestFullscreen) {
      await container.requestFullscreen().catch(() => {});
    } else if (video && "webkitEnterFullscreen" in video) {
      (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }

  function replay() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setEnded(false);
    video.play().catch(() => {});
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-md bg-black"
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
    >
      <video
        key={attempt}
        ref={videoRef}
        playsInline
        poster={thumbnailUrl ?? undefined}
        muted={isMuted}
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        className="h-full w-full"
        onClick={togglePlay}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setCurrentTime(time);
          const total = e.currentTarget.duration;
          if (!total || Number.isNaN(total)) return;
          const percent = (time / total) * 100;
          for (const milestone of MILESTONES) {
            if (percent >= milestone && !firedMilestones.current.has(milestone)) {
              firedMilestones.current.add(milestone);
              sendVideoEvent(videoId, tracking, "progress", milestone);
              if (milestone === 100) postToParent(videoId, "complete");
              else postToParent(videoId, "progress", milestone);
            }
          }
        }}
        onProgress={(e) => {
          const buf = e.currentTarget.buffered;
          if (buf.length > 0) setBufferedEnd(buf.end(buf.length - 1));
        }}
        onPlay={() => {
          setIsPlaying(true);
          setHasStarted(true);
          setEnded(false);
          scheduleHideControls();
          if (!hasFiredPlay.current) {
            hasFiredPlay.current = true;
            sendVideoEvent(videoId, tracking, "play");
            postToParent(videoId, "play");
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setEnded(true);
          setShowControls(true);
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => setStage("error")}
      >
        <source src={`/api/stream/${videoId}`} />
      </video>

      {isBuffering && !ended && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {!hasStarted && !isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Reproduzir"
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
            <PlayIcon className="h-8 w-8 translate-x-0.5" />
          </span>
        </button>
      )}

      {ended && (
        <button
          type="button"
          onClick={replay}
          aria-label="Assistir novamente"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black">
            <ReplayIcon className="h-7 w-7" />
          </span>
          <span className="text-sm font-medium text-white">Assistir novamente</span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 transition-opacity ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative flex h-3 items-center">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/25">
            <div className="absolute inset-y-0 left-0 bg-white/40" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute inset-y-0 left-0 bg-red-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Progresso do vídeo"
            className="absolute inset-0 h-3 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 text-white">
          <button type="button" onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
            {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
          </button>

          <div className="flex items-center gap-1.5">
            <button type="button" onClick={toggleMute} aria-label={isMuted ? "Ativar som" : "Silenciar"}>
              {isMuted ? <VolumeMuteIcon className="h-5 w-5" /> : <VolumeHighIcon className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              className="hidden w-16 accent-white sm:block"
            />
          </div>

          <div className="flex-1" />

          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <FullscreenExitIcon className="h-5 w-5" /> : <FullscreenEnterIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerMessage({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-md bg-neutral-900 p-6 text-center text-white">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-neutral-400">{detail}</p>
      {children}
    </div>
  );
}
