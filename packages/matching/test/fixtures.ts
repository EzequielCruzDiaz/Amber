import type { MissingCase, UnidentifiedRecord } from "@rb/domain";

const SDE: [number, number] = [-69.857, 18.488];
const DN_HOSPITAL: [number, number] = [-69.919, 18.494];

export function missing(over: Partial<MissingCase> = {}): MissingCase {
  return {
    id: "DR-1000",
    fullName: "Ramón Almonte Peña",
    sex: "M",
    ageYears: 34,
    heightCm: 172,
    marks: ["tatuaje:rosa:antebrazo_der"],
    flags: [],
    lastSeenAt: "2026-10-09T09:00:00-04:00",
    lastSeenPlace: SDE,
    municipality: "Santo Domingo Este",
    province: "Santo Domingo",
    circumstances: "Salió en motocicleta hacia el trabajo.",
    channel: "destacamento",
    status: "en_busqueda",
    resolvedAt: null,
    createdAt: "2026-10-09T20:00:00-04:00",
    ...over,
  };
}

export function record(over: Partial<UnidentifiedRecord> = {}): UnidentifiedRecord {
  return {
    id: "HN-500",
    kind: "hospital",
    institutionId: "h-dn",
    sex: "M",
    ageMin: 30,
    ageMax: 40,
    heightCm: 170,
    marks: ["tatuaje:rosa:antebrazo_der"],
    registeredAt: "2026-10-10T02:00:00-04:00",
    location: DN_HOSPITAL,
    notes: "Ingresó inconsciente tras accidente de motocicleta.",
    linkedCaseId: null,
    ...over,
  };
}
