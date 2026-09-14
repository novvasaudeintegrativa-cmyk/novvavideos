-- Fase 1: bucket privado de vídeos + políticas de acesso por workspace.
-- Convenção de caminho: {workspace_id}/{video_id}/original.<ext>
-- O primeiro segmento do caminho é sempre o workspace_id — as policies abaixo
-- usam isso para garantir isolamento entre workspaces.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false, -- privado: acesso somente via URL assinada gerada no backend
  5368709120, -- 5GB por arquivo (ajuste conforme necessário)
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Membros do workspace podem ler os objetos do próprio workspace
create policy "videos bucket: members can read"
  on storage.objects for select
  using (
    bucket_id = 'videos'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  );

-- Editores+ podem enviar arquivos
create policy "videos bucket: editors+ can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'videos'
    and exists (
      select 1 from public.workspace_members m
      where m.workspace_id = (storage.foldername(name))[1]::uuid
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'editor')
    )
  );

-- Editores+ podem substituir/remover arquivos
create policy "videos bucket: editors+ can update"
  on storage.objects for update
  using (
    bucket_id = 'videos'
    and exists (
      select 1 from public.workspace_members m
      where m.workspace_id = (storage.foldername(name))[1]::uuid
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'editor')
    )
  );

create policy "videos bucket: editors+ can delete"
  on storage.objects for delete
  using (
    bucket_id = 'videos'
    and exists (
      select 1 from public.workspace_members m
      where m.workspace_id = (storage.foldername(name))[1]::uuid
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'editor')
    )
  );
