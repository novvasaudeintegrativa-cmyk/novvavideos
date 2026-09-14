-- Fase 2: biblioteca de vídeos.
-- storage_path / source_url ficam nulos até a Fase 3 (upload real + validação).
-- Os contadores de métricas começam zerados e serão incrementados pelo
-- pipeline de eventos da Fase 7 (rastreamento).

create type public.video_status as enum ('draft', 'processing', 'ready', 'error', 'archived');

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  thumbnail_url text,
  status public.video_status not null default 'draft',
  storage_path text,
  source_url text,
  duration_seconds numeric,
  views_count bigint not null default 0,
  plays_count bigint not null default 0,
  cta_clicks_count bigint not null default 0,
  conversions_count bigint not null default 0,
  avg_watch_seconds numeric,
  completion_rate numeric,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "videos: members can read"
  on public.videos for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = videos.project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy "videos: editors+ can write"
  on public.videos for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = videos.project_id
        and public.is_workspace_editor(p.workspace_id)
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_videos_updated_at on public.videos;
create trigger set_videos_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

create index if not exists idx_videos_project on public.videos (project_id);
create index if not exists idx_videos_status on public.videos (status);

-- ─────────────────────────────────────────────────────────────
-- Bucket público de thumbnails (imagens, não vídeo — sem dado sensível).
-- Convenção de caminho: {workspace_id}/{video_id}/thumb.<ext>
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "thumbnails bucket: public read"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "thumbnails bucket: editors+ can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails'
    and public.is_workspace_editor((storage.foldername(name))[1]::uuid)
  );

create policy "thumbnails bucket: editors+ can update"
  on storage.objects for update
  using (
    bucket_id = 'thumbnails'
    and public.is_workspace_editor((storage.foldername(name))[1]::uuid)
  );

create policy "thumbnails bucket: editors+ can delete"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnails'
    and public.is_workspace_editor((storage.foldername(name))[1]::uuid)
  );
