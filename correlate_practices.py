"""
correlate_practices.py
======================
Stage 1 of the visual layer pipeline.

Reads extractions_output.json (803 Ostrom SES practices) and ontology.json,
codes each practice against the 40-category ontology via Vertex AI, and writes
incrementally to practice_codings.json.

Matches the infrastructure pattern from extract_all.py:
  - Vertex AI ADC authentication
  - Exponential backoff for 429/500/503/504
  - Resumability: skips practice_ids already in output file
  - Incremental JSON write after each practice

Usage:
    .venv/Scripts/python.exe correlate_practices.py

Output:
    practice_codings.json  — one entry per practice with p1/p2/p3 codes
"""

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
# Configuration
# ---------------------------------------------------------------------------

EXTRACTIONS_PATH = Path("extractions_output.json")
ONTOLOGY_PATH    = Path("ontology.json")
OUTPUT_PATH      = Path("practice_codings.json")
PROMPT_PATH      = Path("correlation_prompt.md")   # for reference; prompts built inline

# Vertex AI — match your existing project/region
GCP_PROJECT  = "sonic-name-500202-t5"
GCP_LOCATION = "global"  # or "us-central1" if global endpoint unavailable
MODEL_ID     = "gemini-3.5-flash"  # high-reasoning flash model

VERTEX_URL = (
    f"https://aiplatform.googleapis.com/v1/projects/{GCP_PROJECT}"
    f"/locations/{GCP_LOCATION}/publishers/google/models/{MODEL_ID}:generateContent"
)

# Backoff config
MAX_RETRIES    = 6
INITIAL_DELAY  = 2.0   # seconds
MAX_DELAY      = 120.0

# Delay between successful API calls (politeness)
INTER_CALL_DELAY = 0.5

# ---------------------------------------------------------------------------
# Ontology helpers
# ---------------------------------------------------------------------------

def load_ontology_compact(ontology_path: Path) -> list[dict]:
    """
    Flatten ontology.json into a compact list of category dicts containing
    only the fields the model needs for coding. Strips schema metadata.
    """
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
    """
    extractions_output.json is keyed by post_id; each post has a 'practices'
    list. Flatten to a list of practices with a stable globally-unique
    practice_id composed of post_id + index.

    Adjusts if the actual schema uses different field names — inspect the first
    record and adapt the field names below to match your actual output.
    """
    flat = []
    for post_id, post_data in extractions.items():
        # Handle both list-of-practices and dict-with-practices-key structures
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


