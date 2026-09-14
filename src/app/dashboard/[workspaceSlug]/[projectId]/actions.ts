"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function backTo(workspaceSlug: string, projectId: string, error?: string) {
  const base = `/dashboard/${workspaceSlug}/${projectId}`;
  redirect(error ? `${base}?error=${encodeURIComponent(error)}` : base);
}

function backToEdit(workspaceSlug: string, projectId: string, videoId: string, message?: string, isError = true) {
  const base = `/dashboard/${workspaceSlug}/${projectId}/${videoId}/edit`;
  if (!message) {
    redirect(base);
  }
  const param = isError ? "error" : "saved";
  redirect(`${base}?${param}=${encodeURIComponent(message)}`);
}

export async function createVideo(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    backTo(workspaceSlug, projectId, "Informe um nome para o vídeo.");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("videos").insert({
    project_id: projectId,
    name,
    description: description || null,
  });

  backTo(workspaceSlug, projectId, error?.message);
}

export async function duplicateVideo(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const videoId = String(formData.get("video_id") ?? "");

  const supabase = await createClient();
  const { data: original, error: fetchError } = await supabase
    .from("videos")
    .select("name, description, thumbnail_url, project_id")
    .eq("id", videoId)
    .single();

  if (fetchError || !original) {
    backTo(workspaceSlug, projectId, fetchError?.message ?? "Vídeo não encontrado.");
    return;
  }

  const { error } = await supabase.from("videos").insert({
    project_id: original.project_id,
    name: `${original.name} (cópia)`,
    description: original.description,
    thumbnail_url: original.thumbnail_url,
  });

  backTo(workspaceSlug, projectId, error?.message);
}

export async function toggleArchiveVideo(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const videoId = String(formData.get("video_id") ?? "");
  const archive = formData.get("archive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update(
      archive
        ? { status: "archived", archived_at: new Date().toISOString() }
        : { status: "draft", archived_at: null },
    )
    .eq("id", videoId);

  backTo(workspaceSlug, projectId, error?.message);
}

export async function updateVideo(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const videoId = String(formData.get("video_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    backToEdit(workspaceSlug, projectId, videoId, "Informe um nome para o vídeo.");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({ name, description: description || null })
    .eq("id", videoId);

  backToEdit(workspaceSlug, projectId, videoId, error?.message ?? "Alterações salvas.", Boolean(error));
}

const ALLOWED_THUMBNAIL_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export async function uploadThumbnail(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const videoId = String(formData.get("video_id") ?? "");
  const file = formData.get("thumbnail");

  if (!(file instanceof File) || file.size === 0) {
    backToEdit(workspaceSlug, projectId, videoId, "Selecione uma imagem para enviar.");
    return;
  }

  if (!ALLOWED_THUMBNAIL_TYPES.includes(file.type)) {
    backToEdit(workspaceSlug, projectId, videoId, "Formato inválido. Use PNG, JPEG ou WebP.");
    return;
  }

  if (file.size > MAX_THUMBNAIL_BYTES) {
    backToEdit(workspaceSlug, projectId, videoId, "Imagem muito grande (máximo 5MB).");
    return;
  }

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    backToEdit(workspaceSlug, projectId, videoId, "Projeto não encontrado.");
    return;
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${project.workspace_id}/${videoId}/thumb.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("thumbnails")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    backToEdit(workspaceSlug, projectId, videoId, uploadError.message);
    return;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("thumbnails").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("videos")
    .update({ thumbnail_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", videoId);

  backToEdit(
    workspaceSlug,
    projectId,
    videoId,
    updateError?.message ?? "Thumbnail atualizada.",
    Boolean(updateError),
  );
}

export async function finalizeVideoUpload(input: {
  workspaceId: string;
  videoId: string;
  storagePath: string;
  durationSeconds: number | null;
}) {
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("storage_path")
    .eq("id", input.videoId)
    .single();

  const { error } = await supabase
    .from("videos")
    .update({
      storage_path: input.storagePath,
      duration_seconds: input.durationSeconds,
      status: "ready",
    })
    .eq("id", input.videoId);

  if (!error && video?.storage_path && video.storage_path !== input.storagePath) {
    await supabase.storage.from("videos").remove([video.storage_path]);
  }

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function deleteVideo(formData: FormData) {
  const workspaceSlug = String(formData.get("workspace_slug") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const videoId = String(formData.get("video_id") ?? "");

  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("storage_path, thumbnail_url")
    .eq("id", videoId)
    .single();

  const { error } = await supabase.from("videos").delete().eq("id", videoId);

  if (!error && video?.storage_path) {
    await supabase.storage.from("videos").remove([video.storage_path]);
  }

  backTo(workspaceSlug, projectId, error?.message);
}
