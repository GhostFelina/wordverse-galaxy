-- Metadata/RLS test only, not an upload/delete API test. Run in Wordverse SQL Editor.
-- No existing user's data is changed; all fixtures and policies roll back.
begin;
select set_config('wordverse.avatar_a', gen_random_uuid()::text, true);
select set_config('wordverse.avatar_b', gen_random_uuid()::text, true);
insert into auth.users (id) values
  (current_setting('wordverse.avatar_a')::uuid),
  (current_setting('wordverse.avatar_b')::uuid);
insert into storage.objects (bucket_id, name, owner_id) values
  ('wordverse-avatars', current_setting('wordverse.avatar_a') || '/avatar.png', current_setting('wordverse.avatar_a')),
  ('wordverse-avatars', current_setting('wordverse.avatar_b') || '/avatar.png', current_setting('wordverse.avatar_b'));

-- Deliberately permissive fixture proves our restrictive guard wins.
create policy wordverse_avatar_test_broad on storage.objects
for all to authenticated, anon using (true) with check (true);
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('wordverse.avatar_a'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.avatar_a'), 'role', 'authenticated')::text, true);
do $$
declare n integer; blocked boolean;
begin
  select count(*) into n from storage.objects where bucket_id = 'wordverse-avatars';
  if n <> 1 then raise exception 'Avatar read isolation failed: %', n; end if;
  update storage.objects set metadata = '{"probe":true}' where bucket_id = 'wordverse-avatars' and owner_id = current_setting('wordverse.avatar_b');
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Cross-user avatar update succeeded'; end if;
  blocked := false;
  begin
    insert into storage.objects (bucket_id, name, owner_id) values
      ('wordverse-avatars', current_setting('wordverse.avatar_b') || '/spoof.png', current_setting('wordverse.avatar_a'));
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Cross-user folder insert succeeded'; end if;
  blocked := false;
  begin
    update storage.objects set owner_id = current_setting('wordverse.avatar_b')
    where bucket_id = 'wordverse-avatars' and owner_id = current_setting('wordverse.avatar_a');
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Avatar owner reassignment succeeded'; end if;
  insert into storage.objects (bucket_id, name, owner_id) values
    ('wordverse-avatars', current_setting('wordverse.avatar_a') || '/new.webp', current_setting('wordverse.avatar_a'));
  update storage.objects set metadata = '{"ownProbe":true}'
  where bucket_id = 'wordverse-avatars' and name = current_setting('wordverse.avatar_a') || '/new.webp';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Own avatar update failed'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('wordverse.avatar_b'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('wordverse.avatar_b'), 'role', 'authenticated')::text, true);
do $$
declare n integer;
begin
  select count(*) into n from storage.objects where bucket_id = 'wordverse-avatars';
  if n <> 1 then raise exception 'Reverse avatar isolation failed'; end if;
end;
$$;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n integer;
begin
  select count(*) into n from storage.objects where bucket_id = 'wordverse-avatars';
  if n <> 0 then raise exception 'Anonymous avatar read succeeded'; end if;
end;
$$;
reset role;
select 'Avatar RLS checks passed; fixtures rolled back' as result;
rollback;
