"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_STYLE = "basic-v2";
const DEFAULT_ZOOM = 15;

type MarinaMapProps = {
  lat: number;
  lng: number;
  name: string;
  address: string;
};

function StaticFallback({
  address,
  message,
}: {
  address: string;
  message: string;
}) {
  return (
    <>
      <div className="relative aspect-[16/9] max-h-[420px] overflow-hidden rounded-sm border border-neutral-200">
        <Image
          src="/images/map-placeholder.svg"
          alt={`Map placeholder for ${address}`}
          fill
          sizes="(max-width: 768px) 100vw, 1024px"
          className="object-cover"
        />
      </div>
      <p className="mt-3 text-center text-sm font-light text-neutral-400">
        {message}
      </p>
    </>
  );
}

export default function MarinaMap({ lat, lng, name, address }: MarinaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    if (!key || !containerRef.current) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    let map: MapLibreMap | null = null;

    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: `https://api.maptiler.com/maps/${MAPTILER_STYLE}/style.json?key=${key}`,
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        cooperativeGestures: true,
      });

      map.addControl(
        new NavigationControl({ showCompass: false }),
        "top-right"
      );

      new Marker({ color: "#0a1a2f" }).setLngLat([lng, lat]).addTo(map);

      map.on("load", () => {
        if (!cancelled) setStatus("ready");
      });

      map.on("error", () => {
        if (!cancelled) setStatus("error");
      });
    } catch {
      setStatus("error");
    }

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  if (status === "error") {
    return (
      <StaticFallback
        address={address}
        message={`Map unavailable right now — showing ${name}'s location placeholder instead.`}
      />
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        role="img"
        aria-label={`Map centred on ${name}`}
        className="relative aspect-[16/9] max-h-[420px] overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100"
      />
      <p className="mt-3 text-center text-sm font-light text-neutral-400">
        Berth-by-berth map — coming soon
      </p>
    </>
  );
}