def build_prompt(practice: dict, ontology_categories: list[dict]) -> str:
    """
    Build the user-turn prompt for a single practice.
    We include only the fields relevant to coding; large null Ostrom fields
    are omitted to save tokens.
    """
    # Select the practice fields most useful for coding
    practice_for_prompt = {
        "practice_id":    practice.get("practice_id"),
        "practice_name":  practice.get("practice_name") or practice.get("title"),
        "location":       practice.get("location_string") or practice.get("location"),
        "temporal":       practice.get("temporal_classification") or practice.get("temporal"),
        "evidence":       practice.get("evidence"),
        # Ostrom outcome fields are the richest source of practice description
        "outcomes":       practice.get("outcomes"),
        "interactions":   practice.get("interactions"),
        "users":          practice.get("users"),
        "governance":     practice.get("governance_systems"),
        "resource":       practice.get("resource_systems"),
    }
    # Strip null fields to save tokens
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
    """
    Make a single Vertex AI generateContent call.
    Uses high-thinking configuration to improve structural adherence.
    Returns parsed JSON response dict.
    """
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": user_prompt}]}
        ],
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature":     1.0,   # required for thinking mode
            "thinkingConfig": {
                "thinkingBudget": 8192  # maximum budget to remove reasoning caps
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
    """Pull the model's text output from Vertex generateContent response."""
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
    """
    Parse the model's JSON output. Strips accidental markdown fences.
    Returns a validated coding dict.
    """
    # Strip markdown fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())

    coding = json.loads(text)

    # Validate required keys
    assert "practice_id" in coding, "Missing practice_id"
    assert "p1" in coding, "Missing p1"
    assert "p2" in coding, "Missing p2"
    assert "p3" in coding and isinstance(coding["p3"], list), "Missing/invalid p3"

    # Normalise: ensure null objects have consistent structure
    for field in ("p1", "p2"):
        if coding[field] is None or coding[field].get("category_id") is None:
            coding[field] = {
                "category_id":      None,
                "justification":    None,
                "verbatim_evidence": None,
            }

    # Validate that assigned category IDs actually exist in the ontology
    # (caller passes valid_ids set)
    coding["practice_id"] = practice_id  # enforce correct id
    return coding


def call_with_backoff(
    system_prompt: str,
    user_prompt: str,
    token: str,
    valid_category_ids: set[str],
    practice_id: str,
) -> tuple[dict | None, str | None]:
    """
    Call Vertex AI with exponential backoff. Returns tuple (parsed_coding, raw_response_text).
    """
    delay = INITIAL_DELAY
    last_text = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = call_vertex(system_prompt, user_prompt, token)
            text     = extract_text_from_response(response)
            last_text = text
            coding   = parse_coding_output(text, practice_id)

            # Validate category IDs
            for field in ("p1", "p2"):
                cid = coding[field]["category_id"]
                if cid is not None and cid not in valid_category_ids:
                    raise ValueError(f"Invalid category_id '{cid}' in {field}")
            for item in coding["p3"]:
                if item["category_id"] not in valid_category_ids:
                    raise ValueError(
                        f"Invalid category_id '{item['category_id']}' in p3"
                    )
            return coding, text

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
                return None, None

        except (json.JSONDecodeError, AssertionError, ValueError, KeyError) as e:
            print(f"  [PARSE ERROR] Attempt {attempt}/{MAX_RETRIES}: {e}")
            if attempt == MAX_RETRIES:
                print(f"  Giving up on {practice_id}")
                return None, last_text
            time.sleep(delay)
            delay = min(delay * 2, MAX_DELAY)

        except Exception as e:
            print(f"  [UNEXPECTED] {e}")
            return None, last_text

    return None, last_text


# ---------------------------------------------------------------------------
# Output file management
# ---------------------------------------------------------------------------

def load_existing_output(path: Path) -> dict:
    """Load existing practice_codings.json for resumability."""
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_output(path: Path, codings: dict) -> None:
    """Write the full codings dict atomically."""
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(codings, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== Correlation Pipeline: correlate_practices.py ===\n")

    # Load inputs
    print(f"Loading extractions from {EXTRACTIONS_PATH}...")
    with open(EXTRACTIONS_PATH, encoding="utf-8") as f:
        extractions = json.load(f)

    print(f"Loading ontology from {ONTOLOGY_PATH}...")
    ontology_categories = load_ontology_compact(ONTOLOGY_PATH)
    valid_category_ids  = {c["category_id"] for c in ontology_categories}
    print(f"  {len(ontology_categories)} categories loaded, "
          f"{len(valid_category_ids)} unique IDs.")

    # Flatten practices
    practices = flatten_practices(extractions)
    print(f"  {len(practices)} practices flattened from {len(extractions)} posts.\n")

    # Load existing output for resumability
    codings = load_existing_output(OUTPUT_PATH)
    already_done = set(codings.keys())
    print(f"  {len(already_done)} practices already coded. Resuming...\n")

    # Get initial access token
    print("Authenticating with Google Cloud ADC...")
    token = get_access_token()
    print("  Token obtained.\n")

    # Token refresh interval (Vertex tokens expire after ~1 hour)
    token_refresh_counter = 0
    TOKEN_REFRESH_EVERY   = 50  # refresh every 50 calls

    # Processing loop
    processed = 0
    skipped   = 0
    failed    = 0

    for practice in practices:
        practice_id = practice["practice_id"]

        if practice_id in already_done:
            skipped += 1
            continue

        # Refresh token periodically
        token_refresh_counter += 1
        if token_refresh_counter % TOKEN_REFRESH_EVERY == 0:
            print(f"  [Token refresh at call {token_refresh_counter}]")
            token = get_access_token()

        print(f"Coding [{processed + skipped + failed + 1}/{len(practices)}] "
              f"{practice_id} — {practice.get('practice_name', '')[:60]}...")

        system_prompt, user_prompt = build_prompt(practice, ontology_categories)

        coding, raw_response = call_with_backoff(
            system_prompt, user_prompt, token, valid_category_ids, practice_id
        )

        if coding is not None:
            codings[practice_id] = coding
            processed += 1
            # Persist after every successful coding
            save_output(OUTPUT_PATH, codings)
        else:
            failed += 1
            # Write a null placeholder so we know this was attempted
            codings[practice_id] = {
                "practice_id": practice_id,
                "p1": {"category_id": None, "justification": "EXTRACTION_FAILED",
                        "verbatim_evidence": None},
                "p2": {"category_id": None, "justification": "EXTRACTION_FAILED",
                        "verbatim_evidence": None},
                "p3": [],
                "raw_response": raw_response
            }
            save_output(OUTPUT_PATH, codings)

        time.sleep(INTER_CALL_DELAY)

    print(f"\n=== Complete ===")
    print(f"  Newly coded:  {processed}")
    print(f"  Skipped:      {skipped}")
    print(f"  Failed:       {failed}")
    print(f"  Output:       {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
