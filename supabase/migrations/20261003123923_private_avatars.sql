-- Wordverse only. Never change another application's buckets or policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wordverse-avatars', 'wordverse-avatars', false, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'wordverse-avatars' and public = false
      and file_size_limit = 2097152
      and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']
      and allowed_mime_types <@ array['image/jpeg', 'image/png', 'image/webp']
  ) then
    raise exception 'Existing wordverse-avatars bucket configuration differs; inspect before changing it';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'storage.objects'::regclass) then
    raise exception 'Storage objects RLS must be enabled';
  end if;
end;
$$;

-- The API sets owner_id from the JWT. Use both that and the user folder.
-- ALL provides SELECT + INSERT + UPDATE for upsert, and DELETE for removal.
create policy wordverse_avatar_owner on storage.objects
for all to authenticated
using (
  bucket_id = 'wordverse-avatars'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'wordverse-avatars'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Existing permissive policies must not accidentally expose this bucket.
-- Other buckets retain their existing access rules.
create policy wordverse_avatar_guard on storage.objects
as restrictive for all to anon, authenticated
using (
  bucket_id <> 'wordverse-avatars'
  or (
    owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
)
with check (
  bucket_id <> 'wordverse-avatars'
  or (
    owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
);
