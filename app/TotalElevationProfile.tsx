"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getPackedTechnicalProfiles } from "./HomeRegistrationInfo";
import styles from "./TotalElevationProfile.module.css";

type PackedProfile = { p: Array<[number, number, number]> };
type TotalProfile = { points: string; gain: number[] };

const routeParts = [
  { id: 56232690, distance: 111.908 },
  { id: 56232708, distance: 89.9166 },
  { id: 56232721, distance: 99.3242 },
  { id: 56232745, distance: 69.9754 },
];

const routeDistance = 370.7;
const routeAscent = 7226;

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
    for (const [percent, rawElevation] of parts[partIndex].p) {
      combined.push({ distance: distanceOffset + (percent / 100) * distance, elevation: rawElevation / 10 });
    }
    distanceOffset += distance;
  }

  const heights = combined.map((point) => point.elevation);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  const heightRange = Math.max(maxHeight - minHeight, 1);
  const points = combined.map((point) => {
    const x = Math.min(100, (point.distance / routeDistance) * 100);
    const y = 8 + ((maxHeight - point.elevation) / heightRange) * 50;
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
    const targetDistance = (index / 100) * routeDistance;
    let pointIndex = combined.findIndex((point) => point.distance >= targetDistance);
    if (pointIndex < 0) pointIndex = combined.length - 1;
    const previousIndex = Math.max(0, pointIndex - 1);
    const previous = combined[previousIndex];
    const next = combined[pointIndex];
    const distanceRange = Math.max(next.distance - previous.distance, 0.001);
    const interpolation = Math.max(0, Math.min(1, (targetDistance - previous.distance) / distanceRange));
    return Math.round((rawGainAt[previousIndex] + (rawGainAt[pointIndex] - rawGainAt[previousIndex]) * interpolation) * scale);
  });

  return { points, gain };
}

function number(value: number, digits = 0) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function TotalElevationProfile() {
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
        const elapsed = Math.min((now - startedAt) / 6800, 1);
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

  return <section className={styles.section} ref={sectionRef} aria-label="Perfil altimétrico do percurso completo">
    <div className={styles.frame}>
      <div className={styles.heading}>
        <div><p>Legends Ultimate · percurso completo</p><h2>Todo o percurso.<br /><em>Uma só história.</em></h2></div>
        <span className={styles.source}>Dados técnicos · Ride with GPS</span>
      </div>
      <div className={styles.chart}>
        <span className={styles.ghost}>370,7</span>
        <svg viewBox="0 0 100 68" preserveAspectRatio="none" role="img" aria-label="Perfil altimétrico animado do percurso total">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#d48b50" stopOpacity=".62" /><stop offset="1" stopColor="#d48b50" stopOpacity=".02" /></linearGradient>
            <clipPath id={`${gradientId}-clip`}><rect width={marker} height="68" /></clipPath>
          </defs>
          {profile ? <><polygon points={`${profile.points} 100,64 0,64`} fill={`url(#${gradientId})`} clipPath={`url(#${gradientId}-clip)`} /><polyline points={profile.points} className={styles.line} clipPath={`url(#${gradientId}-clip)`} /></> : <rect className={styles.loading} x="0" y="25" width="100" height="20" />}
          <line x1={marker} x2={marker} y1="2" y2="64" className={styles.marker} />
        </svg>
        <div className={styles.metrics} aria-live="polite"><div><span>Distância</span><strong>{number(routeDistance * progress, 1)} km</strong></div><div><span>Elevação acumulada</span><strong>{number(elevation)} m+</strong></div></div>
      </div>
    </div>
  </section>;
}
