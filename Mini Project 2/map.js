const MapModule = (() => {
  let map = null;
  let safetyLayer = null;
  let safetyFeatures = [];
  let safetyVisible = true;
  let communityLayer = null;
  let communityVisible = true;
  let routeLine = null;
  let destMarker = null;
  let originMarker = null;
  let userDot = null;
  let userDotPulse = null;
  let searchTimeout = null;
  let activeField = null;
  let geoWatchId = null;

  let userLatLng = null;
  let originLatLng = null;
  let destLatLng = null;
  let originIsGps = true;

  const UDIST_CENTER = [47.6613, -122.3131];
  const TILES_URL =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  const SCORE_COLORS = {
    low: "#2ca25f",
    medium: "#fec44f",
    high: "#f03b20",
    highest: "#8c2d04",
  };

  /* ── Community Hotspots (from r/udub Reddit posts) ──────── */

  const COMMUNITY_HOTSPOTS = [
    {
      name: "The Ave north of 45th",
      lat: 47.6618, lng: -122.3131,
      radius: 200,
      tip: "Students report this stretch feels unsafe after dark. Consider walking on a parallel street.",
    },
    {
      name: "Jack in the Box intersection",
      lat: 47.6635, lng: -122.3131,
      radius: 100,
      tip: "Frequently flagged by students for drug activity and phone thefts at night.",
    },
    {
      name: "Safeway area",
      lat: 47.6658, lng: -122.3131,
      radius: 120,
      tip: "Multiple students report uncomfortable encounters here at night. Make your Safeway run during daylight.",
    },
    {
      name: "Joy Mini Mart / 7-Eleven",
      lat: 47.6642, lng: -122.3131,
      radius: 80,
      tip: "Loitering reported by students; stay alert when passing at night.",
    },
    {
      name: "Alleys between 45th-52nd",
      lat: 47.6650, lng: -122.3145,
      radius: 150,
      tip: "Students strongly recommend avoiding alleys in this area at night.",
    },
    {
      name: "Cowen Park playground area",
      lat: 47.6685, lng: -122.3180,
      radius: 130,
      tip: "Flagged as risky after dark. Stick to well-lit paths.",
    },
    {
      name: "65th St underpass",
      lat: 47.6757, lng: -122.3131,
      radius: 100,
      tip: "Getting sketchy even in daytime per recent student reports.",
    },
    {
      name: "Near I-5 corridor (U-District)",
      lat: 47.6613, lng: -122.3200,
      radius: 180,
      tip: "More isolated with fewer witnesses. Stick to busier streets when possible.",
    },
    {
      name: "Bus stop at 45th & University Way",
      lat: 47.6614, lng: -122.3131,
      radius: 80,
      tip: "Be careful around this bus stop at night — flagged by multiple students.",
    },
  ];

  function scoreColor(score) {
    const s = Number(score) || 0;
    if (s >= 75) return SCORE_COLORS.highest;
    if (s >= 55) return SCORE_COLORS.high;
    if (s >= 25) return SCORE_COLORS.medium;
    return SCORE_COLORS.low;
  }

  function scoreWeight(crimeCount) {
    return Number(crimeCount) > 0 ? 4 : 2;
  }

  function scoreOpacity(crimeCount) {
    return Number(crimeCount) > 0 ? 0.85 : 0.35;
  }

  /* ── Initialize ─────────────────────────────────────────── */

  function init() {
    if (map) return;

    map = L.map("map-container", {
      center: UDIST_CENTER,
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(TILES_URL, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    loadSafetyData();
    buildCommunityLayer();
    bindSearch();
    bindControls();
    startGpsTracking();
  }

  /* ── GPS Tracking ───────────────────────────────────────── */

  function startGpsTracking() {
    if (!navigator.geolocation) {
      onGpsFallback();
      return;
    }

    geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        userLatLng = [lat, lng];

        updateUserDot(lat, lng);

        if (originIsGps) {
          originLatLng = [lat, lng];
          document.getElementById("origin-search").value = "My Location";
          document.getElementById("origin-search").classList.add("gps-active");
        }

        if (!userDot._centered) {
          map.setView(userLatLng, 15);
          userDot._centered = true;
        }
      },
      () => {
        onGpsFallback();
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
  }

  function onGpsFallback() {
    const input = document.getElementById("origin-search");
    input.value = "";
    input.placeholder = "Type starting location...";
    input.removeAttribute("readonly");
    originIsGps = false;
  }

  function updateUserDot(lat, lng) {
    if (userDot) {
      userDot.setLatLng([lat, lng]);
      userDotPulse.setLatLng([lat, lng]);
    } else {
      userDotPulse = L.circleMarker([lat, lng], {
        radius: 18,
        color: "#4b6cc1",
        fillColor: "#4b6cc1",
        fillOpacity: 0.15,
        weight: 0,
        className: "user-dot-pulse",
      }).addTo(map);

      userDot = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#fff",
        fillColor: "#4b6cc1",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      userDot._centered = false;
    }
  }

  /* ── Place Search (Nominatim — free, no key) ────────────── */

  function bindSearch() {
    const originInput = document.getElementById("origin-search");
    const destInput = document.getElementById("place-search");
    const dropdown = document.getElementById("search-results");

    destInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      activeField = "dest";
      const q = destInput.value.trim();
      if (q.length < 3) {
        dropdown.classList.add("hidden");
        return;
      }
      searchTimeout = setTimeout(() => searchPlaces(q, "dest"), 400);
    });

    originInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      activeField = "origin";
      const q = originInput.value.trim();
      if (q.length < 3) {
        dropdown.classList.add("hidden");
        return;
      }
      searchTimeout = setTimeout(() => searchPlaces(q, "origin"), 400);
    });

    originInput.addEventListener("focus", () => {
      if (originIsGps) {
        originInput.removeAttribute("readonly");
        originInput.value = "";
        originInput.classList.remove("gps-active");
        originIsGps = false;
      }
    });

    [originInput, destInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") dropdown.classList.add("hidden");
      });
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== destInput && e.target !== originInput) {
        dropdown.classList.add("hidden");
      }
    });

    document.getElementById("btn-locate").addEventListener("click", () => {
      if (userLatLng) {
        originLatLng = [...userLatLng];
        originIsGps = true;
        const input = document.getElementById("origin-search");
        input.value = "My Location";
        input.setAttribute("readonly", "");
        input.classList.add("gps-active");
        map.setView(userLatLng, 15);
        App.toast("Using your current location");
      } else {
        App.toast("Location not available — type an address instead");
      }
    });
  }

  function searchPlaces(query, field) {
    const dropdown = document.getElementById("search-results");
    dropdown.dataset.field = field;

    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q: query + ", Seattle, WA",
        format: "json",
        limit: 5,
        viewbox: "-122.34,47.68,-122.28,47.64",
        bounded: 0,
      });

    fetch(url, {
      headers: { "Accept-Language": "en" },
    })
      .then((r) => r.json())
      .then((results) => {
        if (!results.length) {
          dropdown.innerHTML =
            '<div class="search-item muted">No results found</div>';
          dropdown.classList.remove("hidden");
          return;
        }

        dropdown.innerHTML = results
          .map(
            (r) =>
              `<div class="search-item" data-lat="${r.lat}" data-lon="${r.lon}">${r.display_name}</div>`
          )
          .join("");
        dropdown.classList.remove("hidden");

        dropdown.querySelectorAll(".search-item[data-lat]").forEach((item) => {
          item.addEventListener("click", () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const label = item.textContent.split(",")[0];

            if (dropdown.dataset.field === "origin") {
              document.getElementById("origin-search").value = label;
              originLatLng = [lat, lon];
              originIsGps = false;
            } else {
              document.getElementById("place-search").value = label;
              destLatLng = [lat, lon];
            }

            dropdown.classList.add("hidden");
            tryRoute();
          });
        });
      })
      .catch(() => {
        dropdown.innerHTML =
          '<div class="search-item muted">Search error — try again</div>';
        dropdown.classList.remove("hidden");
      });
  }

  /* ── Routing (OSRM — free, no key) ─────────────────────── */

  function getOrigin() {
    if (originLatLng) return originLatLng;
    if (userLatLng) return userLatLng;
    return null;
  }

  function tryRoute() {
    const origin = getOrigin();
    if (!origin) {
      App.toast("Set a starting location first");
      return;
    }
    if (!destLatLng) return;
    calculateRoute(origin, destLatLng);
  }

  function calculateRoute(from, to) {
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
    if (originMarker) { map.removeLayer(originMarker); originMarker = null; }

    destMarker = L.marker(to, { title: "Destination" }).addTo(map);

    if (!originIsGps || !userDot) {
      originMarker = L.circleMarker(from, {
        radius: 7,
        color: "#fff",
        fillColor: "#2ca25f",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
    }

    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${from[1]},${from[0]};${to[1]},${to[0]}` +
      `?overview=full&geometries=geojson&steps=true`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data.routes || !data.routes.length) {
          App.toast("Could not find a walking route.");
          return;
        }

        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);

        routeLine = L.polyline(coords, {
          color: "#6b8ae0",
          weight: 5,
          opacity: 0.9,
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
        showRouteSteps(route);
        checkSafetyAlerts(coords);
      })
      .catch(() => {
        App.toast("Routing error — please try again.");
      });
  }

  function showRouteSteps(route) {
    const panel = document.getElementById("route-steps");
    const leg = route.legs[0];
    const distKm = (route.distance / 1000).toFixed(1);
    const mins = Math.round(route.duration / 60);

    let html = `
      <div class="route-summary">
        <span>${distKm} km &middot; ${mins} min walk</span>
        <button class="btn-close-route" id="close-route">Clear</button>
      </div>
    `;

    leg.steps.forEach((step) => {
      const instr = step.maneuver.type.replace(/_/g, " ");
      const name = step.name || "";
      const m = Math.round(step.distance);
      html += `<div class="route-step">${capitalize(instr)} ${name ? "onto <b>" + name + "</b>" : ""} (${m}m)</div>`;
    });

    panel.innerHTML = html;
    panel.classList.remove("hidden");

    document.getElementById("close-route").addEventListener("click", clearRoute);
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function clearRoute() {
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
    if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
    destLatLng = null;
    document.getElementById("route-steps").classList.add("hidden");
    document.getElementById("safety-alerts").classList.add("hidden");
    document.getElementById("place-search").value = "";
  }

  /* ── Safety Data ────────────────────────────────────────── */

  function loadSafetyData() {
    fetch("./corridor_safety_demo.geojson")
      .then((r) => r.json())
      .then((geojson) => {
        safetyFeatures = geojson.features || [];

        safetyLayer = L.geoJSON(geojson, {
          style: (feature) => {
            const props = feature.properties || {};
            return {
              color: scoreColor(props.corridor_score),
              weight: scoreWeight(props.crime_count),
              opacity: scoreOpacity(props.crime_count),
            };
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties || {};
            const name = p.name || "(unnamed corridor)";
            layer.bindPopup(
              `<div style="font-size:13px;max-width:240px;line-height:1.5">
                <b style="font-size:14px">${name}</b><br>
                <b>Level:</b> ${p.corridor_level || "N/A"}<br>
                <b>Score:</b> ${Number(p.corridor_score || 0).toFixed(0)}<br>
                <b>Crimes:</b> ${Number(p.crime_count || 0)}<br>
                <b>Density:</b> ${Number(p.crime_density || 0).toFixed(1)} / km<br>
                <b>Lighting:</b> ${p.lit || "missing"}<br>
                <b>Path:</b> ${p.highway || "unknown"}<br>
                <b>Surface:</b> ${p.surface || "missing"}<br>
                <b>Wheelchair:</b> ${p.wheelchair || "missing"}<br>
                <b>Barrier:</b> ${String(p.potential_wheelchair_barrier) === "True" ? "yes" : "no"}
              </div>`,
              { maxWidth: 260 }
            );
          },
        });

        safetyLayer.addTo(map);
      })
      .catch((err) => {
        console.warn("Could not load safety data:", err);
      });
  }

  /* ── Safety Alerts ──────────────────────────────────────── */

  function checkSafetyAlerts(routeCoords) {
    const alerts = [];
    const seen = new Set();

    safetyFeatures.forEach((feature) => {
      const props = feature.properties || {};
      const crimeCount = Number(props.crime_count) || 0;
      const corridorLevel = props.corridor_level || "";
      const lit = String(props.lit || "").toLowerCase();
      const barrier = String(props.potential_wheelchair_barrier) === "True";

      if (crimeCount === 0 && !barrier) return;

      const geom = feature.geometry;
      if (!geom || !geom.coordinates) return;

      let coords = geom.coordinates;
      if (geom.type === "MultiLineString") coords = coords.flat();

      const isNear = coords.some((coord) =>
        routeCoords.some(
          (rPt) =>
            Math.abs(coord[1] - rPt[0]) < 0.0008 &&
            Math.abs(coord[0] - rPt[1]) < 0.001
        )
      );

      if (!isNear) return;

      const key = `${crimeCount}-${lit}-${barrier}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (corridorLevel === "Consider alternate route") {
        alerts.push({ level: "red", icon: "\u26A0", text: "Higher incident density on this route" });
      }
      if ((lit === "no" || lit === "" || lit === "nan" || lit === "none") && crimeCount > 0) {
        alerts.push({ level: "orange", icon: "\uD83D\uDD26", text: "Low-lit area ahead \u2014 stay alert" });
      }
      if (barrier) {
        alerts.push({ level: "yellow", icon: "\u267F", text: "Potential wheelchair barrier on route" });
      }
    });

    let routeNearHotspot = false;
    COMMUNITY_HOTSPOTS.forEach((spot) => {
      const threshLat = spot.radius / 111000;
      const threshLng = spot.radius / (111000 * Math.cos(spot.lat * Math.PI / 180));

      const isNear = routeCoords.some(
        (rPt) =>
          Math.abs(rPt[0] - spot.lat) < threshLat &&
          Math.abs(rPt[1] - spot.lng) < threshLng
      );

      if (!isNear) return;
      routeNearHotspot = true;

      alerts.push({
        level: "purple",
        icon: "\uD83D\uDCAC",
        text: spot.name + " \u2014 " + spot.tip,
      });
    });

    if (routeNearHotspot) {
      const timeWarning = getTimeWarning();
      if (timeWarning) {
        alerts.push(timeWarning);
      }
    }

    const unique = [];
    const seenText = new Set();
    alerts.forEach((a) => {
      if (!seenText.has(a.text)) { unique.push(a); seenText.add(a.text); }
    });

    const panel = document.getElementById("safety-alerts");
    if (unique.length === 0) {
      panel.classList.add("hidden");
      return;
    }

    panel.innerHTML = unique
      .map(
        (a) =>
          `<div class="alert-card alert-${a.level}">
            <span class="alert-icon">${a.icon}</span>
            <span>${a.text}</span>
          </div>`
      )
      .join("");
    panel.classList.remove("hidden");
  }

  /* ── Community Hotspot Layer ─────────────────────────────── */

  function buildCommunityLayer() {
    communityLayer = L.layerGroup();

    COMMUNITY_HOTSPOTS.forEach((spot) => {
      const circle = L.circle([spot.lat, spot.lng], {
        radius: spot.radius,
        color: "#9b59b6",
        fillColor: "#9b59b6",
        fillOpacity: 0.12,
        weight: 1.5,
        className: "community-circle",
      });

      circle.bindPopup(
        `<div style="font-size:13px;max-width:220px;line-height:1.5">
          <b style="font-size:14px;color:#bb86fc">${spot.name}</b><br>
          <span style="color:#ccc">${spot.tip}</span><br>
          <span style="font-size:11px;color:#9b91a5;margin-top:4px;display:inline-block">Source: r/udub student reports</span>
        </div>`,
        { maxWidth: 240 }
      );

      communityLayer.addLayer(circle);
    });

    communityLayer.addTo(map);
  }

  /* ── Time-Based Risk ───────────────────────────────────── */

  function getTimeRiskLevel() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 22) return { level: 0, label: "low" };
    if (hour >= 22 || hour < 0)  return { level: 1, label: "moderate" };
    if (hour >= 0 && hour < 2)   return { level: 2, label: "elevated" };
    return { level: 3, label: "high" };
  }

  function getTimeWarning() {
    const risk = getTimeRiskLevel();
    switch (risk.level) {
      case 1:
        return { level: "purple", icon: "\uD83C\uDF19", text: "It's after 10pm \u2014 this area gets sketchier. Stay on well-lit streets." };
      case 2:
        return { level: "purple", icon: "\uD83C\uDF19", text: "After midnight \u2014 students report increased risk. Consider NightRide or a buddy." };
      case 3:
        return { level: "red", icon: "\u26A0", text: "Peak risk hours (2\u20135am). Strongly consider Husky NightWalk (206-685-WALK) or a rideshare." };
      default:
        return null;
    }
  }

  /* ── Controls ───────────────────────────────────────────── */

  function bindControls() {
    document.getElementById("btn-safety-toggle").addEventListener("click", () => {
      safetyVisible = !safetyVisible;
      if (safetyLayer) {
        if (safetyVisible) {
          safetyLayer.addTo(map);
        } else {
          map.removeLayer(safetyLayer);
        }
      }
      document.getElementById("btn-safety-toggle").classList.toggle("active", safetyVisible);
    });
    document.getElementById("btn-safety-toggle").classList.add("active");

    document.getElementById("btn-community-toggle").addEventListener("click", () => {
      communityVisible = !communityVisible;
      if (communityLayer) {
        if (communityVisible) {
          communityLayer.addTo(map);
        } else {
          map.removeLayer(communityLayer);
        }
      }
      document.getElementById("btn-community-toggle").classList.toggle("active", communityVisible);
    });
    document.getElementById("btn-community-toggle").classList.add("active");
  }

  return { init };
})();
