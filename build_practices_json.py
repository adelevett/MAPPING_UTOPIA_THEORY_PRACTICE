"""
build_practices_json.py
=======================
Stage 2 of the visual layer pipeline.

Merges:
  extractions_output.json  — Ostrom SES fields + geocoordinates
  practice_codings.json    — P1/P2/P3 ontology codes
  ontology.json            — category metadata (names, definitions)
  coded_matrix.json        — reference → category mappings (for reverse lookup)

Outputs:
  practices.json           — single flat array consumed by the React frontend
  category_index.json      — 40 category nodes for the Cytoscape graph
  reference_index.json     — 23 reference nodes for the Cytoscape graph
  graph_edges.json         — typed edges: practice→category, reference→category

Run after correlate_practices.py is complete (or partially complete).
"""

import json
from pathlib import Path
from collections import defaultdict

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

EXTRACTIONS_PATH    = Path("extractions_output.json")
CODINGS_PATH        = Path("practice_codings.json")
ONTOLOGY_PATH       = Path("ontology.json")
CODED_MATRIX_PATH   = Path("coded_matrix.json")

OUT_PRACTICES       = Path("practices.json")
OUT_CATEGORIES      = Path("category_index.json")
OUT_REFERENCES      = Path("reference_index.json")
OUT_EDGES           = Path("graph_edges.json")


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_json(path: Path) -> dict | list:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def flatten_practices(extractions: dict) -> dict:
    """Return {practice_id: practice_dict} from extractions_output.json."""
    flat = {}
    for post_id, post_data in extractions.items():
        if isinstance(post_data, list):
            practices = post_data
            post_meta = {}
        elif isinstance(post_data, dict):
            practices = post_data.get("practices", [post_data])
            post_meta = {
                "post_title": post_data.get("title", ""),
                "post_url":   post_data.get("url", ""),
                "post_date":  post_data.get("date", ""),
            }
        else:
            continue

        for idx, practice in enumerate(practices):
            pid = f"{post_id}__{idx}"
            flat[pid] = {**post_meta, **practice, "practice_id": pid}
    return flat


def build_ontology_index(ontology: dict) -> dict:
    """Return {category_id: {id, name, perspective_id, perspective_name, definition, coding_rule}}"""
    index = {}
    for perspective in ontology["perspectives"]:
        for cat in perspective["categories"]:
            index[cat["category_id"]] = {
                "category_id":          cat["category_id"],
                "category_name":        cat["category_name"],
                "category_definition":  cat["category_definition"],
                "coding_rule":          cat["coding_rule"],
                "anchor_example":       cat["anchor_example"],
                "perspective_id":       perspective["perspective_id"],
                "perspective_name":     perspective["perspective_name"],
            }
    return index


def build_category_to_references(coded_matrix: dict) -> dict[str, list[str]]:
    """
    Invert coded_matrix.json: {category_id: [reference_id, ...]}
    Used to auto-link practices to references via shared category codes.
    """
    cat_to_refs = defaultdict(list)
    for ref in coded_matrix.get("references", []):
        ref_id = ref["id"]
        for code in ref.get("applied_codes", []):
            cat_to_refs[code["category_id"]].append(ref_id)
    return dict(cat_to_refs)


# ---------------------------------------------------------------------------
# Practice record builder
# ---------------------------------------------------------------------------

