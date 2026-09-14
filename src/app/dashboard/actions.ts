"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(DIACRITICS_REGEX, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `workspace-${Date.now()}`
  );
}

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/dashboard?error=" + encodeURIComponent("Informe um nome para o workspace."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase.from("workspaces").insert({
    name,
    slug,
    owner_id: user.id,
  });

  if (error) {
    redirect("/dashboard?error=" + encodeURIComponent(error.message));
  }

  redirect("/dashboard");
}
