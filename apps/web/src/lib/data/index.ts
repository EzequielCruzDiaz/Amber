import "server-only";
import { Role } from "@rb/domain";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";
import { MockRepository } from "./mock-repository";
import type { Repository } from "./repository";
import { SupabaseRepository } from "./supabase-repository";

export const DEMO_ROLE_COOKIE = "rb_demo_role";

/** Punto único de acceso a datos para Server Components y Server Actions. */
export async function getRepository(): Promise<Repository> {
  const jar = await cookies();

  if (env.DATA_SOURCE === "mock") {
    const parsed = Role.safeParse(jar.get(DEMO_ROLE_COOKIE)?.value);
    return new MockRepository(parsed.success ? parsed.data : env.DEMO_ROLE);
  }

  const db = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL as string,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) jar.set(name, value, options);
          } catch {
            // Llamado desde un Server Component: la sesión se refresca en proxy.ts.
          }
        },
      },
    },
  );
  return new SupabaseRepository(db);
}

export function isMockMode() {
  return env.DATA_SOURCE === "mock";
}

export { ForbiddenError } from "./repository";
