-- Permisos que Supabase concede por defecto; en Postgres normal hay que darlos
-- a mano después de las migraciones. RLS sigue decidiendo qué filas se ven.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
