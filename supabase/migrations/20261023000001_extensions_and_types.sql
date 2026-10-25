-- Red de Búsqueda RD · tipos base
-- PostGIS para ubicaciones y distancias; pgcrypto para uuid.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('publico', 'operador', 'fiscalia', 'admin');
create type public.sex as enum ('M', 'F');
create type public.case_status as enum (
  'en_busqueda',
  'en_verificacion',
  'localizado_vivo',
  'localizado_fallecido',
  'archivado'
);
create type public.record_kind as enum ('hospital', 'detencion', 'forense');
create type public.vulnerability_flag as enum ('menor', 'adulto_mayor', 'salud_mental', 'discapacidad');
create type public.report_channel as enum ('911', 'destacamento', 'fiscalia', 'familia_ong');
create type public.match_decision as enum ('pendiente', 'en_verificacion', 'confirmada', 'descartada');
create type public.alert_kind as enum ('menor', 'profugo');
create type public.institution_kind as enum ('hospital', 'destacamento', 'forense', 'fiscalia', 'centro_911');
create type public.event_kind as enum ('denuncia', 'alerta', 'coincidencia', 'verificacion', 'cierre', 'nota');
