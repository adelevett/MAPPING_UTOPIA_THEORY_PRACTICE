// Ostrom Socio-Ecological System (SES) framework code lookup.
// Maps short code tokens to a human-readable icon and label.
// Covers Resource System (RS), Governance System (GS), Users (U),
// Interactions (I), and Outcomes (O) tiers.

export const OSTROM_CODES = {
  // Resource System
  RS1:  { icon: '🏷️', label: 'Resource Sector' },
  RS2:  { icon: '📊', label: 'Clarity of System Boundaries' },
  RS3:  { icon: '🌀', label: 'Resource System Productivity' },
  RS4:  { icon: '🏗️', label: 'Human-Constructed Facilities' },
  RS5:  { icon: '🔄', label: 'System Equilibrium' },
  RS6:  { icon: '🧩', label: 'System Predictability' },
  RS7:  { icon: '💾', label: 'Resource Storage' },
  RS8:  { icon: '📍', label: 'Location' },
  RS9:  { icon: '🗺️', label: 'Location / Setting' },

  // Resource Units
  RU1:  { icon: '🌿', label: 'Resource Unit Mobility' },
  RU2:  { icon: '📈', label: 'Growth / Replacement Rate' },
  RU3:  { icon: '🔁', label: 'Interaction Among Units' },
  RU4:  { icon: '⚖️', label: 'Economic Value' },
  RU5:  { icon: '🔢', label: 'Number of Units' },
  RU6:  { icon: '🎯', label: 'Distinctive Markings' },
  RU7:  { icon: '🌐', label: 'Spatial / Temporal Distribution' },

  // Governance System
  GS1:  { icon: '🏛️', label: 'Government Organisations' },
  GS2:  { icon: '📜', label: 'Non-government Organisations' },
  GS3:  { icon: '⚖️', label: 'Network Structure' },
  GS4:  { icon: '📋', label: 'Property-rights Systems' },
  GS5:  { icon: '🤝', label: 'Operational Rules' },
  GS6:  { icon: '📐', label: 'Collective-choice Rules' },
  GS7:  { icon: '🏗️', label: 'Constitutional Rules' },
  GS8:  { icon: '🔍', label: 'Monitoring & Sanctioning Processes' },

  // Users
  U1:   { icon: '👥', label: 'Number of Users' },
  U2:   { icon: '🌍', label: 'Socioeconomic Attributes' },
  U3:   { icon: '📚', label: 'History of Use' },
  U4:   { icon: '📍', label: 'Location' },
  U5:   { icon: '🌟', label: 'Leadership / Entrepreneurship' },
  U6:   { icon: '🧭', label: 'Norms / Social Capital' },
  U7:   { icon: '💡', label: 'Knowledge of SES' },
  U8:   { icon: '🏷️', label: 'Importance of Resource' },
  U9:   { icon: '🔧', label: 'Technology Used' },

  // Interactions
  I1:   { icon: '🌾', label: 'Harvesting Levels' },
  I2:   { icon: '💬', label: 'Information Sharing' },
  I3:   { icon: '🤝', label: 'Deliberation Processes' },
  I4:   { icon: '🔗', label: 'Conflicts among Users' },
  I5:   { icon: '🌱', label: 'Investment Activities' },
  I6:   { icon: '🏠', label: 'Lobbying Activities' },
  I7:   { icon: '🌀', label: 'Self-organising Activities' },
  I8:   { icon: '🌐', label: 'Networking Activities' },

  // Outcomes
  O1:   { icon: '🌿', label: 'Social Performance' },
  O2:   { icon: '♻️', label: 'Ecological Performance' },
  O3:   { icon: '🏛️', label: 'Externalities to Other SES' },
};

/**
 * Parse an Ostrom summary field value (e.g. "RS1 sector: Solar restaurant; RS4 ...") 
 * into an array of { code, icon, label, detail } objects.
 * Handles semicolon-separated entries, each starting with a code token.
 */
export function parseOstromField(fieldValue) {
  if (!fieldValue) return [];
  return fieldValue
    .split(/;\s*/)
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .map(chunk => {
      // Match leading code token like RS1, GS7, U5, I3, O2, RU4
      const match = chunk.match(/^([A-Z]{1,2}\d{1,2})\s*(.*)/);
      if (!match) return null;
      const code = match[1];
      const detail = match[2].replace(/^[:\-–]\s*/, '').trim();
      const lookup = OSTROM_CODES[code];
      return {
        code,
        icon: lookup?.icon ?? '📌',
        label: lookup?.label ?? code,
        detail,
      };
    })
    .filter(Boolean);
}
