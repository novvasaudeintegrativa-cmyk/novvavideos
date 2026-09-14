"use client";

import { useMemo, useState } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponível (ex: http sem TLS) — ignora silenciosamente
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
    >
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

export function EmbedSettings({ videoId }: { videoId: string }) {
  const [autoplay, setAutoplay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [responsive, setResponsive] = useState(true);
  const [width, setWidth] = useState("640");
  const [height, setHeight] = useState("360");

  const effectiveMuted = muted || autoplay;

  const playerUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (autoplay) params.set("autoplay", "1");
    if (effectiveMuted) params.set("muted", "1");
    const qs = params.toString();
    return `${SITE_URL}/p/${videoId}${qs ? `?${qs}` : ""}`;
  }, [videoId, autoplay, effectiveMuted]);

  const iframeCode = useMemo(() => {
    if (responsive) {
      return `<div style="position:relative;width:${width}px;max-width:100%;padding-top:56.25%;">
  <iframe
    src="${playerUrl}"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>`;
    }
    return `<iframe
  src="${playerUrl}"
  width="${width}"
  height="${height}"
  style="border:0;"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>`;
  }, [playerUrl, responsive, width, height]);

  const scriptCode = useMemo(() => {
    return `<div id="novva-video-${videoId}"></div>
<script
  src="${SITE_URL}/embed.js"
  data-target="novva-video-${videoId}"
  data-video-id="${videoId}"
  data-autoplay="${autoplay}"
  data-muted="${effectiveMuted}"
  data-responsive="${responsive}"
  data-width="${width}"
  ${!responsive ? `data-height="${height}"` : ""}
  async
></script>`;
  }, [videoId, autoplay, effectiveMuted, responsive, width, height]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <p className="text-sm font-medium">Opções</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
            Autoplay
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={effectiveMuted}
              disabled={autoplay}
              onChange={(e) => setMuted(e.target.checked)}
            />
            Mudo {autoplay && <span className="text-xs text-neutral-400">(obrigatório com autoplay)</span>}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={responsive} onChange={(e) => setResponsive(e.target.checked)} />
            Responsivo (ocupa a largura do container)
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {responsive ? "Largura máxima (px)" : "Largura (px)"}
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          {!responsive && (
            <label className="flex flex-col gap-1 text-sm">
              Altura (px)
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-sm"
              />
            </label>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">URL pública</p>
          <CopyButton text={playerUrl} />
        </div>
        <input
          readOnly
          value={playerUrl}
          className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-xs"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Código iframe</p>
          <CopyButton text={iframeCode} />
        </div>
        <textarea
          readOnly
          value={iframeCode}
          rows={7}
          className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-xs"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Código script (recomendado)</p>
            <p className="text-xs text-neutral-500">
              Captura UTMs da página automaticamente e identifica sessão do visitante.
            </p>
          </div>
          <CopyButton text={scriptCode} />
        </div>
        <textarea
          readOnly
          value={scriptCode}
          rows={9}
          className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-xs"
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">Preview</p>
        <div
          className="overflow-hidden rounded-md border border-neutral-200 bg-black"
          style={{ maxWidth: responsive ? `${width}px` : undefined }}
        >
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe
              src={playerUrl}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
