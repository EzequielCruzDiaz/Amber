-- Prueba de humo de permisos. Corre sobre una base con las migraciones aplicadas:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_smoke.sql
-- Todo ocurre dentro de una transacción que se revierte al final.

begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');
update public.profiles set role = 'operador' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set role = 'fiscalia' where id = '00000000-0000-0000-0000-00000000000b';

insert into public.institutions (id, kind, name, province, location) values
  ('t-h', 'hospital', 'Hospital de prueba', 'Distrito Nacional', 'SRID=4326;POINT(-69.92 18.49)'),
  ('t-m', 'forense', 'Patología de prueba', 'Distrito Nacional', 'SRID=4326;POINT(-69.93 18.47)');

insert into public.missing_cases (id, full_name, sex, age_years, height_cm, marks, last_seen_at, last_seen_place,
  municipality, province, channel)
values ('T-1', 'Ramón Almonte Peña', 'M', 34, 172, '{tatuaje:rosa:antebrazo_der}', now() - interval '2 days',
  'SRID=4326;POINT(-69.857 18.488)', 'Santo Domingo Este', 'Santo Domingo', 'destacamento');

insert into public.unidentified_records (id, kind, institution_id, sex, age_min, age_max, height_cm, marks,
  registered_at, location)
values
  ('T-H', 'hospital', 't-h', 'M', 30, 40, 170, '{tatuaje:rosa:antebrazo_der}', now() - interval '1 day', 'SRID=4326;POINT(-69.92 18.49)'),
  ('T-M', 'forense', 't-m', 'M', 30, 40, 171, '{}', now() - interval '1 day', 'SRID=4326;POINT(-69.93 18.47)');

-- Público (anon): no ve tablas, sí la función enmascarada.
set local role anon;
do $$ begin
  assert (select count(*) from public.missing_cases) = 0, 'anon no debe ver casos';
  assert (select display_name from public.public_cases() where id = 'T-1') = 'Ramón A.', 'nombre enmascarado';
end $$;
reset role;

-- Operador: ve hospital, no forense; no puede cerrar casos.
set local role authenticated;
set local request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select count(*) from public.missing_cases where id = 'T-1') = 1, 'operador ve el caso';
  assert (select count(*) from public.unidentified_records where id in ('T-H', 'T-M')) = 1, 'operador no ve forense';
  assert (select count(*) from public.candidate_records('T-1') where id in ('T-H', 'T-M')) = 1, 'prefiltro respeta RLS';
  begin
    update public.missing_cases set status = 'localizado_vivo' where id = 'T-1';
    assert false, 'operador no debió poder cerrar el caso';
  exception when insufficient_privilege then null;
  end;
  insert into public.matches (case_id, record_id, score) values ('T-1', 'T-H', 94);
  begin
    update public.matches set decision = 'confirmada' where case_id = 'T-1';
    assert false, 'operador no debió poder confirmar';
  exception when insufficient_privilege then null;
  end;
  update public.matches set decision = 'en_verificacion' where case_id = 'T-1';
end $$;
reset role;

-- Fiscalía: ve forense, confirma y cierra.
set local role authenticated;
set local request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from public.unidentified_records where id in ('T-H', 'T-M')) = 2, 'fiscalía ve forense';
  update public.matches set decision = 'confirmada' where case_id = 'T-1';
  update public.missing_cases set status = 'localizado_vivo' where id = 'T-1';
  assert (select resolved_at is not null from public.missing_cases where id = 'T-1'), 'cierre fecha el caso';
  assert (select count(*) from public.audit_log where action = 'consulta_cruce') >= 1, 'la consulta quedó auditada';
end $$;
reset role;

select 'RLS OK' as resultado;
rollback;
