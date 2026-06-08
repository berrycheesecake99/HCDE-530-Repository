import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function authHeaders() {
  const lov = process.env.LOVABLE_API_KEY;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!lov || !key) throw new Error("Google Maps connector not configured");
  return {
    Authorization: `Bearer ${lov}`,
    "X-Connection-Api-Key": key,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

// Text-search based autocomplete (uses Places API New). Returns up to 5 places
// with id, name, address, lat, lng.
export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      query: z.string().min(1).max(200),
    }).parse,
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({
        textQuery: `${data.query}, Seattle, WA`,
        locationBias: {
          circle: {
            center: { latitude: 47.6613, longitude: -122.3131 },
            radius: 8000,
          },
        },
        pageSize: 6,
      }),
    });
    if (!res.ok) {
      console.error("places:searchText failed", res.status, await res.text());
      return { results: [] as Array<{ id: string; name: string; address: string; lat: number; lng: number }> };
    }
    const json: any = await res.json();
    const results = (json.places ?? []).map((p: any) => ({
      id: p.id,
      name: p.displayName?.text ?? p.formattedAddress ?? "",
      address: p.formattedAddress ?? "",
      lat: p.location?.latitude,
      lng: p.location?.longitude,
    })).filter((r: any) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
    return { results };
  });

// Walking directions via Routes API.
export const computeWalkingRoute = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      origin: z.object({ lat: z.number(), lng: z.number() }),
      destination: z.object({ lat: z.number(), lng: z.number() }),
    }).parse,
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: data.origin.lat, longitude: data.origin.lng } } },
        destination: { location: { latLng: { latitude: data.destination.lat, longitude: data.destination.lng } } },
        travelMode: "WALK",
        polylineEncoding: "ENCODED_POLYLINE",
      }),
    });
    if (!res.ok) {
      console.error("computeRoutes failed", res.status, await res.text());
      return { error: "routing_failed" as const };
    }
    const json: any = await res.json();
    const route = json.routes?.[0];
    if (!route) return { error: "no_route" as const };
    const seconds = Number(String(route.duration ?? "0s").replace("s", "")) || 0;
    return {
      distanceMeters: route.distanceMeters ?? 0,
      durationSeconds: seconds,
      encodedPolyline: route.polyline?.encodedPolyline ?? "",
    };
  });