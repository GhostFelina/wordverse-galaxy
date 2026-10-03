-- Run as postgres in the Wordverse SQL Editor. Everything is rolled back.
begin;

select set_config('wordverse.test_a', gen_random_uuid()::text, true);
select set_config('wordverse.test_b', gen_random_uuid()::text, true);
select set_config('wordverse.test_c', gen_random_uuid()::text, true);

insert into auth.users (id)
values (current_setting('wordverse.test_a')::uuid),
       (current_setting('wordverse.test_b')::uuid),
       (current_setting('wordverse.test_c')::uuid);

insert into public.wordverse_galaxies (user_id, id, payload)
values (current_setting('wordverse.test_a')::uuid, 'rls-a-g', '{"id":"rls-a-g"}'),
       (current_setting('wordverse.test_b')::uuid, 'rls-b-g', '{"id":"rls-b-g"}');
insert into public.wordverse_entries (user_id, id, galaxy_id, payload)
values (current_setting('wordverse.test_a')::uuid, 'rls-a-e', 'rls-a-g', '{"id":"rls-a-e","galaxyId":"rls-a-g"}'),
       (current_setting('wordverse.test_b')::uuid, 'rls-b-e', 'rls-b-g', '{"id":"rls-b-e","galaxyId":"rls-b-g"}');
insert into public.wordverse_events (user_id, id, galaxy_id, payload)
values (current_setting('wordverse.test_a')::uuid, 'rls-a-event', 'rls-a-g', '{"id":"rls-a-event"}'),
       (current_setting('wordverse.test_b')::uuid, 'rls-b-event', 'rls-b-g', '{"id":"rls-b-event"}');
insert into public.wordverse_settings (user_id, payload)
values (current_setting('wordverse.test_a')::uuid, '{}'),
       (current_setting('wordverse.test_b')::uuid, '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('wordverse.test_a'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.test_a'), 'role', 'authenticated')::text, true);

do $$
declare
  table_name text;
  visible_count integer;
  changed_count integer;
  blocked boolean;
  test_a uuid := current_setting('wordverse.test_a')::uuid;
  test_b uuid := current_setting('wordverse.test_b')::uuid;
  test_c uuid := current_setting('wordverse.test_c')::uuid;
begin
  foreach table_name in array array['wordverse_galaxies', 'wordverse_entries', 'wordverse_events', 'wordverse_settings'] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    if visible_count <> 1 then raise exception 'RLS read isolation failed for %: %', table_name, visible_count; end if;
    execute format('update public.%I set payload = payload || ''{"probe":true}''::jsonb where user_id = $1', table_name) using test_b;
    get diagnostics changed_count = row_count;
    if changed_count <> 0 then raise exception 'Cross-user update succeeded for %', table_name; end if;
    execute format('update public.%I set payload = payload || ''{"ownProbe":true}''::jsonb where user_id = $1', table_name) using test_a;
    get diagnostics changed_count = row_count;
    if changed_count <> 1 then raise exception 'Own-user update failed for %', table_name; end if;
    if has_table_privilege('authenticated', 'public.' || table_name, 'DELETE') then
      raise exception 'Hard delete privilege remains for %', table_name;
    end if;
    blocked := false;
    begin
      if table_name = 'wordverse_settings' then
        insert into public.wordverse_settings (user_id, payload) values (test_c, '{}');
      elsif table_name = 'wordverse_entries' then
        insert into public.wordverse_entries (user_id, id, galaxy_id, payload)
        values (test_b, 'rls-spoof', 'rls-b-g', '{"id":"rls-spoof","galaxyId":"rls-b-g"}');
      else
        execute format('insert into public.%I (user_id, id, payload) values ($1, ''rls-spoof'', ''{"id":"rls-spoof"}''::jsonb)', table_name) using test_b;
      end if;
    exception when insufficient_privilege then blocked := true;
    end;
    if not blocked then raise exception 'Cross-user insert succeeded for %', table_name; end if;
  end loop;
  blocked := false;
  begin
    update public.wordverse_entries set user_id = test_b, galaxy_id = 'rls-b-g', payload = '{"id":"rls-a-e","galaxyId":"rls-b-g"}' where user_id = test_a;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Owner reassignment was permitted'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('wordverse.test_b'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.test_b'), 'role', 'authenticated')::text, true);
do $$
declare table_name text; visible_count integer;
begin
  foreach table_name in array array['wordverse_galaxies', 'wordverse_entries', 'wordverse_events', 'wordverse_settings'] loop
    execute format('select count(*) from public.%I', table_name) into visible_count;
    if visible_count <> 1 then raise exception 'Reverse RLS read isolation failed for %', table_name; end if;
  end loop;
end;
$$;

reset role;
select 'RLS isolation checks passed; test records rolled back' as result;
rollback;
