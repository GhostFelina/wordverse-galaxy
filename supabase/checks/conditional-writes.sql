-- Run as postgres in the Wordverse SQL Editor. No persistent users or records.
begin;
select set_config('wordverse.test_a', gen_random_uuid()::text, true);
select set_config('wordverse.test_b', gen_random_uuid()::text, true);
insert into auth.users (id) values (current_setting('wordverse.test_a')::uuid), (current_setting('wordverse.test_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('wordverse.test_a'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.test_a'), 'role', 'authenticated')::text, true);
do $$
declare
  owner_id uuid := current_setting('wordverse.test_a')::uuid;
  other_id uuid := current_setting('wordverse.test_b')::uuid;
  result jsonb;
  first_revision timestamptz;
  second_revision timestamptz;
  blocked boolean;
begin
  result := public.wordverse_write_change(owner_id, 'wordverse_galaxies', 'cas-g', '{"id":"cas-g","name":"first"}', null, null, null);
  if result->>'status' <> 'applied' then raise exception 'Initial insert failed'; end if;
  first_revision := (result->'row'->>'updated_at')::timestamptz;
  result := public.wordverse_write_change(owner_id, 'wordverse_galaxies', 'cas-g', '{"id":"cas-g","name":"second"}', null, null, first_revision);
  if result->>'status' <> 'applied' then raise exception 'Expected revision update failed'; end if;
  second_revision := (result->'row'->>'updated_at')::timestamptz;
  if second_revision <= first_revision then raise exception 'Server revision did not advance'; end if;
  result := public.wordverse_write_change(owner_id, 'wordverse_galaxies', 'cas-g', '{"id":"cas-g","name":"stale"}', null, null, first_revision);
  if result->>'status' <> 'conflict' or result->'row'->'payload'->>'name' <> 'second' then raise exception 'Stale write overwrote data'; end if;
  result := public.wordverse_write_change(owner_id, 'wordverse_galaxies', 'cas-g', '{"id":"cas-g","name":"duplicate"}', null, null, null);
  if result->>'status' <> 'conflict' then raise exception 'Repeated insert overwrote data'; end if;
  result := public.wordverse_write_change(owner_id, 'wordverse_galaxies', 'missing', '{"id":"missing"}', null, null, first_revision);
  if result->>'status' <> 'conflict' or result->'row' <> 'null'::jsonb then raise exception 'Missing revision unexpectedly inserted'; end if;
  blocked := false;
  begin
    perform public.wordverse_write_change(other_id, 'wordverse_galaxies', 'cas-g', '{"id":"cas-g"}', null, null, null);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Account mismatch was permitted'; end if;
  blocked := false;
  begin
    perform public.wordverse_write_change(owner_id, 'wordverse_galaxies; drop table auth.users', 'x', '{"id":"x"}', null, null, null);
  exception when invalid_parameter_value then blocked := true;
  end;
  if not blocked then raise exception 'Invalid table was permitted'; end if;
  blocked := false;
  begin
    insert into public.wordverse_galaxies (user_id, id, payload) values (owner_id, 'missing-id', '{}');
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'Missing payload identity was permitted'; end if;
  result := public.wordverse_write_change(owner_id, 'wordverse_entries', 'cas-e', '{"id":"cas-e","galaxyId":"cas-g"}', 'cas-g', null, null);
  if result->>'status' <> 'applied' then raise exception 'Entry insert failed'; end if;
  first_revision := (result->'row'->>'updated_at')::timestamptz;
  result := public.wordverse_write_change(owner_id, 'wordverse_entries', 'cas-e', '{"id":"cas-e","galaxyId":"cas-g"}', 'cas-g', clock_timestamp(), first_revision);
  if result->>'status' <> 'applied' or result->'row'->>'deleted_at' is null then raise exception 'Soft delete failed'; end if;
  result := public.wordverse_write_change(owner_id, 'wordverse_events', 'cas-event', '{"id":"cas-event","galaxyId":"cas-g"}', 'cas-g', null, null);
  if result->>'status' <> 'applied' then raise exception 'Event insert failed'; end if;
  result := public.wordverse_write_change(owner_id, 'wordverse_settings', null, '{"version":4,"theme":"dark"}', null, null, null);
  if result->>'status' <> 'applied' then raise exception 'Settings insert failed'; end if;
  first_revision := (result->'row'->>'updated_at')::timestamptz;
  result := public.wordverse_write_change(owner_id, 'wordverse_settings', null, '{"version":4,"theme":"light"}', null, null, first_revision);
  if result->>'status' <> 'applied' then raise exception 'Settings update failed'; end if;
end;
$$;
select set_config('request.jwt.claim.sub', current_setting('wordverse.test_b'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.test_b'), 'role', 'authenticated')::text, true);
do $$
declare result jsonb;
begin
  result := public.wordverse_write_change(current_setting('wordverse.test_b')::uuid, 'wordverse_galaxies', 'cas-g', '{"id":"cas-g","name":"other account"}', null, null, null);
  if result->>'status' <> 'applied' then raise exception 'Independent account identity failed'; end if;
end;
$$;
reset role;
do $$
begin
  if has_function_privilege('anon', 'public.wordverse_write_change(uuid,text,text,jsonb,text,timestamptz,timestamptz)', 'EXECUTE') then raise exception 'Anonymous execute remains'; end if;
  if (select prosecdef from pg_proc where oid = 'public.wordverse_write_change(uuid,text,text,jsonb,text,timestamptz,timestamptz)'::regprocedure) then raise exception 'Function bypasses invoker RLS'; end if;
end;
$$;
select 'Conditional writes passed: revisions, stale conflicts, owner isolation, settings, tombstones and privileges; all test data rolled back' as result;
rollback;
