-- Corrige recursão infinita no RLS de workspace_members.
--
-- A policy original "workspace_members: owner/admin can manage" fazia um
-- subselect na própria tabela workspace_members dentro do USING, o que faz
-- o Postgres reaplicar a mesma policy recursivamente (erro 42P17) sempre
-- que a tabela é lida — inclusive pelo trigger que roda logo após criar
-- um workspace. A correção usa funções SECURITY DEFINER (que não reaplicam
-- RLS) para checar o papel do usuário, do mesmo jeito que já fazíamos em
-- is_workspace_member.

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_editor(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'editor')
  );
$$;

drop policy if exists "workspace_members: owner/admin can manage" on public.workspace_members;
create policy "workspace_members: owner/admin can manage"
  on public.workspace_members for all
  using (public.is_workspace_admin(workspace_id));

drop policy if exists "projects: editors+ can write" on public.projects;
create policy "projects: editors+ can write"
  on public.projects for all
  using (public.is_workspace_editor(workspace_id));

-- Mesma correção nas políticas de storage (00002), que faziam o subselect
-- inline em vez de usar uma função SECURITY DEFINER.
drop policy if exists "videos bucket: editors+ can upload" on storage.objects;
create policy "videos bucket: editors+ can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'videos'
    and public.is_workspace_editor((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "videos bucket: editors+ can update" on storage.objects;
create policy "videos bucket: editors+ can update"
  on storage.objects for update
  using (
    bucket_id = 'videos'
    and public.is_workspace_editor((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "videos bucket: editors+ can delete" on storage.objects;
create policy "videos bucket: editors+ can delete"
  on storage.objects for delete
  using (
    bucket_id = 'videos'
    and public.is_workspace_editor((storage.foldername(name))[1]::uuid)
  );
