// Shared category styling and label utilities.
// Import from here instead of duplicating across components.

export const P1_COLORS = {
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

export const P2_COLOR = '#10b981';
export const P3_COLOR = '#f59e0b';

export function getCategoryColor(id) {
  if (!id) return '#888';
  if (id.startsWith('P1')) return P1_COLORS[id] || '#6366f1';
  if (id.startsWith('P2')) return P2_COLOR;
  return P3_COLOR;
}

/** Returns the perspective prefix — 'P1', 'P2', or 'P3'. */
export function getPerspectiveLabel(id) {
  if (!id) return '';
  return id.split('-')[0];
}

/** Best available verbatim quote for a practice record. */
export function getBestQuote(practice) {
  return (
    practice.p1_verbatim_evidence
    || practice.p3_items?.[0]?.verbatim_evidence
    || practice.evidence
    || practice.post_title
    || practice.practice_name
    || ''
  );
}
