-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 010: DATA COVERAGE & PROVENANCE SYSTEM
-- Adds explicit provenance classification, layer coverage matrix, and real source health tracking.
-- ==============================================================================

-- 1. Create Enums for Provenance and Coverage States
DO $$ BEGIN
    CREATE TYPE data_provenance_type AS ENUM (
        'official_verified',
        'community_open',
        'citizen_submitted',
        'internal_derived',
        'development_fixture'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE coverage_status_type AS ENUM (
        'available',
        'partial',
        'metadata_only',
        'integration_pending',
        'credential_required',
        'not_publicly_available',
        'unavailable',
        'development_only'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 2. Add Provenance Column to Core Tables
ALTER TABLE gis_features 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'official_verified' NOT NULL;

ALTER TABLE citizen_reports 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'citizen_submitted' NOT NULL;

ALTER TABLE issue_clusters 
ADD COLUMN IF NOT EXISTS provenance_type data_provenance_type DEFAULT 'internal_derived' NOT NULL;

ALTER TABLE gis_layers 
ADD COLUMN IF NOT EXISTS default_provenance data_provenance_type DEFAULT 'official_verified' NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gis_features_provenance ON gis_features(provenance_type);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_provenance ON citizen_reports(provenance_type);


-- 3. Create Data Coverage Table
CREATE TABLE IF NOT EXISTS data_coverage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES gis_layers(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    coverage_status coverage_status_type DEFAULT 'unavailable' NOT NULL,
    feature_count INTEGER DEFAULT 0 NOT NULL,
    geographic_coverage VARCHAR(100) DEFAULT 'Municipal Area',
    temporal_coverage VARCHAR(100),
    authority_level source_authority_level,
    provenance_type data_provenance_type DEFAULT 'official_verified' NOT NULL,
    last_source_update TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    completeness_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_city_layer_coverage UNIQUE (city_id, layer_id)
);

CREATE INDEX IF NOT EXISTS idx_data_coverage_city ON data_coverage(city_id);
CREATE INDEX IF NOT EXISTS idx_data_coverage_layer ON data_coverage(layer_id);
CREATE INDEX IF NOT EXISTS idx_data_coverage_status ON data_coverage(coverage_status);

DROP TRIGGER IF EXISTS trg_data_coverage_updated_at ON data_coverage;
CREATE TRIGGER trg_data_coverage_updated_at
BEFORE UPDATE ON data_coverage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on data_coverage
ALTER TABLE data_coverage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public can view data_coverage" ON data_coverage FOR SELECT USING (TRUE);
    CREATE POLICY "Admins have full access to data_coverage" ON data_coverage FOR ALL TO authenticated 
    USING (get_current_user_role() IN ('gis_admin', 'super_admin')) 
    WITH CHECK (get_current_user_role() IN ('gis_admin', 'super_admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;
