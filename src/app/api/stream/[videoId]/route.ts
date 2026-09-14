import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function contentTypeFor(storagePath: string): string {
  const extension = storagePath.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream";
}

// Rota pública: serve o vídeo sem exigir sessão logada (o player e o embed
// são consumidos por visitantes anônimos). A segurança está em nunca expor
// o caminho real do arquivo nem a URL assinada ao cliente — geramos uma
// URL assinada de vida curta aqui dentro e só repassamos os bytes.
export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const supabase = createAdminClient();

  const { data: video, error } = await supabase
    .from("videos")
    .select("storage_path, status")
    .eq("id", videoId)
    .single();

  if (error || !video || !video.storage_path || video.status !== "ready") {
    return NextResponse.json({ error: "Vídeo não encontrado ou não disponível." }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("videos")
    .createSignedUrl(video.storage_path, 60);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Não foi possível gerar acesso ao arquivo." }, { status: 500 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(signed.signedUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Falha ao carregar o arquivo de vídeo." }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentTypeFor(video.storage_path));
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=0, must-revalidate");
  headers.set("Access-Control-Allow-Origin", "*");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
