import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  video_id: z.string().uuid(),
  session_id: z.string().min(1).max(128),
  event_type: z.enum(["view", "play", "progress", "cta_click"]),
  milestone: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).optional(),
  page_url: z.string().max(2048).optional(),
  utm_source: z.string().max(255).optional(),
  utm_medium: z.string().max(255).optional(),
  utm_campaign: z.string().max(255).optional(),
  utm_term: z.string().max(255).optional(),
  utm_content: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (payload.event_type === "progress" && !payload.milestone) {
    return NextResponse.json({ error: "milestone é obrigatório para o evento progress." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("video_events").insert({
    video_id: payload.video_id,
    session_id: payload.session_id,
    event_type: payload.event_type,
    milestone: payload.milestone ?? null,
    page_url: payload.page_url ?? null,
    utm_source: payload.utm_source ?? null,
    utm_medium: payload.utm_medium ?? null,
    utm_campaign: payload.utm_campaign ?? null,
    utm_term: payload.utm_term ?? null,
    utm_content: payload.utm_content ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      // Evento duplicado (mesma sessão/vídeo/marco) — já contabilizado, não é erro.
      return NextResponse.json({ ok: true, deduped: true }, { status: 202 });
    }
    if (error.code === "23503") {
      return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao registrar evento." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
