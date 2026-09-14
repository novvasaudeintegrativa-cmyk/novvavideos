"use client";

import { duplicateVideo, toggleArchiveVideo, deleteVideo } from "./actions";

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}
function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
    </svg>
  );
}
function UnarchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 9l5.5 5.5H14v2h-4v-2H6.5L12 9zM5.12 5l.81-1h12l.94 1H5.12z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

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
    <div className="flex items-center gap-1">
      <form action={duplicateVideo}>
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="video_id" value={videoId} />
        <button
          type="submit"
          title="Duplicar"
          aria-label="Duplicar vídeo"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <DuplicateIcon />
        </button>
      </form>

      <form action={toggleArchiveVideo}>
        <input type="hidden" name="workspace_slug" value={workspaceSlug} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="video_id" value={videoId} />
        <input type="hidden" name="archive" value={isArchived ? "false" : "true"} />
        <button
          type="submit"
          title={isArchived ? "Desarquivar" : "Arquivar"}
          aria-label={isArchived ? "Desarquivar vídeo" : "Arquivar vídeo"}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
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
        <button
          type="submit"
          title="Excluir"
          aria-label="Excluir vídeo"
          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <TrashIcon />
        </button>
      </form>
    </div>
  );
}
