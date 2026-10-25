import { fakerES as faker } from "@faker-js/faker";
import type {
  Alert,
  CaseStatus,
  Incident911,
  Institution,
  LngLat,
  MarkCode,
  MissingCase,
  ReportChannel,
  Sex,
  UnidentifiedRecord,
  VulnerabilityFlag,
} from "@rb/domain";
import { INSTITUTIONS, institutionById, PLACES, type Place, placeByName } from "./places";

export interface Scenario {
  generatedAt: string;
  institutions: readonly Institution[];
  cases: MissingCase[];
  records: UnidentifiedRecord[];
  incidents: Incident911[];
  alerts: Alert[];
}

export interface ScenarioOptions {
  /** Semilla: el mismo valor produce exactamente el mismo escenario. */
  seed?: number;
  /** Momento de referencia del escenario. */
  now?: Date;
  fillerCases?: number;
  incidents?: number;
}

const DAY = 864e5;
const HOUR = 36e5;

/**
 * Escenario completamente ficticio para demos y pruebas.
 *
 * Incluye cuatro casos ancla con coincidencias deliberadas (hospital, detención,
 * patología forense y una adulta mayor desorientada) y casos de relleno con una
 * distribución de resultados parecida a la publicada por la Policía Nacional
 * (~80% localizados con vida).
 */
