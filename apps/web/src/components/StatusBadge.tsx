import type { CaseStatus } from "@rb/domain";

const STATUS: Record<CaseStatus, { label: string; className: string }> = {
  en_busqueda: { label: "En búsqueda", className: "text-st-busqueda" },
  en_verificacion: { label: "Coincidencia en verificación", className: "text-st-verificacion" },
  localizado_vivo: { label: "Localizado con vida", className: "text-st-vivo" },
  localizado_fallecido: { label: "Localizado sin vida", className: "text-st-fallecido" },
  archivado: { label: "Archivado", className: "text-muted" },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-block rounded-full border border-current px-2 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}
