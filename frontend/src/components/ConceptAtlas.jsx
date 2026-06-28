import React, { useMemo, useState } from 'react';
import { ChevronRight, MapIcon } from 'lucide-react';

const P1_COLORS = {
  'P1-C1':  '#6366f1', 'P1-C2':  '#8b5cf6', 'P1-C3':  '#ec4899',
  'P1-C4':  '#14b8a6', 'P1-C5':  '#f97316', 'P1-C6':  '#06b6d4',
  'P1-C7':  '#f43f5e', 'P1-C8':  '#a855f7', 'P1-C9':  '#3b82f6',
  'P1-C10': '#84cc16', 'P1-C11': '#f59e0b', 'P1-C12': '#10b981',
  'P1-C13': '#64748b', 'P1-C14': '#d946ef',
};

function getCategoryColor(id) {
  if (!id) return '#888';
  if (id.startsWith('P1')) return P1_COLORS[id] || '#6366f1';
  if (id.startsWith('P2')) return '#10b981';
  return '#f59e0b';
}

function getBestQuote(practice) {
  return practice.p1_verbatim_evidence
    || (practice.p3_items?.[0]?.verbatim_evidence)
    || practice.evidence
    || practice.post_title
    || practice.practice_name;
}

const PERSPECTIVE_META = {
  P1: {
    label: 'Typologies of Visionary Constructs',
    color: '#6366f1',
    description: 'Categorizes the theoretical nature of imagined futures — what kind of utopia or dystopia is being invoked, and what sociopolitical stance it encodes.',
  },
  P2: {
    label: 'Speculative Methodologies',
    color: '#10b981',
    description: 'Captures the structured tools and narrative approaches used to generate and explore alternative educational futures — how the imagining gets done.',
  },
  P3: {
    label: 'Pedagogical Affects',
    color: '#f59e0b',
    description: 'Identifies the emotional and critical forces at work — hope, fear, provocation, crisis-awakening — that shape how learners engage with transformative visions.',
  },
};

