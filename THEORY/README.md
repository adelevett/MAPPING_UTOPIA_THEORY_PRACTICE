# Conceptual Systematic Review (CSR) Workspace

This directory houses the source corpora, tools, pipeline scripts, and structured JSON deliverables for the **Conceptual Systematic Review (CSR)** of "utopianism and dystopianism in digital education."

---

## 1. Directory Structure

```
Final-Project/
├── 03-full-text-papers/           # Literature Corpus
│   ├── original-papers-pdfs/      # Core reference PDFs (Open Access)
│   ├── next-best-things-pdfs/     # Proxy PDFs (Citing/Author Open Access)
│   └── extracted-structures/      # Layout JSONs and parsed plain-text Markdown (.md)
│
├── 04-ai-artifacts/               # Deliverables & Pipeline Inputs
│   ├── references_resolved.json   # Base metadata, abstracts, and summaries
│   ├── ontology.json              # FINAL DELIVERABLE: Structured Extraction Ontology (JSON Schema)
│   └── coded_matrix.json          # FINAL DELIVERABLE: Coded Qualitative Review Matrix (JSON)
│
├── METHODOLOGICAL_SUMMARY.md      # Technical details of the Schreiber & Cramer (2024) execution
└── README.md                      # This guide
```

---

## 2. Deliverables Description

The deliverables are located under [04-ai-artifacts/](file:///C:/Users/delevetta/Documents/Su26/EDTECH575/Final-Project/04-ai-artifacts):

*   **[ontology.json](file:///C:/Users/delevetta/Documents/Su26/EDTECH575/Final-Project/04-ai-artifacts/ontology.json)**: A valid JSON Schema representation of the qualitative extraction ontology. It defines 3 distinct analytical perspectives (*Typologies of Visionary Constructs*, *Speculative Methodologies*, and *Pedagogical Affects*) containing 40 total categories. Each category contains a definition, coding rule, and verbatim anchor quote.
*   **[coded_matrix.json](file:///C:/Users/delevetta/Documents/Su26/EDTECH575/Final-Project/04-ai-artifacts/coded_matrix.json)**: A JSON dataset containing the classification mapping of the 23 core references. Every reference contains justifications and verbatim evidence snippets.

---

## 3. How to Run the Pipeline

### Prerequisites
1.  **GCP Application Default Credentials (ADC):**
    Ensure your local environment is authenticated to your Google Cloud project (Vertex AI APIs enabled). Run:
    ```bash
    gcloud auth application-default login
    ```
2.  **Virtual Environment Setup:**
    Activate the Python virtual environment located in `Module-06`:
    ```powershell
    # In PowerShell:
    & "C:\Users\delevetta\Documents\Su26\EDTECH575\Module-06\.venv\Scripts\Activate.ps1"
    ```

### Running the Rolling Extraction
To execute the pipeline and re-generate the deliverables:
1.  Navigate to the scratch directory where the pipeline script is kept:
    `C:\Users\delevetta\.gemini\antigravity-cli\brain\43343593-9c56-4792-bbf8-f78f04772ba3\scratch\`
2.  Run the pipeline:
    ```bash
    python extract_ontology_adc.py
    ```
    *Note: The script compiles context units from `references_resolved.json` and `extracted-structures/`, makes a baseline call, and loops 23 times to code and inductively grow the ontology using `gemini-3.1-pro-preview`.*

### Validating the Deliverables
To verify that the generated ontology and matrix files are complete and cross-referenced:
```bash
python verify_deliverables.py
```
This script will parse both JSON files, check their structures, count perspectives/categories, and ensure all matrix codings reference valid category IDs in the schema.
