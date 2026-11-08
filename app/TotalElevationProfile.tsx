"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getPackedTechnicalProfiles } from "./HomeRegistrationInfo";
import styles from "./TotalElevationProfile.module.css";
import type { Locale } from "./i18n/config";

type PackedProfile = { p: Array<[number, number, number]> };
type TotalProfile = { points: string; gain: number[]; altitude: number[]; minAltitude: number; maxAltitude: number };

const routeParts = [
  { id: 56232690, distance: 111.908 },
  { id: 56232708, distance: 89.9166 },
  { id: 56232721, distance: 99.3242 },
  { id: 56232745, distance: 69.9754 },
];

const routeDistance = 370.7;
const routeAscent = 7226;
const stageDistanceTotal = routeParts.reduce((total, stage) => total + stage.distance, 0);

async function unpack(encoded: string): Promise<PackedProfile> {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as PackedProfile;
}

function buildTotalProfile(parts: PackedProfile[]): TotalProfile | null {
  if (parts.some((part) => part.p.length < 2)) return null;

  const combined: Array<{ distance: number; elevation: number }> = [];
  let distanceOffset = 0;
  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    const { distance } = routeParts[partIndex];
    for (const [distanceProgress, rawElevation] of parts[partIndex].p) {
      combined.push({ distance: distanceOffset + (distanceProgress / 10000) * distance, elevation: rawElevation / 10 });
    }
    distanceOffset += distance;
  }

  const heights = combined.map((point) => point.elevation);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  const heightRange = Math.max(maxHeight - minHeight, 1);
  const points = combined.map((point) => {
    const x = Math.min(100, (point.distance / stageDistanceTotal) * 100);
    const y = 7 + ((maxHeight - point.elevation) / heightRange) * 57;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  let rawGain = 0;
  const rawGainAt = [0];
  for (let index = 1; index < combined.length; index += 1) {
    rawGain += Math.max(0, combined[index].elevation - combined[index - 1].elevation);
    rawGainAt.push(rawGain);
  }
  const scale = rawGain ? routeAscent / rawGain : 0;
  const gain = Array.from({ length: 101 }, (_, index) => {
    const targetDistance = (index / 100) * stageDistanceTotal;
    let pointIndex = combined.findIndex((point) => point.distance >= targetDistance);
    if (pointIndex < 0) pointIndex = combined.length - 1;
    const previousIndex = Math.max(0, pointIndex - 1);
    const previous = combined[previousIndex];
    const next = combined[pointIndex];
    const distanceRange = Math.max(next.distance - previous.distance, 0.001);
    const interpolation = Math.max(0, Math.min(1, (targetDistance - previous.distance) / distanceRange));
    return Math.round((rawGainAt[previousIndex] + (rawGainAt[pointIndex] - rawGainAt[previousIndex]) * interpolation) * scale);
  });

  const altitude = Array.from({ length: 101 }, (_, index) => {
    const targetDistance = (index / 100) * stageDistanceTotal;
    let pointIndex = combined.findIndex((point) => point.distance >= targetDistance);
    if (pointIndex < 0) pointIndex = combined.length - 1;
    const previousIndex = Math.max(0, pointIndex - 1);
    const previous = combined[previousIndex];
    const next = combined[pointIndex];
    const distanceRange = Math.max(next.distance - previous.distance, 0.001);
    const interpolation = Math.max(0, Math.min(1, (targetDistance - previous.distance) / distanceRange));
    return previous.elevation + (next.elevation - previous.elevation) * interpolation;
  });

  return { points, gain, altitude, minAltitude: minHeight, maxAltitude: maxHeight };
}

function number(value: number, locale: Locale, digits = 0) {
  return value.toLocaleString(locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

const profileCopy: Record<Locale, { aria: string; heading: string; source: string; chart: string; distance: string; elevation: string; distanceDone: string; gain: string }> = {
  pt: { aria: "Perfil altimétrico do percurso completo", heading: "Perfil altimétrico técnico · Legends Ultimate", source: "Dados oficiais · Ride with GPS", chart: "Perfil altimétrico técnico animado do percurso total", distance: "Distância", elevation: "Elevação acumulada", distanceDone: "Distância percorrida", gain: "Ganho acumulado" },
  es: { aria: "Perfil altimétrico del recorrido completo", heading: "Perfil altimétrico técnico · Legends Ultimate", source: "Datos oficiales · Ride with GPS", chart: "Perfil altimétrico técnico animado del recorrido total", distance: "Distancia", elevation: "Desnivel acumulado", distanceDone: "Distancia recorrida", gain: "Desnivel acumulado" },
  en: { aria: "Elevation profile of the full route", heading: "Technical elevation profile · Legends Ultimate", source: "Official data · Ride with GPS", chart: "Animated technical elevation profile of the full route", distance: "Distance", elevation: "Elevation gain", distanceDone: "Distance covered", gain: "Elevation gain" },
};

export default function TotalElevationProfile({ locale = "pt" }: { locale?: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [profile, setProfile] = useState<TotalProfile | null>(null);
  const [progress, setProgress] = useState(0);
  const gradientId = useId();

  useEffect(() => {
    const packed = getPackedTechnicalProfiles();
    void Promise.all(routeParts.map(({ id }) => unpack(packed[id]))).then(buildTotalProfile).then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    let frame = 0;
    let startedAt = 0;
    const start = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setProgress(1); return; }
      const animate = (now: number) => {
        if (!startedAt) startedAt = now;
        const elapsed = Math.min((now - startedAt) / 11000, 1);
        setProgress(1 - Math.pow(1 - elapsed, 3));
        if (elapsed < 1) frame = window.requestAnimationFrame(animate);
      };
      frame = window.requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { observer.disconnect(); start(); }
    }, { threshold: 0.22 });
    observer.observe(element);
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); };
  }, []);

  const marker = progress * 100;
  const lower = Math.floor(marker);
  const upper = Math.min(100, lower + 1);
  const fractional = marker - lower;
  const elevation = profile ? profile.gain[lower] + (profile.gain[upper] - profile.gain[lower]) * fractional : routeAscent * progress;
  const currentDistance = routeDistance * progress;
  const currentAltitude = profile ? profile.altitude[lower] + (profile.altitude[upper] - profile.altitude[lower]) * fractional : 0;
  const yTicks = profile ? [profile.maxAltitude, profile.maxAltitude - (profile.maxAltitude - profile.minAltitude) / 2, profile.minAltitude] : [];
  const copy = profileCopy[locale];

  return <section className={styles.section} ref={sectionRef} aria-label={copy.aria}>
    <div className={styles.frame}>
      <div className={styles.heading}>
        <p>{copy.heading}</p>
        <span className={styles.source}>{copy.source}</span>
      </div>
      <div className={styles.chart}>
        <div className={styles.yAxis} aria-hidden="true">{yTicks.map((tick) => <span key={tick}>{number(tick, locale)} m</span>)}</div>
        <svg viewBox="0 0 100 68" preserveAspectRatio="none" role="img" aria-label={copy.chart}>
          <defs><clipPath id={`${gradientId}-clip`}><rect width={marker} height="68" /></clipPath></defs>
          <line x1="0" x2="100" y1="7" y2="7" className={styles.grid} /><line x1="0" x2="100" y1="35.5" y2="35.5" className={styles.grid} /><line x1="0" x2="100" y1="64" y2="64" className={styles.grid} />
          {profile ? <><polyline points={profile.points} className={styles.trackBase} /><polyline points={profile.points} className={styles.line} clipPath={`url(#${gradientId}-clip)`} /></> : <rect className={styles.loading} x="0" y="25" width="100" height="20" />}
          <line x1={marker} x2={marker} y1="5" y2="64" className={styles.marker} />
          {profile ? <circle cx={marker} cy={7 + ((profile.maxAltitude - currentAltitude) / Math.max(profile.maxAltitude - profile.minAltitude, 1)) * 57} r="1.15" className={styles.markerDot} /> : null}
        </svg>
        <div className={styles.xAxis} aria-hidden="true"><span>0 km</span><span>100</span><span>200</span><span>300</span><span>{number(routeDistance, locale, 1)} km</span></div>
        <div className={styles.metrics} aria-live="polite"><div><span>{copy.distanceDone}</span><strong>{number(currentDistance, locale, 1)} <i>/ {number(routeDistance, locale, 1)} km</i></strong></div><div><span>{copy.gain}</span><strong>{number(elevation, locale)} <i>/ {number(routeAscent, locale)} m+</i></strong></div></div>
      </div>
    </div>
  </section>;
}
