-- ==============================================================================
-- NAGARDRISHTI — MIGRATION 007: DATASET UPLOADS, INGESTION RUNS & AUDIT LOGS
-- Administrative Operations, ETL Observability & Security Audit (SRS Section 9, 12, 13)
-- ==============================================================================

-- 1. Admin Dataset Uploads Table
CREATE TABLE IF NOT EXISTS dataset_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_format VARCHAR(50) NOT NULL,           -- 'geojson', 'kml', 'shapefile_zip', 'csv'
    storage_path VARCHAR(500) NOT NULL,        -- Supabase Storage bucket 'gis-datasets'
    detected_crs VARCHAR(50) DEFAULT 'EPSG:4326',
    target_layer_id UUID REFERENCES gis_layers(id) ON DELETE SET NULL,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    validation_status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'valid', 'invalid', 'imported', 'failed'
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
CREATE INDEX IF NOT EXISTS idx_dataset_uploads_status ON dataset_uploads(validation_status);

CREATE TRIGGER trg_dataset_uploads_updated_at
BEFORE UPDATE ON dataset_uploads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Ingestion Runs Observability Table (ETL Health & Sync Logs)
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    run_type VARCHAR(50) DEFAULT 'scheduled_sync', -- 'scheduled_sync', 'manual_trigger', 'webhook', 'file_import'
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
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON ingestion_runs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON ingestion_runs(started_at DESC);


-- 3. Security & Operational Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role user_role DEFAULT 'guest',
    action VARCHAR(100) NOT NULL,               -- e.g. 'layer.create', 'report.moderate', 'dataset.import', 'user.role_change'
    resource_type VARCHAR(100) NOT NULL,        -- 'gis_layer', 'citizen_report', 'data_source', 'user_profile'
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    diff_before JSONB,
    diff_after JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
