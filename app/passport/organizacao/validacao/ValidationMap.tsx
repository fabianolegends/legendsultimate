"use client";

import { useEffect, useMemo, useState } from "react";
import { divIcon, latLngBounds } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
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
  distancesM: number[];
  startPointIndex: number;
  endPointIndex: number;
  maxDeviationM: number;
  averageDeviationM: number;
  lengthM: number;
};

type DirectionArrow = {
  point: ValidationMapPoint;
  bearing: number;
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

function nearestDistanceToRouteM(
  point: ValidationMapPoint,
  officialPoints: ValidationMapPoint[],
) {
  let nearest = Number.POSITIVE_INFINITY;
  for (const officialPoint of officialPoints) {
    const distance = distanceM(point, officialPoint);
    if (distance < nearest) nearest = distance;
    if (nearest < 4) break;
  }
  return nearest;
}

function polylineLengthM(points: ValidationMapPoint[]) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distanceM(points[index - 1], points[index]);
  }
  return length;
}

function buildSegment(
  matched: boolean,
  points: ValidationMapPoint[],
  distancesM: number[],
  startPointIndex: number,
  endPointIndex: number,
): RouteSegment {
  const maxDeviationM = distancesM.reduce((maximum, value) => Math.max(maximum, value), 0);
  const averageDeviationM = distancesM.length
    ? distancesM.reduce((total, value) => total + value, 0) / distancesM.length
    : 0;

  return {
    matched,
    points,
    distancesM,
    startPointIndex,
    endPointIndex,
    maxDeviationM,
    averageDeviationM,
    lengthM: polylineLengthM(points),
  };
}

function splitActivitySegments(
  activityPoints: ValidationMapPoint[],
  officialPoints: ValidationMapPoint[],
  toleranceM: number,
): RouteSegment[] {
  if (activityPoints.length < 2 || officialPoints.length < 2) return [];

  const pointDistances = activityPoints.map((point) =>
    nearestDistanceToRouteM(point, officialPoints),
  );
  const matches = pointDistances.map((distance) => distance <= toleranceM);
  const segments: RouteSegment[] = [];
  let matched = matches[0];
  let points: ValidationMapPoint[] = [activityPoints[0]];
  let distancesM: number[] = [pointDistances[0]];
  let startPointIndex = 0;

  for (let index = 1; index < activityPoints.length; index += 1) {
    const currentMatched = matches[index];
    if (currentMatched !== matched) {
      points.push(activityPoints[index]);
      distancesM.push(pointDistances[index]);
      if (points.length >= 2) {
        segments.push(buildSegment(matched, points, distancesM, startPointIndex, index));
      }

      points = [activityPoints[index - 1], activityPoints[index]];
      distancesM = [pointDistances[index - 1], pointDistances[index]];
      startPointIndex = index - 1;
      matched = currentMatched;
    } else {
      points.push(activityPoints[index]);
      distancesM.push(pointDistances[index]);
    }
  }

  if (points.length >= 2) {
    segments.push(
      buildSegment(
        matched,
        points,
        distancesM,
        startPointIndex,
        activityPoints.length - 1,
      ),
    );
  }

  return segments;
}

function formatDistance(distance: number) {
  if (distance >= 1000) return `${(distance / 1000).toFixed(2)} km`;
  return `${Math.round(distance)} m`;
}

function bearingDegrees(a: ValidationMapPoint, b: ValidationMapPoint) {
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function buildDirectionArrows(
  points: ValidationMapPoint[],
  requestedCount = 10,
): DirectionArrow[] {
  if (points.length < 2) return [];

  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distanceM(points[index - 1], points[index]));
  }

  const total = cumulative[cumulative.length - 1];
  if (total <= 0) return [];
  const count = Math.max(3, Math.min(requestedCount, Math.floor(total / 2500) + 2));
  const arrows: DirectionArrow[] = [];

  for (let arrowIndex = 1; arrowIndex <= count; arrowIndex += 1) {
    const target = (arrowIndex / (count + 1)) * total;
    let segmentIndex = 1;
    while (segmentIndex < cumulative.length && cumulative[segmentIndex] < target) {
      segmentIndex += 1;
    }
    if (segmentIndex >= points.length) segmentIndex = points.length - 1;

    const previousDistance = cumulative[segmentIndex - 1];
    const segmentDistance = Math.max(1, cumulative[segmentIndex] - previousDistance);
    const fraction = Math.min(1, Math.max(0, (target - previousDistance) / segmentDistance));
    const start = points[segmentIndex - 1];
    const finish = points[segmentIndex];
    const point: ValidationMapPoint = [
      start[0] + (finish[0] - start[0]) * fraction,
      start[1] + (finish[1] - start[1]) * fraction,
    ];
    arrows.push({ point, bearing: bearingDegrees(start, finish) });
  }

  return arrows;
}

function offsetPoint(
  point: ValidationMapPoint,
  northM: number,
  eastM: number,
): ValidationMapPoint {
  const latitudeOffset = northM / 111_320;
  const longitudeScale = 111_320 * Math.max(0.2, Math.cos((point[0] * Math.PI) / 180));
  return [point[0] + latitudeOffset, point[1] + eastM / longitudeScale];
}

