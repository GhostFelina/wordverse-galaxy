-- Text IDs preserve existing v2/v3/v4 backup identifiers. Ownership is part
-- of every primary and foreign key, including references between rows.
create table public.wordverse_universes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz,
  primary key (owner_id, id)
);

create table public.wordverse_collections (
  owner_id uuid not null,
  id text not null check (length(id) between 1 and 200),
  universe_id text not null,
  name text not null check (length(name) between 1 and 500),
  learning_language text not null check (length(learning_language) between 1 and 100),
  meaning_language text not null default 'tr' check (length(meaning_language) between 1 and 100),
  visual_state jsonb not null default '{}' check (jsonb_typeof(visual_state) = 'object'),
  legacy_data jsonb not null default '{}' check (jsonb_typeof(legacy_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz,
  primary key (owner_id, id),
  foreign key (owner_id, universe_id) references public.wordverse_universes(owner_id, id)
);

create table public.wordverse_entries (
  owner_id uuid not null,
  id text not null check (length(id) between 1 and 200),
  collection_id text not null,
  type text not null check (length(type) between 1 and 100),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  review_state jsonb not null default '{}' check (jsonb_typeof(review_state) = 'object'),
  visual_state jsonb not null default '{}' check (jsonb_typeof(visual_state) = 'object'),
  tags text[] not null default '{}',
  legacy_data jsonb not null default '{}' check (jsonb_typeof(legacy_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz,
  primary key (owner_id, id),
  foreign key (owner_id, collection_id) references public.wordverse_collections(owner_id, id)
);

-- History is append-only; payload preserves legacy before/after records.
create table public.wordverse_events (
  owner_id uuid not null,
  id text not null check (length(id) between 1 and 200),
  universe_id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  foreign key (owner_id, universe_id) references public.wordverse_universes(owner_id, id)
);

create index wordverse_collections_parent_idx on public.wordverse_collections(owner_id, universe_id);
create index wordverse_entries_parent_idx on public.wordverse_entries(owner_id, collection_id);
create index wordverse_events_parent_idx on public.wordverse_events(owner_id, universe_id);
create index wordverse_universes_sync_idx on public.wordverse_universes(owner_id, updated_at, id);
create index wordverse_collections_sync_idx on public.wordverse_collections(owner_id, updated_at, id);
create index wordverse_entries_sync_idx on public.wordverse_entries(owner_id, updated_at, id);

-- The invoker trigger never elevates privileges. Revisions support optimistic
-- concurrency; deleted rows remain readable so other devices see tombstones.
create function public.wordverse_stamp_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := clock_timestamp();
    new.revision := 1;
  else
    new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;
revoke all on function public.wordverse_stamp_update() from public, anon, authenticated;

create trigger wordverse_universes_stamp before insert or update on public.wordverse_universes
for each row execute function public.wordverse_stamp_update();
create trigger wordverse_collections_stamp before insert or update on public.wordverse_collections
for each row execute function public.wordverse_stamp_update();
create trigger wordverse_entries_stamp before insert or update on public.wordverse_entries
for each row execute function public.wordverse_stamp_update();

alter table public.wordverse_universes enable row level security;
alter table public.wordverse_collections enable row level security;
alter table public.wordverse_entries enable row level security;
alter table public.wordverse_events enable row level security;

revoke all on public.wordverse_universes, public.wordverse_collections,
  public.wordverse_entries, public.wordverse_events from public, anon, authenticated;
grant select, insert on public.wordverse_universes, public.wordverse_collections,
  public.wordverse_entries, public.wordverse_events to authenticated;
-- Identity, original creation time and server revisions are immutable on update.
grant update (settings, deleted_at) on public.wordverse_universes to authenticated;
grant update (universe_id, name, learning_language, meaning_language, visual_state, legacy_data, deleted_at)
  on public.wordverse_collections to authenticated;
grant update (collection_id, type, content, review_state, visual_state, tags, legacy_data, deleted_at)
  on public.wordverse_entries to authenticated;

create policy wordverse_universes_read on public.wordverse_universes for select to authenticated
using ((select auth.uid()) = owner_id);
create policy wordverse_universes_insert on public.wordverse_universes for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy wordverse_universes_update on public.wordverse_universes for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy wordverse_collections_read on public.wordverse_collections for select to authenticated
using ((select auth.uid()) = owner_id);
create policy wordverse_collections_insert on public.wordverse_collections for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy wordverse_collections_update on public.wordverse_collections for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy wordverse_entries_read on public.wordverse_entries for select to authenticated
using ((select auth.uid()) = owner_id);
create policy wordverse_entries_insert on public.wordverse_entries for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy wordverse_entries_update on public.wordverse_entries for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy wordverse_events_read on public.wordverse_events for select to authenticated
using ((select auth.uid()) = owner_id);
create policy wordverse_events_insert on public.wordverse_events for insert to authenticated
with check ((select auth.uid()) = owner_id);
