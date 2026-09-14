"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateVideoFile, ACCEPTED_MIME_TYPES } from "@/lib/video-validation";
import { createVideoUploadUrl, finalizeVideoUpload } from "../../actions";
import type { VideoStatus } from "@/types/database";

type Stage = "idle" | "validating" | "invalid" | "ready-to-upload" | "uploading" | "done" | "upload-error";

const EXTENSION_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function VideoUploader({
  workspaceId,
  videoId,
  currentStatus,
  hasExistingFile,
}: {
  workspaceId: string;
  videoId: string;
  currentStatus: VideoStatus;
  hasExistingFile: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const selectedFileRef = useRef<File | null>(null);
  const durationRef = useRef<number | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStage("validating");
    setErrorMessage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    const result = await validateVideoFile(file);

    if (!result.ok) {
      setStage("invalid");
      setErrorMessage(result.reason ?? "Arquivo inválido.");
      selectedFileRef.current = null;
      return;
    }

    selectedFileRef.current = file;
    durationRef.current = result.duration ?? null;
    setPreviewUrl(URL.createObjectURL(file));
    setStage("ready-to-upload");
  }

  async function handleUpload() {
    const file = selectedFileRef.current;
    if (!file) return;

    setStage("uploading");
    setProgress(0);
    setErrorMessage(null);

    const extension = EXTENSION_BY_MIME[file.type] ?? "mp4";

    const ticket = await createVideoUploadUrl({
      workspaceId,
      videoId,
      contentType: file.type,
      extension,
    });

    if (!ticket.ok) {
      setStage("upload-error");
      setErrorMessage(ticket.error);
      return;
    }

    const uploadResult = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", ticket.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: `Falha no upload (HTTP ${xhr.status}).` });
        }
      };
      xhr.onerror = () => resolve({ ok: false, error: "Falha de rede durante o upload." });

      xhr.send(file);
    });

    if (!uploadResult.ok) {
      setStage("upload-error");
      setErrorMessage(uploadResult.error ?? "Falha no upload.");
      return;
    }

    const finalizeResult = await finalizeVideoUpload({
      workspaceId,
      videoId,
      storagePath: ticket.key,
      durationSeconds: durationRef.current,
    });

    if (!finalizeResult.ok) {
      setStage("upload-error");
      setErrorMessage(finalizeResult.error ?? "Falha ao salvar informações do vídeo.");
      return;
    }

    setStage("done");
    router.refresh();
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    selectedFileRef.current = null;
    setStage("idle");
    setErrorMessage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      {stage === "idle" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME_TYPES.join(",")}
            onChange={handleFileSelect}
            className="text-sm"
          />
          <p className="text-xs text-neutral-500">
            MP4 (H.264/AAC) ou WebM, até 5GB. Se o arquivo for rejeitado, converta para MP4 com
            codec de vídeo H.264 e áudio AAC antes de enviar.
          </p>
        </>
      )}

      {stage === "validating" && (
        <p className="text-sm text-neutral-600">Validando arquivo no navegador…</p>
      )}

      {stage === "invalid" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={reset}
            className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Escolher outro arquivo
          </button>
        </div>
      )}

      {stage === "ready-to-upload" && previewUrl && (
        <div className="flex flex-col gap-2">
          <video src={previewUrl} controls muted className="max-w-md rounded-md border border-neutral-200" />
          <p className="text-sm text-green-700">Arquivo validado — pronto para enviar.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Enviar vídeo
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Escolher outro arquivo
            </button>
          </div>
        </div>
      )}

      {stage === "uploading" && (
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-neutral-900 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-neutral-600">Enviando… {progress}%</p>
        </div>
      )}

      {stage === "upload-error" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={reset}
            className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {stage === "done" && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Vídeo enviado e validado com sucesso.
        </p>
      )}

      {stage === "idle" && hasExistingFile && (
        <p className="text-xs text-neutral-500">
          Status atual: <span className="font-medium">{currentStatus}</span>. Enviar um novo
          arquivo substitui o atual.
        </p>
      )}
    </div>
  );
}
