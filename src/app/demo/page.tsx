import { demoProjects, demoVideos, demoWorkspace } from "@/lib/demo-data";

const statusLabel: Record<string, string> = {
  ready: "Pronto",
  processing: "Processando",
  error: "Erro",
};

const statusClass: Record<string, string> = {
  ready: "bg-green-50 text-green-700",
  processing: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

export default function DemoDashboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="section-title text-xl">{demoWorkspace.name}</h1>
        <p className="text-sm text-muted-foreground">
          Explore a biblioteca de vídeos com dados fictícios. Nada aqui é salvo.
        </p>
      </div>

      {demoProjects.map((project) => (
        <section key={project.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{project.name}</h2>
            <span className="text-xs text-muted-foreground">{project.videoCount} vídeo(s)</span>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {demoVideos
                  .filter((v) => v.projectId === project.id)
                  .map((video) => (
                    <tr key={video.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{video.name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${statusClass[video.status]}`}
                        >
                          {statusLabel[video.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2">{video.views.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2">{video.plays.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2">{video.ctaClicks.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2">{video.conversions.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2">
                        {video.status === "ready"
                          ? `${Math.round(video.completionRate * 100)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
