-- Run as postgres in the Wordverse SQL Editor after the review_progress migration.
-- Verifies owner isolation and conditional writes for review progress. Everything is rolled back.
begin;

select set_config('wordverse.test_a', gen_random_uuid()::text, true);
select set_config('wordverse.test_b', gen_random_uuid()::text, true);
select set_config('wordverse.test_c', gen_random_uuid()::text, true);

insert into auth.users (id)
values (current_setting('wordverse.test_a')::uuid),
       (current_setting('wordverse.test_b')::uuid),
       (current_setting('wordverse.test_c')::uuid);

insert into public.wordverse_reviews (user_id, payload)
values (current_setting('wordverse.test_a')::uuid, '{"version":1,"cards":{},"days":{}}'),
       (current_setting('wordverse.test_b')::uuid, '{"version":1,"cards":{},"days":{}}');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('wordverse.test_a'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.test_a'), 'role', 'authenticated')::text, true);

do $$
declare
  visible_count integer;
  changed_count integer;
  blocked boolean;
  result jsonb;
  current_version timestamptz;
  test_a uuid := current_setting('wordverse.test_a')::uuid;
  test_b uuid := current_setting('wordverse.test_b')::uuid;
  test_c uuid := current_setting('wordverse.test_c')::uuid;
begin
  select count(*) into visible_count from public.wordverse_reviews;
  if visible_count <> 1 then raise exception 'Review read isolation failed: %', visible_count; end if;

  update public.wordverse_reviews set payload = payload || '{"probe":true}' where user_id = test_b;
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then raise exception 'Cross-user review update succeeded'; end if;

  if has_table_privilege('authenticated', 'public.wordverse_reviews', 'DELETE') then
    raise exception 'Hard delete privilege remains for wordverse_reviews';
  end if;

  blocked := false;
  begin
    insert into public.wordverse_reviews (user_id, payload) values (test_c, '{"version":1}');
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Cross-user review insert succeeded'; end if;

  blocked := false;
  begin
    perform public.wordverse_write_reviews(test_b, '{"version":1,"cards":{},"days":{}}', null);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Review RPC accepted another owner'; end if;

  result := public.wordverse_write_reviews(test_a, '{"version":1,"cards":{},"days":{}}', '2000-01-01T00:00:00Z');
  if result ->> 'status' <> 'conflict' then raise exception 'Stale review write was applied: %', result; end if;

  select updated_at into current_version from public.wordverse_reviews where user_id = test_a;
  result := public.wordverse_write_reviews(test_a, '{"version":1,"cards":{},"days":{"2026-11-01":{"reviewed":1,"again":0,"learned":1}}}', current_version);
  if result ->> 'status' <> 'applied' then raise exception 'Current review write was rejected: %', result; end if;
  if (result -> 'row' ->> 'updated_at')::timestamptz <= current_version then
    raise exception 'Review version did not advance';
  end if;

  blocked := false;
  begin
    perform public.wordverse_write_reviews(test_a, '{"version":2}', (result -> 'row' ->> 'updated_at')::timestamptz);
  exception when invalid_parameter_value then blocked := true;
  end;
  if not blocked then raise exception 'Invalid review payload was accepted'; end if;
end;
$$;

select 'review isolation and conditional writes passed' as result;
rollback;
