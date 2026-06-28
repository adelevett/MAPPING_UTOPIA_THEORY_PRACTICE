import json
import time
import re
import os
import sys
from pathlib import Path

import google.auth
import google.auth.transport.requests
import requests

# ---------------------------------------------------------------------------
# Configuration (Test paths)
# ---------------------------------------------------------------------------

EXTRACTIONS_PATH = Path("extractions_output.json")
ONTOLOGY_PATH    = Path("ontology.json")
OUTPUT_PATH      = Path("test_practice_codings.json")
PROMPT_PATH      = Path("correlation_prompt.md")

GCP_PROJECT  = "sonic-name-500202-t5"
GCP_LOCATION = "global"
MODEL_ID     = "gemini-3.5-flash"

VERTEX_URL = (
    f"https://aiplatform.googleapis.com/v1/projects/{GCP_PROJECT}"
    f"/locations/{GCP_LOCATION}/publishers/google/models/{MODEL_ID}:generateContent"
)

MAX_RETRIES    = 6
INITIAL_DELAY  = 2.0
MAX_DELAY      = 120.0
INTER_CALL_DELAY = 0.5

# ---------------------------------------------------------------------------
# Ontology helpers
# ---------------------------------------------------------------------------

def load_ontology_compact(ontology_path: Path) -> list[dict]:
    with open(ontology_path, encoding="utf-8") as f:
        raw = json.load(f)

    categories = []
    for perspective in raw["perspectives"]:
        pid   = perspective["perspective_id"]
        pname = perspective["perspective_name"]
        pdef  = perspective["perspective_definition"]
        for cat in perspective["categories"]:
            categories.append({
                "category_id":   cat["category_id"],
                "perspective_id":   pid,
                "perspective_name": pname,
                "perspective_definition": pdef,
                "category_name":   cat["category_name"],
                "category_definition": cat["category_definition"],
                "coding_rule":     cat["coding_rule"],
                "anchor_example":  cat["anchor_example"],
            })
    return categories

def flatten_practices(extractions: dict) -> list[dict]:
    flat = []
    for post_id, post_data in extractions.items():
        if isinstance(post_data, list):
            practices = post_data
        elif isinstance(post_data, dict):
            practices = post_data.get("practices", [post_data])
        else:
            continue

        for idx, practice in enumerate(practices):
            pid = f"{post_id}__{idx}"
            flat.append({
                "practice_id":   pid,
                "post_id":       post_id,
                "post_title":    post_data.get("title", "") if isinstance(post_data, dict) else "",
                "post_url":      post_data.get("url", "")   if isinstance(post_data, dict) else "",
                **practice,
            })
    return flat

# ---------------------------------------------------------------------------
# Vertex AI call
# ---------------------------------------------------------------------------

def get_access_token() -> str:
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return creds.token

def build_prompt(practice: dict, ontology_categories: list[dict]) -> tuple[str, str]:
    practice_for_prompt = {
        "practice_id":    practice.get("practice_id"),
        "practice_name":  practice.get("practice_name") or practice.get("title"),
        "location":       practice.get("location_string") or practice.get("location"),
        "temporal":       practice.get("temporal_classification") or practice.get("temporal"),
        "evidence":       practice.get("evidence"),
        "outcomes":       practice.get("outcomes"),
        "interactions":   practice.get("interactions"),
        "users":          practice.get("users"),
        "governance":     practice.get("governance_systems"),
        "resource":       practice.get("resource_systems"),
    }
    practice_for_prompt = {k: v for k, v in practice_for_prompt.items() if v}

    system_prompt = """You are a qualitative coding assistant applying a fixed ontology to community \
practice descriptions. The ontology has three perspectives:

P1 — Typologies of Visionary Constructs: ONE code only. What kind of utopian/dystopian/speculative \
construct does this practice instantiate? Choose the single best fit.

P2 — Speculative Methodologies: ONE code or null. Apply ONLY if the practice itself IS a process, \
workshop, scenario exercise, or pedagogical tool for imagining futures. A physical infrastructure, \
restaurant, currency, or building is NOT a methodology. When in doubt: null.

P3 — Pedagogical Affects and Orientations: LIST of codes (one or more). What emotional, psychological, \
or critical orientations does this practice express or produce in participants?

Coding rules:
1. For every applied code, provide justification (1-2 sentences) and verbatim_evidence (exact quote \
from the practice fields provided — not from the ontology definitions).
2. If no coding rule matches with clear textual evidence, return null (P1/P2) or [] (P3).
3. Do not invent or expand categories. The ontology is fixed.
4. Return ONLY a valid JSON object — no preamble, no markdown fences."""

    user_prompt = f"""Code this practice against the ontology.

PRACTICE:
{json.dumps(practice_for_prompt, indent=2, ensure_ascii=False)}

ONTOLOGY CATEGORIES:
{json.dumps(ontology_categories, indent=2, ensure_ascii=False)}

Return exactly this JSON structure:
{{
  "practice_id": "{practice.get('practice_id')}",
  "p1": {{
    "category_id": "P1-Cx or null",
    "justification": "...",
    "verbatim_evidence": "..."
  }},
  "p2": {{
    "category_id": "P2-Cx or null",
    "justification": "...",
    "verbatim_evidence": "..."
  }},
  "p3": [
    {{
      "category_id": "P3-Cx",
      "justification": "...",
      "verbatim_evidence": "..."
    }}
  ]
}}"""

    return system_prompt, user_prompt

