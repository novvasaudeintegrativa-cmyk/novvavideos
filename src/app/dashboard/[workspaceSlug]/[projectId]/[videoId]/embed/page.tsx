import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmbedSettings } from "./embed-settings";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; videoId: string }>;
}) {
  const { workspaceSlug, projectId, videoId } = await params;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();
  if (!workspace) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();
  if (!project) notFound();

  const { data: video } = await supabase
    .from("videos")
    .select("id, name, status")
    .eq("id", videoId)
    .eq("project_id", projectId)
    .single();
  if (!video) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/${workspace.slug}/${project.id}/${video.id}/edit`}
          className="text-sm text-neutral-500 underline"
        >
          ← {video.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Embed</h1>
        <p className="text-sm text-neutral-500">
          Coloque este vídeo em qualquer página externa, com ou sem CTAs.
        </p>
      </div>

      {video.status !== "ready" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este vídeo ainda não está pronto (status: {video.status}). O código abaixo já funciona,
          mas o player só vai reproduzir depois que o upload for concluído.
        </p>
      )}

      <EmbedSettings videoId={video.id} />
    </div>
  );
}
