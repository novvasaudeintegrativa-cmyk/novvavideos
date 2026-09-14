import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Troca o código de confirmação de e-mail / magic link por uma sessão.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Não foi possível confirmar o login.")}`);
}
