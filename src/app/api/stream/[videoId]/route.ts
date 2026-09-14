import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createDownloadUrl } from "@/lib/r2";

// Duração da URL assinada: precisa cobrir a sessão inteira de visualização
// (o navegador reaproveita essa mesma URL pra todos os pedidos de Range
// durante o play/seek), não só o primeiro request. 6h é generoso o
// suficiente pra qualquer sessão real sem virar uma URL "permanente".
const SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

// Rota pública: redireciona pro arquivo real no R2 via URL assinada de
// vida curta, gerada só aqui no backend. Diferente de um proxy, os bytes
// do vídeo trafegam direto do R2 pro navegador — o R2 não cobra egress,
// então isso evita custo de banda da própria Vercel em escala (tráfego
// pago/alto volume). Segurança: nunca expomos o caminho real do arquivo
// permanentemente, nunca persistimos a URL assinada, e o vídeo só fica
// acessível enquanto status = "ready".
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

  try {
    const signedUrl = await createDownloadUrl(video.storage_path, SIGNED_URL_TTL_SECONDS);
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch {
    return NextResponse.json({ error: "Não foi possível gerar acesso ao arquivo." }, { status: 500 });
  }
}
