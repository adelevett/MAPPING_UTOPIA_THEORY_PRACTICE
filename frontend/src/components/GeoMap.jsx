import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const P1_COLORS = {
  'P1-C1':  '#6366f1',
  'P1-C2':  '#8b5cf6',
  'P1-C3':  '#ec4899',
  'P1-C4':  '#14b8a6',
  'P1-C5':  '#f97316',
  'P1-C6':  '#06b6d4',
  'P1-C7':  '#f43f5e',
  'P1-C8':  '#a855f7',
  'P1-C9':  '#3b82f6',
  'P1-C10': '#84cc16',
  'P1-C11': '#f59e0b',
  'P1-C12': '#10b981',
  'P1-C13': '#64748b',
  'P1-C14': '#d946ef',
};

function getMarkerColor(practice) {
  return P1_COLORS[practice.p1_id] || '#a78bfa';
}

// Check if a practice matches any of the active filters
function matchesFilters(practice, activeFilters) {
  if (activeFilters.size === 0) return true;
  if (activeFilters.has(practice.p1_id)) return true;
  if (activeFilters.has(practice.p2_id)) return true;
  if ((practice.p3_ids || []).some(id => activeFilters.has(id))) return true;
  return false;
}

// Best verbatim quote for tooltip
function getTooltipQuote(practice) {
  const raw = practice.p1_verbatim_evidence
    || (practice.p3_items?.[0]?.verbatim_evidence)
    || practice.evidence
    || '';
  return raw.length > 90 ? raw.slice(0, 90) + '…' : raw;
}

export default function GeoMap({ practices, activeFilters, activeStoryPracticeId, onSelectPractice }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const [tileTheme, setTileTheme] = useState('light'); // default to light

  // 1. Initialize Leaflet map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [25, -20],
      zoom: 2.5,
      zoomControl: false,
      attributionControl: true,
    });

    // Default to light tiles on init
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    // Call invalidateSize on a small delay to handle settled heights
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 1b. Swapping Tile Layers dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const url = tileTheme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(url, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);
  }, [tileTheme]);

  // 1c. Invalidate map size on any container resize (using ResizeObserver)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 2. Re-render markers whenever practices, filters, or active story changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const geocoded = practices.filter(p => p.geocoded && p.lat != null && p.lng != null);

    geocoded.forEach(p => {
      const isMatch = matchesFilters(p, activeFilters);
      const isActive = activeStoryPracticeId === p.practice_id;
      const color = getMarkerColor(p);

      const radius = isActive ? 11 : (isMatch ? 7 : 4);
      const fillOpacity = isActive ? 1 : (isMatch ? 0.85 : 0.12);
      const opacity = isMatch ? 1 : 0.3;
      const weight = isActive ? 2.5 : (isMatch ? 1.5 : 0.5);
      const strokeColor = isActive ? '#ffffff' : (isMatch ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)');

      const marker = L.circleMarker([p.lat, p.lng], {
        radius,
        fillColor: color,
        color: strokeColor,
        weight,
        opacity,
        fillOpacity,
      });

      // Hover tooltip: quote + name + location
      const quote = getTooltipQuote(p);
      const tooltipContent = `
        <div class="map-hover-card">
          ${quote ? `<p class="map-hover-quote">&ldquo;${quote}&rdquo;</p>` : ''}
          <strong class="map-hover-name">${p.practice_name}</strong>
          ${p.location_string ? `<span class="map-hover-location">${p.location_string}</span>` : ''}
        </div>
      `;
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -8],
        className: 'custom-tooltip',
      });

      marker.on('click', () => onSelectPractice(p.practice_id));
      marker.addTo(map);
      markersRef.current[p.practice_id] = marker;
    });
  }, [practices, activeFilters, activeStoryPracticeId, onSelectPractice]);

  return (
    <div className="map-view-container" id="geo-map-container">
      <div ref={mapRef} className="leaflet-map-element" />
      
      {/* Map Theme Toggle Switcher */}
      <div className="map-theme-switcher glass-panel" id="map-theme-switcher">
        <button
          className={`theme-switch-btn ${tileTheme === 'light' ? 'active' : ''}`}
          onClick={() => setTileTheme('light')}
          title="Light Map Tiles"
          id="map-theme-light-btn"
        >
          Light
        </button>
        <button
          className={`theme-switch-btn ${tileTheme === 'dark' ? 'active' : ''}`}
          onClick={() => setTileTheme('dark')}
          title="Dark Map Tiles"
          id="map-theme-dark-btn"
        >
          Dark
        </button>
      </div>
    </div>
  );
}
