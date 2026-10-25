import { z } from "zod";

/** Roles de acceso. Cada rol ve un subconjunto distinto de datos (ver docs/SEGURIDAD.md). */
export const Role = z.enum(["publico", "operador", "fiscalia", "admin"]);
export type Role = z.infer<typeof Role>;

export const Sex = z.enum(["M", "F"]);
export type Sex = z.infer<typeof Sex>;

/** Ciclo de vida de una denuncia. Solo `fiscalia` puede pasar a `localizado_*`. */
export const CaseStatus = z.enum([
  "en_busqueda",
  "en_verificacion",
  "localizado_vivo",
  "localizado_fallecido",
  "archivado",
]);
export type CaseStatus = z.infer<typeof CaseStatus>;

export const OPEN_STATUSES: readonly CaseStatus[] = ["en_busqueda", "en_verificacion"];

/** Origen de un registro de persona sin identificar. */
export const RecordKind = z.enum(["hospital", "detencion", "forense"]);
export type RecordKind = z.infer<typeof RecordKind>;

export const VulnerabilityFlag = z.enum(["menor", "adulto_mayor", "salud_mental", "discapacidad"]);
export type VulnerabilityFlag = z.infer<typeof VulnerabilityFlag>;

export const ReportChannel = z.enum(["911", "destacamento", "fiscalia", "familia_ong"]);
export type ReportChannel = z.infer<typeof ReportChannel>;

export const MatchDecision = z.enum(["pendiente", "en_verificacion", "confirmada", "descartada"]);
export type MatchDecision = z.infer<typeof MatchDecision>;

export const AlertKind = z.enum(["menor", "profugo"]);
export type AlertKind = z.infer<typeof AlertKind>;
