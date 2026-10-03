begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select ok(relrowsecurity, relname || ' enables RLS')
from pg_class where oid in (
  'wordverse_universes'::regclass, 'wordverse_collections'::regclass,
  'wordverse_entries'::regclass, 'wordverse_events'::regclass
);

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into wordverse_universes (owner_id, id) values
  ('00000000-0000-4000-8000-000000000002', 'remote');
insert into wordverse_collections (owner_id, id, universe_id, name, learning_language) values
  ('00000000-0000-4000-8000-000000000002', 'remote', 'remote', 'Remote', 'en');
insert into wordverse_entries (owner_id, id, collection_id, type, content) values
  ('00000000-0000-4000-8000-000000000002', 'remote', 'remote', 'word', '{"word":"private"}');
insert into wordverse_events (owner_id, id, universe_id, payload) values
  ('00000000-0000-4000-8000-000000000002', 'remote', 'remote', '{"type":"word.added"}');

set local role anon;
select throws_ok('select * from wordverse_universes', '42501', null, 'Guests cannot read universes');
select throws_ok('select * from wordverse_collections', '42501', null, 'Guests cannot read collections');
select throws_ok('select * from wordverse_entries', '42501', null, 'Guests cannot read entries');
select throws_ok('select * from wordverse_events', '42501', null, 'Guests cannot read history');
select ok(not has_table_privilege('anon', tablename, 'INSERT'), tablename || ' rejects guest writes')
from pg_tables where schemaname = 'public' and tablename like 'wordverse_%';
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select is((select count(*)::int from wordverse_universes), 0, 'Other universes are invisible');
select is((select count(*)::int from wordverse_collections), 0, 'Other collections are invisible');
select is((select count(*)::int from wordverse_entries), 0, 'Other entries are invisible');
select is((select count(*)::int from wordverse_events), 0, 'Other history is invisible');

select lives_ok($$insert into wordverse_universes (owner_id, id) values
  ('00000000-0000-4000-8000-000000000001', 'local')$$, 'Owner creates universe');
select lives_ok($$insert into wordverse_collections (owner_id, id, universe_id, name, learning_language) values
  ('00000000-0000-4000-8000-000000000001', 'galaxy-english', 'local', 'English', 'en')$$,
  'Legacy collection IDs are preserved');
select lives_ok($$insert into wordverse_entries (owner_id, id, collection_id, type, content) values
  ('00000000-0000-4000-8000-000000000001', 'legacy-word', 'galaxy-english', 'word', '{"word":"star","meaning":"yıldız"}')$$,
  'Owner creates entry');
select lives_ok($$insert into wordverse_events (owner_id, id, universe_id, payload) values
  ('00000000-0000-4000-8000-000000000001', 'local', 'local', '{"type":"word.added"}')$$,
  'Owner appends history');
select lives_ok($$insert into wordverse_entries (owner_id, id, collection_id, type, content, revision, updated_at) values
  ('00000000-0000-4000-8000-000000000001', 'forged-time', 'galaxy-english', 'word', '{}', 100, '2099-01-01')$$,
  'Insert normalizes untrusted sync metadata');
select is((select revision::int from wordverse_entries where id = 'forged-time'), 1, 'Server owns initial revision');
select ok((select updated_at < '2099-01-01' from wordverse_entries where id = 'forged-time'), 'Server owns initial sync time');

select throws_ok($$insert into wordverse_universes (owner_id, id) values
  ('00000000-0000-4000-8000-000000000002', 'attack')$$, '42501', null, 'Cannot forge universe owner');
select throws_ok($$insert into wordverse_collections (owner_id, id, universe_id, name, learning_language) values
  ('00000000-0000-4000-8000-000000000002', 'attack', 'remote', 'Attack', 'en')$$,
  '42501', null, 'Cannot forge collection owner');
select throws_ok($$insert into wordverse_entries (owner_id, id, collection_id, type, content) values
  ('00000000-0000-4000-8000-000000000002', 'attack', 'remote', 'word', '{}')$$,
  '42501', null, 'Cannot forge entry owner');
