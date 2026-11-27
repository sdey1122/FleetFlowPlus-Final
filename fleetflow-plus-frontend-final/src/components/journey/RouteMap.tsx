import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { IPlace } from "../../types/interface/IPlace";
import type { IRoute } from "../../types/interface/IRoute";
import "leaflet/dist/leaflet.css";
import { Alert, Box } from "@mui/material";
function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (points.length === 1) map.setView(points[0], 13);
    else if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, points]);
  return null;
}
export default function RouteMap({
  a,
  b,
  route,
}: {
  a: IPlace | null;
  b: IPlace | null;
  route: IRoute | null;
}) {
  const [tileError, setTileError] = useState(false);
  const tileEvents = useMemo(() => ({ tileerror: () => setTileError(true), tileload: () => setTileError(false) }), []);
  const points = useMemo<[number, number][]>(() => route?.coordinates || [a, b].filter((p): p is IPlace => !!p).map((p) => [p.lat, p.lon]), [a, b, route]);
  return (
    <>
    {tileError && <Alert severity="warning" sx={{ mb: 1 }}>Map tiles are unavailable. Check your internet connection. Selected coordinates and road routing are independent of the map tiles.</Alert>}
    <Box
      sx={{
        height: { xs: 260, md: 330 },
        borderRadius: 2,
        overflow: "hidden",
        "& .leaflet-container": { height: "100%", width: "100%" },
      }}
    >
      <MapContainer center={[22.5, 79.0]} zoom={5} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={tileEvents}
        />
        {route && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{ color: "#A6342C", weight: 5 }}
          />
        )}
        {[a, b].map(
          (p, i) =>
            p && (
              <CircleMarker
                key={i}
                center={[p.lat, p.lon]}
                radius={8}
                pathOptions={{
                  color: "#282825",
                  fillColor: i ? "#E85A4F" : "#D8C3A5",
                  fillOpacity: 1,
                }}
              >
                <Popup>{p.label}</Popup>
              </CircleMarker>
            ),
        )}
        <Fit points={points} />
      </MapContainer>
    </Box>
    </>
  );
}
