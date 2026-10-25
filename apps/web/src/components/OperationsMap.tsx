"use client";

import {
  type ExpressionSpecification,
  type GeoJSONSource,
  Map as MlMap,
  NavigationControl,
  type StyleSpecification,
  setWorkerUrl,
} from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MapLayers } from "@/lib/map-features";

// Worker servido desde /public (ver scripts/copy-maplibre-worker.mjs).
setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

/**
 * Integración directa con MapLibre (sin wrapper de React): un efecto crea el
 * mapa una vez y otro actualiza los datos con setData cuando cambian las capas.
 *
 * Sin estilo externo el mapa funciona offline: fondo + provincias locales.
 * Con NEXT_PUBLIC_MAP_STYLE_URL (p. ej. OpenFreeMap) se usan teselas reales.
 */
const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "fondo", type: "background", paint: { "background-color": "#d9e3ed" } }],
};

const STATUS_COLOR: ExpressionSpecification = [
  "match",
  ["get", "status"],
  "en_busqueda",
  "#c97f06",
  "en_verificacion",
  "#bd2f78",
  "localizado_vivo",
  "#2b8a57",
  "localizado_fallecido",
  "#6c6f87",
  "#999999",
];
const RECORD_COLOR: ExpressionSpecification = [
  "match",
  ["get", "kind"],
  "hospital",
  "#1f7fb8",
  "detencion",
  "#8a5a12",
  "forense",
  "#4d4f63",
  "#999999",
];
const ALERT_COLOR: ExpressionSpecification = [
  "match",
  ["get", "kind"],
  "menor",
  "#e0532a",
  "#7b44c2",
];

type LayerKey = keyof MapLayers;

const LABELS: Record<LayerKey, string> = {
  cases: "Personas reportadas",
  records: "Registros sin identificar",
  incidents: "Incidentes 911",
  alerts: "Alertas activas",
  institutions: "Instituciones",
};

/** Qué capas de MapLibre pertenecen a cada interruptor de la leyenda. */
const MAP_LAYER_IDS: Record<LayerKey, string[]> = {
  cases: ["casos"],
  records: ["registros"],
  incidents: ["incidentes"],
  alerts: ["alertas-fill", "alertas-line"],
  institutions: ["instituciones"],
};

export function OperationsMap({
  layers,
  styleUrl,
}: {
  layers: MapLayers;
  styleUrl?: string | undefined;
}) {
  const router = useRouter();
  const container = useRef<HTMLElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    cases: true,
    records: layers.records.features.length > 0,
    incidents: layers.incidents.features.length > 0,
    alerts: true,
    institutions: false,
  });

  // Crear el mapa una sola vez.
  // biome-ignore lint/correctness/useExhaustiveDependencies: el mapa se crea una vez; los datos se actualizan en otro efecto
  useEffect(() => {
    if (!container.current) return;
    const map = new MlMap({
      container: container.current,
      style: styleUrl ?? OFFLINE_STYLE,
      center: [-70.2, 18.85],
      zoom: 7,
      attributionControl: {
        compact: true,
        customAttribution: "Límites: geoBoundaries (CC BY 4.0) · Datos ficticios",
      },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("error", (e) => console.error("[mapa]", e.error?.message ?? e));
    map.on("load", () => {
      map.addSource("provincias", { type: "geojson", data: "/geo/provincias.geojson" });
      map.addLayer({
        id: "prov-fill",
        type: "fill",
        source: "provincias",
        paint: { "fill-color": "#f8fafc", "fill-opacity": styleUrl ? 0.15 : 1 },
      });
      map.addLayer({
        id: "prov-line",
        type: "line",
        source: "provincias",
        paint: { "line-color": "#b9c6d4", "line-width": 0.8 },
      });

      for (const key of ["alerts", "incidents", "institutions", "records", "cases"] as const) {
        map.addSource(key, { type: "geojson", data: layers[key] });
      }
      map.addLayer({
        id: "alertas-fill",
        type: "fill",
        source: "alerts",
        paint: { "fill-color": ALERT_COLOR, "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "alertas-line",
        type: "line",
        source: "alerts",
        paint: { "line-color": ALERT_COLOR, "line-dasharray": [2, 2] },
      });
      map.addLayer({
        id: "incidentes",
        type: "circle",
        source: "incidents",
        paint: { "circle-radius": 2.5, "circle-color": "#7d8fa3", "circle-opacity": 0.7 },
      });
      map.addLayer({
        id: "instituciones",
        type: "circle",
        source: "institutions",
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#1d5ca6",
        },
      });
      map.addLayer({
        id: "registros",
        type: "circle",
        source: "records",
        paint: {
          "circle-radius": 6,
          "circle-color": RECORD_COLOR,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "casos",
        type: "circle",
        source: "cases",
        paint: {
          "circle-radius": [
            "case",
            ["in", ["get", "status"], ["literal", ["en_busqueda", "en_verificacion"]]],
            6.5,
            4.5,
          ],
          "circle-color": STATUS_COLOR,
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "casos", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === "string") router.push(`/casos/${id}`);
      });
      map.on("mousemove", "casos", (e) => {
        map.getCanvas().style.cursor = "pointer";
        setHover((e.features?.[0]?.properties?.label as string | undefined) ?? null);
      });
      map.on("mouseleave", "casos", () => {
        map.getCanvas().style.cursor = "";
        setHover(null);
      });
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar datos cuando el servidor manda capas nuevas (p. ej. tras confirmar un caso).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const key of Object.keys(LABELS) as LayerKey[]) {
      (map.getSource(key) as GeoJSONSource | undefined)?.setData(layers[key]);
    }
  }, [layers, ready]);

  // Interruptores de la leyenda.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const key of Object.keys(MAP_LAYER_IDS) as LayerKey[]) {
      for (const id of MAP_LAYER_IDS[key])
        map.setLayoutProperty(id, "visibility", visible[key] ? "visible" : "none");
    }
  }, [visible, ready]);

  return (
    <div className="relative h-[68vh] min-h-[420px] overflow-hidden rounded-lg border border-line lg:h-full">
      <section
        ref={container}
        className="h-full w-full"
        aria-label="Mapa operativo de República Dominicana"
      />

      <fieldset className="absolute top-3 left-3 rounded-md border border-line bg-surface/95 p-3 text-sm shadow-sm">
        <legend className="sr-only">Capas</legend>
        {(Object.keys(LABELS) as LayerKey[]).map((k) => (
          <label key={k} className="flex cursor-pointer items-center gap-2 py-0.5">
            <input
              id={`capa-${k}`}
              type="checkbox"
              checked={visible[k]}
              onChange={(e) => setVisible((v) => ({ ...v, [k]: e.target.checked }))}
            />
            {LABELS[k]}
            <span className="ml-auto pl-3 font-mono text-xs text-muted">
              {layers[k].features.length}
            </span>
          </label>
        ))}
      </fieldset>

      {hover && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-ink px-2 py-1 text-xs text-surface">
          {hover}
        </div>
      )}
    </div>
  );
}
