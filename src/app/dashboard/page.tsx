import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "./actions";
import { RenameWorkspaceForm } from "./rename-workspace-form";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="section-title text-xl">Seus workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Cada workspace isola seus vídeos, projetos e dados de quem só tem acesso a ele.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {workspaces && workspaces.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {workspaces.map((ws) => (
            <li
              key={ws.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-brand/40"
            >
              <Link href={`/dashboard/${ws.slug}`} className="flex-1">
                <p className="font-medium">{ws.name}</p>
                <p className="text-xs text-muted-foreground">{ws.slug}</p>
              </Link>
              <RenameWorkspaceForm workspaceId={ws.id} name={ws.name} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhum workspace ainda. Crie o primeiro abaixo.
        </p>
      )}

      <form action={createWorkspace} className="flex gap-2">
        <input
          name="name"
          placeholder="Nome do workspace"
          required
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
        >
          Criar workspace
        </button>
      </form>
    </div>
  );
}
