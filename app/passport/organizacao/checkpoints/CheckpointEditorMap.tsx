"use client";

import { useEffect } from "react";
import { latLngBounds } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

export type EditorPoint = [number, number];
export type EditorCheckpoint = {
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  route_progress: number;
  radius_m: number;
};

function FitBounds({ points }: { points: EditorPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [map, points]);
  return null;
}

function distanceSquared(a: EditorPoint, b: EditorPoint) {
  const latitudeScale = Math.cos((a[0] * Math.PI) / 180);
  const dLat = a[0] - b[0];
  const dLng = (a[1] - b[1]) * latitudeScale;
  return dLat * dLat + dLng * dLng;
}

function MapClickHandler({
  routePoints,
  selectedIndex,
  onMove,
}: {
  routePoints: EditorPoint[];
  selectedIndex: number | null;
  onMove: (checkpointIndex: number, progress: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (selectedIndex === null || routePoints.length < 2) return;
      const clickPoint: EditorPoint = [event.latlng.lat, event.latlng.lng];
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      routePoints.forEach((point, index) => {
        const distance = distanceSquared(point, clickPoint);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const progress = (nearestIndex / (routePoints.length - 1)) * 100;
      onMove(selectedIndex, Number(progress.toFixed(2)));
    },
  });
  return null;
}

export default function CheckpointEditorMap({
  routePoints,
  checkpoints,
  selectedIndex,
  onSelect,
  onMove,
}: {
  routePoints: EditorPoint[];
  checkpoints: EditorCheckpoint[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onMove: (checkpointIndex: number, progress: number) => void;
}) {
  const center: EditorPoint = routePoints[0] ?? [-29.5, -50.8];
  return (
    <div className="checkpoint-editor-map-wrap">
      <style>{`
        .checkpoint-editor-map-wrap{border:1px solid #b9ad9b;background:#ddd5c9}.checkpoint-editor-map{height:500px;width:100%}
        .leaflet-tooltip.editor-marker{background:transparent;border:0;box-shadow:none;color:#fff;font-size:10px;font-weight:900;line-height:20px;padding:0;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.5)}
        .leaflet-tooltip.editor-marker:before{display:none}
        @media(max-width:760px){.checkpoint-editor-map{height:390px}}
      `}</style>
      <MapContainer className="checkpoint-editor-map" center={center} zoom={12} scrollWheelZoom preferCanvas>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={routePoints} />
        <MapClickHandler routePoints={routePoints} selectedIndex={selectedIndex} onMove={onMove} />
        <Polyline positions={routePoints} pathOptions={{ color: "#e86619", weight: 6, opacity: 0.88 }} />
        {checkpoints.map((checkpoint, index) => {
          const isEndpoint = index === 0 || index === checkpoints.length - 1;
          const active = selectedIndex === index;
          const label = index === 0 ? "L" : index === checkpoints.length - 1 ? "C" : String(index);
          return (
            <CircleMarker
              key={`${checkpoint.sequence}-${checkpoint.label}-${checkpoint.route_progress}`}
              center={[checkpoint.latitude, checkpoint.longitude]}
              radius={active ? 13 : isEndpoint ? 11 : 10}
              pathOptions={{
                color: active ? "#111" : "#fff",
                weight: active ? 4 : 2,
                fillColor: index === 0 ? "#176b42" : index === checkpoints.length - 1 ? "#171817" : "#cf3434",
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onSelect(index) }}
            >
              <Tooltip permanent direction="center" className="editor-marker" opacity={1}>{label}</Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
