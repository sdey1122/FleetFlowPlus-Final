import { useEffect } from "react";
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
import { Box } from "@mui/material";
function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length)
      map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
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
  const points: [number, number][] =
    route?.coordinates ||
    [a, b].filter((p): p is IPlace => !!p).map((p) => [p.lat, p.lon]);
  return (
    <Box
      sx={{
        height: { xs: 260, md: 330 },
        borderRadius: 2,
        overflow: "hidden",
        "& .leaflet-container": { height: "100%", width: "100%" },
      }}
    >
      <MapContainer center={[23.2, 88.1]} zoom={5} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  );
}
