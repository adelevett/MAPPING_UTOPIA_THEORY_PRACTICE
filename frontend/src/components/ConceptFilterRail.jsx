import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// P1 gets 14 distinct colors, P2 and P3 use their perspective color
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

const P2_COLOR = '#10b981';
const P3_COLOR = '#f59e0b';

function getCategoryColor(categoryId) {
  if (categoryId.startsWith('P1')) return P1_COLORS[categoryId] || '#6366f1';
  if (categoryId.startsWith('P2')) return P2_COLOR;
  return P3_COLOR;
}

const PERSPECTIVE_LABELS = {
  P1: { label: 'Typologies', description: 'What kind of future is imagined?' },
  P2: { label: 'Methods', description: 'How is that future constructed or explored?' },
  P3: { label: 'Affects', description: 'What emotional or pedagogical force drives it?' },
};

export default function ConceptFilterRail({ categories, practices, activeFilters, onFiltersChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedPerspectives, setExpandedPerspectives] = useState({ P1: true, P2: false, P3: false });

  // Count geocoded practices per category
  const countsByCategory = useMemo(() => {
    const counts = {};
    practices.forEach(p => {
      if (!p.geocoded) return;
      if (p.p1_id) counts[p.p1_id] = (counts[p.p1_id] || 0) + 1;
      if (p.p2_id) counts[p.p2_id] = (counts[p.p2_id] || 0) + 1;
      (p.p3_ids || []).forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [practices]);

  const grouped = useMemo(() => {
    const g = { P1: [], P2: [], P3: [] };
    categories.forEach(cat => {
      const pid = cat.perspective_id || cat.node_id?.split('-')[0];
      if (g[pid]) g[pid].push(cat);
    });
    return g;
  }, [categories]);

  const toggleFilter = (id) => {
    const next = new Set(activeFilters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltersChange(next);
  };

  const togglePerspective = (pid) => {
    setExpandedPerspectives(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  const clearAll = () => onFiltersChange(new Set());

  return (
    <div className={`filter-rail ${collapsed ? 'filter-rail--collapsed' : ''}`} id="concept-filter-rail">
      <button
        className="filter-rail-toggle"
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand filter rail' : 'Collapse filter rail'}
        id="filter-rail-toggle-btn"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {!collapsed && (
        <div className="filter-rail-inner scrollbar-custom">
          <div className="filter-rail-header">
            <span className="filter-rail-title">Concept Filters</span>
            {activeFilters.size > 0 && (
              <button className="filter-clear-btn" onClick={clearAll} id="filter-clear-all-btn">
                <X size={12} /> Clear {activeFilters.size}
              </button>
            )}
          </div>

          {['P1', 'P2', 'P3'].map(pid => (
            <div key={pid} className="filter-perspective-group">
              <button
                className="filter-perspective-header"
                onClick={() => togglePerspective(pid)}
                id={`filter-group-${pid}`}
              >
                <span
                  className="filter-perspective-badge"
                  style={{ backgroundColor: pid === 'P1' ? '#6366f1' : pid === 'P2' ? P2_COLOR : P3_COLOR }}
                >
                  {pid}
                </span>
                <span className="filter-perspective-label">{PERSPECTIVE_LABELS[pid].label}</span>
                <span className="filter-perspective-count">
                  {grouped[pid]?.filter(c => activeFilters.has(c.node_id)).length > 0
                    ? `${grouped[pid].filter(c => activeFilters.has(c.node_id)).length} active`
                    : grouped[pid]?.length}
                </span>
                <ChevronRight
                  size={12}
                  className={`filter-chevron ${expandedPerspectives[pid] ? 'filter-chevron--open' : ''}`}
                />
              </button>

              {expandedPerspectives[pid] && (
                <div className="filter-pills">
                  {(grouped[pid] || []).map(cat => {
                    const active = activeFilters.has(cat.node_id);
                    const count = countsByCategory[cat.node_id] || 0;
                    const color = getCategoryColor(cat.node_id);
                    return (
                      <button
                        key={cat.node_id}
                        className={`filter-pill ${active ? 'filter-pill--active' : ''}`}
                        onClick={() => toggleFilter(cat.node_id)}
                        id={`filter-pill-${cat.node_id}`}
                        style={active ? { borderColor: color, backgroundColor: `${color}22` } : {}}
                        title={cat.label}
                      >
                        <span
                          className="filter-pill-dot"
                          style={{ backgroundColor: color }}
                        />
                        <span className="filter-pill-name">{cat.label}</span>
                        <span className="filter-pill-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
