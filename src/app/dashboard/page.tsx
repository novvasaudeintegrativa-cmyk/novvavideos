import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "./actions";

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
        <h1 className="text-xl font-semibold">Seus workspaces</h1>
        <p className="text-sm text-neutral-500">
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
              className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3"
            >
              <div>
                <p className="font-medium">{ws.name}</p>
                <p className="text-xs text-neutral-500">{ws.slug}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
          Nenhum workspace ainda. Crie o primeiro abaixo.
        </p>
      )}

      <form action={createWorkspace} className="flex gap-2">
        <input
          name="name"
          placeholder="Nome do workspace"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Criar workspace
        </button>
      </form>
    </div>
  );
}
