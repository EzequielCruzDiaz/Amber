import { describeMark, type MissingCase, parseMark, type UnidentifiedRecord } from "@rb/domain";
import { DEFAULT_CONFIG, type MatchingConfig } from "./config";
import { haversineKm } from "./geo";

export type FactorKey = "edad" | "estatura" | "senas" | "tiempo" | "distancia";

/** Una razón concreta que sumó (o restó) puntos. Es lo que ve el operador. */
export interface Factor {
  key: FactorKey;
  label: string;
  points: number;
}

export type RejectionReason =
  | "sexo_distinto"
  | "registro_ya_vinculado"
  | "registro_anterior_a_desaparicion"
  | "edad_fuera_de_rango"
  | "estatura_incompatible";

export type ScoreOutcome =
  | { ok: true; score: number; band: "alta" | "media" | "baja"; factors: Factor[] }
  | { ok: false; reason: RejectionReason };

const HOUR_MS = 36e5;
const DAY_MS = 864e5;
const YEAR_MS = 365.25 * DAY_MS;

/**
 * Compara una denuncia con un registro de persona sin identificar.
 *
 * Función pura y determinista: mismo input, mismo resultado. Primero aplica
 * filtros duros que descartan el par; luego suma puntos por factor. Nunca
 * decide una identidad: solo prioriza qué revisar.
 */
export function scoreMatch(
  missing: MissingCase,
  record: UnidentifiedRecord,
  config: MatchingConfig = DEFAULT_CONFIG,
): ScoreOutcome {
  const { points: P, limits: L, thresholds: T } = config;

  if (record.linkedCaseId !== null) return { ok: false, reason: "registro_ya_vinculado" };
  if (missing.sex !== record.sex) return { ok: false, reason: "sexo_distinto" };

  const lastSeen = Date.parse(missing.lastSeenAt);
  const registered = Date.parse(record.registeredAt);
  if (registered < lastSeen - L.clockSkewHours * HOUR_MS) {
    return { ok: false, reason: "registro_anterior_a_desaparicion" };
  }

  const factors: Factor[] = [];

  // Edad: la persona envejece entre la desaparición y el registro.
  const ageAtRecord = missing.ageYears + Math.max(0, registered - lastSeen) / YEAR_MS;
  if (ageAtRecord >= record.ageMin && ageAtRecord <= record.ageMax + 0.999) {
    factors.push({
      key: "edad",
      label: `Edad en rango ${record.ageMin}–${record.ageMax}`,
      points: P.ageInRange,
    });
  } else if (
    ageAtRecord >= record.ageMin - L.ageToleranceYears &&
    ageAtRecord <= record.ageMax + L.ageToleranceYears
  ) {
    factors.push({ key: "edad", label: "Edad cercana al rango estimado", points: P.ageNear });
  } else {
    return { ok: false, reason: "edad_fuera_de_rango" };
  }

  // Estatura: solo si ambos lados la tienen.
  if (missing.heightCm !== null && record.heightCm !== null) {
    const diff = Math.abs(missing.heightCm - record.heightCm);
    if (diff > L.heightRejectCm) return { ok: false, reason: "estatura_incompatible" };
    if (diff <= L.heightCloseCm)
      factors.push({ key: "estatura", label: `Estatura ±${diff} cm`, points: P.heightClose });
    else if (diff <= L.heightNearCm)
      factors.push({ key: "estatura", label: `Estatura ±${diff} cm`, points: P.heightNear });
  }

  // Señas particulares: código exacto vale más que mismo tipo en la misma zona.
  const markFactor = scoreMarks(missing.marks, record.marks, config);
  if (markFactor) factors.push(markFactor);

  // Tiempo: un registro poco después de la desaparición es más probable.
  const days = Math.max(0, registered - lastSeen) / DAY_MS;
  if (days <= 7)
    factors.push({
      key: "tiempo",
      label: `${Math.round(days)} días después`,
      points: P.timeWithinWeek,
    });
  else if (days <= 30)
    factors.push({
      key: "tiempo",
      label: `${Math.round(days)} días después`,
      points: P.timeWithinMonth,
    });
  else if (days <= 90)
    factors.push({
      key: "tiempo",
      label: `${Math.round(days)} días después`,
      points: P.timeWithinQuarter,
    });

  // Distancia entre el último lugar visto y donde se registró.
  const km = haversineKm(missing.lastSeenPlace, record.location);
  if (km <= L.distanceNearKm)
    factors.push({ key: "distancia", label: `${Math.round(km)} km`, points: P.distanceNear });
  else if (km <= L.distanceRegionalKm)
    factors.push({ key: "distancia", label: `${Math.round(km)} km`, points: P.distanceRegional });

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const band = score >= T.high ? "alta" : score >= T.show ? "media" : "baja";
  return { ok: true, score, band, factors };
}

function scoreMarks(
  caseMarks: string[],
  recordMarks: string[],
  config: MatchingConfig,
): Factor | null {
  const { points: P } = config;
  if (caseMarks.length === 0 || recordMarks.length === 0) return null;

  const exact = caseMarks.filter((m) => recordMarks.includes(m));
  const sameZone = caseMarks.filter((m) => {
    if (exact.includes(m)) return false;
    const a = parseMark(m);
    return recordMarks.some((r) => {
      const b = parseMark(r);
      return a.type === b.type && a.zone === b.zone;
    });
  });

  const pts = Math.min(P.marksMax, exact.length * P.markExact + sameZone.length * P.markSameZone);
  if (pts > 0) {
    const first = exact[0] ?? sameZone[0];
    const label =
      exact.length > 0
        ? `Seña: ${describeMark(first as string)}`
        : `Seña parecida: ${describeMark(first as string)}`;
    return { key: "senas", label, points: pts };
  }
  return { key: "senas", label: "Señas registradas distintas", points: -P.marksConflictPenalty };
}
