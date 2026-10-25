import type { Alert, Incident911, Institution, MissingCase, UnidentifiedRecord } from "@rb/domain";
import circle from "@turf/circle";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

/** Capas del mapa como GeoJSON serializable, construidas en el servidor. */
export interface MapLayers {
  cases: FeatureCollection<Point, { id: string; status: MissingCase["status"]; label: string }>;
  records: FeatureCollection<Point, { id: string; kind: UnidentifiedRecord["kind"] }>;
  incidents: FeatureCollection<Point, { id: string; type: string }>;
  institutions: FeatureCollection<Point, { id: string; kind: Institution["kind"]; name: string }>;
  alerts: FeatureCollection<Polygon, { id: string; kind: Alert["kind"]; title: string }>;
}

const point = <P>(coords: [number, number], properties: P): Feature<Point, P> => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: coords },
  properties,
});

export function buildMapLayers(input: {
  cases: MissingCase[];
  records: UnidentifiedRecord[];
  incidents: Incident911[];
  institutions: Institution[];
  alerts: Alert[];
}): MapLayers {
  return {
    cases: {
      type: "FeatureCollection",
      features: input.cases.map((c) =>
        point(c.lastSeenPlace, {
          id: c.id,
          status: c.status,
          label: `${c.fullName} · ${c.ageYears}`,
        }),
      ),
    },
    records: {
      type: "FeatureCollection",
      features: input.records.map((r) => point(r.location, { id: r.id, kind: r.kind })),
    },
    incidents: {
      type: "FeatureCollection",
      features: input.incidents.map((i) => point(i.location, { id: i.id, type: i.type })),
    },
    institutions: {
      type: "FeatureCollection",
      features: input.institutions.map((i) =>
        point(i.location, { id: i.id, kind: i.kind, name: i.name }),
      ),
    },
    alerts: {
      type: "FeatureCollection",
      features: input.alerts.map((a) =>
        circle(a.center, a.radiusKm, {
          units: "kilometers",
          steps: 48,
          properties: { id: a.id, kind: a.kind, title: a.title },
        }),
      ),
    },
  };
}
