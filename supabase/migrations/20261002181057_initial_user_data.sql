-- Wordverse user-owned records. Payload retains every v4 field during sync.
-- IDs are text because existing guest IDs include legacy and seeded strings.

create table if not exists public.wordverse_galaxies (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ->> 'id' = id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table if not exists public.wordverse_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  galaxy_id text not null,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'id' = id
    and payload ->> 'galaxyId' = galaxy_id
  ),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, galaxy_id) references public.wordverse_galaxies (user_id, id)
);

create table if not exists public.wordverse_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  galaxy_id text,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ->> 'id' = id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, galaxy_id) references public.wordverse_galaxies (user_id, id)
);

create table if not exists public.wordverse_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists wordverse_galaxies_updated_idx on public.wordverse_galaxies (user_id, updated_at);
create index if not exists wordverse_entries_updated_idx on public.wordverse_entries (user_id, updated_at);
create index if not exists wordverse_entries_galaxy_idx on public.wordverse_entries (user_id, galaxy_id);
create index if not exists wordverse_events_updated_idx on public.wordverse_events (user_id, updated_at);
create index if not exists wordverse_events_galaxy_idx on public.wordverse_events (user_id, galaxy_id);

alter table public.wordverse_galaxies enable row level security;
alter table public.wordverse_entries enable row level security;
alter table public.wordverse_events enable row level security;
alter table public.wordverse_settings enable row level security;

revoke all on public.wordverse_galaxies, public.wordverse_entries, public.wordverse_events, public.wordverse_settings from anon;
revoke all on public.wordverse_galaxies, public.wordverse_entries, public.wordverse_events, public.wordverse_settings from authenticated;
grant select, insert, update on public.wordverse_galaxies, public.wordverse_entries, public.wordverse_events, public.wordverse_settings to authenticated;
grant all on public.wordverse_galaxies, public.wordverse_entries, public.wordverse_events, public.wordverse_settings to service_role;

drop policy if exists wordverse_galaxies_select on public.wordverse_galaxies;
drop policy if exists wordverse_galaxies_insert on public.wordverse_galaxies;
drop policy if exists wordverse_galaxies_update on public.wordverse_galaxies;
create policy wordverse_galaxies_select on public.wordverse_galaxies for select to authenticated using ((select auth.uid()) = user_id);
create policy wordverse_galaxies_insert on public.wordverse_galaxies for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wordverse_galaxies_update on public.wordverse_galaxies for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists wordverse_entries_select on public.wordverse_entries;
drop policy if exists wordverse_entries_insert on public.wordverse_entries;
drop policy if exists wordverse_entries_update on public.wordverse_entries;
create policy wordverse_entries_select on public.wordverse_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy wordverse_entries_insert on public.wordverse_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wordverse_entries_update on public.wordverse_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists wordverse_events_select on public.wordverse_events;
drop policy if exists wordverse_events_insert on public.wordverse_events;
drop policy if exists wordverse_events_update on public.wordverse_events;
create policy wordverse_events_select on public.wordverse_events for select to authenticated using ((select auth.uid()) = user_id);
create policy wordverse_events_insert on public.wordverse_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wordverse_events_update on public.wordverse_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists wordverse_settings_select on public.wordverse_settings;
drop policy if exists wordverse_settings_insert on public.wordverse_settings;
drop policy if exists wordverse_settings_update on public.wordverse_settings;
create policy wordverse_settings_select on public.wordverse_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy wordverse_settings_insert on public.wordverse_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wordverse_settings_update on public.wordverse_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
