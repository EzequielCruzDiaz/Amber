import "server-only";
import { Role } from "@rb/domain";
import { z } from "zod";

const Env = z
  .object({
    DATA_SOURCE: z.enum(["mock", "supabase"]).default("mock"),
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    DEMO_ROLE: Role.default("operador"),
  })
  .refine(
    (e) =>
      e.DATA_SOURCE === "mock" || (e.NEXT_PUBLIC_SUPABASE_URL && e.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      message:
        "DATA_SOURCE=supabase requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
  );

/** Variables de entorno validadas al arrancar: un error aquí detiene el servidor con un mensaje claro. */
export const env = Env.parse(process.env);
