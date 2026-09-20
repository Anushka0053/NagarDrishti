# NagarDrishti Project Guide

Consolidated setup and technical documentation. See [README](README.md) for the overview and quickstart, and [SECURITY](SECURITY.md) for security and privacy architecture.

The reference sections preserve the project specifications and blueprint; they do not verify that every planned capability is implemented.

## Contents
- [Development](#development)
- [Database Setup](#database-setup)
- [Architecture](#architecture)
- [Database Reference](#database-reference)
- [API Reference](#api-reference)
- [Data Sources](#data-sources)

---

## Development

**Operating System**: Windows / Linux / macOS

---

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Supabase Account** (or local Docker PostGIS instance)

---

### 2. Windows Development Setup Commands

#### Step 1: Database Setup
1. Open your Supabase project dashboard -> SQL Editor.
2. Run `database/supabase_schema.sql`.
3. Run `database/seeds/001_dev_seed.sql`.

#### Step 2: Backend Development Server
Open PowerShell in project root:
```powershell
cd backend
python -m pip install -r requirements.txt
cp .env.example .env
# Update .env with your Supabase database credentials
uvicorn app.main:app --reload --port 8000
```

#### Step 3: Frontend Development Server
Open a second PowerShell window:
```powershell
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### 3. Running Automated Tests

#### Python Backend Tests
```powershell
cd backend
python -m pytest
```

#### Database Health Check
```powershell
python scripts/check_db.py
```

---

## Database Setup

**Scope**: Madhya Pradesh Geospatial Civic Intelligence Platform | **Reference City**: Gwalior

This guide walks you through setting up the complete PostgreSQL + PostGIS database in Supabase for **NagarDrishti**.

---

### 1. Prerequisites
1. A Supabase account and a new Supabase Project ([supabase.com](https://supabase.com)).
2. Selected Region: `ap-south-1` (Mumbai, India recommended for lowest latency in MP).

---

### 2. Enable PostGIS & Required Extensions
In your Supabase Dashboard:
1. Navigate to **Database** -> **Extensions**.
2. Search for and enable:
   - `postgis` (PostGIS spatial database engine)
   - `uuid-ossp` (UUID generation functions)
   - `pgcrypto` (Cryptographic hashing functions)
   - `btree_gist` (GiST indexing for scalar types)
   - `pg_trgm` (Trigram text matching for search)

*(Note: The schema script will also execute `CREATE EXTENSION IF NOT EXISTS` automatically).*

---

### 3. Execute Schema Migration

You have two execution options:

#### Option A: Unified One-Click Execution (Recommended)
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Open [`database/supabase_schema.sql`](database/supabase_schema.sql).
3. Copy and paste the entire script into the SQL Editor.
4. Click **Run**.
5. Verify that all 19 tables, enums, triggers, RLS policies, storage buckets, and realtime publications are created without errors.

#### Option B: Step-by-Step Migration Sequence
If you prefer running individual migration files, execute them in this exact order:
1. `database/migrations/001_extensions_and_enums.sql` — Extensions, Enums & update trigger
2. `database/migrations/002_admin_and_geography.sql` — MP Administrative hierarchy, Cities, Wards, Localities
3. `database/migrations/003_layers_and_sources.sql` — Sectors, Departments, Data Sources & GIS Layer catalog
4. `database/migrations/004_civic_features.sql` — PostGIS Civic Features model & spatial indexes
5. `database/migrations/005_citizen_feedback.sql` — Citizen Reports, Media, Status History, Evidence & Corroborations
6. `database/migrations/006_civic_intelligence_and_ai.sql` — Issue Clusters, Risk Scores, Public Records, AI Reports, Translations
7. `database/migrations/007_admin_and_audit.sql` — Dataset Uploads, Ingestion Runs, Audit Logs
8. `database/migrations/008_rls_and_security.sql` — Row Level Security (RLS) policies for all roles
9. `database/migrations/009_storage_and_realtime.sql` — Supabase Storage buckets & Realtime publications

---

### 4. Seed Development Data (MP & Gwalior Reference City)
1. In the **SQL Editor**, open [`database/seeds/001_dev_seed.sql`](database/seeds/001_dev_seed.sql).
2. Copy and paste the script and click **Run**.
3. This seeds:
   - State of Madhya Pradesh & 5 key MP districts (Gwalior, Indore, Bhopal, Jabalpur, Ujjain).
   - Gwalior City (Reference City) with default coordinates `[26.2183, 78.1828]`.
   - 5 Gwalior wards (Lashkar, Maharaj Bada, Morar, Thatipur, City Center) with PostGIS polygon boundaries.
   - 8 Sectors & 6 Government Departments.
   - 6 Data Source registries (GARUD MP, MP eService, ISRO Bhuvan, data.gov.in, OSM, NagarDrishti Internal).
   - Core GIS layer definitions (Roads, Hospitals, Water Tanks, Police Stations, Issue Clusters).
   - Sample Gwalior civic geographic features & test report.

---

### 5. Verify Setup
Run this verification SQL query in the Supabase SQL Editor:
```sql
SELECT 
    (SELECT count(*) FROM admin_units) AS admin_units_count,
    (SELECT count(*) FROM cities) AS cities_count,
    (SELECT count(*) FROM wards) AS wards_count,
    (SELECT count(*) FROM sectors) AS sectors_count,
    (SELECT count(*) FROM departments) AS departments_count,
    (SELECT count(*) FROM data_sources) AS data_sources_count,
    (SELECT count(*) FROM gis_layers) AS gis_layers_count,
    (SELECT count(*) FROM gis_features) AS gis_features_count;
```
Expected result: All counts > 0.

---

### 6. Obtain Supabase Environment Variables
Go to **Project Settings** -> **API** and copy:
- **Project URL** -> set as `SUPABASE_URL` in `.env`
- **anon public key** -> set as `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
- **service_role secret** -> set as `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` *(NEVER expose to frontend)*
- **Database Connection String (URI)** from **Database** -> **Connection String** (use Transaction Pooler port 6543) -> set as `DATABASE_URL` in `backend/.env`.

---

## Architecture

**Scope**: Madhya Pradesh Geospatial Civic Intelligence Platform | **Phase**: 1 of 6

---

### 1. System Topology Overview

NagarDrishti uses a decoupled, production-grade 3-tier architecture:

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|   React 18 + TypeScript + Vite + Tailwind CSS + MapLibre GL JS          |
|   State: Zustand (Map/UI) + TanStack Query (Server Data)                |
|   Localization: i18next (Hindi / English)                               |
+------------------------------------+------------------------------------+
                                     | REST (JSON / GeoJSON) & WebSockets
+------------------------------------v------------------------------------+
|                               BACKEND                                   |
|   FastAPI + Pydantic v2 + SQLAlchemy 2.0 + GeoAlchemy2 + Shapely        |
|   - Spatial Query Orchestration (PostGIS ST_*)                          |
|   - External Source Registry Adapters (GARUD, Bhuvan, OGD, MP eService) |
|   - Sarvam AI Integration (STT, Translate, TTS, Grounded Summaries)     |
+------------------------------------+------------------------------------+
                                     | PostGIS / SQL / Storage / Realtime
+------------------------------------v------------------------------------+
|                         DATABASE & STORAGE                              |
|   Supabase PostgreSQL 16 + PostGIS 3.4 Extension                        |
|   - Master Administrative & Civic Feature Store                         |
|   - Row Level Security (RLS) Policies on all tables                     |
|   - Supabase Storage: 'report-media', 'gis-datasets', 'ai-audio-cache'  |
|   - Supabase Realtime Publication for accepted reports/clusters         |
+-------------------------------------------------------------------------+
```

---

### 2. 5-Zone GIS Dashboard Information Architecture (SRS Section 22)

```
+-------------------------------------------------------------------------+
| 1. TOP HEADER                                                           |
| [Logo] [MP City Selector]   [Universal Search / AI Bar]   [हिन्दी/EN] [User]|
+-------------------+-----------------------------------+-----------------+
| 2. LEFT SIDEBAR   | 3. CENTRAL MAP WORKSPACE          | 4. RIGHT        |
| - Layers Catalog  | - MapLibre GL Interactive Canvas  |    INSPECTOR    |
| - Sectors View    | - Floating GIS Toolbar (Identify, | - Overview      |
| - Departments     |   Buffer, Route, Proximity, etc.) | - Civic Status  |
| - Basemap Switcher| - Coordinates & Live Status Bar   | - AI Summary    |
| - Legend Swatches | - GeoJSON & Vector Tile Overlays  | - Reports Graph |
|                   |                                   | - Source Links  |
+-------------------+-----------------------------------+-----------------+
| 5. BOTTOM ANALYTICS DRAWER (Collapsible)                                |
| [City KPIs: 24 Open | 118 Resolved] [Category Bars] [30-Day Trend]      |
+-------------------------------------------------------------------------+
```

---

### 3. Directory Responsibilities

| Directory | Responsibility |
| :--- | :--- |
| `backend/app/api/v1/` | REST endpoint routing and HTTP serialization |
| `backend/app/core/` | Central configuration, database pooling, security, and error handling |
| `backend/app/models/` | SQLAlchemy 2.0 Declarative ORM models with GeoAlchemy2 spatial types |
| `backend/app/schemas/` | Pydantic v2 validation contracts for requests and responses |
| `backend/app/services/` | Core domain services (SpatialService, AIService, FeedbackService, IntelligenceService) |
| `backend/app/adapters/` | Upstream data source connectors (GARUD MP, ISRO Bhuvan, MP eService, Sarvam AI) |
| `database/migrations/` | Modular, ordered SQL migrations (001 through 009) |
| `database/seeds/` | Clearly labeled development test data for MP and Gwalior |
| `frontend/src/components/layout/` | Shell layout containers: Header, LeftSidebar, Inspector, AnalyticsDrawer |
| `frontend/src/components/map/` | MapLibre instance, FloatingToolbar, CoordinatesBar |
| `frontend/src/components/feedback/`| 5-step citizen issue reporting modal |
| `frontend/src/store/` | Zustand reactive state slices for map, active layers, and feedback |
| `frontend/src/i18n/` | English and Hindi localization dictionaries |
| `infrastructure/` | Container definitions (Docker, Compose) for local and cloud deployment |
| `scripts/` | Database health verification and ingestion scripts |

---

### 4. Key Architectural Invariants

1. **Spatial Truth in PostGIS**: All spatial relationship calculations (point-in-polygon, buffer intersections, proximity distances) are performed on the server via PostGIS (`ST_DWithin`, `ST_Intersects`, `ST_Buffer`), not in client JavaScript.
2. **AI Grounding Guardrail**: Sarvam AI is used as a multilingual reasoning and language interface. All factual claims are grounded in database evidence bundles containing explicit source IDs and dates.
3. **Multi-City Scaling**: Adding a new Madhya Pradesh city is purely a database configuration and boundary ingestion task—no codebase modifications or city-specific forks are required.
4. **Zero Commits of Privileged Keys**: Privileged credentials (Supabase Service Role Key, Sarvam API Key) remain strictly server-side.

---

## Database Reference

**Platform**: Supabase PostgreSQL 16 + PostGIS 3.4 Extension  
**Scope**: Full 6-Phase Master Blueprint for Madhya Pradesh

---

### 1. Relational & Spatial Entity Model

```
                    +-------------------+
                    |   admin_units     | (MP Administrative Hierarchy)
                    +---------+---------+
                              |
                     +--------v--------+
                     |     cities      | (ULBs / Municipal Corporations)
                     +--------+--------+
                              |
                     +--------v--------+
                     |      wards      | (Ward Polygons)
                     +--------+--------+
                              |
+--------------+    +---------v---------+    +----------------+
|  gis_layers  +--->|   gis_features    |<---+  data_sources  |
+--------------+    +-------------------+    +----------------+
                              ^
                              | (Spatial links)
                    +---------+---------+
                    |  citizen_reports  |
                    +----+---------+----+
                         |         |
          +--------------v-+     +-v--------------------+
          |  report_media  |     | report_status_history|
          +----------------+     +----------------------+
```

---

### 2. Table Summary (All 19 Tables)

| Table | Geometry Column | Primary Purpose |
| :--- | :--- | :--- |
| `admin_units` | `GEOMETRY(4326)`, `POINT(4326)` | MP state, divisions, districts, tehsils, villages |
| `cities` | `MULTIPOLYGON(4326)` | Enabled MP cities (Gwalior reference city, Indore, Bhopal, etc.) |
| `wards` | `MULTIPOLYGON(4326)` | Municipal ward boundary polygons, corporator info, population |
| `localities` | `GEOMETRY(4326)` | Mohallas, colonies, villages |
| `sectors` | *Non-spatial* | Sector taxonomy (Transport, Water, Health, Safety, Education) |
| `departments` | *Non-spatial* | Owning departments (GMC, MP PWD, Health, Police, etc.) |
| `data_sources` | *Non-spatial* | External source registry (GARUD, Bhuvan, OGD, MP eService, OSM) |
| `gis_layers` | *Metadata* | Dynamic metadata-driven layer definitions & style JSON |
| `gis_features` | `GEOMETRY(4326)` | Master civic asset & feature store (Points, Lines, Polygons) |
| `user_profiles` | *Non-spatial* | Linked to Supabase `auth.users` with RBAC roles |
| `citizen_reports`| `POINT(4326)` | Citizen issue reports with categories and normalized text |
| `report_media` | *Non-spatial* | Supabase Storage paths for photo/audio evidence |
| `report_status_history`| *Non-spatial* | Audit trail of report workflow transitions |
| `report_evidence` | *Non-spatial* | Evidence graph connecting reports to public records |
| `report_corroborations`| *Non-spatial* | Citizen upvoting / validation with abuse limits |
| `moderation_actions` | *Non-spatial* | Verifier / Moderator audit actions |
| `issue_clusters` | `POINT(4326)`, `POLYGON(4326)` | Spatial/temporal issue groupings |
| `risk_scores` | *Non-spatial* | Deterministic, explainable scoring records |
| `public_records` | *Non-spatial* | Official government orders, tenders, budgets |
| `news_mentions` | *Non-spatial* | Secondary evidence from verified public news sources |
| `ai_reports` | *Non-spatial* | Grounded Sarvam AI generated summaries |
| `translations` | *Non-spatial* | Translation cache with SHA-256 text hashing |
| `saved_places_routes`| `GEOMETRY(4326)` | User saved bookmarks and routes |
| `dataset_uploads` | *Non-spatial* | Admin GIS file imports and validation tracking |
| `ingestion_runs` | *Non-spatial* | ETL observability and sync execution logs |
| `audit_logs` | *Non-spatial* | Security and operational audit log |

---

### 3. Spatial Indexing Strategy
All tables containing geometry columns utilize PostGIS GiST (Generalized Search Tree) indexes:
```sql
CREATE INDEX idx_gis_features_geometry ON gis_features USING GIST(geometry);
CREATE INDEX idx_citizen_reports_geometry ON citizen_reports USING GIST(location_geometry);
CREATE INDEX idx_wards_geometry ON wards USING GIST(geometry);
CREATE INDEX idx_issue_clusters_centroid ON issue_clusters USING GIST(centroid);
```
Composite B-Tree indexes are created for common bounding-box + layer/category queries:
```sql
CREATE INDEX idx_gis_features_city_layer ON gis_features(city_id, layer_id);
CREATE INDEX idx_citizen_reports_city_status ON citizen_reports(city_id, status);
```

---

### 4. Row Level Security (RLS) Policies
Every table has Row Level Security enabled.
- **Public Read**: Enabled on master layers, active features, active wards, public reports (reporter personal identity protected), verified public records, and active clusters.
- **Authenticated Write**: Citizens can insert new reports, upload evidence media, corroborate reports, and manage their saved places.
- **Staff / Admin Roles**: Analysts, Verifiers, and Admins have role-based write access to moderation, layer management, and audit inspection.

---

## API Reference

**Base Path**: `/v1` | **Interactive Swagger Documentation**: `http://localhost:8000/docs`

---

### 1. Summary of Endpoints

#### System
- `GET /health` — Root health probe and service status.
- `GET /v1/health` — Full PostGIS connection and version check.

#### Geography & Administrative Units
- `GET /v1/admin-units` — MP administrative hierarchy units (State, Districts, Tehsils).
- `GET /v1/cities` — Enabled MP cities with center coordinates and zoom levels.
- `GET /v1/cities/{city_id}` — Details and bounding box for a specific city.
- `GET /v1/cities/{city_id}/wards` — Municipal wards for a city.

#### GIS Layers & Features
- `GET /v1/layers` — Dynamic GIS layers filtered by city, sector, or department.
- `GET /v1/layers/sectors` — Sectors taxonomy.
- `GET /v1/layers/departments` — Government departments catalog.
- `GET /v1/layers/{layer_id}/features` — Features as a GeoJSON `FeatureCollection` (supports `bbox` and `city_id` query parameters).
- `GET /v1/features/{feature_id}` — Comprehensive feature attributes, geometry, and source provenance.
- `GET /v1/sources` — External data source registry.

#### Spatial Analysis Tools
- `POST /v1/spatial/identify` — PostGIS coordinate identification against active layers.
- `POST /v1/spatial/buffer` — Generates PostGIS buffer polygon for distance queries.
- `POST /v1/spatial/proximity` — Returns nearest facilities ordered by distance.
- `POST /v1/spatial/routes` — Computes shortest route with civic issues overlay.

#### Citizen Feedback & Intelligence
- `POST /v1/feedback` — Submit a citizen civic report with optional media paths.
- `GET /v1/feedback` — List public, accepted citizen reports.
- `POST /v1/feedback/{report_id}/corroborate` — Upvote / validate an existing report.
- `GET /v1/intelligence/clusters` — Retrieve active spatial issue clusters.
- `GET /v1/intelligence/{entity_type}/{entity_id}` — Assemble complete evidence bundle.

#### Sarvam AI Integration
- `POST /v1/ai/query` — Grounded natural-language civic queries.
- `POST /v1/ai/translate` — Cached Hindi/English translation service.
- `POST /v1/ai/transcribe` — Indian-language speech-to-text audio upload.

#### Administration & Operations
- `GET /v1/admin/ingestion-runs` — Observability of background source sync runs.

---

## Data Sources

**Scope**: Madhya Pradesh Urban Civic Datasets | **Reference City**: Gwalior

---

### 1. Authoritative Data Source Matrix (SRS Section 6)

| Source Key | Provider | Authority Level | Access Type | Geographic Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `garud_mp_uadd` | Directorate of Urban Administration & Development, MP | `conditional_official` | WMS / Portal / API | MP ULBs | **Conditional** (Requires departmental access agreement for full WFS) |
| `mp_eservice_api` | MP State Electronic Development Corporation (MPSEDC) | `verified_state_government` | Open API | Madhya Pradesh | **Verified** (Administrative hierarchy & village coordinates) |
| `isro_bhuvan_wms` | National Remote Sensing Centre (NRSC), ISRO | `verified_central_government` | OGC WMS / REST API | MP / National | **Verified** (LULC, Urban Land Use, Geomorphology, Proximity) |
| `data_gov_in_gwalior`| Open Government Data Platform India (NIC) | `verified_central_government` | REST Open API | Gwalior / MP | **Verified / Conditional** (Road infrastructure, Smart City datasets) |
| `osm_community` | OpenStreetMap Contributors | `community_open` | Overpass API | Global / MP | **Community** (Supplementary road/poi geometry with ODbL attribution) |
| `nagardrishti_internal`| NagarDrishti Platform Engine | `internal_platform` | PostGIS / Realtime | Madhya Pradesh | **Internal** (Verified citizen reports, issue clusters, risk scores) |

---

### 2. Status Definitions

- **Verified**: Official government capability and open endpoint verified.
- **Conditional**: Official government source exists; exact API credentials or inter-departmental data-sharing agreements must be configured before production sync.
- **Community**: Supplementary open datasets (e.g. OSM); non-authoritative, requires explicit attribution.
- **Internal**: Generated directly by NagarDrishti citizen feedback and spatial clustering pipelines.

---

### 3. Legal Attribution Requirements

1. **GARUD MP**: `"Source: Directorate of Urban Administration & Development, Govt of MP (GARUD GIS)"` / `"स्रोत: नगरीय प्रशासन एवं विकास संचालनालय, म.प्र. शासन (गरुड़ जीआईएस)"`
2. **ISRO Bhuvan**: `"Geospatial services provided by ISRO Bhuvan / NRSC (Govt of India)"` / `"भू-स्थानिक सेवाएं: इसरो भुवन / एनआरएससी (भारत सरकार)"`
3. **OpenStreetMap**: `"© OpenStreetMap contributors under ODbL license"` / `"© ओपनस्ट्रीटमैप योगदानकर्ता (ODbL लाइसेंस)"`
