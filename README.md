# NAGARDRISHTI (नगरदृष्टि)
### AI-Powered Geospatial Urban Civic Intelligence & Multilingual Feedback Analytics Platform
**Scope**: Madhya Pradesh Scale | **Reference Implementation City**: Gwalior  
**Phase 1 of 6**: Production Foundation, Architecture, Supabase/PostGIS Database & Development Infrastructure

---

## 🏛️ Executive Summary

**NagarDrishti** is a Madhya Pradesh-focused geospatial civic intelligence platform that combines GIS mapping, authoritative government/open public datasets, citizen feedback, spatial analytics, temporal history, and multilingual Indian AI (Sarvam AI).

Designed from Day 1 to scale from **Gwalior** to **Indore, Bhopal, Jabalpur, Ujjain** and across all MP Urban Local Bodies (ULBs).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | High-performance Single Page Application |
| **Styling** | Tailwind CSS, Glassmorphism UI | Professional dense GIS layout matching SRS Section 22 |
| **Map Engine** | MapLibre GL JS | Vector / Raster / GeoJSON / WMS rendering, clusters, tool overlays |
| **State Management** | Zustand & TanStack Query | Map, layer, tool state + server-state caching |
| **Forms & Validation**| React Hook Form + Zod | Typed validation for citizen feedback & uploads |
| **Backend API** | Python 3.10+, FastAPI, Pydantic v2 | High-throughput REST API, spatial query orchestration |
| **Database & GIS** | Supabase PostgreSQL + PostGIS | Canonical spatial store with GiST indexes & RLS policies |
| **ORM & Migrations** | SQLAlchemy 2.0, GeoAlchemy2 | PostGIS models, spatial filters |
| **Language & AI** | Sarvam AI APIs (Server-Side) | Indian language STT, Translation, TTS, Grounded Reasoning |
| **Authentication** | Supabase Auth | Citizen, Analyst, Verifier, GIS Admin, Super Admin roles |
| **Storage & Realtime**| Supabase Storage & Realtime | Media attachments, GIS datasets, live map cluster refresh |

---

## 📁 Repository Structure

```
nagardrishti/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── adapters/         # External source adapters (GARUD, Bhuvan, OGD, Sarvam)
│   │   ├── api/v1/           # Versioned REST endpoints
│   │   ├── core/             # Configuration, DB connection, logging, security
│   │   ├── models/           # SQLAlchemy 2.0 + GeoAlchemy2 PostGIS models
│   │   ├── schemas/          # Pydantic v2 request/response models
│   │   └── services/         # SpatialService, AIService, FeedbackService
│   └── tests/                # Automated API & Schema test suite
├── database/                 # Supabase PostgreSQL + PostGIS Schema & Migrations
│   ├── supabase_schema.sql   # Unified master SQL deliverable for Supabase SQL Editor
│   ├── migrations/           # 001 through 009 ordered migration files
│   ├── seeds/                # 001_dev_seed.sql (MP & Gwalior dev seed data)
├── frontend/                 # React + TypeScript + Vite + Tailwind + MapLibre
│   └── src/
│       ├── api/              # HTTP client and civic services
│       ├── components/       # Header, LeftSidebar, MapContainer, Inspector, AnalyticsDrawer, FeedbackModal
│       ├── i18n/             # English & Hindi translation catalogs
│       ├── pages/            # Dashboard, Login, Profile, Reports, Admin, NotFound
│       ├── store/            # Zustand stores (map, layers, feedback)
│       └── types/            # Complete TypeScript interfaces
├── infrastructure/           # Dockerfiles & Docker Compose setup
├── scripts/                  # check_db.py, seed_db.py
├── SECURITY.md               # Security foundation & RLS policy guide
└── PROJECT_GUIDE.md          # Setup, architecture, database, API & data sources
```

---

## ⚡ Quickstart Guide (Windows PowerShell / CMD)

### 1. Database Setup (Supabase)
1. Create a Supabase project in region `ap-south-1` (Mumbai).
2. Follow the instructions in [database setup guide](PROJECT_GUIDE.md#database-setup).
3. Copy [`database/supabase_schema.sql`](database/supabase_schema.sql) into the **Supabase SQL Editor** and click **Run**.
4. Copy [`database/seeds/001_dev_seed.sql`](database/seeds/001_dev_seed.sql) and click **Run**.

### 2. Backend Setup
```powershell
# Navigate to backend
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be available at: `http://localhost:8000`  
Swagger interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```powershell
# Navigate to frontend
cd frontend

# Install Node modules
npm install

# Configure environment
cp .env.example .env

# Start Vite dev server
npm run dev
```
Frontend GIS Dashboard will be available at: `http://localhost:5173`

---

## 🧪 Verification & Health Check
Run the database and PostGIS health check script:
```powershell
python scripts/check_db.py
```

Run the backend unit test suite:
```powershell
cd backend
pytest
```

## Documentation

- [README.md](README.md): overview, stack, quickstart, and verification.
- [PROJECT_GUIDE.md](PROJECT_GUIDE.md): development, database setup, architecture, database reference, API, and data sources.
- [SECURITY.md](SECURITY.md): security and privacy architecture and hardening roadmap.

These are the three Markdown files published to GitHub. Older individual guides and the extracted SRS remain local and are ignored by Git; maintain shared technical documentation in `PROJECT_GUIDE.md`. Environment examples, dependency lockfiles, source code, SQL migrations, and development seeds remain eligible for version control.