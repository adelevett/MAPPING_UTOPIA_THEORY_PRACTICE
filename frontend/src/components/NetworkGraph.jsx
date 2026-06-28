import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function NetworkGraph({ practices, categories, references, edges, selection, onSelect }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // 1. Build and configure graph elements and layout
  useEffect(() => {
    if (!containerRef.current) return;

    // Build Nodes
    const elements = [];

    // Order categories by perspective for circular alignment
    const orderedCats = [...categories].sort((a, b) => {
      if (a.perspective_id !== b.perspective_id) {
        return a.perspective_id.localeCompare(b.perspective_id);
      }
      return a.node_id.localeCompare(b.node_id);
    });

    const R_cat = 320;
    const catPositions = {};

    // A. Add Category Nodes in a circle
    orderedCats.forEach((cat, idx) => {
      const angle = (2 * Math.PI * idx) / orderedCats.length;
      const x = R_cat * Math.cos(angle);
      const y = R_cat * Math.sin(angle);
      catPositions[cat.node_id] = { x, y };

      elements.push({
        group: 'nodes',
        data: {
          id: cat.node_id,
          label: cat.node_id,
          fullName: cat.label,
          colour: cat.colour,
          node_type: 'category',
          perspective_id: cat.perspective_id
        },
        position: { x, y }
      });
    });

    // B. Add Reference Nodes in a larger outer circle
    const R_ref = 600;
    references.forEach((ref, idx) => {
      const angle = (2 * Math.PI * idx) / references.length;
      const x = R_ref * Math.cos(angle);
      const y = R_ref * Math.sin(angle);

      elements.push({
        group: 'nodes',
        data: {
          id: ref.node_id,
          label: ref.short_label,
          fullName: ref.label,
          node_type: 'reference'
        },
        position: { x, y }
      });
    });

    // C. Add Practice Nodes orbiting their primary category node
    // To position them nicely, keep track of how many practices are assigned to each category
    const catPracticeCounts = {};
    practices.forEach(p => {
      const parentId = p.p1_id || p.p2_id || (p.p3_ids && p.p3_ids[0]) || null;
      if (parentId) {
        catPracticeCounts[parentId] = (catPracticeCounts[parentId] || 0) + 1;
      }
    });

    const catPracticeIndex = {};
    practices.forEach(p => {
      const parentId = p.p1_id || p.p2_id || (p.p3_ids && p.p3_ids[0]) || null;
      let pos = { x: 0, y: 0 };

      if (parentId && catPositions[parentId]) {
        const parentPos = catPositions[parentId];
        const count = catPracticeCounts[parentId];
        const idx = catPracticeIndex[parentId] || 0;
        catPracticeIndex[parentId] = idx + 1;

        // Position practices in a golden spiral around their parent concept
        const alpha = 1.6 * idx; // Golden spiral step angle
        const r = 70 + 8 * Math.sqrt(idx); // Radius increases with index

        pos = {
          x: parentPos.x + r * Math.cos(alpha),
          y: parentPos.y + r * Math.sin(alpha)
        };
      } else {
        // Fallback for uncoded practices - cluster near center
        const idx = catPracticeIndex['uncoded'] || 0;
        catPracticeIndex['uncoded'] = idx + 1;
        const alpha = 2.4 * idx;
        const r = 30 + 5 * Math.sqrt(idx);
        pos = {
          x: r * Math.cos(alpha),
          y: r * Math.sin(alpha)
        };
      }

      elements.push({
        group: 'nodes',
        data: {
          id: p.practice_id,
          label: p.practice_name,
          node_type: 'practice',
          geocoded: p.geocoded
        },
        position: pos
      });
    });

    // D. Add Edges
    edges.forEach(e => {
      // Check if source and target exist
      const sourceExists = elements.some(el => el.data.id === e.source);
      const targetExists = elements.some(el => el.data.id === e.target);
      if (sourceExists && targetExists) {
        elements.push({
          group: 'edges',
          data: {
            id: e.edge_id,
            source: e.source,
            target: e.target,
            edge_type: e.edge_type,
            weight: e.weight
          }
        });
      }
    });

    // 2. Initialize Cytoscape Instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      boxSelectionEnabled: false,
      autounselectify: true,
      wheelSensitivity: 0.15,
      style: [
        // NODES
        {
          selector: 'node',
          style: {
            'content': 'data(label)',
            'font-family': 'Inter, sans-serif',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'background-color': '#4b5563',
            'transition-property': 'background-color, line-color, target-arrow-color, opacity, width, height, border-color, border-width',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node[node_type="category"]',
          style: {
            'shape': 'hexagon',
            'background-color': 'data(colour)',
            'width': '42px',
            'height': '42px',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'color': '#ffffff'
          }
        },
        {
          selector: 'node[node_type="category"][perspective_id="P2"]',
          style: {
            'color': '#022c22'
          }
        },
        {
          selector: 'node[node_type="category"][perspective_id="P3"]',
          style: {
            'color': '#451a03'
          }
        },
        {
          selector: 'node[node_type="reference"]',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#06b6d4',
            'width': '55px',
            'height': '22px',
            'font-size': '9px',
            'font-weight': '500',
            'color': '#083344'
          }
        },
        {
          selector: 'node[node_type="practice"]',
          style: {
            'shape': 'circle',
            'background-color': '#1f2937',
            'border-width': '1.5px',
            'border-color': '#374151',
            'width': '10px',
            'height': '10px',
            'content': '', // Hide labels by default to prevent huge clutter
            'color': '#cbd5e1'
          }
        },

        // EDGES
        {
          selector: 'edge',
          style: {
            'curve-style': 'straight',
            'line-color': '#374151',
            'opacity': 0.2,
            'width': 1,
            'transition-property': 'line-color, opacity, width',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge[edge_type="coded_to"]',
          style: {
            'line-color': '#6366f1',
            'width': 'mapData(weight, 0, 1, 1, 3.5)',
            'opacity': 0.15
          }
        },
        {
          selector: 'edge[edge_type="evidences"]',
          style: {
            'line-color': '#06b6d4',
            'width': 2,
            'opacity': 0.35,
            'line-style': 'dashed'
          }
        },

        // INTERACTIVE CLASSES
        {
          selector: '.highlighted',
          style: {
            'opacity': 1.0,
            'z-index': 999
          }
        },
        {
          selector: 'node[node_type="practice"].highlighted',
          style: {
            'width': '18px',
            'height': '18px',
            'background-color': '#a78bfa',
            'border-color': '#ffffff',
            'border-width': '2px',
            'content': 'data(label)',
            'text-valign': 'top',
            'text-margin-y': -6
          }
        },
        {
          selector: 'node[node_type="category"].highlighted',
          style: {
            'width': '52px',
            'height': '52px',
            'border-color': '#ffffff',
            'border-width': '3px',
            'content': 'data(fullName)',
            'font-size': '12px',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'text-valign': 'top',
            'text-margin-y': -8
          }
        },
        {
          selector: 'node[node_type="reference"].highlighted',
          style: {
            'width': '70px',
            'height': '28px',
            'border-color': '#ffffff',
            'border-width': '2px',
            'content': 'data(label)',
            'font-size': '10px',
            'text-wrap': 'wrap',
            'text-max-width': '180px',
            'text-valign': 'top',
            'text-margin-y': -6
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'opacity': 0.85,
            'width': 3
          }
        },
        {
          selector: 'edge[edge_type="coded_to"].highlighted',
          style: {
            'line-color': '#a78bfa'
          }
        },
        {
          selector: 'edge[edge_type="evidences"].highlighted',
          style: {
            'line-color': '#22d3ee'
          }
        },
        
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.08,
            'events': 'no'
          }
        }
      ]
    });

    // 3. Node selection click handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const type = node.data('node_type');
      onSelect({ type, id: node.id() });
    });

    // Tap background to clear selection
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelect({ type: null, id: null });
      }
    });

    cyRef.current = cy;
    cy.fit(null, 50);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [practices, categories, references, edges]); // run only once on data mount

  // 4. Update highlighting/dimming classes in response to selection updates
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      // Clear classes
      cy.elements().removeClass('highlighted dimmed');

      if (!selection || !selection.id) {
        // No selection - fit graph and clear highlights
        return;
      }

      const selId = selection.id;
      const selType = selection.type;
      const selNode = cy.getElementById(selId);

      if (selNode.length === 0) return;

      // Add highlighted to selection node itself
      selNode.addClass('highlighted');

      // Dim all elements by default, we'll restore highlighted ones
      cy.elements().difference(selNode).addClass('dimmed');

      if (selType === 'practice') {
        // Find connected categories (coded_to targets)
        const connectedEdges = selNode.connectedEdges();
        connectedEdges.forEach(edge => {
          if (edge.source().id() === selId) {
            edge.removeClass('dimmed').addClass('highlighted');
            const catNode = edge.target();
            catNode.removeClass('dimmed').addClass('highlighted');

            // Find reference nodes connected to these categories
            catNode.connectedEdges('[edge_type="evidences"]').forEach(evEdge => {
              evEdge.removeClass('dimmed').addClass('highlighted');
              evEdge.source().removeClass('dimmed').addClass('highlighted');
            });
          }
        });
      } 
      else if (selType === 'category') {
        // Find connected practices and references
        const connectedEdges = selNode.connectedEdges();
        connectedEdges.forEach(edge => {
          edge.removeClass('dimmed').addClass('highlighted');
          edge.connectedNodes().removeClass('dimmed').addClass('highlighted');
        });
      } 
      else if (selType === 'reference') {
        // Find connected categories (evidences targets)
        const connectedEdges = selNode.connectedEdges();
        connectedEdges.forEach(edge => {
          if (edge.source().id() === selId) {
            edge.removeClass('dimmed').addClass('highlighted');
            const catNode = edge.target();
            catNode.removeClass('dimmed').addClass('highlighted');

            // Find practice nodes connected to these categories
            catNode.connectedEdges('[edge_type="coded_to"]').forEach(practiceEdge => {
              practiceEdge.removeClass('dimmed').addClass('highlighted');
              practiceEdge.source().removeClass('dimmed').addClass('highlighted');
            });
          }
        });
      }
    });

    // Smoothly pan and center on the selected element
    const selNode = cy.getElementById(selection.id);
    if (selNode.length > 0) {
      cy.animate({
        center: { eels: selNode },
        zoom: selNode.data('node_type') === 'practice' ? 2.0 : 1.2,
        duration: 800
      });
    }
  }, [selection]);

  return (
    <div className="cytoscape-container">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="cytoscape-legend glass-panel">
        <div className="legend-item"><span className="legend-dot p1-bg"></span><span>P1 Typology</span></div>
        <div className="legend-item"><span className="legend-dot p2-bg"></span><span>P2 Method</span></div>
        <div className="legend-item"><span className="legend-dot p3-bg"></span><span>P3 Affect</span></div>
        <div className="legend-item"><span className="legend-dot cyan-bg"></span><span>Reference</span></div>
        <div className="legend-item"><span className="legend-dot grey-bg"></span><span>Practice</span></div>
      </div>
    </div>
  );
}
