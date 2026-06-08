/// <reference types="google.maps" />
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Navigation, Layers, AlertTriangle, X, Search, Play, Square, Flag, Lightbulb, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { COMMUNITY_HOTSPOTS, scoreColor, getReports, addReport, type Report } from "@/lib/safewalk-data";
import { searchPlaces, computeWalkingRoute } from "@/lib/maps.functions";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_app/navigate")({
  head: () => ({ meta: [{ title: "Navigate — SafeWalk" }] }),
  component: NavigatePage,
});

type LatLng = { lat: number; lng: number };
type PlaceResult = { id: string; name: string; address: string; lat: number; lng: number };

const REPORT_TYPES = [
  { id: "hazard", label: "Hazard", icon: AlertTriangle, color: "#f59e0b" },
  { id: "lighting", label: "Poor lighting", icon: Lightbulb, color: "#facc15" },
  { id: "loitering", label: "Suspicious activity", icon: Users, color: "#ef4444" },
  { id: "other", label: "Other concern", icon: Flag, color: "#a78bfa" },
] as const;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Dark midnight-navy map style matching the SafeWalk palette.
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#24324f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111a2f" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#d8dee9" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#4b5f85" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#6b7898" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#151f36" }, { weight: 1.2 }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#f4d37a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#b88f38" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#fff2bd" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#071226" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7db7d8" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1b2945" }] },
];

let mapsLoaderPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (mapsLoaderPromise) return mapsLoaderPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  mapsLoaderPromise = new Promise<typeof google>((resolve, reject) => {
    (window as any).__initSafeWalkMap = () => resolve((window as any).google);
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      libraries: "geometry,places",
      loading: "async",
      callback: "__initSafeWalkMap",
      v: "weekly",
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return mapsLoaderPromise;
}

function NavigatePage() {
  const callSearch = useServerFn(searchPlaces);
  const callRoute = useServerFn(computeWalkingRoute);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const hotspotCirclesRef = useRef<google.maps.Circle[]>([]);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);
  const userDotRef = useRef<google.maps.Marker | null>(null);
  const userPulseRef = useRef<google.maps.Circle | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const safetyFeaturesRef = useRef<any[]>([]);
  const userLatLngRef = useRef<LatLng | null>(null);
  const originLatLngRef = useRef<LatLng | null>(null);
  const destLatLngRef = useRef<LatLng | null>(null);
  const originIsGpsRef = useRef(true);
  const searchTimeout = useRef<any>(null);
  const routePathRef = useRef<google.maps.LatLng[] | null>(null);
  const routeTotalsRef = useRef<{ distanceMeters: number; durationSeconds: number } | null>(null);
  const firedAlertsRef = useRef<Set<string>>(new Set());
  const isNavigatingRef = useRef(false);
  const reportMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const reportsRef = useRef<Report[]>([]);

  const [safetyOn, setSafetyOn] = useState(true);
  const [communityOn, setCommunityOn] = useState(true);
  const [originText, setOriginText] = useState("My Location");
  const [destText, setDestText] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [activeField, setActiveField] = useState<"origin" | "dest" | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distKm: string; mins: number } | null>(null);
  const [alerts, setAlerts] = useState<{ level: string; text: string }[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [remaining, setRemaining] = useState<{ distKm: string; mins: number } | null>(null);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  // init map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const g = await loadGoogleMaps();
        if (cancelled || !mapEl.current || mapRef.current) return;

        const map = new g.maps.Map(mapEl.current, {
          center: { lat: 47.6613, lng: -122.3131 },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
          gestureHandling: "greedy",
          backgroundColor: "#182238",
          styles: DARK_STYLE,
          clickableIcons: false,
        });
        mapRef.current = map;
        infoWindowRef.current = new g.maps.InfoWindow();

        // SPD safety GeoJSON layer
        try {
          const res = await fetch("/corridor_safety.geojson");
          const gj = await res.json();
          safetyFeaturesRef.current = gj.features || [];
          const data = new g.maps.Data({ map });
          data.addGeoJson(gj);
          data.setStyle((feature: google.maps.Data.Feature) => {
            const score = Number(feature.getProperty("corridor_score")) || 0;
            const crimes = Number(feature.getProperty("crime_count")) || 0;
            return {
              strokeColor: scoreColor(score),
              strokeWeight: crimes > 0 ? 4 : 2,
              strokeOpacity: crimes > 0 ? 0.9 : 0.4,
              clickable: true,
            };
          });
          data.addListener("click", (e: google.maps.Data.MouseEvent) => {
            const f = e.feature;
            const html = `
              <div style="max-width:240px;line-height:1.5;color:#0f172a;font-family:Inter,sans-serif">
                <b>${f.getProperty("name") || "(unnamed corridor)"}</b><br/>
                <b>Level:</b> ${f.getProperty("corridor_level") ?? "N/A"}<br/>
                <b>Score:</b> ${Number(f.getProperty("corridor_score") || 0).toFixed(0)}<br/>
                <b>Crimes:</b> ${Number(f.getProperty("crime_count") || 0)}<br/>
                <b>Lighting:</b> ${f.getProperty("lit") ?? "missing"}<br/>
                <b>Path:</b> ${f.getProperty("highway") ?? "unknown"}
              </div>`;
            infoWindowRef.current!.setContent(html);
            infoWindowRef.current!.setPosition(e.latLng);
            infoWindowRef.current!.open(map);
          });
          dataLayerRef.current = data;
        } catch (e) {
          console.warn("safety load failed", e);
        }

        // Community hotspots
        COMMUNITY_HOTSPOTS.forEach((spot) => {
          if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng) || !Number.isFinite(spot.radius)) return;
          const c = new g.maps.Circle({
            map,
            center: { lat: spot.lat, lng: spot.lng },
            radius: spot.radius,
            strokeColor: "#bb86fc",
            strokeWeight: 1.5,
            strokeOpacity: 0.9,
            fillColor: "#bb86fc",
            fillOpacity: 0.12,
            clickable: true,
          });
          c.addListener("click", (e: google.maps.MapMouseEvent) => {
            infoWindowRef.current!.setContent(
              `<div style="max-width:220px;line-height:1.5;color:#0f172a;font-family:Inter,sans-serif">
                 <b style="color:#7c3aed">${spot.name}</b><br/>
                 <span>${spot.tip}</span><br/>
                 <span style="font-size:11px;opacity:0.6">Source: r/udub student reports</span>
               </div>`,
            );
            infoWindowRef.current!.setPosition(e.latLng);
            infoWindowRef.current!.open(map);
          });
          hotspotCirclesRef.current.push(c);
        });

        // GPS
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            (pos) => {
              const ll: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              userLatLngRef.current = ll;
              if (originIsGpsRef.current) originLatLngRef.current = ll;
              if (!userDotRef.current) {
                userPulseRef.current = new g.maps.Circle({
                  map, center: ll, radius: 35,
                  strokeWeight: 0, fillColor: "#fbbf24", fillOpacity: 0.18,
                });
                userDotRef.current = new g.maps.Marker({
                  map, position: ll,
                  icon: {
                    path: g.maps.SymbolPath.CIRCLE,
                    scale: 7, fillColor: "#fbbf24", fillOpacity: 1,
                    strokeColor: "#ffffff", strokeWeight: 2,
                  },
                });
                map.setCenter(ll);
                map.setZoom(15);
              } else {
                userDotRef.current.setPosition(ll);
                userPulseRef.current!.setCenter(ll);
              }
              if (isNavigatingRef.current) onNavTick(ll);
            },
            () => { /* keep U-District center */ },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
          );
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Map failed to load");
      }
    })();
    return () => {
      cancelled = true;
      hotspotCirclesRef.current.forEach((c) => c.setMap(null));
      hotspotCirclesRef.current = [];
      dataLayerRef.current?.setMap(null);
      routeLineRef.current?.setMap(null);
      destMarkerRef.current?.setMap(null);
      userDotRef.current?.setMap(null);
      userPulseRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, []);

  // toggle layers
  useEffect(() => {
    if (!mapRef.current || !dataLayerRef.current) return;
    dataLayerRef.current.setMap(safetyOn ? mapRef.current : null);
  }, [safetyOn]);
  useEffect(() => {
    if (!mapRef.current) return;
    hotspotCirclesRef.current.forEach((c) => c.setMap(communityOn ? mapRef.current : null));
    reportMarkersRef.current.forEach((m) => m.setMap(communityOn ? mapRef.current : null));
  }, [communityOn]);

  // Render community reports as map pins; refresh on change.
  useEffect(() => {
    const refresh = () => {
      const map = mapRef.current;
      const g = (window as any).google as typeof google | undefined;
      if (!map || !g?.maps) return;
      const reports = getReports();
      reportsRef.current = reports;
      const seen = new Set<string>();
      reports.forEach((r) => {
        if (typeof r.lat !== "number" || typeof r.lng !== "number") return;
        seen.add(r.id);
        if (reportMarkersRef.current.has(r.id)) return;
        const meta = REPORT_TYPES.find((t) => t.id === r.type) || REPORT_TYPES[0];
        const marker = new g.maps.Marker({
          map: communityOn ? map : null,
          position: { lat: r.lat, lng: r.lng },
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: meta.color,
            fillOpacity: 0.95,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          zIndex: 999,
        });
        marker.addListener("click", () => {
          const when = new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
          infoWindowRef.current!.setContent(
            `<div style="max-width:220px;line-height:1.5;color:#0f172a;font-family:Inter,sans-serif">
               <b style="color:${meta.color}">${meta.label}</b><br/>
               ${r.note ? `<span>${escapeHtml(r.note)}</span><br/>` : ""}
               <span style="font-size:11px;opacity:0.6">Reported ${when}</span>
             </div>`,
          );
          infoWindowRef.current!.setPosition({ lat: r.lat!, lng: r.lng! });
          infoWindowRef.current!.open(map);
        });
        reportMarkersRef.current.set(r.id, marker);
      });
      // Drop markers for removed reports.
      for (const [id, m] of reportMarkersRef.current) {
        if (!seen.has(id)) { m.setMap(null); reportMarkersRef.current.delete(id); }
      }
    };
    refresh();
    const interval = setInterval(refresh, 1500); // map may not be ready immediately
    window.addEventListener("safewalk:reports", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("safewalk:reports", refresh);
    };
  }, [communityOn]);

  function submitQuickReport(typeId: string, note: string) {
    const ll = userLatLngRef.current || (mapRef.current ? {
      lat: mapRef.current.getCenter()!.lat(),
      lng: mapRef.current.getCenter()!.lng(),
    } : null);
    if (!ll) { toast.error("Waiting for location…"); return; }
    const session = getSession();
    addReport({
      id: crypto.randomUUID(),
      type: typeId,
      note: note.trim().slice(0, 280),
      createdAt: Date.now(),
      netid: session?.netid || "anon",
      lat: ll.lat,
      lng: ll.lng,
    });
    toast.success("Report shared — thanks for keeping Huskies safe");
    setReportSheetOpen(false);
  }

  function onSearchChange(q: string, field: "origin" | "dest") {
    setActiveField(field);
    if (field === "origin") { setOriginText(q); originIsGpsRef.current = false; }
    else setDestText(q);
    if (q.trim().length < 3) { setSearchResults([]); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const { results } = await callSearch({ data: { query: q } });
        setSearchResults(results);
      } catch (e) {
        console.error(e);
        setSearchResults([]);
      }
    }, 300);
  }

  async function pickResult(r: PlaceResult) {
    const ll = { lat: r.lat, lng: r.lng };
    if (activeField === "origin") {
      setOriginText(r.name); originLatLngRef.current = ll; originIsGpsRef.current = false;
    } else {
      setDestText(r.name); destLatLngRef.current = ll;
    }
    setSearchResults([]);
    await tryRoute();
  }

  function useMyLocation() {
    originIsGpsRef.current = true;
    setOriginText("My Location");
    originLatLngRef.current = userLatLngRef.current;
    setSearchResults([]);
    tryRoute();
  }

  function clearRoute() {
    setDestText(""); destLatLngRef.current = null;
    setRouteInfo(null); setAlerts([]); setSearchResults([]);
    routeLineRef.current?.setMap(null); routeLineRef.current = null;
    destMarkerRef.current?.setMap(null); destMarkerRef.current = null;
    routePathRef.current = null;
    routeTotalsRef.current = null;
    stopNavigation("manual");
  }

  async function tryRoute() {
    const origin = originLatLngRef.current || userLatLngRef.current;
    const dest = destLatLngRef.current;
    const map = mapRef.current;
    if (!origin || !dest || !map) return;
    const g = (window as any).google as typeof google;

    routeLineRef.current?.setMap(null);
    destMarkerRef.current?.setMap(null);
    destMarkerRef.current = new g.maps.Marker({
      map, position: dest,
      icon: {
        path: g.maps.SymbolPath.CIRCLE,
        scale: 8, fillColor: "#ef4444", fillOpacity: 1,
        strokeColor: "#ffffff", strokeWeight: 2,
      },
    });

    try {
      const result = await callRoute({ data: { origin, destination: dest } });
      if ("error" in result) { toast.error("No walking route found"); return; }
      const path = g.maps.geometry.encoding.decodePath(result.encodedPolyline);
      routeLineRef.current = new g.maps.Polyline({
        map, path, strokeColor: "#fbbf24", strokeWeight: 5, strokeOpacity: 0.95,
      });
      const bounds = new g.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 60);
      routePathRef.current = path;
      routeTotalsRef.current = {
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
      };
      setRouteInfo({
        distKm: (result.distanceMeters / 1000).toFixed(1),
        mins: Math.round(result.durationSeconds / 60),
      });
      computeAlerts(path.map((p) => [p.lat(), p.lng()] as [number, number]));
    } catch (e) {
      console.error(e);
      toast.error("Routing error — try again");
    }
  }

  function startNavigation() {
    const map = mapRef.current;
    const user = userLatLngRef.current;
    if (!map || !routePathRef.current) { toast.error("Set a destination first"); return; }
    if (!user) { toast.error("Waiting for GPS location…"); return; }
    firedAlertsRef.current = new Set();
    isNavigatingRef.current = true;
    setIsNavigating(true);
    map.setCenter(user);
    map.setZoom(17);
    toast.success("Navigation started — stay aware of your surroundings");
    onNavTick(user);
  }

  function stopNavigation(reason?: "arrived" | "manual") {
    if (!isNavigatingRef.current && reason === "manual") return;
    isNavigatingRef.current = false;
    setIsNavigating(false);
    setRemaining(null);
    firedAlertsRef.current = new Set();
    if (reason === "arrived") toast.success("You've arrived 🎉");
  }

  function onNavTick(user: LatLng) {
    const g = (window as any).google as typeof google;
    if (!g?.maps?.geometry || !routePathRef.current || !routeTotalsRef.current) return;
    const map = mapRef.current;
    if (map) map.panTo(user);

    const userLL = new g.maps.LatLng(user.lat, user.lng);
    const path = routePathRef.current;

    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < path.length; i++) {
      const d = g.maps.geometry.spherical.computeDistanceBetween(userLL, path[i]);
      if (d < minDist) { minDist = d; minIdx = i; }
    }
    let remainingMeters = 0;
    for (let i = minIdx; i < path.length - 1; i++) {
      remainingMeters += g.maps.geometry.spherical.computeDistanceBetween(path[i], path[i + 1]);
    }
    const totals = routeTotalsRef.current;
    const ratio = totals.distanceMeters > 0 ? remainingMeters / totals.distanceMeters : 0;
    const mins = Math.max(0, Math.round((totals.durationSeconds * ratio) / 60));
    setRemaining({ distKm: (remainingMeters / 1000).toFixed(2), mins });

    const destLL = path[path.length - 1];
    const distToDest = g.maps.geometry.spherical.computeDistanceBetween(userLL, destLL);
    if (distToDest <= 25) { stopNavigation("arrived"); return; }

    // Build look-ahead window: points along the route up to LOOKAHEAD_METERS in front.
    const LOOKAHEAD_METERS = 150;
    const ahead: { pt: google.maps.LatLng; metersAhead: number }[] = [
      { pt: path[minIdx], metersAhead: 0 },
    ];
    let acc = 0;
    for (let i = minIdx; i < path.length - 1 && acc < LOOKAHEAD_METERS; i++) {
      acc += g.maps.geometry.spherical.computeDistanceBetween(path[i], path[i + 1]);
      ahead.push({ pt: path[i + 1], metersAhead: acc });
    }

    checkLiveAlerts(userLL, ahead);
  }

  function pushAlert(id: string, level: "danger" | "warn" | "info", text: string) {
    if (firedAlertsRef.current.has(id)) return;
    firedAlertsRef.current.add(id);
    setAlerts((prev) => [{ level, text }, ...prev].slice(0, 8));
    if (level === "danger") {
      toast.error(text);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(220);
    } else if (level === "warn") {
      toast.warning(text);
    } else {
      toast(text);
    }
  }

  function checkLiveAlerts(
    userLL: google.maps.LatLng,
    ahead: { pt: google.maps.LatLng; metersAhead: number }[] = [],
  ) {
    const g = (window as any).google as typeof google;
    const HAZARD_ON_ROUTE_M = 25;

    // ---- Look-ahead alerts (proactive) ----
    COMMUNITY_HOTSPOTS.forEach((spot, i) => {
      const spotLL = new g.maps.LatLng(spot.lat, spot.lng);
      let best = { d: Infinity, metersAhead: 0 };
      for (const a of ahead) {
        const d = g.maps.geometry.spherical.computeDistanceBetween(spotLL, a.pt);
        if (d < best.d) best = { d, metersAhead: a.metersAhead };
      }
      if (best.d <= spot.radius + HAZARD_ON_ROUTE_M && best.metersAhead > 20) {
        pushAlert(
          `ahead-hotspot-${i}`,
          "warn",
          `Heads up: ${spot.name} hotspot ahead in ~${Math.round(best.metersAhead)} m — ${spot.tip}`,
        );
      }
    });

    safetyFeaturesRef.current.forEach((f, fi) => {
      const p = f.properties || {};
      let geo = f.geometry?.coordinates || [];
      if (f.geometry?.type === "MultiLineString") geo = geo.flat();
      let best = { d: Infinity, metersAhead: 0 };
      for (const c of geo as number[][]) {
        const segLL = new g.maps.LatLng(c[1], c[0]);
        for (const a of ahead) {
          const d = g.maps.geometry.spherical.computeDistanceBetween(segLL, a.pt);
          if (d < best.d) best = { d, metersAhead: a.metersAhead };
        }
      }
      if (best.d > HAZARD_ON_ROUTE_M || best.metersAhead <= 20) return;
      const crimes = Number(p.crime_count) || 0;
      const name = p.name || "Segment";
      const inM = Math.round(best.metersAhead);
      if (crimes > 0 && p.corridor_level === "Consider alternate route") {
        pushAlert(
          `ahead-alt-${fi}`,
          "danger",
          `Warning: ${crimes} recent incident(s) reported on ${name}, ~${inM} m ahead. Consider an alternate route.`,
        );
      } else if (crimes > 0 && p.corridor_level === "Use extra caution") {
        pushAlert(
          `ahead-caution-${fi}`,
          "warn",
          `Caution: ${name} ahead in ~${inM} m — ${crimes} recent incident(s). Stay alert.`,
        );
      }
      if (p.lit === "no") {
        pushAlert(
          `ahead-lit-${fi}`,
          "info",
          `Heads up: unlit stretch (${name}) coming up in ~${inM} m.`,
        );
      }
    });

    // Community reports along the upcoming path.
    reportsRef.current.forEach((r) => {
      if (typeof r.lat !== "number" || typeof r.lng !== "number") return;
      const rLL = new g.maps.LatLng(r.lat, r.lng);
      let best = { d: Infinity, metersAhead: 0 };
      for (const a of ahead) {
        const d = g.maps.geometry.spherical.computeDistanceBetween(rLL, a.pt);
        if (d < best.d) best = { d, metersAhead: a.metersAhead };
      }
      if (best.d > HAZARD_ON_ROUTE_M || best.metersAhead <= 20) return;
      const meta = REPORT_TYPES.find((t) => t.id === r.type) || REPORT_TYPES[0];
      const level = r.type === "loitering" ? "danger" : r.type === "hazard" ? "warn" : "info";
      const note = r.note ? ` — "${r.note}"` : "";
      pushAlert(
        `ahead-report-${r.id}`,
        level as "danger" | "warn" | "info",
        `Heads up: ${meta.label} reported ~${Math.round(best.metersAhead)} m ahead${note}`,
      );
    });

    // ---- Entering alerts (reactive — user has arrived at the hazard) ----
    COMMUNITY_HOTSPOTS.forEach((spot, i) => {
      const d = g.maps.geometry.spherical.computeDistanceBetween(
        userLL, new g.maps.LatLng(spot.lat, spot.lng),
      );
      if (d <= spot.radius) {
        pushAlert(`hotspot-${i}`, "warn", `Entering ${spot.name}: ${spot.tip}`);
      }
    });
    safetyFeaturesRef.current.forEach((f, fi) => {
      const p = f.properties || {};
      let geo = f.geometry?.coordinates || [];
      if (f.geometry?.type === "MultiLineString") geo = geo.flat();
      const near = (geo as number[][]).some((c: number[]) => {
        const d = g.maps.geometry.spherical.computeDistanceBetween(
          userLL, new g.maps.LatLng(c[1], c[0]),
        );
        return d <= 40;
      });
      if (!near) return;
      const crimes = Number(p.crime_count) || 0;
      if (crimes > 0 && p.corridor_level === "Consider alternate route") {
        pushAlert(`alt-${fi}`, "danger", `${p.name || "Segment"}: ${crimes} recent incident(s). Consider an alternate route.`);
      } else if (crimes > 0 && p.corridor_level === "Use extra caution") {
        pushAlert(`caution-${fi}`, "warn", `${p.name || "Segment"}: ${crimes} recent incident(s). Stay alert.`);
      }
      if (p.lit === "no") {
        pushAlert(`lit-${fi}`, "info", `${p.name || "Segment"}: unlit street ahead.`);
      }
    });
  }

  function computeAlerts(coords: [number, number][]) {
    const out: { level: string; text: string }[] = [];
    const seen = new Set<string>();
    safetyFeaturesRef.current.forEach((f) => {
      const p = f.properties || {};
      if ((Number(p.crime_count) || 0) === 0) return;
      let geo = f.geometry?.coordinates || [];
      if (f.geometry?.type === "MultiLineString") geo = geo.flat();
      const near = (geo as number[][]).some((c: number[]) =>
        coords.some(([lat, lng]) => Math.abs(c[1] - lat) < 0.0008 && Math.abs(c[0] - lng) < 0.001),
      );
      if (!near) return;
      if (p.corridor_level === "Consider alternate route" && !seen.has("alt")) {
        out.push({ level: "danger", text: `${p.name}: ${p.crime_count} recent incident(s). Consider an alternate route.` });
        seen.add("alt");
      } else if (p.corridor_level === "Use extra caution" && !seen.has("caution")) {
        out.push({ level: "warn", text: `${p.name}: ${p.crime_count} recent incident(s). Stay alert and well-lit.` });
        seen.add("caution");
      }
      if (p.lit === "no" && !seen.has("lit")) {
        out.push({ level: "info", text: `${p.name}: unlit street segment along route.` });
        seen.add("lit");
      }
    });
    setAlerts(out);
  }

  return (
    <div className="relative h-full min-h-full">
      <div ref={mapEl} className="absolute inset-0 bg-[oklch(0.14_0.03_260)]" />

      {/* Search bar overlay */}
      <div className="absolute inset-x-3 top-3 z-20 space-y-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface/85 shadow-xl backdrop-blur-xl">
          <SearchRow
            color="bg-gold"
            placeholder="My location"
            value={originText}
            onChange={(v) => onSearchChange(v, "origin")}
            onFocus={() => setActiveField("origin")}
            trailing={
              <button onClick={useMyLocation} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-gold" title="Use my location">
                <Navigation className="h-4 w-4" />
              </button>
            }
          />
          <div className="ml-7 h-px bg-border" />
          <SearchRow
            color="bg-sos"
            placeholder="Where to?"
            value={destText}
            onChange={(v) => onSearchChange(v, "dest")}
            onFocus={() => setActiveField("dest")}
            trailing={destText ? (
              <button onClick={clearRoute} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-elevated"><X className="h-4 w-4" /></button>
            ) : <Search className="mr-2 h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-xl backdrop-blur-xl">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => pickResult(r)}
                className="flex w-full items-start gap-2.5 border-b border-border/50 px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-surface-elevated"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span className="min-w-0">
                  <span className="block truncate text-foreground/90">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.address}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer toggles */}
      <div className="absolute right-3 top-[7.5rem] z-20 flex flex-col gap-2">
        <LayerToggle on={safetyOn} onClick={() => setSafetyOn((v) => !v)} icon={<Layers className="h-4 w-4" />} label="Safety" />
        <LayerToggle on={communityOn} onClick={() => setCommunityOn((v) => !v)} icon={<AlertTriangle className="h-4 w-4" />} label="Reports" />
      </div>

      {/* Quick-report FAB (Waze-style) */}
      <button
        onClick={() => setReportSheetOpen(true)}
        className="absolute right-3 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sos to-[oklch(0.55_0.22_25)] text-white shadow-2xl shadow-sos/30 ring-2 ring-background active:scale-95"
        style={{ bottom: routeInfo || alerts.length > 0 ? "11rem" : "5rem" }}
        title="Report an incident"
        aria-label="Report an incident"
      >
        <Plus className="h-6 w-6" />
      </button>

      {reportSheetOpen && (
        <ReportSheet
          onClose={() => setReportSheetOpen(false)}
          onSubmit={submitQuickReport}
          hasLocation={!!userLatLngRef.current}
        />
      )}

      {/* Bottom panel */}
      {(routeInfo || alerts.length > 0) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute inset-x-3 bottom-3 z-20 overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl backdrop-blur-xl"
        >
          {routeInfo && (
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isNavigating ? "Navigating · remaining" : "Walking route"}
                </div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-foreground">
                  {(isNavigating && remaining ? remaining.distKm : routeInfo.distKm)}
                  <span className="text-sm text-muted-foreground"> km</span>
                  <span className="mx-2 text-border">•</span>
                  {(isNavigating && remaining ? remaining.mins : routeInfo.mins)}
                  <span className="text-sm text-muted-foreground"> min</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isNavigating ? (
                  <>
                    <button onClick={clearRoute} className="rounded-full bg-surface-elevated px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Clear</button>
                    <button
                      onClick={startNavigation}
                      className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-background shadow-md hover:brightness-110"
                    >
                      <Play className="h-3.5 w-3.5" /> Start
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => stopNavigation("manual")}
                    className="flex items-center gap-1.5 rounded-full bg-sos px-4 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110"
                  >
                    <Square className="h-3.5 w-3.5" /> Stop
                  </button>
                )}
              </div>
            </div>
          )}
          {alerts.length > 0 && (
            <div className="max-h-44 space-y-1.5 overflow-y-auto p-3">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                  a.level === "danger" ? "border-danger/30 bg-danger/10 text-danger" :
                  a.level === "warn" ? "border-warn/30 bg-warn/10 text-warn" :
                  "border-accent/30 bg-accent/10 text-accent-foreground"
                }`}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="leading-relaxed">{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      {!routeInfo && alerts.length === 0 && (
        <div className="absolute bottom-3 left-3 z-20 rounded-2xl border border-border bg-surface/85 px-3.5 py-2.5 text-[11px] backdrop-blur-xl">
          <div className="mb-1.5 font-medium uppercase tracking-wider text-muted-foreground">Corridor risk</div>
          <div className="space-y-1">
            {[
              ["#2ca25f", "Low"], ["#fec44f", "Medium"], ["#f03b20", "High"], ["#8c2d04", "Avoid"],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span className="h-1 w-5 rounded-full" style={{ background: c }} />
                <span className="text-foreground/80">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchRow({ color, placeholder, value, onChange, onFocus, trailing }: {
  color: string; placeholder: string; value: string;
  onChange: (v: string) => void; onFocus?: () => void; trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color} ring-2 ring-background`} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />
      {trailing}
    </div>
  );
}

