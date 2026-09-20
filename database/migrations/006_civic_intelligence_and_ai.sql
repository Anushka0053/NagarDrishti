-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 006: CIVIC INTELLIGENCE, RISK SCORING & AI AUDIT
-- Grounded AI Summaries, Explainable Risk Scores, Clusters & Provenance (SRS Section 4.4, 5, 12)
-- ==============================================================================

-- 1. Spatial & Temporal Issue Clusters Table
CREATE TABLE IF NOT EXISTS issue_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    cluster_title_en VARCHAR(200),
    cluster_title_hi VARCHAR(200),
    cluster_geometry GEOMETRY(POLYGON, 4326),  -- Convex hull / buffer of grouped issues
    centroid GEOMETRY(POINT, 4326) NOT NULL,    -- Center point for map clustering
    report_count INTEGER DEFAULT 1 NOT NULL,
    unresolved_count INTEGER DEFAULT 1 NOT NULL,
    composite_risk_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    cluster_status VARCHAR(50) DEFAULT 'active' NOT NULL, -- 'active', 'monitoring', 'resolved', 'merged'
    first_reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issue_clusters_centroid ON issue_clusters USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_issue_clusters_city_id ON issue_clusters(city_id);
CREATE INDEX IF NOT EXISTS idx_issue_clusters_category ON issue_clusters(category);
CREATE INDEX IF NOT EXISTS idx_issue_clusters_status ON issue_clusters(cluster_status);

CREATE TRIGGER trg_issue_clusters_updated_at
BEFORE UPDATE ON issue_clusters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Deterministic Civic Risk Scores Table (Explainable scoring formula)
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,           -- 'city', 'ward', 'road_segment', 'facility', 'cluster'
    entity_id UUID NOT NULL,                    -- Target entity ID (e.g. ward_id or feature_id)
    score DOUBLE PRECISION NOT NULL,            -- Calculated score (0 - 100)
    score_grade VARCHAR(20),                    -- 'low', 'moderate', 'high', 'severe'
    components JSONB NOT NULL,                  -- Exact mathematical breakdown: { "report_density": 25, "infrastructure_age": 15, "complaint_velocity": 30, "unresolved_ratio": 20 }
    formula_version VARCHAR(50) DEFAULT 'v1.0' NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_entity ON risk_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_computed_at ON risk_scores(computed_at DESC);


-- 3. Official Public Records Table (Government notices, tenders, contracts, SCADA records)
CREATE TABLE IF NOT EXISTS public_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),                    -- e.g. 'ward', 'gis_feature', 'city'
    entity_id UUID,
    record_type VARCHAR(100) NOT NULL,          -- 'government_order', 'tender', 'maintenance_log', 'budget_allocation'
    title_en VARCHAR(300) NOT NULL,
    title_hi VARCHAR(300) NOT NULL,
    reference_number VARCHAR(100),              -- Official file / GR number
    content_summary_en TEXT,
    content_summary_hi TEXT,
    structured_data JSONB DEFAULT '{}'::jsonb,  -- Budget, sanctioned amount, contractor name, dates
    record_date DATE NOT NULL,
    original_document_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_records_source_id ON public_records(source_id);
CREATE INDEX IF NOT EXISTS idx_public_records_entity ON public_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_public_records_date ON public_records(record_date DESC);

CREATE TRIGGER trg_public_records_updated_at
BEFORE UPDATE ON public_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. Trusted Public Mentions & News Articles Table (Secondary Evidence)
CREATE TABLE IF NOT EXISTS news_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    publication_name VARCHAR(150) NOT NULL,
    headline VARCHAR(300) NOT NULL,
    article_excerpt TEXT,
    article_url VARCHAR(500) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    sentiment_label VARCHAR(50),               -- 'positive', 'neutral', 'critical_infrastructure_issue'
    is_approved BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_mentions_entity ON news_mentions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_news_mentions_published ON news_mentions(published_at DESC);


-- 5. Grounded AI Reports Table (Sarvam AI generated summaries with provenance guarantees)
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope_type VARCHAR(50) NOT NULL,            -- 'ward', 'city', 'feature', 'cluster', 'route'
    scope_id UUID NOT NULL,
    language VARCHAR(10) DEFAULT 'hi' NOT NULL, -- 'hi' (Hindi), 'en' (English)
    model_provider VARCHAR(50) DEFAULT 'sarvam_ai' NOT NULL,
    model_name VARCHAR(100) DEFAULT 'sarvam-2b' NOT NULL,
    prompt_version VARCHAR(50) DEFAULT 'v1.0' NOT NULL,
    source_bundle JSONB NOT NULL,               -- Explicit list of record IDs and source dates supplied to the prompt
    referenced_source_ids UUID[] DEFAULT '{}',  -- Extracted citations verifying AI grounding
    report_content TEXT NOT NULL,               -- Grounded civic summary
    generation_duration_ms INTEGER,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_current BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_scope ON ai_reports(scope_type, scope_id, is_current);
CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON ai_reports(generated_at DESC);


-- 6. Translation Cache Table (Sarvam Translation reuse)
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,           -- 'gis_layer', 'citizen_report', 'public_record', 'ui_string'
    entity_id UUID,
    field_name VARCHAR(100) NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    source_text_hash VARCHAR(64) NOT NULL,      -- SHA-256 hash for fast cache lookup
    translated_text TEXT NOT NULL,
    model_name VARCHAR(50) DEFAULT 'sarvam-translate',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_translation_cache UNIQUE (entity_type, field_name, source_language, target_language, source_text_hash)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(entity_type, source_text_hash, target_language);


-- 7. Saved Places & Routes Table (Citizen convenience)
CREATE TABLE IF NOT EXISTS saved_places_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,             -- 'place', 'route', 'ward_bookmark'
    title VARCHAR(150) NOT NULL,
    description TEXT,
    geometry GEOMETRY(GEOMETRY, 4326),
    payload JSONB DEFAULT '{}'::jsonb NOT NULL, -- Route origin/destination coords, zoom, layers active
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places_routes(user_id);
CREATE TRIGGER trg_saved_places_updated_at
BEFORE UPDATE ON saved_places_routes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
