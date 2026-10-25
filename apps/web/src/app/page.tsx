import { OPEN_STATUSES } from "@rb/domain";
import { rankRecordsForCase } from "@rb/matching";
import Link from "next/link";
import { MapClient } from "@/components/MapClient";
import { getRepository } from "@/lib/data";
import { buildMapLayers } from "@/lib/map-features";

export default async function MapPage() {
  const repo = await getRepository();
  const role = await repo.role();
  const [cases, records, incidents, institutions, alerts, publicCases] = await Promise.all([
    repo.listCases(),
    repo.listOpenRecords(),
    repo.listIncidents(),
    repo.listInstitutions(),
    repo.listAlerts(),
    repo.listPublicCases(),
  ]);

  const open = cases.filter((c) => OPEN_STATUSES.includes(c.status));
  const pending = open
    .map((c) => ({ c, best: rankRecordsForCase(c, records)[0] }))
    .filter((x): x is { c: typeof x.c; best: NonNullable<typeof x.best> } => x.best !== undefined)
    .sort((a, b) => b.best.score - a.best.score);

  const layers = buildMapLayers({
    cases,
    records,
    incidents,
    institutions: role === "publico" ? [] : institutions,
    alerts,
  });

  return (
    <div className="grid gap-3 lg:h-[calc(100dvh-80px)] lg:grid-cols-[minmax(0,1fr)_380px]">
      <MapClient layers={layers} styleUrl={process.env.NEXT_PUBLIC_MAP_STYLE_URL} />

      <aside className="flex min-h-0 flex-col gap-4 overflow-auto rounded-lg border border-line bg-surface p-4">
        <section className="grid grid-cols-2 gap-2">
          <Kpi
            value={
              role === "publico"
                ? publicCases.filter((c) => c.status === "en_busqueda").length
                : open.length
            }
            label="Personas en búsqueda"
            tone="border-st-busqueda"
          />
          <Kpi
            value={role === "publico" ? "—" : pending.length}
            label="Coincidencias por revisar"
            tone="border-st-verificacion"
          />
        </section>

        {role === "publico" ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Fichas activas</h2>
            <p className="text-sm text-muted">
              La vista pública muestra nombre corto, edad y municipio. Cruces y ubicaciones exactas
              son solo para personal autorizado.
            </p>
            <ul className="mt-2 divide-y divide-line text-sm">
              {publicCases
                .filter((c) => c.status === "en_busqueda")
                .map((c) => (
                  <li key={c.id} className="py-2">
                    <b>{c.displayName}</b> · {c.ageYears} años · {c.municipality}
                  </li>
                ))}
            </ul>
          </section>
        ) : (
          <section>
            <h2 className="font-display text-lg font-semibold">Coincidencias abiertas</h2>
            <ul className="mt-2 divide-y divide-line">
              {pending.map(({ c, best }) => (
                <li key={c.id}>
                  <Link
                    href={`/casos/${c.id}`}
                    className="flex items-center gap-3 py-2 hover:bg-bg"
                  >
                    <span className="min-w-0 flex-1">
                      <b className="block truncate">{c.fullName}</b>
                      <span className="text-xs text-muted">
                        {c.id} ↔ {best.item.id}
                      </span>
                    </span>
                    <span className="font-display text-xl">{best.score}%</span>
                  </Link>
                </li>
              ))}
              {pending.length === 0 && (
                <li className="py-2 text-sm text-muted">Sin coincidencias sobre el umbral.</li>
              )}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}

function Kpi({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className={`rounded-md border-l-4 bg-bg px-3 py-2 ${tone}`}>
      <div className="font-display text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
