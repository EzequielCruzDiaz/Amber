import { z } from "zod";
import {
  AlertKind,
  CaseStatus,
  MatchDecision,
  RecordKind,
  ReportChannel,
  Sex,
  VulnerabilityFlag,
} from "./enums";
import { MarkCode } from "./marks";

/** [longitud, latitud] en WGS84, el orden de GeoJSON y PostGIS. */
export const LngLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
export type LngLat = z.infer<typeof LngLat>;

const IsoDateTime = z.iso.datetime({ offset: true });

export const Institution = z.object({
  id: z.string(),
  kind: z.enum(["hospital", "destacamento", "forense", "fiscalia", "centro_911"]),
  name: z.string().min(1),
  province: z.string().min(1),
  location: LngLat,
});
export type Institution = z.infer<typeof Institution>;

/** Denuncia de una persona desaparecida. */
export const MissingCase = z.object({
  id: z.string(),
  fullName: z.string().min(1),
  sex: Sex,
  /** Edad al momento de la desaparición. */
  ageYears: z.number().int().min(0).max(120),
  heightCm: z.number().int().min(40).max(230).nullable(),
  marks: z.array(MarkCode).default([]),
  flags: z.array(VulnerabilityFlag).default([]),
  lastSeenAt: IsoDateTime,
  lastSeenPlace: LngLat,
  municipality: z.string(),
  province: z.string(),
  circumstances: z.string().max(1000),
  channel: ReportChannel,
  status: CaseStatus,
  resolvedAt: IsoDateTime.nullable().default(null),
  createdAt: IsoDateTime,
});
export type MissingCase = z.infer<typeof MissingCase>;

/** Persona sin identificar registrada por una institución. */
export const UnidentifiedRecord = z
  .object({
    id: z.string(),
    kind: RecordKind,
    institutionId: z.string(),
    sex: Sex,
    ageMin: z.number().int().min(0).max(120),
    ageMax: z.number().int().min(0).max(120),
    heightCm: z.number().int().min(40).max(230).nullable(),
    marks: z.array(MarkCode).default([]),
    registeredAt: IsoDateTime,
    location: LngLat,
    notes: z.string().max(1000),
    /** Id del caso con el que se confirmó la identidad, si ya se resolvió. */
    linkedCaseId: z.string().nullable().default(null),
  })
  .refine((r) => r.ageMin <= r.ageMax, { message: "ageMin no puede ser mayor que ageMax" });
export type UnidentifiedRecord = z.infer<typeof UnidentifiedRecord>;

export const CaseEvent = z.object({
  id: z.string(),
  caseId: z.string(),
  at: IsoDateTime,
  actorRole: z.string(),
  kind: z.enum(["denuncia", "alerta", "coincidencia", "verificacion", "cierre", "nota"]),
  text: z.string(),
});
export type CaseEvent = z.infer<typeof CaseEvent>;

export const Match = z.object({
  id: z.string(),
  caseId: z.string(),
  recordId: z.string(),
  score: z.number().min(0).max(100),
  decision: MatchDecision,
  decidedBy: z.string().nullable(),
  decidedAt: IsoDateTime.nullable(),
});
export type Match = z.infer<typeof Match>;

export const Alert = z.object({
  id: z.string(),
  kind: AlertKind,
  title: z.string(),
  center: LngLat,
  radiusKm: z.number().positive(),
  startedAt: IsoDateTime,
  endedAt: IsoDateTime.nullable(),
  caseId: z.string().nullable(),
});
export type Alert = z.infer<typeof Alert>;

export const Incident911 = z.object({
  id: z.string(),
  type: z.string(),
  at: IsoDateTime,
  location: LngLat,
  municipality: z.string(),
});
export type Incident911 = z.infer<typeof Incident911>;
