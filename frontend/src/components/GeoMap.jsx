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

    // Positron light map tiles (CartoDB) - high contrast light theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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

      // Style active markers vs dimmed markers - high contrast for light map
      const markerOptions = {
        radius: isSelected ? 10 : (isActive ? 7 : 4.5),
        fillColor: isSelected ? '#5b21b6' : (isActive ? '#3730a3' : '#6b7280'), // violet-800, indigo-800, grey-500
        color: '#ffffff',
        weight: isSelected ? 2.5 : (isActive ? 1.5 : 1),
        opacity: isActive ? 1.0 : 0.6,
        fillOpacity: isActive ? 0.85 : 0.35
      };

      const marker = L.circleMarker([p.lat, p.lng], markerOptions);

      // Simple tooltip on hover
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

      // Rich popup on click exposing related projects
      marker.bindPopup(() => {
        const related = practices
          .filter(other => other.p1_id === p.p1_id && other.practice_id !== p.practice_id)
          .slice(0, 3);
        
        const relatedList = related.map(other => `<li>${other.practice_name}</li>`).join('');
        const relatedSection = related.length > 0 
          ? `<div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 6px;">
               <strong style="display: block; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Related Projects (Same Speculative Model):</strong>
               <ul style="margin: 4px 0 0 0; padding-left: 14px; font-size: 11px; color: #1f2937; line-height: 1.3;">
                 ${relatedList}
               </ul>
             </div>`
          : '';

        const affectTags = p.p3_names && p.p3_names.length > 0
          ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
               ${p.p3_names.slice(0, 3).map(name => `<span style="background-color: #f3f4f6; color: #374151; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${name}</span>`).join('')}
             </div>`
          : '';

        return `
          <div style="font-family: Inter, sans-serif; padding: 2px; max-width: 250px; line-height: 1.4;">
            <h4 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #1e1b4b;">${p.practice_name}</h4>
            <div style="font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 6px;">${p.location_string || 'No fixed location'}</div>
            
            <div style="font-size: 11px; color: #374151;">
              <strong>Speculative Construct:</strong>
              <div style="color: #4f46e5; font-weight: 600; margin-top: 1px;">${p.p1_name || 'Uncoded'}</div>
            </div>
            
            ${affectTags}
            ${relatedSection}
          </div>
        `;
      }, {
        maxWidth: 260,
        className: 'leaflet-custom-popup'
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
