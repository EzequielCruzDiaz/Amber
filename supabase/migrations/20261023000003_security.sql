-- Red de Búsqueda RD · seguridad
-- Principio: la base de datos impone quién ve qué. La aplicación solo refleja estas reglas.
--
--   publico   → nada de tablas; solo funciones públicas con datos enmascarados
--   operador  → casos, registros de hospital y detención, incidentes y alertas
--   fiscalia  → todo lo anterior + patología forense + confirmar identidades
--   admin     → todo + auditoría

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    'publico'::public.app_role
  );
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_app_role() = any (roles);
$$;

alter table public.institutions          enable row level security;
alter table public.profiles              enable row level security;
alter table public.missing_cases         enable row level security;
alter table public.unidentified_records  enable row level security;
alter table public.matches               enable row level security;
alter table public.case_events           enable row level security;
alter table public.alerts                enable row level security;
alter table public.incidents_911         enable row level security;
alter table public.audit_log             enable row level security;

-- Instituciones: información pública.
create policy institutions_read on public.institutions
  for select to anon, authenticated using (true);

-- Perfiles: cada quien ve el suyo; admin ve todos. Nadie se cambia el rol a sí mismo.
create policy profiles_read_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.has_role('admin'));
create policy profiles_admin_write on public.profiles
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Casos.
create policy cases_read on public.missing_cases
  for select to authenticated using (public.has_role('operador', 'fiscalia', 'admin'));
create policy cases_insert on public.missing_cases
  for insert to authenticated with check (public.has_role('operador', 'fiscalia', 'admin'));
create policy cases_update on public.missing_cases
  for update to authenticated using (public.has_role('operador', 'fiscalia', 'admin'));

-- Registros sin identificar: forense solo para fiscalía/admin.
create policy records_read on public.unidentified_records
  for select to authenticated using (
    public.has_role('fiscalia', 'admin')
    or (public.has_role('operador') and kind in ('hospital', 'detencion'))
  );
create policy records_insert on public.unidentified_records
  for insert to authenticated with check (
    public.has_role('fiscalia', 'admin')
    or (public.has_role('operador') and kind in ('hospital', 'detencion'))
  );

-- Coincidencias: visibles si el registro lo es.
create policy matches_read on public.matches
  for select to authenticated using (
    exists (select 1 from public.unidentified_records r where r.id = record_id)
  );
create policy matches_write on public.matches
  for all to authenticated
  using (public.has_role('operador', 'fiscalia', 'admin'))
  with check (public.has_role('operador', 'fiscalia', 'admin'));

-- Historial del caso.
create policy events_read on public.case_events
  for select to authenticated using (public.has_role('operador', 'fiscalia', 'admin'));
create policy events_insert on public.case_events
  for insert to authenticated with check (
    public.has_role('operador', 'fiscalia', 'admin') and actor = auth.uid()
  );

-- Alertas: la ciudadanía solo ve alertas activas de menores.
create policy alerts_public_read on public.alerts
  for select to anon, authenticated using (
    (kind = 'menor' and ended_at is null) or public.has_role('operador', 'fiscalia', 'admin')
  );
create policy alerts_write on public.alerts
  for all to authenticated
  using (public.has_role('operador', 'fiscalia', 'admin'))
  with check (public.has_role('operador', 'fiscalia', 'admin'));

-- Incidentes 911: operativos.
create policy incidents_read on public.incidents_911
  for select to authenticated using (public.has_role('operador', 'fiscalia', 'admin'));

-- Auditoría: lectura para fiscalía y admin; escritura solo por triggers (security definer).
create policy audit_read on public.audit_log
  for select to authenticated using (public.has_role('fiscalia', 'admin'));

-- Reglas de transición: solo fiscalía/admin cierran un caso o confirman una coincidencia.
create or replace function public.enforce_case_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('localizado_vivo', 'localizado_fallecido', 'archivado')
     and not public.has_role('fiscalia', 'admin') then
    raise exception 'Solo Fiscalía puede cerrar un caso (estado %)', new.status
      using errcode = '42501';
  end if;
  if new.status in ('localizado_vivo', 'localizado_fallecido') and new.resolved_at is null then
    new.resolved_at := now();
  end if;
  return new;
end;
$$;

create trigger missing_cases_transition
  before update on public.missing_cases
  for each row execute function public.enforce_case_transition();

create or replace function public.enforce_match_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.decision = 'confirmada' and not public.has_role('fiscalia', 'admin') then
    raise exception 'Solo Fiscalía puede confirmar una identidad' using errcode = '42501';
  end if;
  if new.decision is distinct from old.decision then
    new.decided_by := auth.uid();
    new.decided_at := now();
  end if;
  return new;
end;
$$;

create trigger matches_decision
  before update on public.matches
  for each row execute function public.enforce_match_decision();

-- Auditoría genérica de escrituras.
create or replace function public.audit_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_key text;
begin
  row_key := coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'));
  insert into public.audit_log (actor, actor_role, action, table_name, row_id, detail)
  values (
    auth.uid(),
    public.current_app_role(),
    lower(tg_op),
    tg_table_name,
    row_key,
    case tg_op
      when 'UPDATE' then jsonb_build_object(
        'antes', to_jsonb(old) - 'full_name',
        'despues', to_jsonb(new) - 'full_name'
      )
      else '{}'::jsonb
    end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_missing_cases after insert or update or delete on public.missing_cases
  for each row execute function public.audit_write();
create trigger audit_records after insert or update or delete on public.unidentified_records
  for each row execute function public.audit_write();
create trigger audit_matches after insert or update or delete on public.matches
  for each row execute function public.audit_write();

-- Perfil automático al registrarse (rol público por defecto).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
