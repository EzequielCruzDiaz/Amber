"use server";

import { Role } from "@rb/domain";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { DEMO_ROLE_COOKIE, getRepository, isMockMode } from "@/lib/data";

export async function setDemoRole(form: FormData) {
  if (!isMockMode()) return;
  const role = Role.exclude(["admin"]).safeParse(form.get("role"));
  if (!role.success) return;
  (await cookies()).set(DEMO_ROLE_COOKIE, role.data, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
}

const MatchInput = z.object({
  caseId: z.string().min(1),
  recordId: z.string().min(1),
  score: z.coerce.number().int().min(0).max(100),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendToVerification(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const input = MatchInput.safeParse(Object.fromEntries(form));
  if (!input.success) return { ok: false, error: "Datos incompletos." };
  try {
    const repo = await getRepository();
    await repo.sendToVerification(input.data.caseId, input.data.recordId, input.data.score);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo enviar a verificación.",
    };
  }
  revalidatePath(`/casos/${input.data.caseId}`);
  return { ok: true };
}

export async function confirmIdentity(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const input = MatchInput.safeParse(Object.fromEntries(form));
  if (!input.success) return { ok: false, error: "Datos incompletos." };
  try {
    const repo = await getRepository();
    await repo.confirmIdentity(input.data.caseId, input.data.recordId);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo confirmar la identidad.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
