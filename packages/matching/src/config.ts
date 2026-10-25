/**
 * Pesos y umbrales del motor de cruce.
 *
 * Los puntos máximos suman 100 para que el puntaje se lea como porcentaje.
 * Cambiar estos valores cambia qué coincidencias ve un operador: cualquier
 * ajuste debe acompañarse de una prueba en test/ y de una nota en
 * docs/MOTOR-CRUCE.md.
 */
export interface MatchingConfig {
  points: {
    ageInRange: number;
    ageNear: number;
    heightClose: number;
    heightNear: number;
    markExact: number;
    markSameZone: number;
    marksMax: number;
    marksConflictPenalty: number;
    timeWithinWeek: number;
    timeWithinMonth: number;
    timeWithinQuarter: number;
    distanceNear: number;
    distanceRegional: number;
  };
  limits: {
    /** Años de tolerancia fuera del rango estimado antes de descartar. */
    ageToleranceYears: number;
    heightCloseCm: number;
    heightNearCm: number;
    /** Diferencia de estatura que descarta el registro. */
    heightRejectCm: number;
    /** Un registro anterior a la desaparición se acepta hasta estas horas antes (relojes y reportes imprecisos). */
    clockSkewHours: number;
    distanceNearKm: number;
    distanceRegionalKm: number;
  };
  thresholds: {
    /** Por debajo no se muestra al operador. */
    show: number;
    /** Desde aquí se marca como prioridad alta. */
    high: number;
  };
}

export const DEFAULT_CONFIG: MatchingConfig = {
  points: {
    ageInRange: 28,
    ageNear: 12,
    heightClose: 15,
    heightNear: 7,
    markExact: 26,
    markSameZone: 10,
    marksMax: 32,
    marksConflictPenalty: 10,
    timeWithinWeek: 15,
    timeWithinMonth: 8,
    timeWithinQuarter: 3,
    distanceNear: 10,
    distanceRegional: 5,
  },
  limits: {
    ageToleranceYears: 5,
    heightCloseCm: 4,
    heightNearCm: 9,
    heightRejectCm: 20,
    clockSkewHours: 6,
    distanceNearKm: 35,
    distanceRegionalKm: 110,
  },
  thresholds: {
    show: 55,
    high: 75,
  },
};
