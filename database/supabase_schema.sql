-- ==============================================================================
-- NAGARDRISHTI — COMPLETE MASTER SUPABASE & POSTGIS DATABASE SCHEMA
-- Madhya Pradesh Geospatial Urban Civic Intelligence & Multilingual Feedback Platform
-- Scope: Madhya Pradesh Scale | Reference City: Gwalior
-- Version 1.0 (Phase 1 of 6 Deliverable)
-- ==============================================================================
-- Instructions: Run this entire script in your Supabase SQL Editor.
-- Ensure PostGIS is enabled on your Supabase project (Project Settings -> Database -> Extensions).
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: EXTENSIONS & ENUMS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
    CREATE TYPE admin_unit_type AS ENUM (
        'state', 'division', 'district', 'subdivision', 'tehsil',
        'block', 'ulb', 'ward', 'gram_panchayat', 'village', 'locality'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ulb_type AS ENUM (
        'nagar_nigam', 'nagar_palika_parishad', 'nagar_parishad', 'cantonment_board'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE source_authority_level AS ENUM (
        'verified_state_government', 'verified_central_government',
        'verified_municipal', 'conditional_official', 'community_open', 'internal_platform'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE layer_source_type AS ENUM (
        'internal_postgis', 'geojson', 'vector_tiles', 'wms', 'wmts', 'external_api', 'uploaded_dataset'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE gis_geometry_type AS ENUM (
        'POINT', 'MULTIPOINT', 'LINESTRING', 'MULTILINESTRING', 'POLYGON', 'MULTIPOLYGON', 'GEOMETRYCOLLECTION'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'submitted', 'ai_processed', 'duplicate_clustered', 'community_corroborated',
        'needs_review', 'verified', 'in_progress', 'resolved', 'rejected_spam'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'audio', 'video', 'document');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM (
        'citizen_submission', 'official_dataset', 'government_notice',
        'trusted_public_mention', 'analyst_verification', 'sensor_telemetry'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'guest', 'citizen', 'analyst', 'verifier', 'gis_admin', 'super_admin'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ingestion_status AS ENUM (
        'pending', 'running', 'completed', 'partial_failure', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- SECTION 2: ADMINISTRATIVE GEOGRAPHY & MASTER ENTITIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS admin_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    unit_type admin_unit_type NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    lgd_code VARCHAR(50),
    census_code VARCHAR(50),
    state_code VARCHAR(10) DEFAULT 'MP',
    geometry GEOMETRY(GEOMETRY, 4326),
    centroid GEOMETRY(POINT, 4326),
    metadata JSONB DEFAULT '{}'::jsonb,
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_units_parent_id ON admin_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_units_unit_type ON admin_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_admin_units_lgd_code ON admin_units(lgd_code);
CREATE INDEX IF NOT EXISTS idx_admin_units_slug ON admin_units(slug);
CREATE INDEX IF NOT EXISTS idx_admin_units_geometry ON admin_units USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_admin_units_centroid ON admin_units USING GIST(centroid);

DROP TRIGGER IF EXISTS trg_admin_units_updated_at ON admin_units;
CREATE TRIGGER trg_admin_units_updated_at
BEFORE UPDATE ON admin_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID REFERENCES admin_units(id) ON DELETE RESTRICT,
    district_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    ulb_type ulb_type DEFAULT 'nagar_nigam' NOT NULL,
    lgd_code VARCHAR(50),
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    default_zoom INTEGER DEFAULT 12 NOT NULL,
    min_zoom INTEGER DEFAULT 9 NOT NULL,
    max_zoom INTEGER DEFAULT 19 NOT NULL,
    bbox_southwest GEOMETRY(POINT, 4326),
    bbox_northeast GEOMETRY(POINT, 4326),
    boundary_geometry GEOMETRY(MULTIPOLYGON, 4326),
    population_census INTEGER,
    area_sq_km DOUBLE PRECISION,
    is_reference_city BOOLEAN DEFAULT FALSE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    settings JSONB DEFAULT '{
        "weather_enabled": true,
        "routing_enabled": true,
        "ai_summary_enabled": true,
        "realtime_enabled": true
    }'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_district_id ON cities(district_id);
CREATE INDEX IF NOT EXISTS idx_cities_is_enabled ON cities(is_enabled);
CREATE INDEX IF NOT EXISTS idx_cities_boundary_geometry ON cities USING GIST(boundary_geometry);

DROP TRIGGER IF EXISTS trg_cities_updated_at ON cities;
CREATE TRIGGER trg_cities_updated_at
BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    admin_unit_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    ward_number INTEGER NOT NULL,
    ward_code VARCHAR(50),
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    zone_number INTEGER,
    zone_name_en VARCHAR(100),
    zone_name_hi VARCHAR(100),
    corporator_name VARCHAR(150),
    corporator_contact VARCHAR(50),
    sanitation_inspector_contact VARCHAR(50),
    population INTEGER,
    area_sq_km DOUBLE PRECISION,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    centroid GEOMETRY(POINT, 4326),
    properties JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_city_ward_number UNIQUE (city_id, ward_number)
);

CREATE INDEX IF NOT EXISTS idx_wards_city_id ON wards(city_id);
CREATE INDEX IF NOT EXISTS idx_wards_ward_number ON wards(ward_number);
CREATE INDEX IF NOT EXISTS idx_wards_geometry ON wards USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_wards_centroid ON wards USING GIST(centroid);

DROP TRIGGER IF EXISTS trg_wards_updated_at ON wards;
CREATE TRIGGER trg_wards_updated_at
BEFORE UPDATE ON wards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS localities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    admin_unit_id UUID REFERENCES admin_units(id) ON DELETE SET NULL,
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    pincode VARCHAR(10),
    locality_type VARCHAR(50) DEFAULT 'mohalla',
    geometry GEOMETRY(GEOMETRY, 4326),
    centroid GEOMETRY(POINT, 4326),
    properties JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_localities_city_id ON localities(city_id);
CREATE INDEX IF NOT EXISTS idx_localities_ward_id ON localities(ward_id);
CREATE INDEX IF NOT EXISTS idx_localities_geometry ON localities USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_localities_centroid ON localities USING GIST(centroid);

DROP TRIGGER IF EXISTS trg_localities_updated_at ON localities;
CREATE TRIGGER trg_localities_updated_at
BEFORE UPDATE ON localities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- SECTION 3: SECTORS, DEPARTMENTS, DATA SOURCES & GIS LAYERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'layers',
    display_order INTEGER DEFAULT 0 NOT NULL,
    color_hex VARCHAR(10) DEFAULT '#2563EB',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sectors_code ON sectors(code);
DROP TRIGGER IF EXISTS trg_sectors_updated_at ON sectors;
CREATE TRIGGER trg_sectors_updated_at
BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    short_name_en VARCHAR(50),
    short_name_hi VARCHAR(50),
    nodal_officer_name VARCHAR(150),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    portal_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_key VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    provider VARCHAR(200) NOT NULL,
    authority_level source_authority_level DEFAULT 'conditional_official' NOT NULL,
    homepage_url VARCHAR(255),
    api_docs_url VARCHAR(255),
    service_endpoint_url VARCHAR(255),
    access_type VARCHAR(50) DEFAULT 'open_api',
    license_type VARCHAR(100) DEFAULT 'Government Open Data (GODL-India)',
    attribution_text_en VARCHAR(255) NOT NULL,
    attribution_text_hi VARCHAR(255) NOT NULL,
    geographic_coverage VARCHAR(100) DEFAULT 'Madhya Pradesh',
    expected_refresh_interval VARCHAR(50) DEFAULT 'monthly',
    schema_version VARCHAR(20) DEFAULT '1.0',
    last_source_update TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    health_status VARCHAR(50) DEFAULT 'healthy',
    notes TEXT,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_sources_source_key ON data_sources(source_key);
CREATE INDEX IF NOT EXISTS idx_data_sources_authority ON data_sources(authority_level);
DROP TRIGGER IF EXISTS trg_data_sources_updated_at ON data_sources;
CREATE TRIGGER trg_data_sources_updated_at
BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS gis_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200) NOT NULL,
    description_en TEXT,
    description_hi TEXT,
    sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    geometry_type gis_geometry_type NOT NULL,
    source_type layer_source_type DEFAULT 'internal_postgis' NOT NULL,
    external_layer_name VARCHAR(150),
    service_url_template VARCHAR(500),
    city_ids UUID[] DEFAULT '{}',
    min_zoom INTEGER DEFAULT 0 NOT NULL,
    max_zoom INTEGER DEFAULT 22 NOT NULL,
    default_visibility BOOLEAN DEFAULT FALSE NOT NULL,
    is_queryable BOOLEAN DEFAULT TRUE NOT NULL,
    is_clusterable BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    style_config JSONB DEFAULT '{
        "fill_color": "#3B82F6",
        "fill_opacity": 0.4,
        "stroke_color": "#1D4ED8",
        "stroke_width": 2,
        "point_radius": 6,
        "icon_image": "marker"
    }'::jsonb NOT NULL,
    legend_config JSONB DEFAULT '{
        "items": [
            {"label_en": "Default Feature", "label_hi": "डिफ़ॉल्ट सुविधा", "color": "#3B82F6"}
        ]
    }'::jsonb NOT NULL,
    filter_config JSONB DEFAULT '{}'::jsonb,
    freshness_sla_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gis_layers_slug ON gis_layers(slug);
CREATE INDEX IF NOT EXISTS idx_gis_layers_sector_id ON gis_layers(sector_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_department_id ON gis_layers(department_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_source_id ON gis_layers(source_id);
DROP TRIGGER IF EXISTS trg_gis_layers_updated_at ON gis_layers;
CREATE TRIGGER trg_gis_layers_updated_at
BEFORE UPDATE ON gis_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- SECTION 4: CIVIC GEOGRAPHIC FEATURES STORE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS gis_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID NOT NULL REFERENCES gis_layers(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    locality_id UUID REFERENCES localities(id) ON DELETE SET NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    external_id VARCHAR(150),
    name_en VARCHAR(250),
    name_hi VARCHAR(250),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb NOT NULL,
    observed_at TIMESTAMPTZ,
    source_updated_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gis_features_geometry ON gis_features USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_gis_features_layer_id ON gis_features(layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_city_id ON gis_features(city_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_ward_id ON gis_features(ward_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_city_layer ON gis_features(city_id, layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_properties ON gis_features USING GIN(properties);
CREATE INDEX IF NOT EXISTS idx_gis_features_name_en_trgm ON gis_features USING GIN(name_en gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_gis_features_updated_at ON gis_features;
CREATE TRIGGER trg_gis_features_updated_at
BEFORE UPDATE ON gis_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- SECTION 5: CITIZEN FEEDBACK & REPORTING SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'citizen' NOT NULL,
    full_name VARCHAR(150),
    phone_number VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'hi' NOT NULL,
    preferred_city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    avatar_url VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number VARCHAR(30) UNIQUE NOT NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    locality_id UUID REFERENCES localities(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    title VARCHAR(200),
    description TEXT NOT NULL,
    normalized_text TEXT,
    input_language VARCHAR(10) DEFAULT 'hi',
    location_geometry GEOMETRY(POINT, 4326) NOT NULL,
    location_address TEXT,
    severity_input VARCHAR(20) DEFAULT 'medium',
    status report_status DEFAULT 'submitted' NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    corroboration_count INTEGER DEFAULT 0 NOT NULL,
    ai_metadata JSONB DEFAULT '{
        "sarvam_stt_transcription": null,
        "suggested_category": null,
        "sentiment_urgency_score": null,
        "extracted_entities": []
    }'::jsonb NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_name VARCHAR(150),
    resolution_summary TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_geometry ON citizen_reports USING GIST(location_geometry);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_id ON citizen_reports(city_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_ward_id ON citizen_reports(ward_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_status ON citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_status ON citizen_reports(city_id, status);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_city_category ON citizen_reports(city_id, category);

DROP TRIGGER IF EXISTS trg_citizen_reports_updated_at ON citizen_reports;
CREATE TRIGGER trg_citizen_reports_updated_at
BEFORE UPDATE ON citizen_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS report_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    bucket_name VARCHAR(100) DEFAULT 'report-media' NOT NULL,
    media_type media_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    moderation_state VARCHAR(50) DEFAULT 'pending',
    exif_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON report_media(report_id);


CREATE TABLE IF NOT EXISTS report_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    previous_status report_status,
    new_status report_status NOT NULL,
    changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role user_role DEFAULT 'citizen',
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_status_history_report ON report_status_history(report_id);


CREATE TABLE IF NOT EXISTS report_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    evidence_type evidence_type NOT NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    external_record_id VARCHAR(150),
    title VARCHAR(250) NOT NULL,
    evidence_url VARCHAR(500),
    confidence_score DOUBLE PRECISION DEFAULT 1.0,
    evidence_details JSONB DEFAULT '{}'::jsonb,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_evidence_report_id ON report_evidence(report_id);


CREATE TABLE IF NOT EXISTS report_corroborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    corroboration_type VARCHAR(50) DEFAULT 'confirm_issue',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_report_user_corroboration UNIQUE (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_report_corroborations_report ON report_corroborations(report_id);


CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES citizen_reports(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL,
    justification TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON moderation_actions(report_id);


-- ==============================================================================
-- SECTION 6: CIVIC INTELLIGENCE, RISK SCORING & AI AUDIT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS issue_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    cluster_title_en VARCHAR(200),
    cluster_title_hi VARCHAR(200),
    cluster_geometry GEOMETRY(POLYGON, 4326),
    centroid GEOMETRY(POINT, 4326) NOT NULL,
    report_count INTEGER DEFAULT 1 NOT NULL,
    unresolved_count INTEGER DEFAULT 1 NOT NULL,
    composite_risk_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    cluster_status VARCHAR(50) DEFAULT 'active' NOT NULL,
    first_reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issue_clusters_centroid ON issue_clusters USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_issue_clusters_city_id ON issue_clusters(city_id);

DROP TRIGGER IF EXISTS trg_issue_clusters_updated_at ON issue_clusters;
CREATE TRIGGER trg_issue_clusters_updated_at
BEFORE UPDATE ON issue_clusters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    score_grade VARCHAR(20),
    components JSONB NOT NULL,
    formula_version VARCHAR(50) DEFAULT 'v1.0' NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_entity ON risk_scores(entity_type, entity_id);


CREATE TABLE IF NOT EXISTS public_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    record_type VARCHAR(100) NOT NULL,
    title_en VARCHAR(300) NOT NULL,
    title_hi VARCHAR(300) NOT NULL,
    reference_number VARCHAR(100),
    content_summary_en TEXT,
    content_summary_hi TEXT,
    structured_data JSONB DEFAULT '{}'::jsonb,
    record_date DATE NOT NULL,
    original_document_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_records_source_id ON public_records(source_id);
CREATE INDEX IF NOT EXISTS idx_public_records_entity ON public_records(entity_type, entity_id);
DROP TRIGGER IF EXISTS trg_public_records_updated_at ON public_records;
CREATE TRIGGER trg_public_records_updated_at
BEFORE UPDATE ON public_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


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
    sentiment_label VARCHAR(50),
    is_approved BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_mentions_entity ON news_mentions(entity_type, entity_id);


CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID NOT NULL,
    language VARCHAR(10) DEFAULT 'hi' NOT NULL,
    model_provider VARCHAR(50) DEFAULT 'sarvam_ai' NOT NULL,
    model_name VARCHAR(100) DEFAULT 'sarvam-2b' NOT NULL,
    prompt_version VARCHAR(50) DEFAULT 'v1.0' NOT NULL,
    source_bundle JSONB NOT NULL,
    referenced_source_ids UUID[] DEFAULT '{}',
    report_content TEXT NOT NULL,
    generation_duration_ms INTEGER,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_current BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_scope ON ai_reports(scope_type, scope_id, is_current);


CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    field_name VARCHAR(100) NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    source_text_hash VARCHAR(64) NOT NULL,
    translated_text TEXT NOT NULL,
    model_name VARCHAR(50) DEFAULT 'sarvam-translate',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_translation_cache UNIQUE (entity_type, field_name, source_language, target_language, source_text_hash)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(entity_type, source_text_hash, target_language);


CREATE TABLE IF NOT EXISTS saved_places_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    geometry GEOMETRY(GEOMETRY, 4326),
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places_routes(user_id);
DROP TRIGGER IF EXISTS trg_saved_places_updated_at ON saved_places_routes;
CREATE TRIGGER trg_saved_places_updated_at
BEFORE UPDATE ON saved_places_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- SECTION 7: ADMIN OPERATIONS, DATASET UPLOADS & AUDIT LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS dataset_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_format VARCHAR(50) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    detected_crs VARCHAR(50) DEFAULT 'EPSG:4326',
    target_layer_id UUID REFERENCES gis_layers(id) ON DELETE SET NULL,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    validation_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    total_features INTEGER DEFAULT 0,
    valid_features INTEGER DEFAULT 0,
    rejected_features INTEGER DEFAULT 0,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    preview_sample JSONB DEFAULT '[]'::jsonb,
    is_imported BOOLEAN DEFAULT FALSE NOT NULL,
    imported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dataset_uploads_uploader ON dataset_uploads(uploader_id);
DROP TRIGGER IF EXISTS trg_dataset_uploads_updated_at ON dataset_uploads;
CREATE TRIGGER trg_dataset_uploads_updated_at
BEFORE UPDATE ON dataset_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    run_type VARCHAR(50) DEFAULT 'scheduled_sync',
    status ingestion_status DEFAULT 'pending' NOT NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ,
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_quarantined INTEGER DEFAULT 0,
    schema_version_observed VARCHAR(20),
    error_summary TEXT,
    execution_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON ingestion_runs(source_id);


CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role user_role DEFAULT 'guest',
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    diff_before JSONB,
    diff_after JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ==============================================================================
-- SECTION 8: ROW LEVEL SECURITY & POLICIES
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    u_role user_role;
BEGIN
    SELECT role INTO u_role
    FROM user_profiles
    WHERE id = auth.uid();
    
    IF u_role IS NULL THEN
        RETURN 'guest'::user_role;
    END IF;
    
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE admin_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_corroborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $$ BEGIN
    CREATE POLICY "Public can view active admin_units" ON admin_units FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view enabled cities" ON cities FOR SELECT USING (is_enabled = TRUE);
    CREATE POLICY "Public can view active wards" ON wards FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view active localities" ON localities FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view active sectors" ON sectors FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view active departments" ON departments FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view enabled data_sources" ON data_sources FOR SELECT USING (is_enabled = TRUE);
    CREATE POLICY "Public can view active gis_layers" ON gis_layers FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view active gis_features" ON gis_features FOR SELECT USING (is_active = TRUE);
    CREATE POLICY "Public can view active issue_clusters" ON issue_clusters FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view risk_scores" ON risk_scores FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view verified public_records" ON public_records FOR SELECT USING (is_verified = TRUE);
    CREATE POLICY "Public can view approved news_mentions" ON news_mentions FOR SELECT USING (is_approved = TRUE);
    CREATE POLICY "Public can view current ai_reports" ON ai_reports FOR SELECT USING (is_current = TRUE);
    CREATE POLICY "Public can view translations" ON translations FOR SELECT USING (TRUE);
    CREATE POLICY "Public can view public accepted citizen reports" ON citizen_reports FOR SELECT USING (is_public = TRUE AND status != 'rejected_spam');
    CREATE POLICY "Users can view own reports" ON citizen_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
    CREATE POLICY "Anyone can submit a citizen report" ON citizen_reports FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY "Public can view approved report media" ON report_media FOR SELECT USING (moderation_state = 'approved');
    CREATE POLICY "Anyone can attach media to report during submission" ON report_media FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY "Public can view status history of public reports" ON report_status_history FOR SELECT USING (EXISTS (SELECT 1 FROM citizen_reports WHERE citizen_reports.id = report_status_history.report_id AND citizen_reports.is_public = TRUE));
    CREATE POLICY "Public can view evidence for public reports" ON report_evidence FOR SELECT USING (EXISTS (SELECT 1 FROM citizen_reports WHERE citizen_reports.id = report_evidence.report_id AND citizen_reports.is_public = TRUE));
    CREATE POLICY "Public can view corroborations" ON report_corroborations FOR SELECT USING (TRUE);
    CREATE POLICY "Authenticated citizens can corroborate reports" ON report_corroborations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Public can view basic public profile info" ON user_profiles FOR SELECT USING (TRUE);
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can insert own profile upon signup" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can view and manage own saved places" ON saved_places_routes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Staff can view and moderate all reports" ON citizen_reports FOR ALL TO authenticated USING (get_current_user_role() IN ('verifier', 'analyst', 'gis_admin', 'super_admin')) WITH CHECK (get_current_user_role() IN ('verifier', 'analyst', 'gis_admin', 'super_admin'));
    CREATE POLICY "Admins have full access to gis_layers" ON gis_layers FOR ALL TO authenticated USING (get_current_user_role() IN ('gis_admin', 'super_admin')) WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));
    CREATE POLICY "Admins have full access to gis_features" ON gis_features FOR ALL TO authenticated USING (get_current_user_role() IN ('gis_admin', 'super_admin')) WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));
    CREATE POLICY "Admins have full access to data_sources" ON data_sources FOR ALL TO authenticated USING (get_current_user_role() IN ('gis_admin', 'super_admin')) WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));
    CREATE POLICY "Admins can manage dataset_uploads" ON dataset_uploads FOR ALL TO authenticated USING (get_current_user_role() IN ('gis_admin', 'super_admin')) WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));
    CREATE POLICY "Admins can view ingestion_runs" ON ingestion_runs FOR ALL TO authenticated USING (get_current_user_role() IN ('gis_admin', 'super_admin'));
    CREATE POLICY "Admins can view audit_logs" ON audit_logs FOR SELECT TO authenticated USING (get_current_user_role() IN ('gis_admin', 'super_admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ==============================================================================
-- SECTION 9: STORAGE BUCKETS & REALTIME
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('report-media', 'report-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'video/mp4']),
    ('gis-datasets', 'gis-datasets', false, 52428800, ARRAY['application/json', 'application/geo+json', 'application/zip', 'text/csv', 'application/vnd.google-earth.kml+xml']),
    ('ai-audio-cache', 'ai-audio-cache', true, 5242880, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
    CREATE POLICY "Public can view report media files" ON storage.objects FOR SELECT USING (bucket_id = 'report-media');
    CREATE POLICY "Anyone can upload report media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-media');
    CREATE POLICY "Public can read AI TTS audio cache" ON storage.objects FOR SELECT USING (bucket_id = 'ai-audio-cache');
    CREATE POLICY "Backend service can insert TTS audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ai-audio-cache');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE citizen_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_clusters;
ALTER PUBLICATION supabase_realtime ADD TABLE report_status_history;
