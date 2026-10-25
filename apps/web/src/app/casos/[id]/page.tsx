import { canConfirmMatch, canSendToVerification, describeMark, OPEN_STATUSES } from "@rb/domain";
import { rankRecordsForCase } from "@rb/matching";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchActions } from "@/components/MatchActions";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepository } from "@/lib/data";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santo_Domingo",
  });

const KIND_LABEL = {
  hospital: "Paciente sin identificar",
  detencion: "Detenido sin identificar",
  forense: "Cuerpo sin identificar",
};

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getRepository();
  const role = await repo.role();
  const c = await repo.getCase(id);
  if (!c) notFound();

  const [records, institutions, events] = await Promise.all([
    repo.listOpenRecords(),
    repo.listInstitutions(),
    repo.listCaseEvents(c.id),
  ]);
  const isOpen = OPEN_STATUSES.includes(c.status);
  const candidates = isOpen ? rankRecordsForCase(c, records) : [];
  const instName = (iid: string) => institutions.find((i) => i.id === iid)?.name ?? iid;

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="rounded-lg border border-line bg-surface p-4">
        <Link href="/casos" className="text-sm font-semibold text-accent">
          ← Todos los casos
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold">{c.fullName}</h1>
        <div className="mt-1 flex flex-wrap gap-2">
          <StatusBadge status={c.status} />
          <span className="rounded bg-bg px-2 py-0.5 font-mono text-xs">{c.id}</span>
          {c.flags.map((f) => (
            <span key={f} className="rounded bg-bg px-2 py-0.5 font-mono text-xs uppercase">
              {f.replace("_", " ")}
            </span>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Edad</dt>
          <dd>{c.ageYears} años</dd>
          <dt className="text-muted">Estatura</dt>
          <dd>{c.heightCm ? `${c.heightCm} cm` : "Sin dato"}</dd>
          <dt className="text-muted">Visto por última vez</dt>
          <dd>
            {c.municipality}, {fmt(c.lastSeenAt)}
          </dd>
          <dt className="text-muted">Circunstancia</dt>
          <dd>{c.circumstances}</dd>
          <dt className="text-muted">Señas</dt>
          <dd>{c.marks.length ? c.marks.map(describeMark).join("; ") : "Ninguna registrada"}</dd>
        </dl>

        <h2 className="mt-6 font-display text-lg font-semibold">Historial</h2>
        <ol className="mt-2 space-y-2 border-l-2 border-line pl-3 text-sm">
          {events.map((e) => (
            <li key={e.id}>
              <span className="block font-mono text-xs text-muted">{fmt(e.at)}</span>
              {e.text}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="font-display text-xl font-semibold">Cruce con registros sin identificar</h2>
        <p className="text-sm text-muted">
          {isOpen
            ? role === "fiscalia"
              ? "Compara con hospitales, destacamentos y patología forense."
              : "Compara con hospitales y destacamentos. Patología forense: solo Fiscalía / INACIF."
            : "El caso está cerrado."}
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {candidates.map(({ item: r, score, band, factors }) => (
            <article
              key={r.id}
              className={`rounded-lg border p-3 ${band === "alta" ? "border-st-verificacion" : "border-line"}`}
            >
              <header className="flex items-center gap-3">
                <span
                  className={`font-display text-3xl font-bold tabular-nums ${band === "alta" ? "text-st-verificacion" : "text-st-busqueda"}`}
                >
                  {score}%
                </span>
                <div className="min-w-0">
                  <b>{KIND_LABEL[r.kind]}</b>{" "}
                  <span className="rounded bg-bg px-1.5 font-mono text-xs">{r.id}</span>
                  <div className="text-xs text-muted">
                    {instName(r.institutionId)} · {fmt(r.registeredAt)}
                  </div>
                </div>
              </header>
              <p className="mt-2 text-sm">{r.notes}</p>
              <ul className="mt-2 flex flex-wrap gap-1">
                {factors.map((f) => (
                  <li
                    key={f.key}
                    className={`rounded bg-bg px-1.5 text-xs ${f.points < 0 ? "line-through opacity-60" : ""}`}
                  >
                    {f.label} {f.points > 0 ? `+${f.points}` : f.points}
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <MatchActions
                  caseId={c.id}
                  recordId={r.id}
                  score={score}
                  canVerify={canSendToVerification(role) && c.status === "en_busqueda"}
                  canConfirm={canConfirmMatch(role)}
                />
              </div>
            </article>
          ))}
          {isOpen && candidates.length === 0 && (
            <p className="rounded border border-dashed border-line p-3 text-sm text-muted">
              Sin coincidencias sobre el umbral. Cada registro nuevo se cruza automáticamente con
              este caso.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
