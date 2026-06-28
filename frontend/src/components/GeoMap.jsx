import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { ShieldAlert } from 'lucide-react';

export default function GeoMap({ practices, selection, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // 1. Calculate active practice IDs based on the current selection state
  const activePracticeIds = useMemo(() => {
    if (!selection || !selection.id) return null; // null = all active
    
    if (selection.type === 'practice') {
      return new Set([selection.id]);
    }
    
    if (selection.type === 'category') {
      return new Set(
        practices
          .filter(p => p.p1_id === selection.id || p.p2_id === selection.id || (p.p3_ids && p.p3_ids.includes(selection.id)))
          .map(p => p.practice_id)
      );
    }
    
    if (selection.type === 'reference') {
      return new Set(
        practices
          .filter(p => p.linked_references && p.linked_references.includes(selection.id))
          .map(p => p.practice_id)
      );
    }
    
    return null;
  }, [selection, practices]);

  // Calculate non-geocoded count for the warning banner
  const warningInfo = useMemo(() => {
    if (!selection || !selection.id || selection.type === 'practice') return null;
    
    // Get all practices linked to this category/reference
    let linked;
    if (selection.type === 'category') {
      linked = practices.filter(p => 
        p.p1_id === selection.id || 
        p.p2_id === selection.id || 
        (p.p3_ids && p.p3_ids.includes(selection.id))
      );
    } else {
      linked = practices.filter(p => p.linked_references && p.linked_references.includes(selection.id));
    }
    
    const total = linked.length;
    const geocoded = linked.filter(p => p.geocoded).length;
    const nonGeocoded = total - geocoded;
    
    if (nonGeocoded > 0) {
      return {
        nonGeocoded,
        type: selection.type
      };
    }
    return null;
  }, [selection, practices]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Map centered on Europe/Atlantic
    const map = L.map(mapRef.current, {
      center: [25, -20],
      zoom: 2.5,
      zoomControl: false,
      attributionControl: true
    });

    // Dark Matter map tiles (CartoDB) - matches premium dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Update Markers when practices, active IDs, or map changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Filter only geocoded practices
    const geocodedPractices = practices.filter(p => p.geocoded && p.lat !== null && p.lng !== null);

    geocodedPractices.forEach(p => {
      const isActive = activePracticeIds === null || activePracticeIds.has(p.practice_id);
      const isSelected = selection && selection.type === 'practice' && selection.id === p.practice_id;

      // Style active markers vs dimmed markers
      const markerOptions = {
        radius: isSelected ? 10 : (isActive ? 7 : 4.5),
        fillColor: isSelected ? '#a78bfa' : (isActive ? '#6366f1' : '#4b5563'), // violet, indigo, grey
        color: isSelected ? '#ffffff' : (isActive ? '#818cf8' : '#374151'),
        weight: isSelected ? 2 : 1,
        opacity: isActive ? 0.9 : 0.4,
        fillOpacity: isActive ? 0.75 : 0.2
      };

      const marker = L.circleMarker([p.lat, p.lng], markerOptions);

      // Simple tooltip
      marker.bindTooltip(`
        <div class="map-tooltip">
          <strong>${p.practice_name}</strong><br/>
          <span class="text-xs text-secondary">${p.location_string || ''}</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -5],
        className: 'custom-tooltip'
      });

      marker.on('click', () => {
        onSelect({ type: 'practice', id: p.practice_id });
      });

      marker.addTo(map);
      markersRef.current[p.practice_id] = marker;
    });
  }, [practices, activePracticeIds, selection, onSelect]);

  // 4. Center map when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selection || selection.type !== 'practice') return;

    const practice = practices.find(p => p.practice_id === selection.id);
    if (practice && practice.geocoded && practice.lat !== null && practice.lng !== null) {
      // Smoothly pan and zoom to the selected practice marker
      map.setView([practice.lat, practice.lng], 6, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selection, practices]);

  return (
    <div className="map-view-container">
      {/* Warning banner for non-geocoded practices linked to category/reference */}
      {warningInfo && (
        <div className="map-warning-overlay animate-slide-in">
          <ShieldAlert className="warning-icon text-accent" />
          <span>
            <strong>{warningInfo.nonGeocoded} additional practices</strong> linked to this {warningInfo.type} have no fixed location (online/global) and are not shown on the map. Switch to <strong>Network View</strong> to see the full set.
          </span>
        </div>
      )}
      <div ref={mapRef} className="leaflet-map-element" />
    </div>
  );
}
