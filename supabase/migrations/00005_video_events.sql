-- Fase 7: rastreamento de eventos do player público.
-- Eventos chegam via POST /api/events, disparados pelo player em /p/[videoId]
-- (sem autenticação — visitante anônimo). RLS fica travado (sem policies):
-- o único caminho de escrita é o admin client no servidor, mesmo padrão do
-- /api/stream.

create table if not exists public.video_events (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  session_id text not null,
  event_type text not null check (event_type in ('view', 'play', 'progress', 'cta_click')),
  milestone smallint check (milestone in (25, 50, 75, 100)),
  page_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default now()
);

alter table public.video_events enable row level security;

create index if not exists idx_video_events_video on public.video_events (video_id, event_type);

-- Dedup: no máximo 1 "view" e 1 "play" por sessão por vídeo.
create unique index if not exists uq_video_events_view_play
  on public.video_events (video_id, session_id, event_type)
  where event_type in ('view', 'play');

-- Dedup: no máximo 1 evento de progresso por marco (25/50/75/100) por sessão por vídeo.
create unique index if not exists uq_video_events_progress
  on public.video_events (video_id, session_id, event_type, milestone)
  where event_type = 'progress';

-- Atualiza os contadores agregados em videos a cada evento novo.
-- (Inserts duplicados são barrados pelos índices únicos acima antes de chegar aqui.)
create or replace function public.apply_video_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_type = 'view' then
    update public.videos set views_count = views_count + 1 where id = new.video_id;
  elsif new.event_type = 'play' then
    update public.videos set plays_count = plays_count + 1 where id = new.video_id;
  elsif new.event_type = 'cta_click' then
    update public.videos set cta_clicks_count = cta_clicks_count + 1 where id = new.video_id;
  elsif new.event_type = 'progress' and new.milestone = 100 then
    update public.videos v
    set completion_rate = coalesce(
      (
        select count(*) filter (where e.event_type = 'progress' and e.milestone = 100)::numeric
             / nullif(count(*) filter (where e.event_type = 'view'), 0)
        from public.video_events e
        where e.video_id = new.video_id
      ),
      v.completion_rate
    )
    where v.id = new.video_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_video_event on public.video_events;
create trigger trg_apply_video_event
  after insert on public.video_events
  for each row execute function public.apply_video_event();
