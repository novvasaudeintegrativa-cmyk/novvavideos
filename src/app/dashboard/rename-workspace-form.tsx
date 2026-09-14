"use client";

import { useState } from "react";
import { renameWorkspace } from "./actions";

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

export function RenameWorkspaceForm({ workspaceId, name }: { workspaceId: string; name: string }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Editar nome"
        aria-label="Editar nome do workspace"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <EditIcon />
      </button>
    );
  }

  return (
    <form action={renameWorkspace} className="flex items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input
        name="name"
        defaultValue={name}
        autoFocus
        required
        onClick={(e) => e.preventDefault()}
        className="rounded-md border border-border px-2 py-1 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-brand px-2 py-1 text-xs font-medium text-brand-foreground hover:bg-brand-hover"
      >
        Salvar
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-muted-foreground underline"
      >
        Cancelar
      </button>
    </form>
  );
}
