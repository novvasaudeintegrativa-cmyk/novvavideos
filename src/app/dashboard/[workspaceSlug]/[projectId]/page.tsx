import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VideoStatus } from "@/types/database";
import { createVideo } from "./actions";
import { VideoRowActions } from "./video-row-actions";

const STATUS_LABEL: Record<VideoStatus, string> = {
  draft: "Rascunho",
  processing: "Processando",
  ready: "Pronto",
  error: "Erro",
  archived: "Arquivado",
};

const STATUS_CLASS: Record<VideoStatus, string> = {
  draft: "bg-muted text-foreground",
  processing: "bg-amber-50 text-amber-700",
  ready: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
  archived: "bg-muted text-muted-foreground",
};

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
  searchParams: Promise<{ error?: string; q?: string; status?: string }>;
}) {
  const { workspaceSlug, projectId } = await params;
  const { error, q, status } = await searchParams;
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
    .select("id, name, workspace_id")
    .eq("id", projectId)
    .single();

  if (!project || project.workspace_id !== workspace.id) {
    notFound();
  }

  let query = supabase
    .from("videos")
    .select(
      "id, name, status, thumbnail_url, views_count, plays_count, cta_clicks_count, conversions_count, completion_rate, created_at",
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status as VideoStatus);
  } else if (!status) {
    query = query.neq("status", "archived");
  }

  const { data: videos } = await query;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Link href={`/dashboard/${workspace.slug}`} className="text-sm text-muted-foreground underline">
          ← {workspace.name}
        </Link>
        <h1 className="section-title mt-2 text-xl">{project.name}</h1>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form className="flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome..."
          className="flex-1 min-w-[200px] rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Ativos (não arquivados)</option>
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="processing">Processando</option>
          <option value="ready">Pronto</option>
          <option value="error">Erro</option>
          <option value="archived">Arquivado</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      {videos && videos.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Vídeo</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Views</th>
                <th className="px-4 py-2">Plays</th>
                <th className="px-4 py-2">Cliques CTA</th>
                <th className="px-4 py-2">Conversões</th>
                <th className="px-4 py-2">Conclusão</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/dashboard/${workspace.slug}/${project.id}/${video.id}/edit`}
                      className="hover:underline"
                    >
                      {video.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[video.status]}`}
                    >
                      {STATUS_LABEL[video.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{video.views_count.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">{video.plays_count.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">{video.cta_clicks_count.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">{video.conversions_count.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">
                    {video.completion_rate != null
                      ? `${Math.round(video.completion_rate * 100)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <VideoRowActions
                      workspaceSlug={workspace.slug}
                      projectId={project.id}
                      videoId={video.id}
                      isArchived={video.status === "archived"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhum vídeo encontrado.
        </p>
      )}

      <form action={createVideo} className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
        <input type="hidden" name="workspace_slug" value={workspace.slug} />
        <input type="hidden" name="project_id" value={project.id} />
        <p className="section-title text-sm">Novo vídeo</p>
        <div className="flex flex-wrap gap-2">
          <input
            name="name"
            placeholder="Nome do vídeo"
            required
            className="flex-1 min-w-[200px] rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="flex-1 min-w-[200px] rounded-md border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
          >
            Criar vídeo
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          O upload do arquivo de vídeo é feito na próxima etapa, direto na tela de edição.
        </p>
      </form>
    </div>
  );
}
