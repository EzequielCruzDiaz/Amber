import type { MissingCase } from "./entities";
import type { RecordKind, Role } from "./enums";

/**
 * Reglas de visibilidad por rol. La base de datos las impone con RLS; estas
 * funciones son la misma regla del lado de la aplicación, para que la interfaz
 * no muestre lo que la base de datos negaría y para el modo mock.
 */
export function canSeeRecordKind(role: Role, kind: RecordKind): boolean {
  if (role === "publico") return false;
  if (kind === "forense") return role === "fiscalia" || role === "admin";
  return true;
}

export function canConfirmMatch(role: Role): boolean {
  return role === "fiscalia" || role === "admin";
}

export function canSendToVerification(role: Role): boolean {
  return role !== "publico";
}

export interface PublicCaseView {
  id: string;
  displayName: string;
  ageYears: number;
  sex: MissingCase["sex"];
  municipality: string;
  province: string;
  lastSeenAt: string;
  status: MissingCase["status"];
  isMinor: boolean;
}

/** Nombre corto para la vista pública: primer nombre + inicial del primer apellido. */
export function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const initial = parts[1]?.[0];
  return initial ? `${first} ${initial}.` : first;
}

/**
 * Proyección pública de un caso. Nunca incluye ubicación exacta, estatura,
 * señas ni circunstancias, y no publica casos de personas fallecidas.
 */
export function toPublicView(c: MissingCase): PublicCaseView | null {
  if (c.status === "localizado_fallecido" || c.status === "archivado") return null;
  return {
    id: c.id,
    displayName: shortName(c.fullName),
    ageYears: c.ageYears,
    sex: c.sex,
    municipality: c.municipality,
    province: c.province,
    lastSeenAt: c.lastSeenAt,
    status: c.status,
    isMinor: c.ageYears < 18,
  };
}
