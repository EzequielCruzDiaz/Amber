import { describe, expect, it } from "vitest";
import { describeMark, MarkCode } from "./marks";
import { shortName, toPublicView } from "./privacy";

describe("MarkCode", () => {
  it("acepta códigos del catálogo", () => {
    expect(MarkCode.safeParse("tatuaje:rosa:antebrazo_der").success).toBe(true);
  });
  it("rechaza tipo o zona desconocidos", () => {
    expect(MarkCode.safeParse("grafiti:rosa:antebrazo_der").success).toBe(false);
    expect(MarkCode.safeParse("tatuaje:rosa:rodilla").success).toBe(false);
  });
  it("describe en lenguaje natural", () => {
    expect(describeMark("tatuaje:rosa:antebrazo_der")).toBe("tatuaje de rosa, antebrazo derecho");
    expect(describeMark("cicatriz:x:cara")).toBe("cicatriz, cara");
  });
});

describe("vista pública", () => {
  it("acorta el nombre", () => {
    expect(shortName("Daniela Pérez Jiménez")).toBe("Daniela P.");
  });
  it("no publica casos de personas fallecidas", () => {
    const base = {
      id: "x",
      fullName: "A B",
      sex: "M" as const,
      ageYears: 30,
      heightCm: 170,
      marks: [],
      flags: [],
      lastSeenAt: "2026-10-01T00:00:00-04:00",
      lastSeenPlace: [-69.9, 18.5] as [number, number],
      municipality: "DN",
      province: "Distrito Nacional",
      circumstances: "",
      channel: "911" as const,
      resolvedAt: null,
      createdAt: "2026-10-01T00:00:00-04:00",
    };
    expect(toPublicView({ ...base, status: "localizado_fallecido" })).toBeNull();
    expect(toPublicView({ ...base, status: "en_busqueda" })).not.toHaveProperty("lastSeenPlace");
  });
});
