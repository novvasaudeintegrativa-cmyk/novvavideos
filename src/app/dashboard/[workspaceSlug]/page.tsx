import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { workspaceSlug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    notFound();
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 underline">
          ← Todos os workspaces
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{workspace.name}</h1>
        <p className="text-sm text-neutral-500">
          Projetos organizam seus vídeos dentro deste workspace.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {projects && projects.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/dashboard/${workspace.slug}/${project.id}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3 hover:border-neutral-400"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-neutral-500">{project.description}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
          Nenhum projeto ainda. Crie o primeiro abaixo.
        </p>
      )}

      <form action={createProject} className="flex gap-2">
        <input type="hidden" name="workspace_slug" value={workspace.slug} />
        <input
          name="name"
          placeholder="Nome do projeto"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Criar projeto
        </button>
      </form>
    </div>
  );
}