select throws_ok($$insert into wordverse_events (owner_id, id, universe_id, payload) values
  ('00000000-0000-4000-8000-000000000002', 'attack', 'remote', '{}')$$,
  '42501', null, 'Cannot forge history owner');

select throws_ok($$insert into wordverse_collections (owner_id, id, universe_id, name, learning_language) values
  ('00000000-0000-4000-8000-000000000001', 'attack', 'remote', 'Attack', 'en')$$,
  '23503', null, 'Cannot reference another owner universe');
select throws_ok($$insert into wordverse_entries (owner_id, id, collection_id, type, content) values
  ('00000000-0000-4000-8000-000000000001', 'attack', 'remote', 'word', '{}')$$,
  '23503', null, 'Cannot reference another owner collection');
select throws_ok($$insert into wordverse_events (owner_id, id, universe_id, payload) values
  ('00000000-0000-4000-8000-000000000001', 'attack', 'remote', '{}')$$,
  '23503', null, 'Cannot attach history to another owner universe');

select results_eq($$with changed as (update wordverse_universes set settings = '{"attack":true}' where id = 'remote' returning *)
  select count(*)::int from changed$$, array[0], 'Cannot update another universe');
select results_eq($$with changed as (update wordverse_collections set name = 'Attack' where id = 'remote' returning *)
  select count(*)::int from changed$$, array[0], 'Cannot update another collection');
select results_eq($$with changed as (update wordverse_entries set content = '{}' where id = 'remote' returning *)
  select count(*)::int from changed$$, array[0], 'Cannot update another entry');

select lives_ok($$update wordverse_universes set settings = '{"activeGalaxyId":"galaxy-english"}' where id = 'local'$$,
  'Owner updates universe');
select lives_ok($$update wordverse_collections set name = 'Renamed' where id = 'galaxy-english'$$,
  'Owner updates collection');
select lives_ok($$update wordverse_entries set content = '{"word":"star","meaning":"estrella"}' where id = 'legacy-word'$$,
  'Owner updates entry');
select is((select revision::int from wordverse_entries where id = 'legacy-word'), 2, 'Server increments revision');
select ok((select updated_at > created_at from wordverse_entries where id = 'legacy-word'), 'Server stamps update time');
select throws_ok($$update wordverse_entries set owner_id = '00000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'Ownership cannot be reassigned');
select throws_ok('update wordverse_entries set revision = 100', '42501', null, 'Revision cannot be forged on update');
select throws_ok('update wordverse_entries set collection_id = ''remote'' where id = ''legacy-word''',
  '23503', null, 'Cannot move entry to another owner collection');
select throws_ok('update wordverse_events set payload = ''{}''', '42501', null, 'History is immutable');
select throws_ok('delete from wordverse_universes', '42501', null, 'No destructive universe deletion');
select throws_ok('delete from wordverse_collections', '42501', null, 'No destructive collection deletion');
select throws_ok('delete from wordverse_entries', '42501', null, 'No destructive entry deletion');
select throws_ok('delete from wordverse_events', '42501', null, 'No destructive history deletion');
select lives_ok('update wordverse_entries set deleted_at = now() where id = ''legacy-word''', 'Owner creates tombstone');
select is((select count(*)::int from wordverse_entries where deleted_at is not null), 1, 'Tombstones are readable for sync');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select is((select count(*)::int from wordverse_entries where id = 'legacy-word'), 0, 'Second account cannot see first account');
select is((select count(*)::int from wordverse_entries where id = 'remote'), 1, 'Second account sees its own entry');
select lives_ok($$insert into wordverse_universes (owner_id, id) values
  ('00000000-0000-4000-8000-000000000002', 'local')$$, 'Legacy IDs can coexist in different accounts');

select set_config('request.jwt.claim.sub', '', true);
select is((select count(*)::int from wordverse_entries), 0, 'Authenticated role without identity sees nothing');
select throws_ok($$insert into wordverse_universes (owner_id, id) values
  ('00000000-0000-4000-8000-000000000001', 'no-identity')$$, '42501', null, 'Missing identity cannot write');
reset role;
select * from finish();
rollback;
