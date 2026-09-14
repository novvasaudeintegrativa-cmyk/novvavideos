"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  if (!email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Preencha e-mail e senha."));
  }

  if (password.length < 8) {
    redirect(
      "/signup?error=" + encodeURIComponent("A senha precisa ter pelo menos 8 caracteres."),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  redirect("/login?message=" + encodeURIComponent("Verifique seu e-mail para confirmar a conta."));
}
