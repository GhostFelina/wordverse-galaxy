-- Spaced-repetition progress, one row per account. Additive and non-destructive:
-- vocabulary tables, payloads and policies are unchanged.
-- The payload is a client-merged CRDT-like state (latest review per card wins),
-- written with optimistic concurrency so concurrent devices never lose reviews.

create table if not exists public.wordverse_reviews (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{"version":1,"cards":{},"days":{}}'::jsonb
    check (jsonb_typeof(payload) = 'object' and (payload ->> 'version') = '1' and pg_column_size(payload) <= 8000000),
  updated_at timestamptz not null default now()
);

alter table public.wordverse_reviews enable row level security;

revoke all on public.wordverse_reviews from anon;
revoke all on public.wordverse_reviews from authenticated;
grant select, insert, update on public.wordverse_reviews to authenticated;
grant all on public.wordverse_reviews to service_role;

drop policy if exists wordverse_reviews_select on public.wordverse_reviews;
drop policy if exists wordverse_reviews_insert on public.wordverse_reviews;
drop policy if exists wordverse_reviews_update on public.wordverse_reviews;
create policy wordverse_reviews_select on public.wordverse_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy wordverse_reviews_insert on public.wordverse_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wordverse_reviews_update on public.wordverse_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Conditional write: applies only when the caller saw the current version.
-- SECURITY INVOKER keeps RLS and table privileges in force.
create or replace function public.wordverse_write_reviews(
  p_owner_id uuid,
  p_payload jsonb,
  p_expected_updated_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  current_row public.wordverse_reviews;
  saved_row public.wordverse_reviews;
begin
  if owner_id is null or p_owner_id is distinct from owner_id then
    raise exception 'Review sync account mismatch' using errcode = '42501';
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object' or (p_payload ->> 'version') is distinct from '1' then
    raise exception 'Invalid review payload' using errcode = '22023';
  end if;

  select * into current_row from public.wordverse_reviews where user_id = owner_id for update;
  if current_row.user_id is null then
    if p_expected_updated_at is not null then
      return pg_catalog.jsonb_build_object('status', 'conflict', 'row', null);
    end if;
    insert into public.wordverse_reviews (user_id, payload, updated_at)
      values (owner_id, p_payload, pg_catalog.clock_timestamp())
      on conflict (user_id) do nothing
      returning * into saved_row;
    if saved_row.user_id is null then
      select * into current_row from public.wordverse_reviews where user_id = owner_id;
      return pg_catalog.jsonb_build_object('status', 'conflict', 'row', pg_catalog.to_jsonb(current_row));
    end if;
  elsif current_row.updated_at is distinct from p_expected_updated_at then
    return pg_catalog.jsonb_build_object('status', 'conflict', 'row', pg_catalog.to_jsonb(current_row));
  else
    update public.wordverse_reviews
      set payload = p_payload,
          updated_at = greatest(pg_catalog.clock_timestamp(), current_row.updated_at + interval '1 microsecond')
      where user_id = owner_id
      returning * into saved_row;
  end if;
  return pg_catalog.jsonb_build_object('status', 'applied', 'row', pg_catalog.to_jsonb(saved_row));
end;
$$;

revoke all on function public.wordverse_write_reviews(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.wordverse_write_reviews(uuid, jsonb, timestamptz) to authenticated;
