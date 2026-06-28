import React, { useMemo, useRef } from 'react';
import { ArrowLeft, X, MapPin, ExternalLink, ChevronRight } from 'lucide-react';
import OstromNarrative from './OstromNarrative';

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

function getCategoryColor(id) {
  if (!id) return '#888';
  if (id.startsWith('P1')) return P1_COLORS[id] || '#6366f1';
  if (id.startsWith('P2')) return P2_COLOR;
  return P3_COLOR;
}

function getPerspectiveLabel(id) {
  if (!id) return '';
  return id.split('-')[0]; // 'P1', 'P2', 'P3'
}

// Derive the best available verbatim quote for display
function getBestQuote(practice) {
  if (practice.p1_verbatim_evidence) return practice.p1_verbatim_evidence;
  if (practice.p3_items && practice.p3_items.length > 0 && practice.p3_items[0].verbatim_evidence) {
    return practice.p3_items[0].verbatim_evidence;
  }
  if (practice.evidence) return practice.evidence;
  if (practice.post_title) return practice.post_title;
  return practice.practice_name;
}

// Score relatedness between two practices (shared category codes)
function getRelatednessScore(a, b) {
  let score = 0;
  if (a.p1_id && a.p1_id === b.p1_id) score += 3;
  if (a.p2_id && a.p2_id === b.p2_id) score += 2;
  const aP3 = new Set(a.p3_ids || []);
  (b.p3_ids || []).forEach(id => { if (aP3.has(id)) score += 1; });
  return score;
}

