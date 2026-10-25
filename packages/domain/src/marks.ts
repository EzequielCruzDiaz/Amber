import { z } from "zod";

/**
 * Catálogo controlado de señas particulares.
 *
 * Las señas se codifican como `tipo:motivo:zona` para que dos instituciones que
 * describen lo mismo con palabras distintas produzcan el mismo código. El texto
 * libre se guarda aparte y no participa en el cruce automático.
 */
export const MarkType = z.enum([
  "tatuaje",
  "cicatriz",
  "amputacion",
  "lunar",
  "protesis",
  "marcha",
  "accesorio",
]);
export type MarkType = z.infer<typeof MarkType>;

export const BodyZone = z.enum([
  "cabeza",
  "cara",
  "cuello",
  "pecho",
  "espalda",
  "abdomen",
  "hombro_izq",
  "hombro_der",
  "brazo_izq",
  "brazo_der",
  "antebrazo_izq",
  "antebrazo_der",
  "mano_izq",
  "mano_der",
  "pierna_izq",
  "pierna_der",
  "pie_izq",
  "pie_der",
  "general",
]);
export type BodyZone = z.infer<typeof BodyZone>;

export const MarkCode = z
  .string()
  .regex(/^[a-z_]+:[a-z0-9_]+:[a-z_]+$/, "Formato esperado tipo:motivo:zona")
  .refine((s) => MarkType.safeParse(s.split(":")[0]).success, "Tipo de seña desconocido")
  .refine((s) => BodyZone.safeParse(s.split(":")[2]).success, "Zona corporal desconocida");
export type MarkCode = z.infer<typeof MarkCode>;

export interface ParsedMark {
  type: MarkType;
  motif: string;
  zone: BodyZone;
}

export function parseMark(code: MarkCode): ParsedMark {
  const [type, motif, zone] = code.split(":") as [MarkType, string, BodyZone];
  return { type, motif, zone };
}

const ZONE_LABEL: Record<BodyZone, string> = {
  cabeza: "cabeza",
  cara: "cara",
  cuello: "cuello",
  pecho: "pecho",
  espalda: "espalda",
  abdomen: "abdomen",
  hombro_izq: "hombro izquierdo",
  hombro_der: "hombro derecho",
  brazo_izq: "brazo izquierdo",
  brazo_der: "brazo derecho",
  antebrazo_izq: "antebrazo izquierdo",
  antebrazo_der: "antebrazo derecho",
  mano_izq: "mano izquierda",
  mano_der: "mano derecha",
  pierna_izq: "pierna izquierda",
  pierna_der: "pierna derecha",
  pie_izq: "pie izquierdo",
  pie_der: "pie derecho",
  general: "",
};

export function describeMark(code: MarkCode): string {
  const { type, motif, zone } = parseMark(code);
  const where = ZONE_LABEL[zone];
  const what = motif === "x" ? type : `${type} de ${motif.replaceAll("_", " ")}`;
  return where ? `${what}, ${where}` : what;
}
