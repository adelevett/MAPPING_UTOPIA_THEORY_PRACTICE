# Technical Methodological Summary: CSR Ontology Extraction

This document summarizes the technical and methodological execution of the **Conceptual Systematic Review (CSR)** ontology extraction and classification matrix, operationalized in accordance with the framework defined by Schreiber & Cramer (2024).

---

## 1. Methodological Framework: Schreiber & Cramer (2024)
The Conceptual Systematic Review (CSR) methodology aims to map, systematize, and resolve polysemous or tangled concepts (in this case, "utopianism and dystopianism in digital education") across a selected literature corpus. The pipeline executed the six core stages of the framework:

```
  +---------------------------------------+
  | Stage 1: Identify Tangled Term        | -> Scope: Utopianism/Dystopianism in Digital Education
  +---------------------------------------+
                     |
  +---------------------------------------+
  | Stage 2 & 3: Theoretical Heuristics   | -> Baseline Taxonomy (10 categories across 3 perspectives)
  +---------------------------------------+
                     |
  +---------------------------------------+
  | Stage 4 & 5: Empirical Systematization| -> Stateful Rolling Loop (Dynamic Inductive Schema Expansion)
  +---------------------------------------+
                     |
  +---------------------------------------+
  | Stage 6: Presentation (JSON Matrix)   | -> Final ontology.json & coded_matrix.json
  +---------------------------------------+
```

### Analytical Quality Criteria Enforced:
1.  **Definiteness:** Every perspective and category in the ontology is defined with explicit boundaries and application rules.
2.  **Selectivity:** Perspectives are mutually exclusive (analytical dimensions do not overlap).
3.  **Independence:** Categories within a single perspective do not share hierarchical subset relationships.
4.  **Generality (Exhaustiveness):** Every conceptual claim regarding technological educational futures in the corpus must map to a category. If a text segment cannot be coded under the baseline frame, a new category is inductively added.
5.  **Operationalizability:** Every applied category is anchored to an exact verbatim quote from the literature.

---

## 2. Technical Architecture: Stateful Rolling Pipeline
Freezing the taxonomy in a global first pass forces a purely deductive coding process, which violates the CSR requirement for reciprocal deductive-inductive loops. To resolve this, we designed a **Stateful Rolling Pipeline**:

```
+--------------------------------------------------------------------------------+
| PHASE 1: Baseline Deductive Taxonomy Generation                                |
| Ingests 23 context summaries -> Calls API -> Saves baseline ontology.json (10 categories) |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| PHASE 2: Rolling Inductive Coding Loop (Iterated 23 times)                     |
|                                                                                |
|  For each reference (1 to 23):                                                 |
|    1. Load current ontology.json + Target Paper Context Text                   |
|    2. Call API: Code paper against ontology.                                   |
|       If a claim doesn't fit -> Inductively generate new category.             |
|    3. Save updated ontology.json back to disk.                                 |
|    4. Append coding block to matrix results.                                   |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| PHASE 3: Compilation and Validation                                            |
| Saves final ontology.json and coded_matrix.json -> Executes validation checks.   |
+--------------------------------------------------------------------------------+
```

*   **Model Utilized:** `gemini-3.1-pro-preview` (Vertex AI API) accessed using Google Application Default Credentials (ADC) to ensure maximum reasoning capability.
*   **Context Ingestion:** The script merged abstracts, publisher summaries, extended descripions, and the first 4,500 characters (introductions) of 16 downloaded/extracted full-text papers to maximize qualitative detail while remaining within context and token constraints.
*   **Token Truncation Prevention:** Calling the API iteratively (one-by-one) for the coding matrix prevented output token limit truncation (which occurs when attempting to generate justifications and quotes for 23 papers in a single prompt).

---

## 3. Empirical Results & Schema Expansion Statistics
The rolling pipeline successfully mapped the entire corpus of 23 core references:

*   **Taxonomy Expansion:** The ontology grew from **10 baseline categories** to **40 final categories** across 3 perspectives, proving the activation of the inductive loop.
*   **Final Perspective Structure:**
    *   **Perspective P1: Typologies of Visionary Constructs** (14 categories) — Distinguishes between concrete, critical-dystopian, anti-utopian, domesticated, open-speculative, solarpunk, and techno-deterministic models.
    *   **Perspective P2: Speculative Methodologies in Education** (13 categories) — Captures tools like *Utopia as Method*, *Speculative Design*, *Cognitive Estrangement*, and *Narrative Mapping*.
    *   **Perspective P3: Pedagogical Affects and Orientations** (13 categories) — Details the psychological, political, and ethical orientations (e.g., *Educated Hope/Fear*, *Existential Anxiety*, *Critical Pedagogical Action*).
*   **Matrix Coverage:** 100% of the 23 references were fully coded with detailed justifications and verbatim anchoring quotes (69 total codings).

---

## 4. Verification Check
Deliverables were programmatically verified using `verify_deliverables.py`, confirming:
*   Perfect syntax validity for both JSON deliverables.
*   All 69 applied codes successfully resolve to valid category IDs defined in the ontology schema (zero orphaned references).
