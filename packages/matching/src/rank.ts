import { type MissingCase, OPEN_STATUSES, type UnidentifiedRecord } from "@rb/domain";
import { DEFAULT_CONFIG, type MatchingConfig } from "./config";
import { type Factor, scoreMatch } from "./score";

export interface Candidate<T> {
  item: T;
  score: number;
  band: "alta" | "media";
  factors: Factor[];
}

/** Registros que superan el umbral para una denuncia, del más probable al menos. */
export function rankRecordsForCase(
  missing: MissingCase,
  records: readonly UnidentifiedRecord[],
  config: MatchingConfig = DEFAULT_CONFIG,
): Candidate<UnidentifiedRecord>[] {
  return collect(records, (r) => scoreMatch(missing, r, config), config);
}

/** Denuncias abiertas que superan el umbral para un registro nuevo (el cruce inverso). */
export function rankCasesForRecord(
  record: UnidentifiedRecord,
  cases: readonly MissingCase[],
  config: MatchingConfig = DEFAULT_CONFIG,
): Candidate<MissingCase>[] {
  const open = cases.filter((c) => OPEN_STATUSES.includes(c.status));
  return collect(open, (c) => scoreMatch(c, record, config), config);
}

function collect<T extends { id: string }>(
  items: readonly T[],
  score: (item: T) => ReturnType<typeof scoreMatch>,
  config: MatchingConfig,
): Candidate<T>[] {
  const out: Candidate<T>[] = [];
  for (const item of items) {
    const r = score(item);
    if (r.ok && r.score >= config.thresholds.show && r.band !== "baja") {
      out.push({ item, score: r.score, band: r.band, factors: r.factors });
    }
  }
  // Orden estable: puntaje descendente, luego id para que la UI no "salte".
  return out.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}
