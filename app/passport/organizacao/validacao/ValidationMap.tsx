"use client";

import { useEffect, useMemo, useState } from "react";
import { latLngBounds } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

export type ValidationMapPoint = [number, number];

export type ValidationMapCheckpoint = {
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  hit: boolean;
  nearest_distance_m: number;
};

type ValidationMapProps = {
  officialPoints: ValidationMapPoint[];
  activityPoints: ValidationMapPoint[];
  checkpoints: ValidationMapCheckpoint[];
  toleranceM: number;
};

type RouteSegment = {
  matched: boolean;
  points: ValidationMapPoint[];
};

const EARTH_RADIUS_M = 6_371_000;

function distanceM(a: ValidationMapPoint, b: ValidationMapPoint) {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(value)));
}

function activityMatchesOfficial(
  point: ValidationMapPoint,
  officialPoints: ValidationMapPoint[],
  toleranceM: number,
) {
  for (const officialPoint of officialPoints) {
    if (distanceM(point, officialPoint) <= toleranceM) return true;
  }
  return false;
}

function splitActivitySegments(
  activityPoints: ValidationMapPoint[],
  officialPoints: ValidationMapPoint[],
  toleranceM: number,
): RouteSegment[] {
  if (activityPoints.length < 2 || officialPoints.length < 2) return [];

  const matches = activityPoints.map((point) =>
    activityMatchesOfficial(point, officialPoints, toleranceM),
  );
  const segments: RouteSegment[] = [];
  let matched = matches[0];
  let points: ValidationMapPoint[] = [activityPoints[0]];

  for (let index = 1; index < activityPoints.length; index += 1) {
    const currentMatched = matches[index];
    if (currentMatched !== matched) {
      points.push(activityPoints[index]);
      if (points.length >= 2) segments.push({ matched, points });
      points = [activityPoints[index - 1], activityPoints[index]];
      matched = currentMatched;
    } else {
      points.push(activityPoints[index]);
    }
  }

  if (points.length >= 2) segments.push({ matched, points });
  return segments;
}

function FitBounds({ points }: { points: ValidationMapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    const bounds = latLngBounds(points);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [map, points]);

  return null;
}

function LayerButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: active ? "1px solid #2f6645" : "1px solid #b8ad9c",
        background: active ? "#e6f2e9" : "#f5efe5",
        color: active ? "#204d34" : "#6b655d",
        padding: "9px 12px",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {active ? "✓ " : ""}{label}
    </button>
  );
}

export default function ValidationMap({
  officialPoints,
  activityPoints,
  checkpoints,
  toleranceM,
}: ValidationMapProps) {
  const [showOfficial, setShowOfficial] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showCheckpoints, setShowCheckpoints] = useState(true);

  const segments = useMemo(
    () => splitActivitySegments(activityPoints, officialPoints, toleranceM),
    [activityPoints, officialPoints, toleranceM],
  );

  const allPoints = useMemo(
    () => [...officialPoints, ...activityPoints],
    [activityPoints, officialPoints],
  );

  const matchedSegments = segments.filter((segment) => segment.matched);
  const deviationSegments = segments.filter((segment) => !segment.matched);
  const center = officialPoints[0] ?? activityPoints[0] ?? [-29.5, -50.8];

  if (officialPoints.length < 2 || activityPoints.length < 2) {
    return (
      <section style={{ marginTop: 24, border: "1px solid #c8bcaa", padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Mapa da validação</h3>
        <p style={{ marginBottom: 0, color: "#6c685f" }}>
          Os pontos necessários para desenhar o mapa não foram recebidos.
        </p>
      </section>
    );
  }

  return (
    <section className="validation-map-card">
      <style>{`
        .validation-map-card{margin-top:24px;border:1px solid #c8bcaa;background:#fffaf2;padding:18px}
        .validation-map-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}
        .validation-map-head h3{font-size:22px;margin:0 0 5px}.validation-map-head p{margin:0;color:#6c685f;font-size:14px;line-height:1.45}
        .validation-map-controls{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
        .validation-map-canvas{height:480px;width:100%;border:1px solid #b8ad9c;overflow:hidden;background:#ded8ce}
        .validation-map-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;color:#4f4a43;font-size:13px}
        .validation-map-legend span{display:inline-flex;align-items:center;gap:7px}.legend-line{display:inline-block;width:25px;height:4px}.legend-dot{display:inline-block;width:11px;height:11px;border-radius:50%}
        .leaflet-container{font-family:Arial,sans-serif}.leaflet-popup-content{margin:12px 15px;line-height:1.45}
        @media(max-width:720px){.validation-map-card{padding:12px}.validation-map-head{display:block}.validation-map-controls{justify-content:flex-start;margin-top:12px}.validation-map-canvas{height:400px}}
      `}</style>

      <div className="validation-map-head">
        <div>
          <h3>Mapa da validação</h3>
          <p>Compare a rota oficial com os pontos GPS registrados pelo atleta.</p>
        </div>
        <div className="validation-map-controls" aria-label="Camadas do mapa">
          <LayerButton active={showOfficial} label="Rota oficial" onClick={() => setShowOfficial((value) => !value)} />
          <LayerButton active={showActivity} label="Atividade" onClick={() => setShowActivity((value) => !value)} />
          <LayerButton active={showCheckpoints} label="Checkpoints" onClick={() => setShowCheckpoints((value) => !value)} />
        </div>
      </div>

      <MapContainer
        className="validation-map-canvas"
        center={center}
        zoom={12}
        scrollWheelZoom
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />

        {showOfficial && (
          <Polyline
            positions={officialPoints}
            pathOptions={{ color: "#e86619", weight: 6, opacity: 0.85 }}
          />
        )}

        {showActivity && matchedSegments.map((segment, index) => (
          <Polyline
            key={`matched-${index}`}
            positions={segment.points}
            pathOptions={{ color: "#16844f", weight: 5, opacity: 0.95 }}
          />
        ))}

        {showActivity && deviationSegments.map((segment, index) => (
          <Polyline
            key={`deviation-${index}`}
            positions={segment.points}
            pathOptions={{ color: "#cf3434", weight: 6, opacity: 0.95 }}
          />
        ))}

        {showCheckpoints && checkpoints.map((checkpoint, index) => {
          const isStart = index === 0;
          const isFinish = index === checkpoints.length - 1;
          const color = isFinish ? "#171817" : isStart ? "#176b42" : checkpoint.hit ? "#16844f" : "#cf3434";
          return (
            <CircleMarker
              key={`${checkpoint.sequence}-${checkpoint.label}`}
              center={[checkpoint.latitude, checkpoint.longitude]}
              radius={isStart || isFinish ? 8 : 6}
              pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }}
            >
              <Popup>
                <strong>{checkpoint.label}</strong><br />
                {checkpoint.hit ? "Confirmado" : "Não confirmado"}<br />
                Distância mínima: {checkpoint.nearest_distance_m} m
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="validation-map-legend" aria-label="Legenda do mapa">
        <span><i className="legend-line" style={{ background: "#e86619" }} />Rota oficial</span>
        <span><i className="legend-line" style={{ background: "#16844f" }} />Trecho compatível</span>
        <span><i className="legend-line" style={{ background: "#cf3434" }} />Trecho fora da tolerância</span>
        <span><i className="legend-dot" style={{ background: "#16844f" }} />Checkpoint confirmado</span>
        <span><i className="legend-dot" style={{ background: "#cf3434" }} />Checkpoint não confirmado</span>
      </div>
    </section>
  );
}
