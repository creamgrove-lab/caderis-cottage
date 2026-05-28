create table if not exists public.caderis_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  username_norm text not null unique,
  nickname text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.caderis_boxes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_type text not null,
  alias text not null,
  mode text not null check (mode in ('short', 'standard', 'long')),
  max_gems integer not null check (max_gems in (14, 20, 30)),
  status text not null default 'active' check (status in ('active', 'packed', 'archived', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.caderis_gems (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.caderis_boxes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  color_type text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  can_undo_until timestamptz not null,
  fixed boolean not null default false
);

create index if not exists caderis_boxes_owner_id_idx on public.caderis_boxes(owner_id);
create index if not exists caderis_gems_owner_id_idx on public.caderis_gems(owner_id);
create index if not exists caderis_gems_box_id_idx on public.caderis_gems(box_id);

alter table public.caderis_profiles enable row level security;
alter table public.caderis_boxes enable row level security;
alter table public.caderis_gems enable row level security;

drop policy if exists "caderis profiles are private" on public.caderis_profiles;
create policy "caderis profiles are private"
on public.caderis_profiles
for all
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "caderis boxes are private" on public.caderis_boxes;
create policy "caderis boxes are private"
on public.caderis_boxes
for all
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

drop policy if exists "caderis gems are private" on public.caderis_gems;
create policy "caderis gems are private"
on public.caderis_gems
for all
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.caderis_boxes
    where caderis_boxes.id = caderis_gems.box_id
      and caderis_boxes.owner_id = (select auth.uid())
  )
);
