import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepository } from "@/lib/data";

export default async function CasesPage() {
  const repo = await getRepository();
  const role = await repo.role();

  if (role === "publico") {
    const cases = await repo.listPublicCases();
    return (
      <section className="mx-auto max-w-3xl rounded-lg border border-line bg-surface p-4">
        <h1 className="font-display text-2xl font-semibold">Personas en búsqueda</h1>
        <ul className="mt-3 divide-y divide-line">
          {cases.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <span className="flex-1">
                <b>{c.displayName}</b> · {c.ageYears} años · {c.municipality}
              </span>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const cases = await repo.listCases();
  return (
    <section className="mx-auto max-w-4xl rounded-lg border border-line bg-surface p-4">
      <h1 className="font-display text-2xl font-semibold">Casos · últimos 90 días</h1>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-2">Caso</th>
              <th>Nombre</th>
              <th>Edad</th>
              <th>Municipio</th>
              <th>Desde</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {cases.map((c) => (
              <tr key={c.id}>
                <td className="py-2 font-mono text-xs">
                  <Link href={`/casos/${c.id}`} className="text-accent underline">
                    {c.id}
                  </Link>
                </td>
                <td>{c.fullName}</td>
                <td className="tabular-nums">{c.ageYears}</td>
                <td>{c.municipality}</td>
                <td className="tabular-nums">
                  {new Date(c.lastSeenAt).toLocaleDateString("es-DO")}
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
