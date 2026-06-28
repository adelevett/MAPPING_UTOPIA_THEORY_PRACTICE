# Correlation Pipeline

**Status: COMPLETED**  
All 803 practices have been successfully coded, validated, and built into frontend graph and map data files. Detailed execution logs and QA statistics can be reviewed in the **[PROGRESS_REPORT.md](file:///C:/Users/delevetta/Documents/Su26/EDTECH575/MAPPING_UTOPIA_THEORY_PRACTICE/PROGRESS_REPORT.md)**.

The pipeline compiles the raw empirical data (`extractions_output.json`) and CSR qualitative ontology (`ontology.json` / `coded_matrix.json`) into the final structured formats consumed by the React + Vite frontend.

---

## Final Compiled Counts
*   **Total Practices (practices.json):** 803 records (542 geocoded, 261 non-geocoded)
*   **Category Nodes (category_index.json):** 40 nodes representing the 3 perspectives
*   **Reference Nodes (reference_index.json):** 23 literature references
*   **Graph Edges (graph_edges.json):** 1,198 edges (typed as `coded_to` and `evidences`)

---

## Pipeline Order

```
extractions_output.json          ontology.json
       +                               +
       +--------> correlate_practices.py -------> practice_codings.json
                                                         |
                         validate_codings.py <-----------+
                                                         |
coded_matrix.json ------> build_practices_json.py <------+
       +
ontology.json
       |
       v
practices.json          (→ public/data/)
category_index.json     (→ public/data/)
reference_index.json    (→ public/data/)
graph_edges.json        (→ public/data/)
```

---

## Step 1: Correlate

```powershell
.venv\Scripts\python.exe correlate_practices.py
```

**Resumable.** Safe to interrupt and re-run; skips already-coded practices.
Writes `practice_codings.json` incrementally after each practice.

Expects in working directory:
- `extractions_output.json`
- `ontology.json`

Outputs:
- `practice_codings.json`

---

## Step 2: Validate

```powershell
.venv\Scripts\python.exe validate_codings.py
```

Run before building. Checks:
- All category IDs resolve to the ontology (zero orphaned codes)
- Null P1 rate < 15%
- No P3 category takes > 40% of all assignments (concentration check)
- Potentially spurious P2 codes (methodology code on non-methodological practice)
- Suspiciously long verbatim evidence strings (> 300 chars = possible ontology copying)

Outputs `validation_report.json`. Review `p1_distribution` and `p3_distribution`
for sense-check before proceeding.

---

## Step 3: Build

```powershell
.venv\Scripts\python.exe build_practices_json.py
```

Expects in working directory:
- `extractions_output.json`
- `practice_codings.json`
- `ontology.json`
- `coded_matrix.json`

Outputs (copy all four to `public/data/` in the React project):
- `practices.json`       — flat array, one record per practice
- `category_index.json`  — 40 category nodes for Cytoscape
- `reference_index.json` — 23 reference nodes for Cytoscape
- `graph_edges.json`     — typed edges: practice→category, reference→category

---

## practices.json field reference

| Field | Type | Notes |
|---|---|---|
| `practice_id` | string | `{post_id}__{idx}` |
| `post_title` | string | Source blog post title |
| `post_url` | string | Source URL |
| `post_date` | string | ISO date |
| `practice_name` | string | Extracted practice name |
| `location_string` | string | Raw location text |
| `lat` | float\|null | Null if non-geocodable |
| `lng` | float\|null | Null if non-geocodable |
| `geocoded` | bool | True if lat/lng present |
| `temporal` | string | persistent \| ephemeral \| seasonal \| undetermined |
| `evidence` | string | Verbatim text from Hopkins blog |
| `ostrom_summary` | object | Ostrom SES fields (non-null only) |
| `p1_id` | string\|null | Primary typology category |
| `p1_name` | string\|null | Category display name |
| `p1_perspective` | string\|null | Always "P1" if set |
| `p1_justification` | string\|null | Coding rationale |
| `p1_verbatim_evidence` | string\|null | Quote from practice text |
| `p2_id` | string\|null | Methodology category (null if not a method) |
| `p2_name` | string\|null | Category display name |
| `p2_is_methodology` | bool | True if practice is a speculative method |
| `p3_ids` | string[] | List of affect/orientation codes |
| `p3_names` | string[] | Display names |
| `p3_items` | object[] | Full coding detail per P3 code |
| `linked_references` | string[] | Reference IDs sharing any applied code |
| `coding_failed` | bool | True if Vertex AI failed on this practice |

---

## graph_edges.json edge types

| `edge_type` | Source | Target | Meaning |
|---|---|---|---|
| `coded_to` | practice_id | category_id | This practice was coded to this category |
| `evidences` | reference_id | category_id | This reference provided evidence for this category |

Edge weight: P1 `coded_to` = 1.0, P2 = 0.7, P3 = 0.5, `evidences` = 0.8.
Used by Cytoscape for edge thickness rendering.

---

## Key design decisions for the visual layer

**P1 = marker colour / graph cluster.** The 14 P1 categories are the primary
visual grouping dimension. Map markers and graph practice nodes should be
coloured by `p1_id`.

**P2 = methodology flag.** The 13 P2 categories apply to ~5–15% of practices
(events, workshops, scenario sessions). In the graph view, methodology nodes
can be rendered with a distinct shape (diamond vs circle).

**P3 = secondary filter / tooltip.** The 13 P3 categories are the affective
layer. In the map view, P3 appears in the popup. In the graph view, P3 edges
are lighter weight and can be toggled off to reduce visual complexity.

**Linked references.** The `linked_references` field drives the
"See also" citation panel in the detail drawer, connecting practice instances
to the academic literature that theorises them.
