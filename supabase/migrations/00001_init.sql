-- Fase 1: projeto, banco, autenticação e estrutura de workspaces/projetos.
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`).

-- ─────────────────────────────────────────────────────────────
-- profiles: espelha auth.users com dados públicos da aplicação
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user reads own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user updates own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- workspaces: isolamento de dados entre clientes/times
-- ─────────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Helper: usuário é membro do workspace?
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create policy "workspaces: members can read"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "workspaces: owner can update"
  on public.workspaces for update
  using (owner_id = auth.uid());

create policy "workspaces: authenticated users can create"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "workspaces: owner can delete"
  on public.workspaces for delete
  using (owner_id = auth.uid());

create policy "workspace_members: members can read roster"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "workspace_members: owner/admin can manage"
  on public.workspace_members for all
  using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Ao criar um workspace, o criador vira membro "owner" automaticamente
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- ─────────────────────────────────────────────────────────────
-- projects: agrupam vídeos dentro de um workspace
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects: members can read"
  on public.projects for select
  using (public.is_workspace_member(workspace_id));

create policy "projects: editors+ can write"
  on public.projects for all
  using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = projects.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'editor')
    )
  );

create index if not exists idx_workspace_members_user on public.workspace_members (user_id);
create index if not exists idx_projects_workspace on public.projects (workspace_id);