function markerIcon(label: string, color: string, size = 24) {
  return divIcon({
    className: "validation-marker-shell",
    html: `<span style="width:${size}px;height:${size}px;background:${color}">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 3)],
  });
}

function directionIcon(bearing: number) {
  return divIcon({
    className: "route-direction-shell",
    html: `<span style="transform:rotate(${bearing}deg)">↑</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
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
  const directionArrows = useMemo(
    () => buildDirectionArrows(officialPoints),
    [officialPoints],
  );

  const endpointDisplay = useMemo(() => {
    if (checkpoints.length < 2) return null;
    const start: ValidationMapPoint = [checkpoints[0].latitude, checkpoints[0].longitude];
    const finishCheckpoint = checkpoints[checkpoints.length - 1];
    const finish: ValidationMapPoint = [finishCheckpoint.latitude, finishCheckpoint.longitude];
    const separated = distanceM(start, finish) < 120;
    return {
      separated,
      start,
      finish,
      startDisplay: separated ? offsetPoint(start, 38, -38) : start,
      finishDisplay: separated ? offsetPoint(finish, -38, 38) : finish,
    };
  }, [checkpoints]);

  const allPoints = useMemo(() => {
    const endpointPoints = endpointDisplay
      ? [endpointDisplay.startDisplay, endpointDisplay.finishDisplay]
      : [];
    return [...officialPoints, ...activityPoints, ...endpointPoints];
  }, [activityPoints, endpointDisplay, officialPoints]);

  const matchedSegments = segments.filter((segment) => segment.matched);
  const deviationSegments = segments.filter((segment) => !segment.matched);
  const largestDeviationM = deviationSegments.reduce(
    (maximum, segment) => Math.max(maximum, segment.maxDeviationM),
    0,
  );
  const outsideRouteM = deviationSegments.reduce(
    (total, segment) => total + segment.lengthM,
    0,
  );
  const center: ValidationMapPoint = officialPoints[0] ?? activityPoints[0] ?? [-29.5, -50.8];

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
        .validation-map-diagnostics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 14px}
        .validation-map-diagnostic{border:1px solid #d5cbbc;background:#f6efe4;padding:11px 13px}.validation-map-diagnostic small{display:block;color:#766f65;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.validation-map-diagnostic strong{display:block;margin-top:4px;font-size:17px;color:#292621}
        .validation-map-canvas{height:480px;width:100%;border:1px solid #b8ad9c;overflow:hidden;background:#ded8ce}
        .validation-map-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;color:#4f4a43;font-size:13px}
        .validation-map-legend span{display:inline-flex;align-items:center;gap:7px}.legend-line{display:inline-block;width:25px;height:4px}.legend-dot{display:inline-block;width:11px;height:11px;border-radius:50%}.legend-arrow{font-weight:900;color:#9a4a12;font-size:17px;line-height:1}
        .leaflet-container{font-family:Arial,sans-serif}.leaflet-popup-content{margin:12px 15px;line-height:1.45}
        .validation-marker-shell{background:transparent!important;border:0!important}.validation-marker-shell span{display:flex;align-items:center;justify-content:center;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 7px rgba(0,0,0,.38);color:#fff;font-size:10px;font-weight:900;line-height:1;box-sizing:border-box}
        .route-direction-shell{background:transparent!important;border:0!important;pointer-events:none}.route-direction-shell span{display:flex;width:24px;height:24px;align-items:center;justify-content:center;color:#8f3f0b;font-size:22px;font-weight:900;line-height:1;text-shadow:0 1px 2px #fff,0 0 3px #fff}
        @media(max-width:720px){.validation-map-card{padding:12px}.validation-map-head{display:block}.validation-map-controls{justify-content:flex-start;margin-top:12px}.validation-map-diagnostics{grid-template-columns:1fr}.validation-map-canvas{height:400px}}
      `}</style>

      <div className="validation-map-head">
        <div>
          <h3>Mapa da validação</h3>
          <p>Compare os traçados. As setas mostram o sentido oficial; clique nos trechos para analisar os desvios.</p>
        </div>
        <div className="validation-map-controls" aria-label="Camadas do mapa">
          <LayerButton active={showOfficial} label="Rota oficial" onClick={() => setShowOfficial((value) => !value)} />
          <LayerButton active={showActivity} label="Atividade" onClick={() => setShowActivity((value) => !value)} />
          <LayerButton active={showCheckpoints} label="Checkpoints" onClick={() => setShowCheckpoints((value) => !value)} />
        </div>
      </div>

      <div className="validation-map-diagnostics">
        <div className="validation-map-diagnostic">
          <small>Tolerância aplicada</small>
          <strong>{toleranceM} m</strong>
        </div>
        <div className="validation-map-diagnostic">
          <small>Maior afastamento</small>
          <strong>{deviationSegments.length ? formatDistance(largestDeviationM) : "Sem desvios"}</strong>
        </div>
        <div className="validation-map-diagnostic">
          <small>Trajeto fora da tolerância</small>
          <strong>{formatDistance(outsideRouteM)}</strong>
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
          <>
            <Polyline
              positions={officialPoints}
              pathOptions={{ color: "#e86619", weight: 6, opacity: 0.85 }}
            >
              <Popup>
                <strong>Rota oficial</strong><br />
                Traçado homologado pela organização. As setas indicam o sentido obrigatório.
              </Popup>
            </Polyline>
            {directionArrows.map((arrow, index) => (
              <Marker
                key={`direction-${index}`}
                position={arrow.point}
                icon={directionIcon(arrow.bearing)}
                interactive={false}
                keyboard={false}
                zIndexOffset={450}
              />
            ))}
          </>
        )}

        {showActivity && matchedSegments.map((segment, index) => (
          <Polyline
            key={`matched-${index}`}
            positions={segment.points}
            pathOptions={{ color: "#16844f", weight: 5, opacity: 0.95 }}
          >
            <Popup>
              <strong>Trecho compatível</strong><br />
              Extensão aproximada: {formatDistance(segment.lengthM)}<br />
              Afastamento médio: {formatDistance(segment.averageDeviationM)}
            </Popup>
          </Polyline>
        ))}

        {showActivity && deviationSegments.map((segment, index) => (
          <Polyline
            key={`deviation-${index}`}
            positions={segment.points}
            pathOptions={{ color: "#cf3434", weight: 7, opacity: 0.96 }}
          >
            <Popup>
              <strong>Desvio {index + 1}</strong><br />
              Extensão aproximada: {formatDistance(segment.lengthM)}<br />
              Afastamento médio: {formatDistance(segment.averageDeviationM)}<br />
              Maior afastamento: {formatDistance(segment.maxDeviationM)}<br />
              Pontos GPS: {segment.startPointIndex + 1}–{segment.endPointIndex + 1}
            </Popup>
          </Polyline>
        ))}

        {showCheckpoints && endpointDisplay?.separated && (
          <>
            <Polyline
              positions={[endpointDisplay.start, endpointDisplay.startDisplay]}
              pathOptions={{ color: "#176b42", weight: 2, opacity: 0.8, dashArray: "4 5" }}
            />
            <Polyline
              positions={[endpointDisplay.finish, endpointDisplay.finishDisplay]}
              pathOptions={{ color: "#171817", weight: 2, opacity: 0.8, dashArray: "4 5" }}
            />
            <CircleMarker center={endpointDisplay.start} radius={3} pathOptions={{ color: "#176b42", fillColor: "#176b42", fillOpacity: 1 }} />
            <CircleMarker center={endpointDisplay.finish} radius={3} pathOptions={{ color: "#171817", fillColor: "#171817", fillOpacity: 1 }} />
          </>
        )}

        {showCheckpoints && checkpoints.map((checkpoint, index) => {
          const isStart = index === 0;
          const isFinish = index === checkpoints.length - 1;
          const color = isFinish ? "#171817" : isStart ? "#176b42" : checkpoint.hit ? "#16844f" : "#cf3434";
          const markerLabel = isStart ? "L" : isFinish ? "C" : String(checkpoint.sequence);
          const position: ValidationMapPoint = isStart && endpointDisplay
            ? endpointDisplay.startDisplay
            : isFinish && endpointDisplay
              ? endpointDisplay.finishDisplay
              : [checkpoint.latitude, checkpoint.longitude];
          return (
            <Marker
              key={`${checkpoint.sequence}-${checkpoint.label}`}
              position={position}
              icon={markerIcon(markerLabel, color, isStart || isFinish ? 28 : 24)}
              zIndexOffset={isStart || isFinish ? 800 : 600}
            >
              <Popup>
                <strong>{checkpoint.label}</strong><br />
                {checkpoint.hit ? "Confirmado" : "Não confirmado"}<br />
                Distância mínima: {checkpoint.nearest_distance_m} m
                {(isStart || isFinish) && endpointDisplay?.separated ? (
                  <><br /><small>Marcador deslocado apenas para evitar sobreposição visual.</small></>
                ) : null}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="validation-map-legend" aria-label="Legenda do mapa">
        <span><i className="legend-line" style={{ background: "#e86619" }} />Rota oficial</span>
        <span><i className="legend-arrow">↑</i>Sentido oficial</span>
        <span><i className="legend-line" style={{ background: "#16844f" }} />Trecho compatível</span>
        <span><i className="legend-line" style={{ background: "#cf3434" }} />Trecho fora da tolerância</span>
        <span><i className="legend-dot" style={{ background: "#176b42" }} />Largada</span>
        <span><i className="legend-dot" style={{ background: "#16844f" }} />Checkpoint confirmado</span>
        <span><i className="legend-dot" style={{ background: "#cf3434" }} />Checkpoint não confirmado</span>
        <span><i className="legend-dot" style={{ background: "#171817" }} />Chegada</span>
      </div>
    </section>
  );
}
