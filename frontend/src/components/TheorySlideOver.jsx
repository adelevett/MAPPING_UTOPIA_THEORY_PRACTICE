import React, { useMemo, useState } from 'react';
import { X, ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react';
import { getCategoryColor, getBestQuote } from '../utils/categoryStyle';

export default function TheorySlideOver({
  referenceId,
  referencesResolved,   // array from references_resolved.json
  codedMatrix,          // array from coded_matrix.json
  nextBestThings,       // object from next_best_things.json
  practices,
  categories,           // from category_index.json
  onClose,
  onNavigatePractice,   // (id) opens StorySheet for that practice
}) {
  const [passageExpanded, setPassageExpanded] = useState(false);

  const refData = useMemo(
    () => referencesResolved?.find(r => r.id === referenceId),
    [referencesResolved, referenceId]
  );

  const matrixEntry = useMemo(
    () => codedMatrix?.find(r => r.id === referenceId),
    [codedMatrix, referenceId]
  );

  const nbt = useMemo(
    () => nextBestThings?.[referenceId],
    [nextBestThings, referenceId]
  );

  const linkedPractices = useMemo(
    () => practices?.filter(p => p.linked_references?.includes(referenceId)).slice(0, 9) || [],
    [practices, referenceId]
  );

  const openAccessPapers = useMemo(() => {
    const items = [];
    if (nbt?.open_access_citations) items.push(...nbt.open_access_citations);
    if (nbt?.open_access_author_papers) items.push(...nbt.open_access_author_papers);
    return items.filter(p => p.pdf_url).slice(0, 5);
  }, [nbt]);

  if (!refData) return null;

  const { metadata, availability } = refData;
  const summary = availability?.summary?.text;
  const extended = availability?.summary?.extended;
  const passage = extended
    ? (passageExpanded ? extended : extended.slice(0, 500) + (extended.length > 500 ? '…' : ''))
    : null;

  const authorShort = metadata?.authors?.[0]?.split(',')[0] || '';
  const year = metadata?.year || '';

  return (
    <div className="theory-slide-over animate-slide-in-right" id="theory-slide-over" role="complementary" aria-label="Theory reference detail">
      <div className="tso-header">
        <div className="tso-header-meta">
          <BookOpen size={16} className="tso-book-icon" />
          <span className="tso-ref-type">{refData.type || 'reference'}</span>
        </div>
        <button className="tso-close-btn" onClick={onClose} id="tso-close-btn" aria-label="Close theory panel">
          <X size={16} />
        </button>
      </div>

      <div className="tso-body scrollbar-custom">
        {/* Identity */}
        <div className="tso-identity">
          <h2 className="tso-author">{authorShort}</h2>
          <h3 className="tso-title">{metadata?.title}</h3>
          <p className="tso-year">{metadata?.publication}{year ? `, ${year}` : ''}</p>
        </div>

        <div className="tso-citation glass-panel">
          <p className="tso-citation-text">{refData.citation_raw}</p>
        </div>

        {/* About this text */}
        {summary && (
          <div className="tso-section">
            <h4 className="tso-section-title">About this text</h4>
            <p className="tso-summary">{summary}</p>
          </div>
        )}

        {/* Key passage */}
        {passage && (
          <div className="tso-section">
            <h4 className="tso-section-title">Key passage</h4>
            <blockquote className="tso-passage">
              &ldquo;{passage}&rdquo;
            </blockquote>
            {extended && extended.length > 500 && (
              <button
                className="tso-expand-btn"
                onClick={() => setPassageExpanded(e => !e)}
                id="tso-expand-passage-btn"
              >
                {passageExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read full passage</>}
              </button>
            )}
          </div>
        )}

        {/* Concepts theorized */}
        {matrixEntry?.applied_codes?.length > 0 && (
          <div className="tso-section">
            <h4 className="tso-section-title">Theoretical concepts covered</h4>
            <div className="tso-concepts">
              {matrixEntry.applied_codes.map(code => {
                const cat = categories?.find(c => c.node_id === code.category_id);
                const color = getCategoryColor(code.category_id);
                return (
                  <div
                    key={code.category_id}
                    className="tso-concept-row"
                    style={{ borderLeftColor: color }}
                    id={`tso-concept-${code.category_id}`}
                  >
                    <div className="tso-concept-header">
                      <span
                        className="tso-concept-badge"
                        style={{ backgroundColor: color }}
                      >
                        {code.category_id}
                      </span>
                      <span className="tso-concept-name">{cat?.label || code.category_id}</span>
                    </div>
                    {code.verbatim_evidence && (
                      <p className="tso-concept-evidence">
                        &ldquo;{code.verbatim_evidence}&rdquo;
                      </p>
                    )}
                    {code.justification && (
                      <p className="tso-concept-justification">{code.justification}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Practices citing this text */}
        {linkedPractices.length > 0 && (
          <div className="tso-section">
            <h4 className="tso-section-title">
              {linkedPractices.length < practices?.filter(p => p.linked_references?.includes(referenceId)).length
                ? `${practices.filter(p => p.linked_references?.includes(referenceId)).length} practices link to this text`
                : `${linkedPractices.length} practices link to this text`
              }
            </h4>
            <div className="tso-practice-grid">
              {linkedPractices.map(p => {
                const q = getBestQuote(p);
                return (
                  <button
                    key={p.practice_id}
                    className="tso-practice-card"
                    onClick={() => onNavigatePractice(p.practice_id)}
                    id={`tso-practice-${p.practice_id}`}
                  >
                    <p className="tso-practice-quote">&ldquo;{q.length > 70 ? q.slice(0, 70) + '…' : q}&rdquo;</p>
                    <span className="tso-practice-name">{p.practice_name}</span>
                    {p.location_string && <span className="tso-practice-location">{p.location_string}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Further reading */}
        {openAccessPapers.length > 0 && (
          <div className="tso-section">
            <h4 className="tso-section-title">Further reading (open access)</h4>
            <div className="tso-further-reading">
              {openAccessPapers.map((paper, i) => (
                <a
                  key={i}
                  href={paper.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tso-paper-card"
                  id={`tso-paper-${i}`}
                >
                  <div className="tso-paper-top">
                    <span className="tso-paper-title">{paper.title}</span>
                    <ExternalLink size={12} className="tso-paper-icon" />
                  </div>
                  <span className="tso-paper-meta">
                    {paper.authors?.slice(0, 2).join(', ')} · {paper.year} · {paper.venue}
                  </span>
                  {paper.abstract && (
                    <p className="tso-paper-abstract">
                      {paper.abstract.length > 180 ? paper.abstract.slice(0, 180) + '…' : paper.abstract}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