def build_practice_record(
    practice_id: str,
    extraction: dict,
    coding: dict,
    ontology_index: dict,
    cat_to_refs: dict[str, list[str]],
) -> dict:
    """
    Build a single flat practice record for the frontend.
    All fields needed by both the map view and graph view are present.
    """
    # Geocoordinates — handle both flat and nested structures
    lat = extraction.get("lat") or extraction.get("latitude")
    lng = extraction.get("lng") or extraction.get("lon") or extraction.get("longitude")

    # If nested under coordinates key
    if lat is None and "coordinates" in extraction and isinstance(extraction["coordinates"], dict):
        lat = extraction["coordinates"].get("latitude") or extraction["coordinates"].get("lat")
        lng = extraction["coordinates"].get("longitude") or extraction["coordinates"].get("lng") or extraction["coordinates"].get("lon")

    # If nested under geocode key
    if lat is None and "geocode" in extraction and isinstance(extraction["geocode"], dict):
        lat = extraction["geocode"].get("lat")
        lng = extraction["geocode"].get("lng") or extraction["geocode"].get("lon")

    geocoded = lat is not None and lng is not None

    # --- P1 ---
    p1_obj = coding.get("p1") or {}
    p1_id  = p1_obj.get("category_id")
    p1_meta = ontology_index.get(p1_id, {}) if p1_id else {}

    # --- P2 ---
    p2_obj = coding.get("p2") or {}
    p2_id  = p2_obj.get("category_id")
    p2_meta = ontology_index.get(p2_id, {}) if p2_id else {}

    # --- P3 ---
    p3_items = coding.get("p3") or []
    p3_ids   = [item["category_id"] for item in p3_items if item.get("category_id")]
    p3_metas = [ontology_index.get(cid, {}) for cid in p3_ids]

    # --- Linked references via category reverse-lookup ---
    all_code_ids = [c for c in [p1_id, p2_id] + p3_ids if c]
    linked_refs  = list({
        ref_id
        for cid in all_code_ids
        for ref_id in cat_to_refs.get(cid, [])
    })

    # --- Ostrom summary (safe extraction) ---
    def flatten_ostrom_dict(d):
        if not isinstance(d, dict):
            return ""
        parts = []
        for sub_key, sub_val in sorted(d.items()):
            if isinstance(sub_val, dict):
                val = sub_val.get("value")
                if val:
                    clean_key = sub_key.replace('_', ' ')
                    clean_key = clean_key[0].upper() + clean_key[1:] if clean_key else ""
                    parts.append(f"{clean_key}: {val}")
        return "; ".join(parts)

    ostrom_summary = {
        "resource_system": flatten_ostrom_dict(extraction.get("resource_systems")),
        "governance":      flatten_ostrom_dict(extraction.get("governance_systems")),
        "users":           flatten_ostrom_dict(extraction.get("users")),
        "interactions":    flatten_ostrom_dict(extraction.get("interactions")),
        "outcomes":        flatten_ostrom_dict(extraction.get("outcomes")),
    }
    # Strip empty values from ostrom_summary
    ostrom_summary = {k: v for k, v in ostrom_summary.items() if v}

    # Location
    loc = extraction.get("location_string") or extraction.get("location")
    if isinstance(loc, dict):
        location_string = loc.get("value") or loc.get("location") or ""
    else:
        location_string = loc or ""

    # Temporal
    temp = extraction.get("temporal_classification") or extraction.get("temporal") or extraction.get("temporal_nature")
    if isinstance(temp, dict):
        temporal = temp.get("value") or ""
    else:
        temporal = temp or "undetermined"

    return {
        # Identity
        "practice_id":   practice_id,
        "post_id":       extraction.get("post_id", ""),
        "post_title":    extraction.get("post_title", ""),
        "post_url":      extraction.get("post_url", ""),
        "post_date":     extraction.get("post_date", ""),
        "practice_name": (
            extraction.get("practice_name")
            or extraction.get("title")
            or "Unnamed Practice"
        ),

        # Location
        "location_string": location_string,
        "lat":  lat,
        "lng":  lng,
        "geocoded": geocoded,

        # Temporal
        "temporal": temporal,

        # Evidence
        "evidence": extraction.get("evidence", ""),

        # Ostrom SES
        "ostrom_summary": ostrom_summary,

        # Ontology coding — P1
        "p1_id":                  p1_id,
        "p1_name":                p1_meta.get("category_name"),
        "p1_perspective":         p1_meta.get("perspective_id"),
        "p1_justification":       p1_obj.get("justification"),
        "p1_verbatim_evidence":   p1_obj.get("verbatim_evidence"),

        # Ontology coding — P2
        "p2_id":                  p2_id,
        "p2_name":                p2_meta.get("category_name"),
        "p2_is_methodology":      p2_id is not None,
        "p2_justification":       p2_obj.get("justification"),
        "p2_verbatim_evidence":   p2_obj.get("verbatim_evidence"),

        # Ontology coding — P3 (list)
        "p3_ids":   p3_ids,
        "p3_names": [m.get("category_name") for m in p3_metas],
        "p3_items": [
            {
                "category_id":       item.get("category_id"),
                "category_name":     ontology_index.get(
                    item.get("category_id"), {}
                ).get("category_name"),
                "justification":     item.get("justification"),
                "verbatim_evidence": item.get("verbatim_evidence"),
            }
            for item in p3_items
        ],

        # Linked references (for popup citations and graph edges)
        "linked_references": linked_refs,

        # Coding quality flag
        "coding_failed": p1_obj.get("justification") == "EXTRACTION_FAILED",
    }


