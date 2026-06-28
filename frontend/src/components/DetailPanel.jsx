import React, { useMemo } from 'react';
import { ArrowLeft, MapPin, Calendar, Link, Book, Layers, ShieldAlert, Award } from 'lucide-react';

export default function DetailPanel({ selection, practices, categories, references, edges, onSelect, onClear }) {
  
  // Find selected item details based on type
  const details = useMemo(() => {
    if (!selection || !selection.id) return null;
    
    if (selection.type === 'practice') {
      const practice = practices.find(p => p.practice_id === selection.id);
      if (!practice) return null;
      
      // Map reference ID to reference details if available
      const linkedRefs = (practice.linked_references || []).map(refId => {
        const ref = references.find(r => r.node_id === refId);
        return {
          id: refId,
          label: ref ? ref.label : refId,
          short: ref ? ref.short_label : refId
        };
      });

      return {
        type: 'practice',
        data: practice,
        linkedRefs
      };
    }
    
    if (selection.type === 'category') {
      const category = categories.find(c => c.node_id === selection.id);
      if (!category) return null;
      
      // Find all practices coded to this category
      const linkedPractices = practices.filter(p => 
        p.p1_id === category.node_id ||
        p.p2_id === category.node_id ||
        (p.p3_ids && p.p3_ids.includes(category.node_id))
      );

      const geocodedCount = linkedPractices.filter(p => p.geocoded).length;
      const nonGeocodedCount = linkedPractices.length - geocodedCount;

      // Find references evidencing this category
      const evRefs = edges
        .filter(e => e.target === category.node_id && e.edge_type === 'evidences')
        .map(e => {
          const ref = references.find(r => r.node_id === e.source);
          return {
            id: e.source,
            label: ref ? ref.label : e.source,
            short: ref ? ref.short_label : e.source
          };
        });

      return {
        type: 'category',
        data: category,
        linkedPractices,
        geocodedCount,
        nonGeocodedCount,
        evRefs
      };
    }
    
    if (selection.type === 'reference') {
      const reference = references.find(r => r.node_id === selection.id);
      if (!reference) return null;
      
      // Find practices that contain this reference
      const linkedPractices = practices.filter(p => 
        p.linked_references && p.linked_references.includes(reference.node_id)
      );

      const geocodedCount = linkedPractices.filter(p => p.geocoded).length;
      const nonGeocodedCount = linkedPractices.length - geocodedCount;

      // Find categories this reference evidences
      const evCats = edges
        .filter(e => e.source === reference.node_id && e.edge_type === 'evidences')
        .map(e => {
          const cat = categories.find(c => c.node_id === e.target);
          return {
            id: e.target,
            label: cat ? cat.label : e.target,
            colour: cat ? cat.colour : '#888'
          };
        });

      return {
        type: 'reference',
        data: reference,
        linkedPractices,
        geocodedCount,
        nonGeocodedCount,
        evCats
      };
    }
    
    return null;
  }, [selection, practices, categories, references, edges]);

  if (!details) {
    return (
      <div className="detail-panel-empty">
        <p className="text-secondary text-sm">Select an element on the map or graph to inspect details.</p>
      </div>
    );
  }

  return (
    <div className="detail-panel animate-slide-in">
      <button onClick={onClear} className="back-btn hover-grow">
        <ArrowLeft className="back-icon" />
        <span>Back to Dashboard</span>
      </button>

      {/* RENDER PRACTICE DETAILS */}
      {details.type === 'practice' && (
        <div className="practice-details">
          <div className="detail-header-section">
            <span className="type-badge practice-badge">Practice Record</span>
            <h2>{details.data.practice_name}</h2>
            
            <div className="practice-meta-row text-xs text-secondary">
              {details.data.location_string && (
                <div className="meta-item">
                  <MapPin className="meta-icon" />
                  <span>{details.data.location_string}</span>
                  {details.data.lat && details.data.lng && (
                    <span className="coords-badge">
                      {details.data.lat.toFixed(4)}, {details.data.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              )}
              {details.data.post_date && (
                <div className="meta-item">
                  <Calendar className="meta-icon" />
                  <span>{details.data.post_date}</span>
                </div>
              )}
              {details.data.temporal && (
                <div className="meta-item">
                  <Layers className="meta-icon animate-pulse-slow" />
                  <span className="temporal-tag">{details.data.temporal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ostrom SES Summary */}
          {details.data.ostrom_summary && Object.keys(details.data.ostrom_summary).length > 0 && (
            <div className="detail-section glass-panel">
              <h3>Ostrom SES Dimensions</h3>
              <div className="ostrom-grid">
                {Object.entries(details.data.ostrom_summary).map(([key, val]) => (
                  <div key={key} className="ostrom-item">
                    <span className="ostrom-key">{key.replace('_', ' ')}</span>
                    <p className="ostrom-val text-sm">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence text */}
          {details.data.evidence && (
            <div className="detail-section">
              <h3>Empirical Evidence</h3>
              <blockquote className="evidence-quote text-sm italic">
                "{details.data.evidence}"
              </blockquote>
            </div>
          )}

          {/* Ontology Codings */}
          <div className="detail-section">
            <h3>Ontology Coding Analysis</h3>
            
            {/* P1 Code */}
            {details.data.p1_id && (
              <div className="code-block-item p1-border-left glass-panel">
                <div className="code-block-header">
                  <span className="perspective-indicator p1-bg">P1</span>
                  <button 
                    onClick={() => onSelect({ type: 'category', id: details.data.p1_id })}
                    className="code-name-btn text-primary hover-underline font-semibold"
                  >
                    {details.data.p1_name} ({details.data.p1_id})
                  </button>
                </div>
                {details.data.p1_justification && (
                  <p className="code-justification text-xs text-secondary mt-1">
                    <strong>Justification:</strong> {details.data.p1_justification}
                  </p>
                )}
                {details.data.p1_verbatim_evidence && (
                  <div className="verbatim-block text-xs italic mt-1">
                    "{details.data.p1_verbatim_evidence}"
                  </div>
                )}
              </div>
            )}

            {/* P2 Code */}
            {details.data.p2_id && (
              <div className="code-block-item p2-border-left glass-panel mt-3">
                <div className="code-block-header">
                  <span className="perspective-indicator p2-bg">P2</span>
                  <button 
                    onClick={() => onSelect({ type: 'category', id: details.data.p2_id })}
                    className="code-name-btn text-primary hover-underline font-semibold"
                  >
                    {details.data.p2_name} ({details.data.p2_id})
                  </button>
                </div>
                {details.data.p2_justification && (
                  <p className="code-justification text-xs text-secondary mt-1">
                    <strong>Justification:</strong> {details.data.p2_justification}
                  </p>
                )}
                {details.data.p2_verbatim_evidence && (
                  <div className="verbatim-block text-xs italic mt-1">
                    "{details.data.p2_verbatim_evidence}"
                  </div>
                )}
              </div>
            )}

            {/* P3 Codes */}
            {details.data.p3_items && details.data.p3_items.length > 0 && (
              <div className="mt-3">
                {details.data.p3_items.map((item, index) => (
                  <div key={index} className="code-block-item p3-border-left glass-panel mb-2">
                    <div className="code-block-header">
                      <span className="perspective-indicator p3-bg">P3</span>
                      <button 
                        onClick={() => onSelect({ type: 'category', id: item.category_id })}
                        className="code-name-btn text-primary hover-underline font-semibold"
                      >
                        {item.category_name} ({item.category_id})
                      </button>
                    </div>
                    {item.justification && (
                      <p className="code-justification text-xs text-secondary mt-1">
                        <strong>Justification:</strong> {item.justification}
                      </p>
                    )}
                    {item.verbatim_evidence && (
                      <div className="verbatim-block text-xs italic mt-1">
                        "{item.verbatim_evidence}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked References */}
          {details.linkedRefs && details.linkedRefs.length > 0 && (
            <div className="detail-section">
              <h3>Theoretical Lineage</h3>
              <div className="references-list-panel">
                {details.linkedRefs.map(ref => (
                  <button 
                    key={ref.id}
                    onClick={() => onSelect({ type: 'reference', id: ref.id })}
                    className="ref-lookup-btn glass-panel text-left hover-grow text-xs"
                  >
                    <Book className="ref-icon text-accent" />
                    <div>
                      <span className="ref-short-label font-bold display-block">{ref.short}</span>
                      <span className="ref-full-label text-secondary display-block mt-0.5">{ref.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* External Link */}
          {details.data.post_url && (
            <a 
              href={details.data.post_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link-btn glass-panel text-center hover-grow text-sm mt-4 font-semibold"
            >
              <Link className="link-icon" />
              <span>View Original Post Source</span>
            </a>
          )}
        </div>
      )}

      {/* RENDER CATEGORY DETAILS */}
      {details.type === 'category' && (
        <div className="category-details">
          <div className="detail-header-section">
            <span 
              className="type-badge perspective-badge"
              style={{ backgroundColor: details.data.colour }}
            >
              Perspective {details.data.perspective_id}
            </span>
            <h2>{details.data.label}</h2>
            <p className="text-secondary text-xs">{details.data.perspective_name}</p>
          </div>

          <div className="detail-section glass-panel">
            <h3>Definition</h3>
            <p className="text-sm leading-relaxed">{details.data.definition}</p>
          </div>

          {details.data.coding_rule && (
            <div className="detail-section glass-panel">
              <h3>Coding Rule</h3>
              <p className="text-sm italic text-secondary">"{details.data.coding_rule}"</p>
            </div>
          )}

          {/* Evidencing Academic References */}
          {details.evRefs && details.evRefs.length > 0 && (
            <div className="detail-section">
              <h3>Evidenced By Academic References</h3>
              <div className="references-list-panel">
                {details.evRefs.map(ref => (
                  <button 
                    key={ref.id}
                    onClick={() => onSelect({ type: 'reference', id: ref.id })}
                    className="ref-lookup-btn glass-panel text-left hover-grow text-xs"
                  >
                    <Book className="ref-icon text-accent" />
                    <div>
                      <span className="ref-short-label font-bold display-block">{ref.short}</span>
                      <span className="ref-full-label text-secondary display-block">{ref.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Practices Section */}
          <div className="detail-section">
            <h3>Linked Practices ({details.linkedPractices.length})</h3>
            
            {/* Non-geocoded warning */}
            {details.nonGeocodedCount > 0 && (
              <div className="warning-banner glass-panel">
                <ShieldAlert className="warning-icon" />
                <span className="text-xs">
                  <strong>{details.nonGeocodedCount}</strong> additional practices linked to this concept have no fixed location and only appear in the graph view.
                </span>
              </div>
            )}

            <div className="linked-practices-list">
              {details.linkedPractices.map(p => (
                <button
                  key={p.practice_id}
                  onClick={() => onSelect({ type: 'practice', id: p.practice_id })}
                  className="practice-lookup-item glass-panel hover-grow"
                >
                  <div className="lookup-info">
                    <span className="lookup-name">{p.practice_name}</span>
                    <span className="lookup-location text-secondary text-xs">
                      {p.location_string || 'No fixed location'} {p.geocoded && '📍'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER REFERENCE DETAILS */}
      {details.type === 'reference' && (
        <div className="reference-details">
          <div className="detail-header-section">
            <span className="type-badge reference-badge">Academic Reference</span>
            <h2>{details.data.short_label.toUpperCase()}</h2>
          </div>

          <div className="detail-section glass-panel">
            <h3>Full Citation</h3>
            <p className="text-sm leading-relaxed">{details.data.label}</p>
          </div>

          {/* Evidenced Categories */}
          {details.evCats && details.evCats.length > 0 && (
            <div className="detail-section">
              <h3>Theorised Concepts</h3>
              <div className="chips-flex mt-2">
                {details.evCats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => onSelect({ type: 'category', id: cat.id })}
                    className="cat-chip-btn hover-grow text-xs"
                    style={{ borderLeft: `3px solid ${cat.colour}` }}
                  >
                    {cat.label} ({cat.id})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Practices Section */}
          <div className="detail-section">
            <h3>Linked Practices ({details.linkedPractices.length})</h3>

            {/* Non-geocoded warning */}
            {details.nonGeocodedCount > 0 && (
              <div className="warning-banner glass-panel">
                <ShieldAlert className="warning-icon" />
                <span className="text-xs">
                  <strong>{details.nonGeocodedCount}</strong> additional practices linked to this reference have no fixed location and only appear in the graph view.
                </span>
              </div>
            )}

            <div className="linked-practices-list">
              {details.linkedPractices.map(p => (
                <button
                  key={p.practice_id}
                  onClick={() => onSelect({ type: 'practice', id: p.practice_id })}
                  className="practice-lookup-item glass-panel hover-grow"
                >
                  <div className="lookup-info">
                    <span className="lookup-name">{p.practice_name}</span>
                    <span className="lookup-location text-secondary text-xs">
                      {p.location_string || 'No fixed location'} {p.geocoded && '📍'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
