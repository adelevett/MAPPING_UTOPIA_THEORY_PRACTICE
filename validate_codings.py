"""
validate_codings.py
===================
QA script to run after correlate_practices.py and before build_practices_json.py.

Checks:
  1. All category_ids in practice_codings.json resolve to the ontology
  2. No P2 codes applied to practices with purely material/infrastructure descriptions
     (heuristic: flags practices where p2 is set and evidence contains no method keywords)
  3. P3 distribution sanity (flags if any single P3 category takes >40% of all codes)
  4. Null-P1 rate (flags if >15% of coded practices have null P1)
  5. Evidence quote validation (flags verbatim_evidence strings > 300 chars
     which may indicate the model copied ontology text rather than practice text)

Outputs a validation_report.json and prints a summary.
"""

import json
from pathlib import Path
from collections import Counter, defaultdict

CODINGS_PATH  = Path("practice_codings.json")
ONTOLOGY_PATH = Path("ontology.json")
REPORT_PATH   = Path("validation_report.json")

# Keywords that suggest a practice is a methodology (P2 is plausible)
METHOD_KEYWORDS = {
    "workshop", "session", "exercise", "scenario", "speculative",
    "fiction", "planning", "mapping", "deliberat", "facilitat",
    "participat", "imagin", "vision", "futur", "dreaming",
    "storytell", "roleplay", "simulation",
}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_valid_ids(ontology):
    ids = set()
    for p in ontology["perspectives"]:
        for c in p["categories"]:
            ids.add(c["category_id"])
    return ids


def check_is_method(practice_id, coding, evidence_text: str) -> bool:
    """Return True if P2 is set but evidence suggests a non-methodological practice."""
    p2_id = coding.get("p2", {}).get("category_id")
    if not p2_id:
        return False  # no P2 set, no issue
    text_lower = evidence_text.lower()
    has_method_kw = any(kw in text_lower for kw in METHOD_KEYWORDS)
    return not has_method_kw  # True = potentially spurious P2


def main():
    print("=== Validation: validate_codings.py ===\n")

    codings  = load_json(CODINGS_PATH)
    ontology = load_json(ONTOLOGY_PATH)

    valid_ids      = build_valid_ids(ontology)
    total          = len(codings)
    issues         = defaultdict(list)

    # Counters
    null_p1_count  = 0
    failed_count   = 0
    p1_counter     = Counter()
    p2_counter     = Counter()
    p3_counter     = Counter()
    total_p3_codes = 0
    spurious_p2    = []
    long_evidence  = []

    for pid, coding in codings.items():
        # Failed extractions
        p1_just = (coding.get("p1") or {}).get("justification", "")
        if p1_just == "EXTRACTION_FAILED":
            failed_count += 1
            continue

        # --- P1 ---
        p1_id = (coding.get("p1") or {}).get("category_id")
        if p1_id is None:
            null_p1_count += 1
        elif p1_id not in valid_ids:
            issues["invalid_p1_id"].append({
                "practice_id": pid, "invalid_id": p1_id
            })
        else:
            p1_counter[p1_id] += 1

        # --- P2 ---
        p2_id = (coding.get("p2") or {}).get("category_id")
        if p2_id is not None:
            if p2_id not in valid_ids:
                issues["invalid_p2_id"].append({
                    "practice_id": pid, "invalid_id": p2_id
                })
            else:
                p2_counter[p2_id] += 1
                evidence = (coding.get("p1") or {}).get("verbatim_evidence", "") or ""
                if check_is_method(pid, coding, evidence):
                    spurious_p2.append({
                        "practice_id": pid,
                        "p2_id": p2_id,
                        "evidence_snippet": evidence[:150],
                    })

        # --- P3 ---
        p3_items = coding.get("p3") or []
        for item in p3_items:
            cid = item.get("category_id")
            if cid is None:
                continue
            if cid not in valid_ids:
                issues["invalid_p3_id"].append({
                    "practice_id": pid, "invalid_id": cid
                })
            else:
                p3_counter[cid] += 1
                total_p3_codes += 1

            # Flag suspiciously long verbatim evidence
            ev = item.get("verbatim_evidence", "") or ""
            if len(ev) > 300:
                long_evidence.append({
                    "practice_id": pid,
                    "category_id": cid,
                    "length":      len(ev),
                    "snippet":     ev[:100],
                })

    # --- Sanity checks ---
    null_p1_pct = (null_p1_count / max(total - failed_count, 1)) * 100
    if null_p1_pct > 15:
        issues["high_null_p1_rate"].append({
            "null_p1_count": null_p1_count,
            "pct":           round(null_p1_pct, 1),
            "threshold":     15,
        })

    if total_p3_codes > 0:
        for cid, count in p3_counter.items():
            pct = (count / total_p3_codes) * 100
            if pct > 40:
                issues["p3_concentration"].append({
                    "category_id": cid,
                    "count":       count,
                    "pct":         round(pct, 1),
                    "threshold":   40,
                })

    if spurious_p2:
        issues["potentially_spurious_p2"] = spurious_p2

    if long_evidence:
        issues["long_verbatim_evidence"] = long_evidence

    # --- Report ---
    report = {
        "summary": {
            "total_practices":     total,
            "failed_extractions":  failed_count,
            "null_p1_count":       null_p1_count,
            "null_p1_pct":         round(null_p1_pct, 1),
            "total_p3_assignments": total_p3_codes,
            "issue_count":         sum(len(v) for v in issues.values()),
        },
        "p1_distribution":  dict(p1_counter.most_common()),
        "p2_distribution":  dict(p2_counter.most_common()),
        "p3_distribution":  dict(p3_counter.most_common()),
        "issues":           dict(issues),
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # Print summary
    print(f"Total practices:        {total}")
    print(f"Failed extractions:     {failed_count}")
    print(f"Null P1 rate:           {null_p1_pct:.1f}%")
    print(f"Total P3 assignments:   {total_p3_codes}")
    print(f"Total issues flagged:   {report['summary']['issue_count']}")
    print()

    print("P1 distribution (top 10):")
    for cid, count in p1_counter.most_common(10):
        print(f"  {cid}: {count}")

    print("\nP3 distribution (top 10):")
    for cid, count in p3_counter.most_common(10):
        print(f"  {cid}: {count}")

    if issues:
        print(f"\n⚠️  Issues written to {REPORT_PATH}")
        for issue_type, items in issues.items():
            print(f"  {issue_type}: {len(items)}")
    else:
        print(f"\n✓ No issues detected. Report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()