function CategoryCard({
  category,
  ontologyCategory,
  practices,
  codedMatrixEntry,
  expandedId,
  onExpand,
  onOpenReference,
  onNavigatePractice,
  onSeeOnMap,
}) {
  const categoryId = category.node_id;
  const color = getCategoryColor(categoryId);
  const isExpanded = expandedId === categoryId;

  // Linked practices
  const linkedPractices = useMemo(() => {
    return practices.filter(p =>
      p.p1_id === categoryId ||
      p.p2_id === categoryId ||
      (p.p3_ids && p.p3_ids.includes(categoryId))
    );
  }, [practices, categoryId]);

  // Anchor quote: use ontology anchor_example as display quote, fall back to first practice
  const anchorQuote = ontologyCategory?.anchor_example
    || (linkedPractices[0] ? getBestQuote(linkedPractices[0]) : '');

  // References theorizing this category
  const theoristedBy = codedMatrixEntry || [];

  return (
    <div
      className={`atlas-card ${isExpanded ? 'atlas-card--expanded' : ''}`}
      id={`atlas-card-${categoryId}`}
      style={{ borderLeftColor: color }}
    >
      {/* Collapsed header — always visible */}
      <button
        className="atlas-card-header"
        onClick={() => onExpand(isExpanded ? null : categoryId)}
        id={`atlas-card-toggle-${categoryId}`}
        aria-expanded={isExpanded}
      >
        <div className="atlas-card-header-top">
          <span className="atlas-category-id" style={{ color }}>{categoryId}</span>
          <span className="atlas-practice-count">{linkedPractices.length}</span>
          <ChevronRight
            size={14}
            className={`atlas-expand-chevron ${isExpanded ? 'atlas-expand-chevron--open' : ''}`}
          />
        </div>
        <h3 className="atlas-category-name">{category.label}</h3>

        {!isExpanded && anchorQuote && (
          <p className="atlas-anchor-quote">
            &ldquo;{anchorQuote.length > 100 ? anchorQuote.slice(0, 100) + '…' : anchorQuote}&rdquo;
          </p>
        )}

        {!isExpanded && theoristedBy.length > 0 && (
          <div className="atlas-theorized-by">
            <span className="atlas-theorized-label">theorized by</span>
            {theoristedBy.slice(0, 3).map(r => (
              <span key={r.id} className="atlas-ref-chip">{r.id.replace(/_\d+$/, '').replace(/_/g, ' ')}</span>
            ))}
          </div>
        )}
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="atlas-card-body">
          {/* Definition */}
          <div className="atlas-section">
            <h4 className="atlas-section-title">Definition</h4>
            <p className="atlas-definition">{category.definition}</p>
          </div>

          {/* Coding rule */}
          {category.coding_rule && (
            <div className="atlas-section">
              <h4 className="atlas-section-title">When to apply</h4>
              <p className="atlas-coding-rule">{category.coding_rule}</p>
            </div>
          )}

          {/* Theorized by — reference cards */}
          {theoristedBy.length > 0 && (
            <div className="atlas-section">
              <h4 className="atlas-section-title">Theorized by</h4>
              <div className="atlas-ref-cards">
                {theoristedBy.map(ref => {
                  const code = ref.applied_codes?.find(c => c.category_id === categoryId);
                  return (
                    <div key={ref.id} className="atlas-ref-card">
                      <div className="atlas-ref-card-top">
                        <span className="atlas-ref-key">{ref.id.replace(/_/g, ' ')}</span>
                        <button
                          className="atlas-explore-btn"
                          onClick={() => onOpenReference(ref.id)}
                          id={`atlas-explore-${ref.id}-${categoryId}`}
                        >
                          explore <ChevronRight size={11} />
                        </button>
                      </div>
                      {code?.verbatim_evidence && (
                        <p className="atlas-ref-evidence">
                          &ldquo;{code.verbatim_evidence.length > 180
                            ? code.verbatim_evidence.slice(0, 180) + '…'
                            : code.verbatim_evidence}&rdquo;
                        </p>
                      )}
                      {code?.justification && (
                        <p className="atlas-ref-justification">{code.justification}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practice gallery */}
          {linkedPractices.length > 0 && (
            <div className="atlas-section">
              <h4 className="atlas-section-title">Practice gallery ({linkedPractices.length})</h4>
              <div className="atlas-practice-gallery scrollbar-custom">
                {linkedPractices.slice(0, 12).map(p => {
                  const q = getBestQuote(p);
                  return (
                    <button
                      key={p.practice_id}
                      className="atlas-practice-card"
                      onClick={() => onNavigatePractice(p.practice_id)}
                      id={`atlas-practice-${p.practice_id}`}
                    >
                      <p className="atlas-practice-quote">&ldquo;{q.length > 80 ? q.slice(0, 80) + '…' : q}&rdquo;</p>
                      <span className="atlas-practice-name">{p.practice_name}</span>
                      {p.location_string && (
                        <span className="atlas-practice-location">{p.location_string}</span>
                      )}
                      {p.temporal && (
                        <span className="atlas-practice-temporal">{p.temporal}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* See on Map */}
          <button
            className="atlas-see-on-map-btn"
            onClick={() => onSeeOnMap(categoryId)}
            id={`atlas-see-on-map-${categoryId}`}
          >
            <MapIcon size={14} /> See on Map
          </button>
        </div>
      )}
    </div>
  );
}

export default function ConceptAtlas({
  categories,       // from category_index.json
  ontology,         // from ontology.json
  codedMatrix,      // array from coded_matrix.json
  practices,
  expandedConceptId,
  onExpandConcept,  // (id | null)
  onOpenReference,  // (refId) → opens TheorySlideOver
  onNavigatePractice, // (practiceId) → opens StorySheet
  onSeeOnMap,       // (categoryId) → switch to map + set filter
}) {
  // Build ontology lookup: categoryId → ontology category object
  const ontologyLookup = useMemo(() => {
    const lookup = {};
    ontology?.perspectives?.forEach(p => {
      p.categories.forEach(c => {
        lookup[c.category_id] = c;
      });
    });
    return lookup;
  }, [ontology]);

  // Build coded_matrix lookup: categoryId → [matrix entries that include this code]
  const matrixByCategoryId = useMemo(() => {
    const lookup = {};
    codedMatrix?.forEach(ref => {
      ref.applied_codes?.forEach(code => {
        if (!lookup[code.category_id]) lookup[code.category_id] = [];
        lookup[code.category_id].push(ref);
      });
    });
    return lookup;
  }, [codedMatrix]);

  // Group categories by perspective
  const grouped = useMemo(() => {
    const g = { P1: [], P2: [], P3: [] };
    categories.forEach(cat => {
      const pid = cat.perspective_id || cat.node_id?.split('-')[0];
      if (g[pid]) g[pid].push(cat);
    });
    return g;
  }, [categories]);

  return (
    <div className="concept-atlas" id="concept-atlas">
      <div className="atlas-columns">
        {['P1', 'P2', 'P3'].map(pid => {
          const meta = PERSPECTIVE_META[pid];
          return (
            <div key={pid} className="atlas-column">
              {/* Sticky column header */}
              <div className="atlas-column-header" style={{ borderTopColor: meta.color }}>
                <div className="atlas-column-header-top">
                  <span
                    className="atlas-perspective-badge"
                    style={{ backgroundColor: meta.color }}
                  >
                    {pid}
                  </span>
                  <span className="atlas-column-title">{meta.label}</span>
                </div>
                <p className="atlas-column-description">{meta.description}</p>
              </div>

              {/* Cards */}
              <div className="atlas-column-cards">
                {(grouped[pid] || []).map(cat => (
                  <CategoryCard
                    key={cat.node_id}
                    category={cat}
                    ontologyCategory={ontologyLookup[cat.node_id]}
                    practices={practices}
                    codedMatrixEntry={matrixByCategoryId[cat.node_id] || []}
                    expandedId={expandedConceptId}
                    onExpand={onExpandConcept}
                    onOpenReference={onOpenReference}
                    onNavigatePractice={onNavigatePractice}
                    onSeeOnMap={onSeeOnMap}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
