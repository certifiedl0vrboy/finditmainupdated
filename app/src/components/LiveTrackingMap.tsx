import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, MapPin } from 'lucide-react';
import { fetchRoute, formatDuration, formatDistance, type RoutePoint } from '@/lib/osrmRouting';

interface LiveTrackingMapProps {
  /** Customer's destination location. */
  customerLocation: RoutePoint;
  /** Provider's current location. Updates live as the booking row changes. */
  providerLocation: RoutePoint | null;
  /** Display name of the provider, shown in the marker popup / ETA card. */
  providerName?: string;
  /** Height of the map; width always fills its container. */
  height?: number | string;
}

// Leaflet's default marker icons reference image files by relative path,
// which breaks under Vite's bundling. We build our own SVG-based markers
// instead of patching the default icon paths, so no separate asset files
// are needed and the markers match FindIt's brand colours.
function buildDivIcon(color: string, label: string) {
  return L.divIcon({
    className: 'findit-map-marker',
    html: `
      <div style="
        width: 38px; height: 38px;
        display: flex; align-items: center; justify-content: center;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      ">
        <span style="transform: rotate(45deg); font-size: 16px; line-height:1;">${label}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

const providerIcon = buildDivIcon('#0284C7', '🧑\u200d🔧');
const customerIcon = buildDivIcon('#CE1126', '📍');

/** Re-centers/fits the map whenever the set of points to show changes. */
function FitBounds({ points }: { points: RoutePoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);
  return null;
}

const LiveTrackingMap = ({
  customerLocation,
  providerLocation,
  providerName = 'Your provider',
  height = 420,
}: LiveTrackingMapProps) => {
  const [route, setRoute] = useState<{ coordinates: RoutePoint[]; distanceMeters: number; durationSeconds: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const lastRouteOriginRef = useRef<string | null>(null);

  // Re-fetch the route whenever the provider's location moves meaningfully
  // (rounded to ~11m precision) rather than on every single GPS tick, since
  // OSRM's public server is a shared, rate-limited resource.
  useEffect(() => {
    if (!providerLocation) return;

    const originKey = `${providerLocation.lat.toFixed(4)},${providerLocation.lng.toFixed(4)}`;
    if (originKey === lastRouteOriginRef.current) return;
    lastRouteOriginRef.current = originKey;

    let cancelled = false;

    (async () => {
      setRouteLoading(true);
      const result = await fetchRoute(providerLocation, customerLocation);
      if (!cancelled) {
        setRoute(result);
        setRouteLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [providerLocation, customerLocation]);

  const points = useMemo(() => {
    const pts: RoutePoint[] = [customerLocation];
    if (providerLocation) pts.push(providerLocation);
    return pts;
  }, [customerLocation, providerLocation]);

  const polylinePositions = useMemo<[number, number][]>(() => {
    if (route?.coordinates?.length) {
      return route.coordinates.map(p => [p.lat, p.lng]);
    }
    // Fallback: straight line while the real route is still loading
    if (providerLocation) {
      return [[providerLocation.lat, providerLocation.lng], [customerLocation.lat, customerLocation.lng]];
    }
    return [];
  }, [route, providerLocation, customerLocation]);

  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 shadow-warm relative font-sans">
      <MapContainer
        center={[customerLocation.lat, customerLocation.lng]}
        zoom={14}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: '#0284C7', weight: 5, opacity: 0.85 }}
          />
        )}

        <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon} />

        {providerLocation && (
          <Marker position={[providerLocation.lat, providerLocation.lng]} icon={providerIcon} />
        )}
      </MapContainer>

      {/* ETA / status card */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-4 py-3 flex items-center gap-4">
        {!providerLocation ? (
          <div className="flex items-center gap-2 text-sm text-mocha/70">
            <Navigation className="w-4 h-4 animate-pulse text-[#0284C7]" />
            Waiting for {providerName} to start sharing their location…
          </div>
        ) : routeLoading && !route ? (
          <div className="flex items-center gap-2 text-sm text-mocha/70">
            <Clock className="w-4 h-4 animate-spin text-[#0284C7]" />
            Calculating route…
          </div>
        ) : route ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#0284C7]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#0284C7]" />
              </div>
              <div>
                <div className="text-xs text-mocha/60 leading-none">ETA</div>
                <div className="text-sm font-bold text-[#075985] leading-tight mt-0.5">
                  {formatDuration(route.durationSeconds)}
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-black/10" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#F5A623]/15 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#B9790A]" />
              </div>
              <div>
                <div className="text-xs text-mocha/60 leading-none">Distance</div>
                <div className="text-sm font-bold text-[#075985] leading-tight mt-0.5">
                  {formatDistance(route.distanceMeters)}
                </div>
              </div>
            </div>
            <div className="ml-auto text-xs text-mocha/50 hidden sm:block">
              {providerName} is on the way
            </div>
          </>
        ) : (
          <div className="text-sm text-mocha/70">Route unavailable right now — {providerName} is still en route.</div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
