// Validação client-side de arquivos de vídeo antes do upload.
//
// Duas camadas de checagem, porque nenhuma delas sozinha é confiável:
// 1. Leitura dos boxes ISO-BMFF (MP4/MOV) para identificar o codec de vídeo
//    de verdade — necessário porque o Safari decodifica HEVC via hardware
//    (o teste de <video> abaixo passaria mesmo sendo HEVC), então sem isso
//    um arquivo H.265 renomeado ou exportado como .mp4 passaria despercebido
//    em alguns navegadores e falharia silenciosamente em outros.
// 2. Carregar o arquivo de verdade num elemento <video> e esperar canplay —
//    pega qualquer outro problema de decodificação que a checagem de box
//    não cobre (arquivo truncado, corrompido, container exótico etc).

export const ACCEPTED_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const ACCEPTED_EXTENSIONS = [".mp4", ".webm", ".mov"] as const;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB, mesmo limite do bucket

const REJECTED_VIDEO_CODECS: Record<string, string> = {
  hev1: "HEVC/H.265",
  hvc1: "HEVC/H.265",
  av01: "AV1",
  mp4v: "MPEG-4 Part 2",
};
const ACCEPTED_VIDEO_CODECS = new Set(["avc1", "avc3"]);

export interface VideoValidationResult {
  ok: boolean;
  reason?: string;
  width?: number;
  height?: number;
  duration?: number;
  videoCodec?: string | null;
}

interface Mp4Box {
  type: string;
  start: number;
  end: number;
  headerSize: number;
}

function readBoxesInRange(view: DataView, rangeStart: number, rangeEnd: number): Mp4Box[] {
  const boxes: Mp4Box[] = [];
  let offset = rangeStart;
  while (offset + 8 <= rangeEnd) {
    const size32 = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    );
    let headerSize = 8;
    let size = size32;
    if (size32 === 1) {
      if (offset + 16 > rangeEnd) break;
      const high = view.getUint32(offset + 8);
      const low = view.getUint32(offset + 12);
      size = high * 2 ** 32 + low;
      headerSize = 16;
    } else if (size32 === 0) {
      size = rangeEnd - offset;
    }
    if (size < headerSize) break;
    const boxEnd = offset + size;
    boxes.push({ type, start: offset, end: Math.min(boxEnd, rangeEnd), headerSize });
    if (boxEnd > rangeEnd) break;
    offset = boxEnd;
  }
  return boxes;
}

function getChildren(view: DataView, start: number, end: number, type: string): Mp4Box[] {
  return readBoxesInRange(view, start, end).filter((b) => b.type === type);
}

/** Lê os boxes ISO-BMFF disponíveis no buffer e retorna o fourcc do codec de vídeo, se encontrado. */
function sniffVideoCodec(buffer: ArrayBuffer): { codec: string | null; foundMoov: boolean } {
  const view = new DataView(buffer);
  const end = buffer.byteLength;
  const moov = readBoxesInRange(view, 0, end).find((b) => b.type === "moov");
  if (!moov) return { codec: null, foundMoov: false };

  for (const trak of getChildren(view, moov.start + moov.headerSize, moov.end, "trak")) {
    const mdia = getChildren(view, trak.start + trak.headerSize, trak.end, "mdia")[0];
    if (!mdia) continue;

    const hdlr = getChildren(view, mdia.start + mdia.headerSize, mdia.end, "hdlr")[0];
    if (!hdlr) continue;
    const handlerTypeOffset = hdlr.start + hdlr.headerSize + 4 + 4;
    if (handlerTypeOffset + 4 > hdlr.end) continue;
    const handlerType = String.fromCharCode(
      view.getUint8(handlerTypeOffset),
      view.getUint8(handlerTypeOffset + 1),
      view.getUint8(handlerTypeOffset + 2),
      view.getUint8(handlerTypeOffset + 3),
    );
    if (handlerType !== "vide") continue;

    const minf = getChildren(view, mdia.start + mdia.headerSize, mdia.end, "minf")[0];
    const stbl = minf && getChildren(view, minf.start + minf.headerSize, minf.end, "stbl")[0];
    const stsd = stbl && getChildren(view, stbl.start + stbl.headerSize, stbl.end, "stsd")[0];
    if (!stsd) continue;

    const entryOffset = stsd.start + stsd.headerSize + 4 + 4;
    if (entryOffset + 8 > stsd.end) continue;
    const codec = String.fromCharCode(
      view.getUint8(entryOffset + 4),
      view.getUint8(entryOffset + 5),
      view.getUint8(entryOffset + 6),
      view.getUint8(entryOffset + 7),
    );
    return { codec, foundMoov: true };
  }
  return { codec: null, foundMoov: true };
}

async function sniffCodecFromFile(file: File): Promise<{ codec: string | null; foundMoov: boolean }> {
  const CHUNK = 4 * 1024 * 1024;

  const head = await file.slice(0, Math.min(CHUNK, file.size)).arrayBuffer();
  const headResult = sniffVideoCodec(head);
  if (headResult.foundMoov) return headResult;

  if (file.size > CHUNK) {
    const tail = await file.slice(Math.max(0, file.size - CHUNK), file.size).arrayBuffer();
    const tailResult = sniffVideoCodec(tail);
    if (tailResult.foundMoov) return tailResult;
  }

  return { codec: null, foundMoov: false };
}

function checkPlayability(file: File): Promise<{ ok: boolean; width?: number; height?: number; duration?: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ ok: false });
    }, 20000);

    video.addEventListener("loadedmetadata", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const { videoWidth, videoHeight, duration } = video;
      cleanup();
      resolve({
        ok: videoWidth > 0 && videoHeight > 0 && Number.isFinite(duration) && duration > 0,
        width: videoWidth,
        height: videoHeight,
        duration,
      });
    });

    video.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanup();
      resolve({ ok: false });
    });

    video.src = url;
  });
}

export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  const lowerName = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasAcceptedExtension) {
    return {
      ok: false,
      reason: `Extensão não suportada. Use ${ACCEPTED_EXTENSIONS.join(", ")}.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: "Arquivo maior que 5GB, o limite permitido." };
  }

  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return {
      ok: false,
      reason: `Tipo de arquivo "${file.type}" não é um vídeo suportado. Converta para MP4 (H.264/AAC) ou WebM.`,
    };
  }

  const isMp4Family = file.type === "video/mp4" || file.type === "video/quicktime" || lowerName.endsWith(".mp4") || lowerName.endsWith(".mov");

  if (isMp4Family) {
    const { codec } = await sniffCodecFromFile(file);
    if (codec && REJECTED_VIDEO_CODECS[codec]) {
      return {
        ok: false,
        reason: `Este arquivo usa o codec ${REJECTED_VIDEO_CODECS[codec]}, incompatível com a maioria dos navegadores. Converta para MP4 com codec H.264 (vídeo) e AAC (áudio) e envie novamente.`,
        videoCodec: codec,
      };
    }
    if (codec && !ACCEPTED_VIDEO_CODECS.has(codec)) {
      return {
        ok: false,
        reason: `Codec de vídeo "${codec}" não reconhecido como H.264. Converta para MP4 (H.264/AAC) e envie novamente.`,
        videoCodec: codec,
      };
    }
  }

  const playability = await checkPlayability(file);
  if (!playability.ok) {
    return {
      ok: false,
      reason:
        "Não foi possível abrir este arquivo no navegador. Verifique se é um vídeo válido, ou converta para MP4 (H.264/AAC) e envie novamente.",
    };
  }

  return {
    ok: true,
    width: playability.width,
    height: playability.height,
    duration: playability.duration,
  };
}