export function generateScenario(opts: ScenarioOptions = {}): Scenario {
  const seed = opts.seed ?? 2026;
  const now = (opts.now ?? new Date("2026-10-23T06:00:00-04:00")).getTime();
  faker.seed(seed);

  const iso = (t: number) => new Date(t).toISOString();
  const jitter = (p: LngLat, deg = 0.02): LngLat => [
    round(p[0] + faker.number.float({ min: -deg, max: deg })),
    round(p[1] + faker.number.float({ min: -deg, max: deg })),
  ];

  const cases: MissingCase[] = [];
  const records: UnidentifiedRecord[] = [];
  let caseSeq = 1000;
  let recordSeq = 500;

  const addCase = (c: {
    fullName: string;
    sex: Sex;
    ageYears: number;
    heightCm: number | null;
    marks?: MarkCode[];
    flags?: VulnerabilityFlag[];
    municipality: string;
    lastSeenAt: number;
    circumstances: string;
    channel: ReportChannel;
    status?: CaseStatus;
    resolvedAt?: number | null;
  }): MissingCase => {
    const place = placeByName(c.municipality);
    const mc: MissingCase = {
      id: `DR-${caseSeq++}`,
      fullName: c.fullName,
      sex: c.sex,
      ageYears: c.ageYears,
      heightCm: c.heightCm,
      marks: c.marks ?? [],
      flags: c.flags ?? (c.ageYears < 18 ? ["menor"] : c.ageYears >= 65 ? ["adulto_mayor"] : []),
      lastSeenAt: iso(c.lastSeenAt),
      lastSeenPlace: jitter(place.location),
      municipality: place.municipality,
      province: place.province,
      circumstances: c.circumstances,
      channel: c.channel,
      status: c.status ?? "en_busqueda",
      resolvedAt: c.resolvedAt ? iso(c.resolvedAt) : null,
      createdAt: iso(c.lastSeenAt + 6 * HOUR),
    };
    cases.push(mc);
    return mc;
  };

  const addRecord = (
    r: Omit<UnidentifiedRecord, "id" | "location" | "registeredAt" | "linkedCaseId"> & {
      registeredAt: number;
    },
  ) => {
    const inst = institutionById(r.institutionId);
    const rec: UnidentifiedRecord = {
      ...r,
      id: `${r.kind === "hospital" ? "HN" : r.kind === "detencion" ? "DT" : "IN"}-${recordSeq++}`,
      registeredAt: iso(r.registeredAt),
      location: jitter(inst.location, 0.003),
      linkedCaseId: null,
    };
    records.push(rec);
    return rec;
  };

  // --- Casos ancla -------------------------------------------------------
  addCase({
    fullName: "Ramón Almonte Peña",
    sex: "M",
    ageYears: 34,
    heightCm: 172,
    marks: ["tatuaje:rosa:antebrazo_der"],
    municipality: "Santo Domingo Este",
    lastSeenAt: now - 14 * DAY + 9 * HOUR,
    channel: "destacamento",
    circumstances: "Salió en motocicleta hacia el trabajo y no llegó.",
  });
  addRecord({
    kind: "hospital",
    institutionId: "h-dn",
    sex: "M",
    ageMin: 30,
    ageMax: 40,
    heightCm: 170,
    marks: ["tatuaje:rosa:antebrazo_der"],
    registeredAt: now - 13 * DAY + 2 * HOUR,
    notes:
      "Ingresó inconsciente tras accidente de motocicleta. Sin documentos; registrado como NN.",
  });

  addCase({
    fullName: "Wilkin Reyes Batista",
    sex: "M",
    ageYears: 22,
    heightCm: 180,
    marks: ["cicatriz:x:cara"],
    municipality: "Santiago de los Caballeros",
    lastSeenAt: now - 9 * DAY + 20 * HOUR,
    channel: "911",
    circumstances: "Visto por última vez en un colmado del sector Cienfuegos.",
  });
  addRecord({
    kind: "detencion",
    institutionId: "d-sti",
    sex: "M",
    ageMin: 18,
    ageMax: 26,
    heightCm: 178,
    marks: ["cicatriz:x:cara"],
    registeredAt: now - 8 * DAY + 3 * HOUR,
    notes: "Detenido en operativo nocturno sin cédula. Dio un nombre que no figura en el padrón.",
  });

  addCase({
    fullName: "José Féliz Rosario",
    sex: "M",
    ageYears: 58,
    heightCm: 168,
    marks: ["amputacion:dedo:mano_izq", "tatuaje:nombre:pecho"],
    municipality: "San Cristóbal",
    lastSeenAt: now - 25 * DAY + 7 * HOUR,
    channel: "fiscalia",
    circumstances: "Salió a pescar al río Nigua.",
  });
  addRecord({
    kind: "forense",
    institutionId: "m-sd",
    sex: "M",
    ageMin: 50,
    ageMax: 65,
    heightCm: 165,
    marks: ["amputacion:dedo:mano_izq"],
    registeredAt: now - 21 * DAY + 11 * HOUR,
    notes: "Cuerpo sin identificar recuperado en la ribera de un río. Muestra de ADN tomada.",
  });

  addCase({
    fullName: "Carmen Mejía Santana",
    sex: "F",
    ageYears: 79,
    heightCm: 155,
    flags: ["adulto_mayor", "salud_mental"],
    municipality: "La Vega",
    lastSeenAt: now - 3 * DAY + 16 * HOUR,
    channel: "911",
    circumstances: "Salió de su casa en la tarde; tiene diagnóstico de demencia.",
  });
  addRecord({
    kind: "hospital",
    institutionId: "h-lv",
    sex: "F",
    ageMin: 70,
    ageMax: 85,
    heightCm: 152,
    marks: [],
    registeredAt: now - 2 * DAY + 4 * HOUR,
    notes: "Mujer desorientada traída por una patrulla. No recuerda su nombre.",
  });

  // Caso sin registro todavía: sirve para demostrar el cruce inverso al
  // registrar un paciente NN desde la interfaz (ver docs/MOTOR-CRUCE.md).
  addCase({
    fullName: "Yeison Martínez De la Cruz",
    sex: "M",
    ageYears: 27,
    heightCm: 175,
    marks: ["tatuaje:tribal:hombro_izq", "tatuaje:estrella:cuello"],
    municipality: "Puerto Plata",
    lastSeenAt: now - 5 * DAY + 22 * HOUR,
    channel: "911",
    circumstances: "Salió de una fiesta de madrugada.",
  });

  // Registros sin identificar que no corresponden a ningún caso ancla.
  const fillerRecords: Array<
    Omit<UnidentifiedRecord, "id" | "location" | "registeredAt" | "linkedCaseId"> & {
      daysAgo: number;
    }
  > = [
    {
      kind: "hospital",
      institutionId: "h-sti",
      sex: "M",
      ageMin: 40,
      ageMax: 55,
      heightCm: 174,
      marks: ["cicatriz:x:abdomen"],
      notes: "Paciente con trauma craneal, sin acompañantes.",
      daysAgo: 6,
    },
    {
      kind: "hospital",
      institutionId: "h-spm",
      sex: "F",
      ageMin: 20,
      ageMax: 30,
      heightCm: 162,
      marks: [],
      notes: "Ingresó tras accidente en la autovía del Este. Sedada.",
      daysAgo: 2,
    },
    {
      kind: "forense",
      institutionId: "m-sti",
      sex: "M",
      ageMin: 25,
      ageMax: 40,
      heightCm: 177,
      marks: ["tatuaje:nombre:pecho"],
      notes: "Cuerpo hallado en zona rural.",
      daysAgo: 11,
    },
    {
      kind: "detencion",
      institutionId: "d-hig",
      sex: "M",
      ageMin: 30,
      ageMax: 45,
      heightCm: 169,
      marks: [],
      notes: "Detenido sin documentos; no aporta datos de familiares.",
      daysAgo: 4,
    },
    {
      kind: "hospital",
      institutionId: "h-sj",
      sex: "M",
      ageMin: 60,
      ageMax: 80,
      heightCm: 166,
      marks: ["marcha:cojera:pierna_der"],
      notes: "Adulto mayor encontrado en la vía pública, no se comunica.",
      daysAgo: 9,
    },
  ];
  for (const { daysAgo, ...r } of fillerRecords)
    addRecord({ ...r, registeredAt: now - daysAgo * DAY - 3 * HOUR });

  // --- Casos de relleno --------------------------------------------------
  const motifs = [
    "Salió a casa de una amiga y no regresó.",
    "No volvió del liceo.",
    "Salió a buscar trabajo en otra provincia.",
    "Discutió con la familia y se fue de la casa.",
    "Viajaba en guagua hacia la capital.",
    "Salió de madrugada sin decir a dónde.",
  ];
  const fillerMarks: MarkCode[] = [
    "cicatriz:x:abdomen",
    "accesorio:lentes:general",
    "protesis:dental:cara",
    "marcha:cojera:pierna_der",
    "lunar:x:cara",
  ];
  const weighted = (): Place =>
    faker.helpers.weightedArrayElement(PLACES.map((p) => ({ weight: p.weight, value: p })));

  for (let i = 0; i < (opts.fillerCases ?? 46); i++) {
    const sex: Sex = faker.datatype.boolean({ probability: 0.55 }) ? "M" : "F";
    const r = faker.number.float();
    const age =
      r < 0.12
        ? faker.number.int({ min: 8, max: 12 })
        : r < 0.36
          ? faker.number.int({ min: 13, max: 17 })
          : r < 0.9
            ? faker.number.int({ min: 18, max: 64 })
            : faker.number.int({ min: 65, max: 85 });
    const daysAgo = faker.number.int({ min: 1, max: 85 });
    const lastSeen = now - daysAgo * DAY + faker.number.int({ min: 0, max: 23 }) * HOUR;
    const outcome = faker.number.float();
    let status: CaseStatus = "en_busqueda";
    let resolvedAt: number | null = null;
    if (daysAgo > 3 && outcome < 0.62) {
      status = "localizado_vivo";
      resolvedAt = lastSeen + Math.min(daysAgo - 1, faker.number.int({ min: 1, max: 12 })) * DAY;
    } else if (daysAgo > 6 && outcome < 0.68) {
      status = "localizado_fallecido";
      resolvedAt = lastSeen + faker.number.int({ min: 2, max: Math.max(2, daysAgo - 1) }) * DAY;
    }
    const base = sex === "M" ? 168 : 156;
    addCase({
      fullName: `${faker.person.firstName(sex === "M" ? "male" : "female")} ${faker.person.lastName()} ${faker.person.lastName()}`,
      sex,
      ageYears: age,
      heightCm:
        age < 13
          ? faker.number.int({ min: 125, max: 150 })
          : base + faker.number.int({ min: -9, max: 9 }),
      marks: faker.datatype.boolean({ probability: 0.35 })
        ? [faker.helpers.arrayElement(fillerMarks)]
        : [],
      municipality: weighted().municipality,
      lastSeenAt: lastSeen,
      circumstances: faker.helpers.arrayElement(motifs),
      channel: faker.helpers.arrayElement<ReportChannel>([
        "911",
        "911",
        "destacamento",
        "fiscalia",
        "familia_ong",
      ]),
      status,
      resolvedAt,
    });
  }

  // --- Incidentes 911 ----------------------------------------------------
  const types = [
    "Accidente de tránsito",
    "Emergencia médica",
    "Violencia intrafamiliar",
    "Riña",
    "Incendio",
    "Persona desorientada",
    "Robo",
  ];
  const incidents: Incident911[] = Array.from({ length: opts.incidents ?? 40 }, (_, i) => {
    const p = weighted();
    return {
      id: `911-${String(100000 + i)}`,
      type: faker.helpers.arrayElement(types),
      at: iso(now - faker.number.int({ min: 0, max: 10 * 60 }) * 60_000),
      location: jitter(p.location, 0.03),
      municipality: p.municipality,
    };
  });

  // --- Alertas -----------------------------------------------------------
  const alerts: Alert[] = [
    {
      id: "alerta-profugo-0193",
      kind: "profugo",
      title: "Sujeto P-0193 (ficticio) · robo agravado",
      center: [-69.92, 18.51],
      radiusKm: 4,
      startedAt: iso(now - 5 * HOUR),
      endedAt: null,
      caseId: null,
    },
  ];

  return { generatedAt: iso(now), institutions: INSTITUTIONS, cases, records, incidents, alerts };
}

const round = (n: number) => Math.round(n * 1e5) / 1e5;