export default function StorySheet({
  practiceId,
  practices,
  codedMatrix,          // array from coded_matrix.json
  onClose,
  onNavigate,           // (practiceId) → navigate sheet to another practice
  onFilterByCategory,   // (categoryId) → sets activeFilters
  onOpenReference,      // (referenceId) → opens TheorySlideOver
  onShowOnMap,          // () → switches to map view
}) {
  const relatedScrollRef = useRef(null);

  const practice = useMemo(
    () => practices.find(p => p.practice_id === practiceId),
    [practiceId, practices]
  );

  // All category codes on this practice
  const allCategoryCodes = useMemo(() => {
    if (!practice) return [];
    const codes = [];
    if (practice.p1_id) codes.push({ id: practice.p1_id, name: practice.p1_name, perspective: 'P1' });
    if (practice.p2_id) codes.push({ id: practice.p2_id, name: practice.p2_name, perspective: 'P2' });
    (practice.p3_items || []).forEach(item =>
      codes.push({ id: item.category_id, name: item.category_name, perspective: 'P3' })
    );
    return codes;
  }, [practice]);

  // Theory entries: coded_matrix entries for this practice's linked references
  const theoryEntries = useMemo(() => {
    if (!practice || !codedMatrix) return [];
    const refIds = new Set(practice.linked_references || []);
    return codedMatrix
      .filter(ref => refIds.has(ref.id))
      .map(ref => {
        // Find the most relevant code for this practice
        const practiceCodeIds = new Set([
          practice.p1_id,
          practice.p2_id,
          ...(practice.p3_ids || []),
        ].filter(Boolean));

        const matchingCode = ref.applied_codes.find(c => practiceCodeIds.has(c.category_id))
          || ref.applied_codes[0];

        return {
          refId: ref.id,
          citation: ref.citation_raw,
          code: matchingCode,
        };
      })
      .filter(e => e.code)
      .slice(0, 4); // Show max 4 theory cards
  }, [practice, codedMatrix]);

  // Related practices scored by shared codes
  const relatedPractices = useMemo(() => {
    if (!practice) return [];
    return practices
      .filter(p => p.practice_id !== practice.practice_id)
      .map(p => ({ practice: p, score: getRelatednessScore(practice, p) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ practice: p }) => p);
  }, [practice, practices]);

  if (!practice) return null;

  const quote = getBestQuote(practice);

  // Shorten author key from citation_raw (e.g. "bloch_1986" → "Bloch 1986")
  const formatRefKey = (refId) =>
    refId.replace(/_/g, ' ').replace(/\b(\w)/g, c => c.toUpperCase());

  return (
    <div className="story-sheet animate-slide-in-right" id="story-sheet" role="complementary" aria-label="Practice detail">
      {/* Header */}
      <div className="story-sheet-header">
        <button className="ss-back-btn" onClick={onClose} id="story-sheet-close-btn" aria-label="Close story sheet">
          <X size={16} />
        </button>
      </div>

      <div className="story-sheet-body scrollbar-custom">
        {/* Pull Quote */}
        <blockquote className="ss-pull-quote">
          &ldquo;{quote.length > 200 ? quote.slice(0, 200) + '…' : quote}&rdquo;
        </blockquote>

        {/* Practice Identity */}
        <div className="ss-identity">
          <h2 className="ss-practice-name">{practice.practice_name}</h2>
          <div className="ss-meta">
            {practice.location_string && (
              <span className="ss-meta-item">
                <MapPin size={12} /> {practice.location_string}
              </span>
            )}
            {practice.temporal && (
              <span className="ss-temporal-tag">{practice.temporal}</span>
            )}
          </div>
        </div>

        {/* What this embodies */}
        {allCategoryCodes.length > 0 && (
          <div className="ss-section">
            <h3 className="ss-section-title">What this embodies</h3>
            <div className="ss-concept-pills">
              {allCategoryCodes.map(code => (
                <button
                  key={code.id}
                  className="ss-concept-pill"
                  onClick={() => onFilterByCategory(code.id)}
                  id={`ss-pill-${code.id}`}
                  style={{ borderColor: getCategoryColor(code.id), color: getCategoryColor(code.id) }}
                  title="Click to filter map to this concept"
                >
                  <span
                    className="ss-pill-dot"
                    style={{ backgroundColor: getCategoryColor(code.id) }}
                  />
                  <span className="ss-pill-perspective">{getPerspectiveLabel(code.id)}</span>
                  {code.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* What happened (Ostrom) */}
        {practice.ostrom_summary && Object.keys(practice.ostrom_summary).length > 0 && (
          <div className="ss-section">
            <h3 className="ss-section-title">What happened</h3>
            <div className="ss-ostrom-box">
              <OstromNarrative ostromSummary={practice.ostrom_summary} />
            </div>
          </div>
        )}

        {/* The theory behind it */}
        {theoryEntries.length > 0 && (
          <div className="ss-section">
            <h3 className="ss-section-title">The theory behind it</h3>
            <div className="ss-theory-cards">
              {theoryEntries.map(entry => (
                <div key={entry.refId} className="ss-theory-card">
                  <div className="ss-theory-ref-key">{formatRefKey(entry.refId)}</div>
                  {entry.code?.verbatim_evidence && (
                    <p className="ss-theory-passage">
                      &ldquo;{entry.code.verbatim_evidence.length > 160
                        ? entry.code.verbatim_evidence.slice(0, 160) + '…'
                        : entry.code.verbatim_evidence}&rdquo;
                    </p>
                  )}
                  <button
                    className="ss-theory-explore-btn"
                    onClick={() => onOpenReference(entry.refId)}
                    id={`ss-theory-explore-${entry.refId}`}
                  >
                    explore <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related practices */}
        {relatedPractices.length > 0 && (
          <div className="ss-section">
            <h3 className="ss-section-title">
              {relatedPractices.length} practices sharing this lens
            </h3>
            <div className="ss-related-scroll scrollbar-custom" ref={relatedScrollRef}>
              {relatedPractices.map(p => {
                const q = getBestQuote(p);
                return (
                  <button
                    key={p.practice_id}
                    className="ss-related-card"
                    onClick={() => onNavigate(p.practice_id)}
                    id={`ss-related-${p.practice_id}`}
                  >
                    <p className="ss-related-quote">&ldquo;{q.length > 80 ? q.slice(0, 80) + '…' : q}&rdquo;</p>
                    <span className="ss-related-name">{p.practice_name}</span>
                    {p.location_string && (
                      <span className="ss-related-location">{p.location_string}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* External link */}
        {practice.post_url && (
          <a
            href={practice.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ss-external-link"
            id="ss-post-url"
          >
            <ExternalLink size={14} /> View original post
          </a>
        )}
      </div>
    </div>
  );
}
