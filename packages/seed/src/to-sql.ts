import type { LngLat } from "@rb/domain";
import type { Scenario } from "./scenario";

const lit = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  return `'${v.replaceAll("'", "''")}'`;
};
const arr = (xs: readonly string[]): string =>
  xs.length ? `array[${xs.map(lit).join(",")}]` : "'{}'";
const point = ([lng, lat]: LngLat): string => `'SRID=4326;POINT(${lng} ${lat})'`;

/** SQL idempotente para `supabase db reset` (se carga después de las migraciones). */
export function scenarioToSql(s: Scenario): string {
  const out: string[] = [
    "-- Generado por @rb/seed. DATOS FICTICIOS: ninguna persona, caso o registro es real.",
    `-- Escenario: ${s.generatedAt}`,
    "begin;",
  ];

  for (const i of s.institutions) {
    out.push(
      `insert into public.institutions (id, kind, name, province, location) values (${lit(i.id)}, ${lit(i.kind)}, ${lit(i.name)}, ${lit(i.province)}, ${point(i.location)}) on conflict (id) do nothing;`,
    );
  }

  for (const c of s.cases) {
    const flags = c.flags.length
      ? `array[${c.flags.map(lit).join(",")}]::public.vulnerability_flag[]`
      : "'{}'";
    out.push(
      `insert into public.missing_cases (id, full_name, sex, age_years, height_cm, marks, flags, last_seen_at, last_seen_place, municipality, province, circumstances, channel, status, resolved_at, created_at) values (${[
        lit(c.id),
        lit(c.fullName),
        lit(c.sex),
        lit(c.ageYears),
        lit(c.heightCm),
        arr(c.marks),
        flags,
        lit(c.lastSeenAt),
        point(c.lastSeenPlace),
        lit(c.municipality),
        lit(c.province),
        lit(c.circumstances),
        lit(c.channel),
        lit(c.status),
        lit(c.resolvedAt),
        lit(c.createdAt),
      ].join(", ")}) on conflict (id) do nothing;`,
    );
  }

  for (const r of s.records) {
    out.push(
      `insert into public.unidentified_records (id, kind, institution_id, sex, age_min, age_max, height_cm, marks, registered_at, location, notes) values (${[
        lit(r.id),
        lit(r.kind),
        lit(r.institutionId),
        lit(r.sex),
        lit(r.ageMin),
        lit(r.ageMax),
        lit(r.heightCm),
        arr(r.marks),
        lit(r.registeredAt),
        point(r.location),
        lit(r.notes),
      ].join(", ")}) on conflict (id) do nothing;`,
    );
  }

  for (const i of s.incidents) {
    out.push(
      `insert into public.incidents_911 (id, type, at, location, municipality) values (${lit(i.id)}, ${lit(i.type)}, ${lit(i.at)}, ${point(i.location)}, ${lit(i.municipality)}) on conflict (id) do nothing;`,
    );
  }

  for (const a of s.alerts) {
    out.push(
      `insert into public.alerts (kind, title, center, radius_km, started_at, ended_at, case_id) values (${lit(a.kind)}, ${lit(a.title)}, ${point(a.center)}, ${a.radiusKm}, ${lit(a.startedAt)}, ${lit(a.endedAt)}, ${lit(a.caseId)});`,
    );
  }

  // Las secuencias siguen después de los ids sembrados.
  out.push(
    "select setval('public.case_code_seq', 2000);",
    "select setval('public.record_code_seq', 2000);",
    "commit;",
    "",
  );
  return out.join("\n");
}
