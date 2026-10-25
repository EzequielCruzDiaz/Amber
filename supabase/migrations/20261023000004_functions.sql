-- Red de Búsqueda RD · funciones de lectura y cruce

-- Registro de lecturas sensibles. security definer porque nadie escribe la
-- auditoría directamente (RLS lo impide); solo esta función y los triggers.
create or replace function public.log_access(p_action text, p_table text, p_row_id text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor, actor_role, action, table_name, row_id)
  values (auth.uid(), public.current_app_role(), p_action, p_table, p_row_id);
$$;

revoke execute on function public.log_access(text, text, text) from public, anon;
grant execute on function public.log_access(text, text, text) to authenticated;

-- Prefiltro del cruce en la base de datos. El puntaje final lo calcula
-- @rb/matching en el servidor; aquí solo se reduce el universo con índices.
-- security invoker: respeta RLS, así que un operador nunca recibe registros forenses.
create or replace function public.candidate_records(p_case_id text, p_radius_km integer default 400)
returns setof public.unidentified_records
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  c public.missing_cases;
begin
  select * into c from public.missing_cases where id = p_case_id;
  if not found then
    return;
  end if;

  perform public.log_access('consulta_cruce', 'missing_cases', p_case_id);

  return query
    select r.*
    from public.unidentified_records r
    where r.linked_case_id is null
      and r.sex = c.sex
      and r.registered_at >= c.last_seen_at - interval '6 hours'
      and c.age_years between r.age_min - 6 and r.age_max + 5
      and (c.height_cm is null or r.height_cm is null or abs(c.height_cm - r.height_cm) <= 20)
      and extensions.st_dwithin(r.location, c.last_seen_place, p_radius_km * 1000);
end;
$$;

-- Vista pública de casos: datos mínimos, sin ubicación exacta ni señas.
create or replace function public.public_cases()
returns table (
  id text,
  display_name text,
  age_years smallint,
  sex public.sex,
  municipality text,
  province text,
  last_seen_at timestamptz,
  status public.case_status,
  is_minor boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    split_part(c.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(c.full_name, ' ', 2), ''), 1) || '.', ''),
    c.age_years,
    c.sex,
    c.municipality,
    c.province,
    c.last_seen_at,
    c.status,
    c.age_years < 18
  from public.missing_cases c
  where c.status in ('en_busqueda', 'en_verificacion', 'localizado_vivo')
    and (c.status <> 'localizado_vivo' or c.resolved_at > now() - interval '7 days');
$$;

-- Cifras agregadas por provincia, públicas.
create or replace function public.province_stats(p_days integer default 90)
returns table (province text, abiertos bigint, localizados_vivos bigint, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.province,
    count(*) filter (where c.status in ('en_busqueda', 'en_verificacion')),
    count(*) filter (where c.status = 'localizado_vivo'),
    count(*)
  from public.missing_cases c
  where c.created_at > now() - make_interval(days => p_days)
  group by c.province;
$$;

grant execute on function public.public_cases() to anon, authenticated;
grant execute on function public.province_stats(integer) to anon, authenticated;
revoke execute on function public.candidate_records(text, integer) from anon;

-- Cruce inverso: avisa cuando entra un registro nuevo para que un worker
-- (Edge Function o servidor) calcule coincidencias contra casos abiertos.
create or replace function public.notify_new_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_notify('nuevo_registro', new.id);
  return new;
end;
$$;

create trigger records_notify after insert on public.unidentified_records
  for each row execute function public.notify_new_record();
