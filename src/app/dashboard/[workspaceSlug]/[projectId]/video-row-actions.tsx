"use client";

import { duplicateVideo, toggleArchiveVideo, deleteVideo } from "./actions";

export function VideoRowActions({
  workspaceSlug,
  projectId,
  videoId,
  isArchived,
}: {
  workspaceSlug: string;
  projectId: string;
  videoId: string;
  isArchived: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <form action={duplicateVideo}>
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="video_id" value={videoId} />
        <button type="submit" className="text-xs text-neutral-600 underline hover:text-neutral-900">
          Duplicar
        </button>
      </form>

      <form action={toggleArchiveVideo}>
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="video_id" value={videoId} />
        <input type="hidden" name="archive" value={isArchived ? "false" : "true"} />
        <button type="submit" className="text-xs text-neutral-600 underline hover:text-neutral-900">
          {isArchived ? "Desarquivar" : "Arquivar"}
        </button>
      </form>

      <form
        action={deleteVideo}
        onSubmit={(e) => {
          if (!confirm("Excluir este vídeo permanentemente? Essa ação não pode ser desfeita.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="video_id" value={videoId} />
        <button type="submit" className="text-xs text-red-600 underline hover:text-red-800">
          Excluir
        </button>
      </form>
    </div>
  );
}
