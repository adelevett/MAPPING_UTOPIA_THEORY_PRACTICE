import React from 'react';
import { parseOstromField } from '../data/ostrom_codes';

const FIELD_LABELS = {
  resource_system: 'Resource System',
  users: 'People',
  interactions: 'Activities',
  outcomes: 'Outcomes',
  governance_system: 'Governance',
};

export default function OstromNarrative({ ostromSummary }) {
  if (!ostromSummary || Object.keys(ostromSummary).length === 0) return null;

  return (
    <div className="ostrom-narrative">
      {Object.entries(ostromSummary).map(([field, value]) => {
        const parsed = parseOstromField(value);
        if (parsed.length === 0) return null;
        return (
          <div key={field} className="ostrom-narrative-row">
            <span className="ostrom-field-label">
              {FIELD_LABELS[field] || field.replace('_', ' ')}
            </span>
            <div className="ostrom-items">
              {parsed.map((item, i) => (
                <div key={i} className="ostrom-item-row">
                  <span className="ostrom-icon" aria-hidden="true">{item.icon}</span>
                  <span className="ostrom-detail">{item.detail || item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
