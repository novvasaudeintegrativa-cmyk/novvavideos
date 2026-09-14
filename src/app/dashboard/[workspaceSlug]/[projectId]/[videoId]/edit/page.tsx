import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateVideo, uploadThumbnail } from "../../actions";

export default async function EditVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; videoId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { workspaceSlug, projectId, videoId } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    notFound();
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  const { data: video } = await supabase
    .from("videos")
    .select("id, name, description, thumbnail_url, status")
    .eq("id", videoId)
    .eq("project_id", projectId)
    .single();

  if (!video) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <Link
          href={`/dashboard/${workspace.slug}/${project.id}`}
          className="text-sm text-neutral-500 underline"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{video.name}</h1>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{saved}</p>}

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <p className="text-sm font-medium">Thumbnail</p>
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.name}
            width={320}
            height={180}
            unoptimized
            className="rounded-md border border-neutral-200 object-cover"
          />
        ) : (
          <div className="flex h-40 w-full max-w-xs items-center justify-center rounded-md border border-dashed border-neutral-300 text-xs text-neutral-400">
            Sem thumbnail
          </div>
        )}
        <form action={uploadThumbnail} className="flex items-center gap-2" encType="multipart/form-data">
          <input type="hidden" name="workspace_slug" value={workspace.slug} />
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="video_id" value={video.id} />
          <input
            type="file"
            name="thumbnail"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
          >
            Enviar
          </button>
        </form>
        <p className="text-xs text-neutral-500">PNG, JPEG ou WebP, até 5MB.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <p className="text-sm font-medium">Arquivo de vídeo</p>
        <p className="text-sm text-neutral-500">
          Status atual: <span className="font-medium">{video.status}</span>. O upload e a
          validação do arquivo (MP4 H.264/AAC) entram na próxima etapa desta plataforma.
        </p>
      </section>

      <form action={updateVideo} className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <input type="hidden" name="workspace_slug" value={workspace.slug} />
        <input type="hidden" name="project_id" value={project.id} />
        <input type="hidden" name="video_id" value={video.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            name="name"
            defaultValue={video.name}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={video.description ?? ""}
            rows={3}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
