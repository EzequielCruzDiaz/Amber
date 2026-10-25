-- Simula lo mínimo de Supabase (roles, auth.users, auth.uid()) para correr las
-- migraciones y rls_smoke.sql en un Postgres + PostGIS normal, como en CI.
-- No se usa con `supabase start`, que ya trae todo esto.

create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
create schema extensions;
grant usage on schema public, extensions, auth to anon, authenticated;
