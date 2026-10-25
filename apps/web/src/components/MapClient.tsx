"use client";

import dynamic from "next/dynamic";

/** MapLibre necesita el navegador (WebGL); se carga solo del lado del cliente. */
export const MapClient = dynamic(() => import("./OperationsMap").then((m) => m.OperationsMap), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[420px] animate-pulse rounded-lg border border-line bg-surface" />
  ),
});
