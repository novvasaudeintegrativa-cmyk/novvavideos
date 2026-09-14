"use client";

import { useState } from "react";
import type { VideoStatus } from "@/types/database";

export function VideoPlayer({
  videoId,
  status,
  thumbnailUrl,
}: {
  videoId: string;
  status: VideoStatus | null;
  thumbnailUrl: string | null;
}) {
  const [playbackError, setPlaybackError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (!status) {
    return (
      <PlayerMessage title="Vídeo não encontrado" detail="Verifique se o link está correto." />
    );
  }

  if (status !== "ready") {
    return (
      <PlayerMessage
        title="Este vídeo ainda não está disponível"
        detail="O upload ainda não foi concluído ou validado."
      />
    );
  }

  if (playbackError) {
    return (
      <PlayerMessage title="Não foi possível carregar o vídeo" detail="Verifique sua conexão e tente novamente.">
        <button
          type="button"
          onClick={() => {
            setPlaybackError(false);
            setAttempt((n) => n + 1);
          }}
          className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
        >
          Tentar novamente
        </button>
      </PlayerMessage>
    );
  }

  return (
    <video
      key={attempt}
      controls
      playsInline
      poster={thumbnailUrl ?? undefined}
      className="aspect-video w-full rounded-md bg-black"
      onError={() => setPlaybackError(true)}
    >
      <source src={`/api/stream/${videoId}`} />
    </video>
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
