import React, { useState, useMemo } from 'react';
import { MapPin, Network, BookOpen, Compass, Search, ChevronRight } from 'lucide-react';

export default function StatsDashboard({ practices, categories, references, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const total = practices.length;
    const geocoded = practices.filter(p => p.geocoded).length;
    const nonGeocoded = total - geocoded;
    const hasP1 = practices.filter(p => p.p1_id).length;
    
    // Group categories by perspective
    const catByPersp = {
      P1: { count: 0, color: '#6366f1', name: 'Typologies of Visionary Constructs' },
      P2: { count: 0, color: '#10b981', name: 'Methodologies of Exploration' },
      P3: { count: 0, color: '#f59e0b', name: 'Utopian Affects' }
    };
    
    categories.forEach(cat => {
      if (catByPersp[cat.perspective_id]) {
        catByPersp[cat.perspective_id].count++;
      }
    });

    // Practice distribution in categories
    const categoryCounts = {};
    practices.forEach(p => {
      if (p.p1_id) categoryCounts[p.p1_id] = (categoryCounts[p.p1_id] || 0) + 1;
      if (p.p2_id) categoryCounts[p.p2_id] = (categoryCounts[p.p2_id] || 0) + 1;
      if (p.p3_ids) {
        p.p3_ids.forEach(id => {
          categoryCounts[id] = (categoryCounts[id] || 0) + 1;
        });
      }
    });

    return {
      total,
      geocoded,
      nonGeocoded,
      hasP1,
      catByPersp,
      categoryCounts
    };
  }, [practices, categories]);

  // Filter practices based on search
  const filteredPractices = useMemo(() => {
    if (!searchTerm.trim()) return practices.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return practices.filter(p => 
      p.practice_name.toLowerCase().includes(term) ||
      (p.location_string && p.location_string.toLowerCase().includes(term)) ||
      (p.evidence && p.evidence.toLowerCase().includes(term))
    ).slice(0, 15);
  }, [practices, searchTerm]);

  return (
    <div className="stats-dashboard">
      <div className="dashboard-header">
        <h2>Ontological Mapping Dashboard</h2>
        <p className="text-secondary text-sm">
          Exploring the interface between utopian theories (perspectives, categories, references) and empirical educational practices.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel animate-fade-in">
          <div className="stat-icon-wrapper p1-bg">
            <Compass className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Practices</span>
          </div>
        </div>

        <div className="stat-card glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon-wrapper p2-bg">
            <MapPin className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.geocoded}</span>
            <span className="stat-label">Geocoded on Map</span>
          </div>
        </div>

        <div className="stat-card glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon-wrapper p3-bg">
            <Network className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{categories.length}</span>
            <span className="stat-label">Theoretical Codes</span>
          </div>
        </div>

        <div className="stat-card glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon-wrapper ref-bg">
            <BookOpen className="stat-icon" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{references.length}</span>
            <span className="stat-label">Academic Texts</span>
          </div>
        </div>
      </div>

      {/* Geocoding Warning Box (Inline info) */}
      <div className="info-banner glass-panel">
        <MapPin className="banner-icon text-accent" />
        <div>
          <h4>Location Coverage</h4>
          <p className="text-sm text-secondary">
            <strong>{stats.geocoded}</strong> practices have geographical locations and appear on the map. 
            <strong> {stats.nonGeocoded}</strong> practices ({Math.round(stats.nonGeocoded / stats.total * 100)}%) are online, global, or non-specific and are visualized solely in the graph view.
          </p>
        </div>
      </div>

      {/* Perspectives / Ontology breakdown */}
      <div className="section-title">
        <h3>Ontology Perspectives</h3>
      </div>
      
      <div className="perspectives-list">
        {Object.entries(stats.catByPersp).map(([id, info]) => (
          <div key={id} className="perspective-row glass-panel">
            <div className="perspective-badge" style={{ backgroundColor: info.color }}>
              {id}
            </div>
            <div className="perspective-details">
              <h4>{info.name}</h4>
              <p className="text-xs text-secondary">{info.count} categories defined in ontology</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Search & Browse */}
      <div className="section-title">
        <h3>Quick Practice Lookup</h3>
      </div>

      <div className="search-container glass-panel">
        <Search className="search-icon text-secondary" />
        <input 
          type="text" 
          placeholder="Search by practice name, location, or evidence..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="practices-lookup-list">
        {filteredPractices.length > 0 ? (
          filteredPractices.map(p => (
            <button 
              key={p.practice_id}
              onClick={() => onSelect({ type: 'practice', id: p.practice_id })}
              className="practice-lookup-item glass-panel hover-grow"
            >
              <div className="lookup-info">
                <span className="lookup-name">{p.practice_name}</span>
                <span className="lookup-location text-secondary text-xs">
                  {p.location_string || 'No fixed location'} 
                  {p.temporal && ` • ${p.temporal}`}
                </span>
              </div>
              <ChevronRight className="lookup-arrow text-secondary" />
            </button>
          ))
        ) : (
          <p className="text-secondary text-center text-sm p-4">No practices found matching search terms.</p>
        )}
      </div>
      
      {/* Help Tips */}
      <div className="dashboard-help glass-panel text-xs text-secondary">
        <p className="font-semibold text-primary mb-1">💡 Interactive Synchronization Tips:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Map view:</strong> Click any circle marker to view details and highlight its category linkages.</li>
          <li><strong>Network view:</strong> Click a practice, category, or reference node to isolate its linkages and dim everything else.</li>
          <li><strong>Cross-view filtering:</strong> Selecting a Category or Reference in the network view automatically focuses the map on its geocoded practices.</li>
        </ul>
      </div>
    </div>
  );
}
