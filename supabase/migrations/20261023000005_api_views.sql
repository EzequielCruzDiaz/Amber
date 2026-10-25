-- Red de Búsqueda RD · vistas para la API
-- PostgREST devuelve geography como WKB; estas vistas exponen lng/lat planos.
-- security_invoker = true: la vista aplica el RLS de quien consulta, no del dueño.

create view public.missing_cases_api with (security_invoker = true) as
select
  c.id, c.full_name, c.sex, c.age_years, c.height_cm, c.marks, c.flags,
  c.last_seen_at,
  extensions.st_x(c.last_seen_place::extensions.geometry) as lng,
  extensions.st_y(c.last_seen_place::extensions.geometry) as lat,
  c.municipality, c.province, c.circumstances, c.channel, c.status, c.resolved_at, c.created_at
from public.missing_cases c;

create view public.unidentified_records_api with (security_invoker = true) as
select
  r.id, r.kind, r.institution_id, r.sex, r.age_min, r.age_max, r.height_cm, r.marks, r.registered_at,
  extensions.st_x(r.location::extensions.geometry) as lng,
  extensions.st_y(r.location::extensions.geometry) as lat,
  r.notes, r.linked_case_id
from public.unidentified_records r;

create view public.institutions_api with (security_invoker = true) as
select
  i.id, i.kind, i.name, i.province,
  extensions.st_x(i.location::extensions.geometry) as lng,
  extensions.st_y(i.location::extensions.geometry) as lat
from public.institutions i;

create view public.incidents_911_api with (security_invoker = true) as
select
  i.id, i.type, i.at, i.municipality,
  extensions.st_x(i.location::extensions.geometry) as lng,
  extensions.st_y(i.location::extensions.geometry) as lat
from public.incidents_911 i;

create view public.alerts_api with (security_invoker = true) as
select
  a.id, a.kind, a.title, a.radius_km, a.started_at, a.ended_at, a.case_id,
  extensions.st_x(a.center::extensions.geometry) as lng,
  extensions.st_y(a.center::extensions.geometry) as lat
from public.alerts a;

grant select on public.institutions_api, public.alerts_api to anon, authenticated;
grant select on public.missing_cases_api, public.unidentified_records_api, public.incidents_911_api to authenticated;
