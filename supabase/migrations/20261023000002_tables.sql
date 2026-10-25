-- Red de Búsqueda RD · tablas
-- Convención: ubicaciones en geography(Point, 4326); fechas en timestamptz.

create sequence public.case_code_seq start 1000;
create sequence public.record_code_seq start 500;

create table public.institutions (
  id          text primary key,
  kind        public.institution_kind not null,
  name        text not null,
  province    text not null,
  location    extensions.geography(Point, 4326) not null
);

-- Un perfil por usuario de Supabase Auth. El rol decide qué ve (ver 0003).
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           public.app_role not null default 'publico',
  institution_id text references public.institutions (id),
  full_name      text,
  created_at     timestamptz not null default now()
);

create table public.missing_cases (
  id               text primary key default ('DR-' || nextval('public.case_code_seq')),
  full_name        text not null check (length(full_name) between 1 and 200),
  sex              public.sex not null,
  age_years        smallint not null check (age_years between 0 and 120),
  height_cm        smallint check (height_cm between 40 and 230),
  marks            text[] not null default '{}',
  flags            public.vulnerability_flag[] not null default '{}',
  last_seen_at     timestamptz not null,
  last_seen_place  extensions.geography(Point, 4326) not null,
  municipality     text not null,
  province         text not null,
  circumstances    text not null default '' check (length(circumstances) <= 1000),
  channel          public.report_channel not null,
  status           public.case_status not null default 'en_busqueda',
  resolved_at      timestamptz,
  created_by       uuid references auth.users (id),
  created_at       timestamptz not null default now(),
  constraint resolved_needs_date check (
    status not in ('localizado_vivo', 'localizado_fallecido') or resolved_at is not null
  ),
  constraint marks_format check (
    array_to_string(marks, ',') ~ '^([a-z_]+:[a-z0-9_]+:[a-z_]+(,|$))*$'
  )
);

create table public.unidentified_records (
  id              text primary key default ('NN-' || nextval('public.record_code_seq')),
  kind            public.record_kind not null,
  institution_id  text not null references public.institutions (id),
  sex             public.sex not null,
  age_min         smallint not null check (age_min between 0 and 120),
  age_max         smallint not null check (age_max between 0 and 120),
  height_cm       smallint check (height_cm between 40 and 230),
  marks           text[] not null default '{}',
  registered_at   timestamptz not null,
  location        extensions.geography(Point, 4326) not null,
  notes           text not null default '' check (length(notes) <= 1000),
  linked_case_id  text references public.missing_cases (id),
  created_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  constraint age_range check (age_min <= age_max)
);

create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  case_id     text not null references public.missing_cases (id) on delete cascade,
  record_id   text not null references public.unidentified_records (id) on delete cascade,
  score       smallint not null check (score between 0 and 100),
  factors     jsonb not null default '[]',
  decision    public.match_decision not null default 'pendiente',
  decided_by  uuid references auth.users (id),
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (case_id, record_id)
);

create table public.case_events (
  id          uuid primary key default gen_random_uuid(),
  case_id     text not null references public.missing_cases (id) on delete cascade,
  at          timestamptz not null default now(),
  actor       uuid references auth.users (id),
  actor_role  public.app_role not null,
  kind        public.event_kind not null,
  text        text not null check (length(text) <= 1000)
);

create table public.alerts (
  id          uuid primary key default gen_random_uuid(),
  kind        public.alert_kind not null,
  title       text not null,
  center      extensions.geography(Point, 4326) not null,
  radius_km   numeric(6, 2) not null check (radius_km > 0),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  case_id     text references public.missing_cases (id)
);

create table public.incidents_911 (
  id            text primary key,
  type          text not null,
  at            timestamptz not null,
  location      extensions.geography(Point, 4326) not null,
  municipality  text not null
);

-- Auditoría: solo la escriben triggers y funciones; nadie la edita.
create table public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       uuid,
  actor_role  public.app_role,
  action      text not null,
  table_name  text,
  row_id      text,
  detail      jsonb not null default '{}'
);

-- Índices para el prefiltro del cruce y el mapa.
create index missing_cases_open_idx on public.missing_cases (status, sex) where status in ('en_busqueda', 'en_verificacion');
create index missing_cases_place_gix on public.missing_cases using gist (last_seen_place);
create index records_unlinked_idx on public.unidentified_records (sex, registered_at) where linked_case_id is null;
create index records_location_gix on public.unidentified_records using gist (location);
create index incidents_at_idx on public.incidents_911 (at desc);
create index incidents_location_gix on public.incidents_911 using gist (location);
create index alerts_active_idx on public.alerts (kind) where ended_at is null;
create index case_events_case_idx on public.case_events (case_id, at);