function LayerToggle({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border backdrop-blur-xl transition ${
        on ? "border-gold/50 bg-gold/15 text-gold" : "border-border bg-surface/80 text-muted-foreground"
      }`}
      title={label}
    >
      {icon}
      <span className="text-[8px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ReportSheet({ onClose, onSubmit, hasLocation }: {
  onClose: () => void;
  onSubmit: (typeId: string, note: string) => void;
  hasLocation: boolean;
}) {
  const [type, setType] = useState<string | null>(null);
  const [note, setNote] = useState("");
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl border-t border-border bg-surface p-5 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Report an incident</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {hasLocation ? "Pinned at your current location." : "GPS unavailable — pinned at map center."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_TYPES.map((t) => {
            const Icon = t.icon; const sel = type === t.id;
            return (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs transition ${
                  sel ? "border-gold/60 bg-gold/10" : "border-border bg-surface-elevated"
                }`}>
                <Icon className="h-4 w-4" style={{ color: t.color }} />
                <span className={sel ? "text-foreground" : "text-muted-foreground"}>{t.label}</span>
              </button>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Optional note (skip to submit faster)…"
          className="mt-3 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
        />
        <button
          disabled={!type}
          onClick={() => type && onSubmit(type, note)}
          className="mt-3 w-full rounded-xl bg-gradient-to-br from-gold to-[oklch(0.72_0.15_65)] py-3 text-sm font-semibold text-[oklch(0.18_0.03_260)] shadow shadow-gold/20 active:scale-[0.98] disabled:opacity-50"
        >
          {type ? "Submit report" : "Pick a category"}
        </button>
      </motion.div>
    </div>
  );
}