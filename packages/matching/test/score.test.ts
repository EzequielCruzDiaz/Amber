import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  haversineKm,
  rankCasesForRecord,
  rankRecordsForCase,
  scoreMatch,
} from "../src";
import { missing, record } from "./fixtures";

describe("scoreMatch: filtros duros", () => {
  it("descarta sexo distinto", () => {
    expect(scoreMatch(missing(), record({ sex: "F" }))).toEqual({
      ok: false,
      reason: "sexo_distinto",
    });
  });

  it("descarta registros ya vinculados a otro caso", () => {
    expect(scoreMatch(missing(), record({ linkedCaseId: "DR-9" }))).toMatchObject({
      ok: false,
      reason: "registro_ya_vinculado",
    });
  });

  it("descarta registros claramente anteriores a la desaparición", () => {
    const r = record({ registeredAt: "2026-10-08T09:00:00-04:00" });
    expect(scoreMatch(missing(), r)).toMatchObject({
      ok: false,
      reason: "registro_anterior_a_desaparicion",
    });
  });

  it("tolera unas horas de desfase de reloj", () => {
    const r = record({ registeredAt: "2026-10-09T05:00:00-04:00" });
    expect(scoreMatch(missing(), r).ok).toBe(true);
  });

  it("descarta edad muy fuera del rango estimado", () => {
    expect(scoreMatch(missing({ ageYears: 60 }), record())).toMatchObject({
      ok: false,
      reason: "edad_fuera_de_rango",
    });
  });

  it("descarta estatura incompatible", () => {
    expect(scoreMatch(missing({ heightCm: 195 }), record({ heightCm: 165 }))).toMatchObject({
      ok: false,
      reason: "estatura_incompatible",
    });
  });
});

describe("scoreMatch: puntaje", () => {
  it("el caso ancla (misma seña, al día siguiente, misma ciudad) es prioridad alta", () => {
    const r = scoreMatch(missing(), record());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.band).toBe("alta");
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.factors.map((f) => f.key)).toEqual([
      "edad",
      "estatura",
      "senas",
      "tiempo",
      "distancia",
    ]);
  });

  it("los puntos de cada factor suman el puntaje", () => {
    const r = scoreMatch(missing(), record());
    if (!r.ok) throw new Error("esperaba coincidencia");
    expect(r.factors.reduce((s, f) => s + f.points, 0)).toBe(r.score);
  });

  it("una seña del mismo tipo y zona con otro motivo suma menos que la exacta", () => {
    const exact = scoreMatch(missing(), record());
    const similar = scoreMatch(missing(), record({ marks: ["tatuaje:flor:antebrazo_der"] }));
    if (!exact.ok || !similar.ok) throw new Error("esperaba coincidencias");
    expect(similar.score).toBeLessThan(exact.score);
    expect(similar.factors.find((f) => f.key === "senas")?.points).toBe(
      DEFAULT_CONFIG.points.markSameZone,
    );
  });

  it("señas registradas y distintas restan puntos", () => {
    const r = scoreMatch(missing(), record({ marks: ["cicatriz:x:cara"] }));
    if (!r.ok) throw new Error("esperaba resultado");
    expect(r.factors.find((f) => f.key === "senas")?.points).toBeLessThan(0);
  });

  it("sin estatura en un lado no suma ni descarta", () => {
    const r = scoreMatch(missing({ heightCm: null }), record());
    if (!r.ok) throw new Error("esperaba resultado");
    expect(r.factors.some((f) => f.key === "estatura")).toBe(false);
  });

  it("la edad avanza entre la desaparición y el registro", () => {
    // 39 años al desaparecer, registro dos años después con rango 40–45.
    const m = missing({ ageYears: 39, lastSeenAt: "2024-10-01T00:00:00-04:00" });
    const r = scoreMatch(
      m,
      record({ ageMin: 40, ageMax: 45, registeredAt: "2026-10-05T00:00:00-04:00" }),
    );
    if (!r.ok) throw new Error("esperaba resultado");
    expect(r.factors.find((f) => f.key === "edad")?.points).toBe(DEFAULT_CONFIG.points.ageInRange);
  });

  it("es determinista", () => {
    expect(scoreMatch(missing(), record())).toEqual(scoreMatch(missing(), record()));
  });
});

describe("ranking", () => {
  it("ordena por puntaje y omite lo que no pasa el umbral", () => {
    const strong = record({ id: "HN-1" });
    const weak = record({ id: "HN-2", marks: [], heightCm: null, location: [-71.0, 19.8] });
    const wrongSex = record({ id: "HN-3", sex: "F" });
    const ranked = rankRecordsForCase(missing(), [weak, wrongSex, strong]);
    expect(ranked.map((c) => c.item.id)).toEqual(["HN-1"]);
  });

  it("el cruce inverso solo mira casos abiertos", () => {
    const open = missing({ id: "DR-1" });
    const closed = missing({ id: "DR-2", status: "localizado_vivo" });
    const ranked = rankCasesForRecord(record(), [closed, open]);
    expect(ranked.map((c) => c.item.id)).toEqual(["DR-1"]);
  });
});

describe("haversineKm", () => {
  it("Santo Domingo a Santiago ronda 135 km en línea recta", () => {
    const km = haversineKm([-69.931, 18.486], [-70.697, 19.451]);
    expect(km).toBeGreaterThan(125);
    expect(km).toBeLessThan(145);
  });
});
