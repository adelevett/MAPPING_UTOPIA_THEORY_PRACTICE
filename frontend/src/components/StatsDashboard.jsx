import React, { useMemo } from 'react';
import { MapPin, BookOpen, Compass } from 'lucide-react';

// compact=true → small floating card for map empty-state
// compact=false (default) → not used in new layout, kept for compatibility
export default function StatsDashboard({ practices, categories, references, onSelect, compact }) {
  const stats = useMemo(() => {
    const total = practices.length;
    const geocoded = practices.filter(p => p.geocoded).length;
    const coded = practices.filter(p => p.p1_id).length;
    return { total, geocoded, coded };
  }, [practices]);

  if (compact) {
    return (
      <div className="map-stats-card glass-panel animate-fade-in" id="map-stats-card">
        <div className="msc-row">
          <Compass size={14} className="msc-icon" style={{ color: '#6366f1' }} />
          <span className="msc-val">{stats.total}</span>
          <span className="msc-label">practices</span>
        </div>
        <div className="msc-row">
          <MapPin size={14} className="msc-icon" style={{ color: '#10b981' }} />
          <span className="msc-val">{stats.geocoded}</span>
          <span className="msc-label">mapped</span>
        </div>
        <div className="msc-row">
          <BookOpen size={14} className="msc-icon" style={{ color: '#f59e0b' }} />
          <span className="msc-val">{categories.length}</span>
          <span className="msc-label">concepts</span>
        </div>
        <p className="msc-hint">Click a marker or use filters to explore</p>
      </div>
    );
  }

  return null;
}
