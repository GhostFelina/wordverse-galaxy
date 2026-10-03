-- Conditional writes use the current JWT owner and server timestamps.
-- SECURITY INVOKER keeps the existing RLS and table privileges in force.
alter table public.wordverse_galaxies drop constraint if exists wordverse_galaxies_payload_identity;
alter table public.wordverse_galaxies add constraint wordverse_galaxies_payload_identity
  check (length(id) > 0 and payload ->> 'id' is not null and payload ->> 'id' = id);
alter table public.wordverse_entries drop constraint if exists wordverse_entries_payload_identity;
alter table public.wordverse_entries add constraint wordverse_entries_payload_identity
  check (length(id) > 0 and length(galaxy_id) > 0 and payload ->> 'id' is not null
    and payload ->> 'galaxyId' is not null and payload ->> 'id' = id and payload ->> 'galaxyId' = galaxy_id);
alter table public.wordverse_events drop constraint if exists wordverse_events_payload_identity;
alter table public.wordverse_events add constraint wordverse_events_payload_identity
  check (length(id) > 0 and payload ->> 'id' is not null and payload ->> 'id' = id
    and (payload ->> 'galaxyId') is not distinct from galaxy_id);

create or replace function public.wordverse_write_change(
  p_owner_id uuid,
  p_table text,
  p_id text,
  p_payload jsonb,
  p_galaxy_id text,
  p_deleted_at timestamptz,
  p_expected_updated_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  current_row jsonb;
  saved_row jsonb;
  lookup_sql text;
  write_sql text;
  server_time timestamptz;
begin
  if owner_id is null or p_owner_id is distinct from owner_id then
    raise exception 'Sync account mismatch' using errcode = '42501';
  end if;
  if p_table is null or p_table not in ('wordverse_galaxies', 'wordverse_entries', 'wordverse_events', 'wordverse_settings') then
    raise exception 'Invalid sync table' using errcode = '22023';
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Invalid sync payload' using errcode = '22023';
  end if;
  if p_table <> 'wordverse_settings' and (p_id is null or length(p_id) = 0 or (p_payload ->> 'id') is distinct from p_id) then
    raise exception 'Invalid sync identity' using errcode = '22023';
  end if;
  if p_table = 'wordverse_entries' and (p_galaxy_id is null or length(p_galaxy_id) = 0 or (p_payload ->> 'galaxyId') is distinct from p_galaxy_id) then
    raise exception 'Invalid sync galaxy' using errcode = '22023';
  end if;
  if p_table = 'wordverse_events' and (p_payload ->> 'galaxyId') is distinct from p_galaxy_id then
    raise exception 'Invalid event galaxy' using errcode = '22023';
  end if;

  if p_table = 'wordverse_settings' then
    lookup_sql := 'select pg_catalog.to_jsonb(target) from public.wordverse_settings as target where user_id = $1 for update';
  else
    lookup_sql := pg_catalog.format('select pg_catalog.to_jsonb(target) from public.%I as target where user_id = $1 and id = $2 for update', p_table);
  end if;
  execute lookup_sql into current_row using owner_id, p_id;
  if current_row is not null then
    if p_expected_updated_at is null or (current_row ->> 'updated_at')::timestamptz is distinct from p_expected_updated_at then
      return pg_catalog.jsonb_build_object('status', 'conflict', 'row', current_row);
    end if;
    server_time := greatest(pg_catalog.clock_timestamp(), (current_row ->> 'updated_at')::timestamptz + interval '1 microsecond');
    if p_table = 'wordverse_settings' then
      write_sql := 'update public.wordverse_settings as target set payload = $3, updated_at = $4, deleted_at = $5 where user_id = $1 returning pg_catalog.to_jsonb(target)';
    elsif p_table = 'wordverse_galaxies' then
      write_sql := 'update public.wordverse_galaxies as target set payload = $3, updated_at = $4, deleted_at = $5 where user_id = $1 and id = $2 returning pg_catalog.to_jsonb(target)';
    else
      write_sql := pg_catalog.format('update public.%I as target set payload = $3, updated_at = $4, deleted_at = $5, galaxy_id = $6 where user_id = $1 and id = $2 returning pg_catalog.to_jsonb(target)', p_table);
    end if;
    execute write_sql into saved_row using owner_id, p_id, p_payload, server_time, p_deleted_at, p_galaxy_id;
  else
    if p_expected_updated_at is not null then
      return pg_catalog.jsonb_build_object('status', 'conflict', 'row', null);
    end if;
    server_time := pg_catalog.clock_timestamp();
    if p_table = 'wordverse_settings' then
      write_sql := 'insert into public.wordverse_settings as target (user_id, payload, updated_at, deleted_at) values ($1, $3, $4, $5) returning pg_catalog.to_jsonb(target)';
    elsif p_table = 'wordverse_galaxies' then
      write_sql := 'insert into public.wordverse_galaxies as target (user_id, id, payload, updated_at, deleted_at) values ($1, $2, $3, $4, $5) returning pg_catalog.to_jsonb(target)';
    else
      write_sql := pg_catalog.format('insert into public.%I as target (user_id, id, payload, updated_at, deleted_at, galaxy_id) values ($1, $2, $3, $4, $5, $6) returning pg_catalog.to_jsonb(target)', p_table);
    end if;
    begin
      execute write_sql into saved_row using owner_id, p_id, p_payload, server_time, p_deleted_at, p_galaxy_id;
    exception when unique_violation then
      -- Another request inserted this identity after our lookup. Preserve it.
      execute lookup_sql into current_row using owner_id, p_id;
      return pg_catalog.jsonb_build_object('status', 'conflict', 'row', current_row);
    end;
  end if;
  if saved_row is null then raise exception 'Sync write rejected' using errcode = '42501'; end if;
  return pg_catalog.jsonb_build_object('status', 'applied', 'row', saved_row);
end;
$$;

revoke all on function public.wordverse_write_change(uuid, text, text, jsonb, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.wordverse_write_change(uuid, text, text, jsonb, text, timestamptz, timestamptz) to authenticated;
notify pgrst, 'reload schema';
