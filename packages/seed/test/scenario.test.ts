import { MissingCase, UnidentifiedRecord } from "@rb/domain";
import { rankRecordsForCase } from "@rb/matching";
import { describe, expect, it } from "vitest";
import { generateScenario } from "../src";

describe("generateScenario", () => {
  const s = generateScenario();

  it("es determinista para la misma semilla", () => {
    expect(generateScenario()).toEqual(s);
    expect(generateScenario({ seed: 7 }).cases[10]).not.toEqual(s.cases[10]);
  });

  it("produce entidades válidas según el dominio", () => {
    for (const c of s.cases) expect(MissingCase.safeParse(c).success, c.id).toBe(true);
    for (const r of s.records) expect(UnidentifiedRecord.safeParse(r).success, r.id).toBe(true);
  });

  it("cada caso ancla encuentra su registro como mejor candidato", () => {
    const anchors: Array<[string, string]> = [
      ["DR-1000", "HN-500"],
      ["DR-1001", "DT-501"],
      ["DR-1002", "IN-502"],
      ["DR-1003", "HN-503"],
    ];
    for (const [caseId, recordId] of anchors) {
      const c = s.cases.find((x) => x.id === caseId);
      if (!c) throw new Error(caseId);
      expect(rankRecordsForCase(c, s.records)[0]?.item.id, caseId).toBe(recordId);
    }
  });

  it("la mayoría de los casos cerrados aparecen con vida", () => {
    const closed = s.cases.filter(
      (c) => c.status === "localizado_vivo" || c.status === "localizado_fallecido",
    );
    const alive = closed.filter((c) => c.status === "localizado_vivo").length;
    expect(alive / closed.length).toBeGreaterThan(0.7);
  });
});
