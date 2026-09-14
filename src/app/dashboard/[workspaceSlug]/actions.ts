"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect(`/dashboard/${workspaceSlug}?error=` + encodeURIComponent("Informe um nome para o projeto."));
  }

  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    redirect("/dashboard");
  }

  const { error } = await supabase.from("projects").insert({
    workspace_id: workspace.id,
    name,
  });

  if (error) {
    redirect(`/dashboard/${workspaceSlug}?error=` + encodeURIComponent(error.message));
  }

  redirect(`/dashboard/${workspaceSlug}`);
}