# ---------------------------------------------------------------------------
# Graph data builders
# ---------------------------------------------------------------------------

def build_category_nodes(ontology_index: dict) -> list[dict]:
    """40 category nodes for Cytoscape."""
    perspective_colours = {
        "P1": "#6366f1",  # indigo — Typologies
        "P2": "#10b981",  # emerald — Methodologies
        "P3": "#f59e0b",  # amber — Affects
    }
    nodes = []
    for cat_id, cat in ontology_index.items():
        pid = cat["perspective_id"]
        nodes.append({
            "node_id":          cat_id,
            "node_type":        "category",
            "label":            cat["category_name"],
            "perspective_id":   pid,
            "perspective_name": cat["perspective_name"],
            "definition":       cat["category_definition"],
            "coding_rule":      cat["coding_rule"],
            "colour":           perspective_colours.get(pid, "#888"),
        })
    return nodes


def build_reference_nodes(coded_matrix: dict) -> list[dict]:
    """23 reference nodes for Cytoscape."""
    nodes = []
    for ref in coded_matrix.get("references", []):
        nodes.append({
            "node_id":      ref["id"],
            "node_type":    "reference",
            "label":        ref["citation_raw"],
            "short_label":  ref["id"].replace("_", " "),
        })
    return nodes


def build_graph_edges(
    practices: list[dict],
    coded_matrix: dict,
) -> list[dict]:
    """
    Two edge types:
      practice→category  (coded_to)      from practices.json coding
      reference→category (evidences)     from coded_matrix.json
    """
    edges = []
    edge_id = 0

    # practice → category edges
    for p in practices:
        if p["coding_failed"]:
            continue
        practice_id = p["practice_id"]

        if p["p1_id"]:
            edges.append({
                "edge_id":   f"e{edge_id}",
                "source":    practice_id,
                "target":    p["p1_id"],
                "edge_type": "coded_to",
                "weight":    1.0,  # primary code = higher visual weight
            })
            edge_id += 1

        if p["p2_id"]:
            edges.append({
                "edge_id":   f"e{edge_id}",
                "source":    practice_id,
                "target":    p["p2_id"],
                "edge_type": "coded_to",
                "weight":    0.7,
            })
            edge_id += 1

        for p3_id in p["p3_ids"]:
            edges.append({
                "edge_id":   f"e{edge_id}",
                "source":    practice_id,
                "target":    p3_id,
                "edge_type": "coded_to",
                "weight":    0.5,
            })
            edge_id += 1

    # reference → category edges (from coded_matrix)
    for ref in coded_matrix.get("references", []):
        ref_id = ref["id"]
        for code in ref.get("applied_codes", []):
            edges.append({
                "edge_id":   f"e{edge_id}",
                "source":    ref_id,
                "target":    code["category_id"],
                "edge_type": "evidences",
                "weight":    0.8,
            })
            edge_id += 1

    return edges


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== Build Pipeline: build_practices_json.py ===\n")

    print(f"Loading {EXTRACTIONS_PATH}...")
    extractions_raw = load_json(EXTRACTIONS_PATH)
    extractions     = flatten_practices(extractions_raw)
    print(f"  {len(extractions)} practices found.\n")

    print(f"Loading {CODINGS_PATH}...")
    codings = load_json(CODINGS_PATH)
    print(f"  {len(codings)} codings found.\n")

    print(f"Loading {ONTOLOGY_PATH}...")
    ontology_raw    = load_json(ONTOLOGY_PATH)
    ontology_index  = build_ontology_index(ontology_raw)
    print(f"  {len(ontology_index)} categories indexed.\n")

    print(f"Loading {CODED_MATRIX_PATH}...")
    coded_matrix  = load_json(CODED_MATRIX_PATH)
    cat_to_refs   = build_category_to_references(coded_matrix)
    print(f"  Inverse lookup: {len(cat_to_refs)} categories -> references.\n")

    # Build practice records
    print("Building practice records...")
    practice_records = []
    unmatched_codings = 0
    failed_codings    = 0

    for practice_id, extraction in extractions.items():
        coding = codings.get(practice_id)
        if coding is None:
            # Not yet coded — include in output without ontology fields
            coding = {
                "practice_id": practice_id,
                "p1": {"category_id": None, "justification": None, "verbatim_evidence": None},
                "p2": {"category_id": None, "justification": None, "verbatim_evidence": None},
                "p3": [],
            }
            unmatched_codings += 1

        record = build_practice_record(
            practice_id, extraction, coding, ontology_index, cat_to_refs
        )
        if record["coding_failed"]:
            failed_codings += 1
        practice_records.append(record)

    # Stats
    geocoded     = sum(1 for p in practice_records if p["geocoded"])
    has_p1       = sum(1 for p in practice_records if p["p1_id"])
    is_method    = sum(1 for p in practice_records if p["p2_is_methodology"])

    print(f"  Total records:      {len(practice_records)}")
    print(f"  Geocoded:           {geocoded}")
    print(f"  Have P1 code:       {has_p1}")
    print(f"  Are methodologies:  {is_method}")
    print(f"  Pending coding:     {unmatched_codings}")
    print(f"  Failed coding:      {failed_codings}\n")

    # --- Write practices.json ---
    print(f"Writing {OUT_PRACTICES}...")
    with open(OUT_PRACTICES, "w", encoding="utf-8") as f:
        json.dump(practice_records, f, ensure_ascii=False, indent=2)
    print(f"  {len(practice_records)} records written.\n")

    # --- Write category_index.json ---
    print(f"Writing {OUT_CATEGORIES}...")
    category_nodes = build_category_nodes(ontology_index)
    with open(OUT_CATEGORIES, "w", encoding="utf-8") as f:
        json.dump(category_nodes, f, ensure_ascii=False, indent=2)
    print(f"  {len(category_nodes)} category nodes written.\n")

    # --- Write reference_index.json ---
    print(f"Writing {OUT_REFERENCES}...")
    reference_nodes = build_reference_nodes(coded_matrix)
    with open(OUT_REFERENCES, "w", encoding="utf-8") as f:
        json.dump(reference_nodes, f, ensure_ascii=False, indent=2)
    print(f"  {len(reference_nodes)} reference nodes written.\n")

    # --- Write graph_edges.json ---
    print(f"Writing {OUT_EDGES}...")
    edges = build_graph_edges(practice_records, coded_matrix)
    with open(OUT_EDGES, "w", encoding="utf-8") as f:
        json.dump(edges, f, ensure_ascii=False, indent=2)
    print(f"  {len(edges)} edges written.\n")

    print("=== Done. Frontend data files ready. ===")
    print(f"  Copy these 4 files to your React project's public/data/ directory:")
    for p in [OUT_PRACTICES, OUT_CATEGORIES, OUT_REFERENCES, OUT_EDGES]:
        print(f"    {p}")


if __name__ == "__main__":
    main()
