// Dados fictícios do modo demonstração — nunca tocam no Supabase.
// Mantidos separados de qualquer tipo/consulta real para não vazar para dados de produção.

export const demoWorkspace = {
  id: "demo-workspace",
  name: "Workspace de demonstração",
  slug: "demo",
};

export const demoProjects = [
  { id: "demo-project-1", name: "Lançamento — Produto A", videoCount: 3 },
  { id: "demo-project-2", name: "Página de vendas — Produto B", videoCount: 1 },
];

export const demoVideos = [
  {
    id: "demo-video-1",
    projectId: "demo-project-1",
    name: "VSL principal",
    status: "ready" as const,
    durationSeconds: 612,
    views: 4820,
    plays: 3910,
    ctaClicks: 742,
    conversions: 96,
    completionRate: 0.41,
  },
  {
    id: "demo-video-2",
    projectId: "demo-project-1",
    name: "Depoimentos",
    status: "processing" as const,
    durationSeconds: 184,
    views: 0,
    plays: 0,
    ctaClicks: 0,
    conversions: 0,
    completionRate: 0,
  },
  {
    id: "demo-video-3",
    projectId: "demo-project-1",
    name: "Bônus exclusivo",
    status: "ready" as const,
    durationSeconds: 96,
    views: 1204,
    plays: 980,
    ctaClicks: 210,
    conversions: 31,
    completionRate: 0.58,
  },
  {
    id: "demo-video-4",
    projectId: "demo-project-2",
    name: "VSL — Produto B",
    status: "error" as const,
    durationSeconds: 0,
    views: 0,
    plays: 0,
    ctaClicks: 0,
    conversions: 0,
    completionRate: 0,
  },
];