def call_vertex(system_prompt: str, user_prompt: str, token: str) -> dict:
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": user_prompt}]}
        ],
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature":     1.0,
            "thinkingConfig": {
                "thinkingBudget": 8192
            }
        }
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }

    resp = requests.post(VERTEX_URL, headers=headers, json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()

def extract_text_from_response(response: dict) -> str:
    try:
        candidates = response.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates in response")
        parts = candidates[0].get("content", {}).get("parts", [])
        text_parts = [p["text"] for p in parts if "text" in p]
        return "\n".join(text_parts).strip()
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected response structure: {e}") from e

def parse_coding_output(text: str, practice_id: str) -> dict:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())

    coding = json.loads(text)

    assert "practice_id" in coding, "Missing practice_id"
    assert "p1" in coding, "Missing p1"
    assert "p2" in coding, "Missing p2"
    assert "p3" in coding and isinstance(coding["p3"], list), "Missing/invalid p3"

    for field in ("p1", "p2"):
        if coding[field] is None or coding[field].get("category_id") is None:
            coding[field] = {
                "category_id":      None,
                "justification":    None,
                "verbatim_evidence": None,
            }

    coding["practice_id"] = practice_id
    return coding

def call_with_backoff(
    system_prompt: str,
    user_prompt: str,
    token: str,
    valid_category_ids: set[str],
    practice_id: str,
) -> dict | None:
    delay = INITIAL_DELAY
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = call_vertex(system_prompt, user_prompt, token)
            text     = extract_text_from_response(response)
            coding   = parse_coding_output(text, practice_id)

            for field in ("p1", "p2"):
                cid = coding[field]["category_id"]
                if cid is not None and cid not in valid_category_ids:
                    raise ValueError(f"Invalid category_id '{cid}' in {field}")
            for item in coding["p3"]:
                if item["category_id"] not in valid_category_ids:
                    raise ValueError(
                        f"Invalid category_id '{item['category_id']}' in p3"
                    )
            return coding

        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response else 0
            if status in (429, 500, 503, 504):
                jitter = delay * 0.1
                sleep_for = min(delay + jitter, MAX_DELAY)
                print(
                    f"  [HTTP {status}] Attempt {attempt}/{MAX_RETRIES}. "
                    f"Retrying in {sleep_for:.1f}s..."
                )
                time.sleep(sleep_for)
                delay = min(delay * 2, MAX_DELAY)
                if attempt % 3 == 0:
                    token = get_access_token()
            else:
                print(f"  [FATAL HTTP {status}] {e} — skipping practice {practice_id}")
                return None

        except (json.JSONDecodeError, AssertionError, ValueError, KeyError) as e:
            print(f"  [PARSE ERROR] Attempt {attempt}/{MAX_RETRIES}: {e}")
            if attempt == MAX_RETRIES:
                print(f"  Giving up on {practice_id}")
                return None
            time.sleep(delay)
            delay = min(delay * 2, MAX_DELAY)

        except Exception as e:
            print(f"  [UNEXPECTED] {e}")
            return None

    return None

def save_output(path: Path, codings: dict) -> None:
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(codings, f, ensure_ascii=False, indent=2)
    tmp.replace(path)

# ---------------------------------------------------------------------------
# Main (Test Run: first 10 practices)
# ---------------------------------------------------------------------------

def main():
    print("=== TEST RUN: test_correlate_practices.py ===\n")

    print(f"Loading extractions from {EXTRACTIONS_PATH}...")
    with open(EXTRACTIONS_PATH, encoding="utf-8") as f:
        extractions = json.load(f)

    print(f"Loading ontology from {ONTOLOGY_PATH}...")
    ontology_categories = load_ontology_compact(ONTOLOGY_PATH)
    valid_category_ids  = {c["category_id"] for c in ontology_categories}
    print(f"  {len(ontology_categories)} categories loaded, "
          f"{len(valid_category_ids)} unique IDs.")

    practices = flatten_practices(extractions)[:10]  # Limit to 10 for test
    print(f"  {len(practices)} test practices selected.\n")

    codings = {}
    print("Authenticating with Google Cloud ADC...")
    token = get_access_token()
    print("  Token obtained.\n")

    processed = 0
    failed    = 0

    for practice in practices:
        practice_id = practice["practice_id"]
        print(f"Coding [{processed + failed + 1}/{len(practices)}] "
              f"{practice_id} — {practice.get('practice_name', '')[:60]}...")

        system_prompt, user_prompt = build_prompt(practice, ontology_categories)
        coding = call_with_backoff(
            system_prompt, user_prompt, token, valid_category_ids, practice_id
        )

        if coding is not None:
            codings[practice_id] = coding
            processed += 1
            save_output(OUTPUT_PATH, codings)
        else:
            failed += 1
            codings[practice_id] = {
                "practice_id": practice_id,
                "p1": {"category_id": None, "justification": "EXTRACTION_FAILED", "verbatim_evidence": None},
                "p2": {"category_id": None, "justification": "EXTRACTION_FAILED", "verbatim_evidence": None},
                "p3": [],
            }
            save_output(OUTPUT_PATH, codings)

        time.sleep(INTER_CALL_DELAY)

    print(f"\n=== Test Run Complete ===")
    print(f"  Coded:  {processed}")
    print(f"  Failed: {failed}")
    print(f"  Output: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
