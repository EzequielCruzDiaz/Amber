import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { getRepository, isMockMode } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Red de Búsqueda RD",
  description:
    "Demo: cruce de denuncias de personas desaparecidas con registros de personas sin identificar.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const repo = await getRepository();
  const role = await repo.role();

  return (
    <html lang="es-DO">
      <body className="min-h-dvh">
        <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-display text-2xl font-bold">
            Red de Búsqueda RD
          </Link>
          <span className="rounded border border-dashed border-st-verificacion px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-st-verificacion">
            Demostración · datos ficticios
          </span>
          <nav className="flex gap-4 text-sm font-semibold">
            <Link href="/">Mapa</Link>
            <Link href="/casos">Casos</Link>
          </nav>
          <div className="ml-auto">
            {isMockMode() ? (
              <RoleSwitcher current={role} />
            ) : (
              <span className="text-sm text-muted">Rol: {role}</span>
            )}
          </div>
        </header>
        <main className="px-4 pb-8">{children}</main>
      </body>
    </html>
  );
}
