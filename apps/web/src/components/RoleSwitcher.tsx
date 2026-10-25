import type { Role } from "@rb/domain";
import { setDemoRole } from "@/app/actions";

const ROLES: Array<{ value: Role; label: string }> = [
  { value: "publico", label: "Público" },
  { value: "operador", label: "Operador 911" },
  { value: "fiscalia", label: "Fiscalía / INACIF" },
];

/** Solo en modo mock: cambia el rol simulado. Con Supabase el rol viene del perfil del usuario. */
export function RoleSwitcher({ current }: { current: Role }) {
  return (
    <form
      action={setDemoRole}
      className="flex overflow-hidden rounded-md border border-line bg-surface text-sm"
    >
      {ROLES.map((r) => (
        <button
          key={r.value}
          type="submit"
          name="role"
          value={r.value}
          aria-pressed={current === r.value}
          className="border-line px-3 py-1.5 font-medium text-muted not-first:border-l aria-pressed:bg-accent aria-pressed:text-surface"
        >
          {r.label}
        </button>
      ))}
    </form>
  );
}
