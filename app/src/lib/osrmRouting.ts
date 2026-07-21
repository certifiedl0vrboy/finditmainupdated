/**
 * Thin wrapper around OSRM's free public routing API (router.project-osrm.org).
 *
 * This is a free, no-API-key routing service maintained by the OSRM project
 * for demo/light use. It returns real road-based routes (not straight lines)
 * plus duration and distance estimates, which is enough to build an
 * Uber-style "route + ETA" experience with zero billing setup.
 *
 * NOTE for scale: the public demo server is rate-limited and not intended
 * for high-traffic production use. If FindIt's request volume grows
 * significantly, self-host an OSRM instance (or switch to Mapbox/Google
 * Directions) — the fetchRoute() function below is the only place that
 * would need to change.
 */

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  /** Ordered lat/lng points describing the road route, for drawing a polyline. */
  coordinates: RoutePoint[];
  /** Total route distance in metres. */
  distanceMeters: number;
  /** Estimated travel duration in seconds. */
  durationSeconds: number;
}

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch a driving route between two points from OSRM's public server.
 * Returns null if the route could not be computed (e.g. network error, or
 * OSRM couldn't find a road-based path between the two points).
 */
export async function fetchRoute(from: RoutePoint, to: RoutePoint): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_BASE_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('OSRM routing request failed:', response.status);
      return null;
    }
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('OSRM returned no route:', data.code);
      return null;
    }

    const route = data.routes[0];
    const coordinates: RoutePoint[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );

    return {
      coordinates,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch (error) {
    console.error('Failed to fetch route from OSRM:', error);
    return null;
  }
}

/** Formats seconds into a short human string like "12 min" or "1 hr 5 min". */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

/** Formats metres into a short human string like "850 m" or "3.2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
