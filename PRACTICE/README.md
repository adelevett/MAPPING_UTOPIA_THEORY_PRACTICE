# Rob Hopkins Blog Ostrom SES Extraction Pipeline

This repository contains the pipeline to ingest, filter, geocode, and extract structured data from [Rob Hopkins' Blog](https://www.robhopkins.net/) into Elinor Ostrom's **Social-Ecological Systems (SES)** framework.

---

## 1. Directory Structure

*   **Module-01/scripts/fetch_posts.py**: Crawls all blog posts from the WordPress API with rate-limiting and outputs raw JSON cache.
*   **Module-01/scripts/extract_all.py**: Main extraction pipeline script. Parses the cache via Vertex AI, resolves coordinates, and writes output.
*   **ses_extraction_schema.json**: JSON schema defining Ostrom SES variables grouped under a `practices` array.
*   **ses_extraction_prompt.md**: Strict system prompt defining extraction rules, evidence requirements, and temporal classifications.
*   **posts_cache.json**: Cached raw JSON payload of all 324 ingested blog posts.
*   **extractions_output.json**: Fully populated extracted database of 803 practices in Ostrom SES format.
*   **geocode_cache.json**: Local cache mapping location text to latitude and longitude coordinates.
*   **PROGRESS_SUMMARY.md**: Technical execution summary and metrics.

---

## 2. Environment Setup

### Python Virtual Environment
Initialize and configure the project virtual environment:
```powershell
# Create virtual environment
python -m venv .venv

# Install dependencies
.venv\Scripts\pip install google-auth requests
```

### Google Cloud Authorization
Verify `gcloud` is installed, initialized, and configured with Application Default Credentials (ADC):
```powershell
# Initialize gcloud and select project [YOUR-PROJECT-ID]
gcloud init

# Authorize Application Default Credentials locally
gcloud auth application-default login
```

---

## 3. Running the Pipeline

### Step 1: Ingest Blog Posts
Runs a safe paginated crawl across Rob Hopkins' blog. It uses a 1.0-second delay between requests to prevent API rate-limiting issues:
```powershell
.venv\Scripts\python.exe Module-01/scripts/fetch_posts.py
```
*Output: `posts_cache.json`*

### Step 2: Run Structured Extraction
Iterates through raw cached posts, runs the Ostrom prompt using Vertex AI (`gemini-3.5-flash` on the `global` endpoint), extracts location strings, resolves coordinates, and saves outputs:
```powershell
.venv\Scripts\python.exe Module-01/scripts/extract_all.py
```
*Output: `extractions_output.json`, `geocode_cache.json`*

---

## 4. Pipeline Design Features

*   **Resumability**: The extraction script checks the output file `extractions_output.json` on startup. If a post's ID already exists in the dictionary, it is skipped. If the script is halted due to a network interruption or token expiration, running the script again will resume processing from the last unparsed post.
*   **Vertex AI Exponential Backoff**: Automatically handles API rate limits (HTTP 429) or transient gateway errors (HTTP 500/503) by retrying requests with increasing delays (2s, 4s, 8s, 16s, etc.).
*   **Polite Geocoding**: Limits geocoding to 1 request per second to respect OpenStreetMap Nominatim guidelines. Coordinates are cached locally in `geocode_cache.json`, preventing redundant API calls when processing multiple posts referencing the same city.
